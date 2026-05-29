import type { Context, Hono } from 'hono';
import {
  buildCrmCookie,
  buildCrmUsersCsv,
  clearCrmCookie,
  createSignedSession,
  filterCrmUsers,
  hashCrmPassword,
  normalizeCrmPage,
  normalizeCrmPageSize,
  normalizeCrmRole,
  normalizeCrmSortDir,
  paginateCrmUsers,
  readCookie,
  sortCrmUsers,
  type CrmRole,
  type CrmSessionPayload,
  type CrmTimelineEvent,
  type CrmUserListRow,
  type CrmUserRecord,
  verifyCrmPassword,
  verifySignedSession,
  serializeCrmTimelineEvent,
} from './crm-logic';

type CrmEnv = {
  DB: D1Database;
  CRM_SESSION_SECRET?: string;
  CRM_BOOTSTRAP_USERNAME?: string;
  CRM_BOOTSTRAP_PASSWORD?: string;
  CRM_BOOTSTRAP_ROLE?: string;
};

type CrmSessionUser = {
  id: number;
  username: string;
  role: CrmRole;
  allowedRoles: CrmRole[];
  lastLoginAt: string | null;
};

type AuthenticatedCrmContext = {
  user: CrmSessionUser;
  session: CrmSessionPayload;
};

type CrmErrorResponse = {
  ok: false;
  message: string;
};

type CrmResponseHeaders = Record<string, string>;

const CRM_ALLOWED_ROLES: CrmRole[] = ['super_admin', 'admin', 'viewer'];
const SESSION_COOKIE_NAME = 'crm_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function registerCrmRoutes<AppEnv extends CrmEnv>(app: Hono<{ Bindings: AppEnv }>) {
  app.get('/api/crm/me', async (c) => {
    const auth = await requireCrmAuth(c);
    if (!auth.ok) return c.json(auth.body, auth.status);
    return c.json({
      ok: true,
      user: auth.user,
    });
  });

  app.post('/api/crm/auth/login', async (c) => {
    const body = await c.req.json<{ username?: string; password?: string }>().catch(() => ({ username: '', password: '' }));
    const username = body.username?.trim() ?? '';
    const password = body.password ?? '';
    const response = await loginCrmUser(c, username, password);
    if (!response.ok) return c.json(response.body, response.status);
    return c.json({ ok: true, user: response.user }, 200, Object.fromEntries(response.headers.entries()));
  });

  app.post('/api/crm/auth/logout', async (c) => {
    const auth = await requireCrmAuth(c);
    if (auth.ok) {
      await revokeCrmSession(c.env, auth.session.sessionId);
      await logCrmEvent(c.env, {
        eventType: 'crm_logout',
        crmUserId: auth.user.id,
        actorRole: auth.user.role,
        title: 'خروج کاربر CRM',
        details: { username: auth.user.username },
      });
    }
    const headers = new Headers();
    headers.set('Set-Cookie', clearCrmCookie(isSecureRequest(c.req.raw.url)));
    return c.json({ ok: true }, 200, Object.fromEntries(headers.entries()));
  });

  app.get('/api/crm/users', async (c) => {
    const auth = await requireCrmAuth(c);
    if (!auth.ok) return c.json(auth.body, auth.status);

    const filters = {
      search: c.req.query('search') ?? '',
      verificationStatus: c.req.query('verificationStatus') ?? '',
      accessLevel: c.req.query('accessLevel') ?? '',
      sortBy: c.req.query('sortBy') ?? 'updatedAt',
      sortDir: normalizeCrmSortDir(c.req.query('sortDir')),
      page: normalizeCrmPage(c.req.query('page')),
      pageSize: normalizeCrmPageSize(c.req.query('pageSize')),
    };
    const result = await listCrmUsers(c.env, filters);
    return c.json({ ok: true, users: result.rows, pagination: result.pagination });
  });

  app.get('/api/crm/users/export', async (c) => {
    const auth = await requireCrmAuth(c);
    if (!auth.ok) return c.json(auth.body, auth.status);

    const filters = {
      search: c.req.query('search') ?? '',
      verificationStatus: c.req.query('verificationStatus') ?? '',
      accessLevel: c.req.query('accessLevel') ?? '',
      sortBy: c.req.query('sortBy') ?? 'updatedAt',
      sortDir: normalizeCrmSortDir(c.req.query('sortDir')),
      page: 1,
      pageSize: 5000,
    };
    const result = await listCrmUsers(c.env, filters);
    const csv = buildCrmUsersCsv(result.rows);
    await logCrmEvent(c.env, {
      eventType: 'crm_export_csv',
      crmUserId: auth.user.id,
      actorRole: auth.user.role,
      title: 'خروجی CSV کاربران',
      details: {
        filters,
        rowCount: result.rows.length,
      },
    });
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="crm-users.csv"',
      },
    });
  });

  app.get('/api/crm/users/:telegramUserId', async (c) => {
    const auth = await requireCrmAuth(c);
    if (!auth.ok) return c.json(auth.body, auth.status);

    const telegramUserId = c.req.param('telegramUserId');
    const detail = await getCrmUserDetail(c.env, telegramUserId);
    if (!detail) return c.json({ ok: false, message: 'کاربر پیدا نشد.' }, 404);
    await logCrmEvent(c.env, {
      eventType: 'crm_view_user_detail',
      crmUserId: auth.user.id,
      actorRole: auth.user.role,
      telegramUserId,
      title: 'مشاهده جزئیات کاربر',
      details: { telegramUserId },
    });
    return c.json({
      ok: true,
      user: detail.user,
      activity: detail.activity.map((event) => serializeCrmTimelineEvent(event)),
    });
  });
}

async function loginCrmUser<AppEnv extends CrmEnv>(
  c: Context<{ Bindings: AppEnv }>,
  username: string,
  password: string,
): Promise<
  | { ok: true; user: CrmSessionUser; headers: Headers }
  | { ok: false; status: 400 | 401 | 500; body: CrmErrorResponse }
> {
  if (!username || !password) {
    await logCrmEvent(c.env, {
      eventType: 'crm_login_failed',
      title: 'ورود ناموفق CRM',
      details: { reason: 'missing_credentials', username },
    });
    return { ok: false as const, status: 400, body: { ok: false, message: 'نام کاربری و رمز عبور الزامی است.' } };
  }

  const bootstrap = await maybeBootstrapCrmUser(c.env, username, password);
  if (bootstrap.ok) {
    const session = await createCrmSession(c, bootstrap.user);
    return { ok: true as const, user: session.user, headers: session.headers };
  }

  const user = await getCrmUserByUsername(c.env, username);
  if (!user || !user.isActive) {
    await logCrmEvent(c.env, {
      eventType: 'crm_login_failed',
      title: 'ورود ناموفق CRM',
      details: { reason: 'user_not_found', username },
    });
    return { ok: false as const, status: 401, body: { ok: false, message: 'نام کاربری یا رمز عبور نادرست است.' } };
  }

  const valid = await verifyCrmPassword(password, user.passwordSalt, user.passwordHash);
  if (!valid) {
    await logCrmEvent(c.env, {
      eventType: 'crm_login_failed',
      title: 'ورود ناموفق CRM',
      crmUserId: user.id,
      actorRole: user.role,
      details: { reason: 'invalid_password', username },
    });
    return { ok: false as const, status: 401, body: { ok: false, message: 'نام کاربری یا رمز عبور نادرست است.' } };
  }

  const session = await createCrmSession(c, user);
  await updateCrmLastLogin(c.env, user.id);
  await logCrmEvent(c.env, {
    eventType: 'crm_login_success',
    title: 'ورود موفق CRM',
    crmUserId: user.id,
    actorRole: user.role,
    details: { username: user.username },
  });
  return { ok: true as const, user: session.user, headers: session.headers };
}

async function createCrmSession<AppEnv extends CrmEnv>(c: Context<{ Bindings: AppEnv }>, user: CrmUserRecord) {
  const secret = requireSessionSecret(c.env);
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload: CrmSessionPayload = {
    sessionId,
    crmUserId: user.id,
    role: user.role,
    expiresAt,
  };
  const token = await createSignedSession(secret, payload);
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO crm_sessions (session_id, crm_user_id, role_snapshot, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(sessionId, user.id, user.role, now, new Date(expiresAt).toISOString())
    .run();

  const headers = new Headers();
  headers.set('Set-Cookie', buildCrmCookie(token, isSecureRequest(c.req.raw.url)));
  return {
    user: toSessionUser(user),
    headers,
  };
}

function requireSessionSecret(env: CrmEnv) {
  const secret = env.CRM_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error('CRM_SESSION_SECRET is required.');
  }
  return secret;
}

async function requireCrmAuth<AppEnv extends CrmEnv>(
  c: Context<{ Bindings: AppEnv }>,
): Promise<
  | { ok: true; user: CrmSessionUser; session: CrmSessionPayload }
  | { ok: false; status: 401 | 500; body: CrmErrorResponse }
> {
  const session = await readCrmSession(c);
  if (!session.ok) {
    return { ok: false as const, status: 401, body: { ok: false, message: 'ورود CRM معتبر نیست.' } };
  }
  return session;
}

async function readCrmSession<AppEnv extends CrmEnv>(c: Context<{ Bindings: AppEnv }>): Promise<
  | { ok: true; user: CrmSessionUser; session: CrmSessionPayload }
  | { ok: false; status: 401 | 500; body: CrmErrorResponse }
> {
  const secret = c.env.CRM_SESSION_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 500, body: { ok: false, message: 'پیکربندی نشست CRM انجام نشده است.' } };
  }

  const token = readCookie(c.req.header('cookie') ?? null, SESSION_COOKIE_NAME);
  if (!token) {
    return { ok: false, status: 401, body: { ok: false, message: 'ورود CRM معتبر نیست.' } };
  }

  const payload = await verifySignedSession(secret, token);
  if (!payload) {
    return { ok: false, status: 401, body: { ok: false, message: 'ورود CRM معتبر نیست.' } };
  }

  const session = await c.env.DB.prepare(
    `SELECT s.session_id AS sessionId, s.crm_user_id AS crmUserId, s.role_snapshot AS roleSnapshot, s.expires_at AS expiresAt, s.revoked_at AS revokedAt,
            u.username AS username, u.role AS role, u.is_active AS isActive, u.last_login_at AS lastLoginAt
     FROM crm_sessions s
     JOIN crm_users u ON u.id = s.crm_user_id
     WHERE s.session_id = ?`,
  )
    .bind(payload.sessionId)
    .first<{
      sessionId: string;
      crmUserId: number;
      roleSnapshot: CrmRole;
      expiresAt: string;
      revokedAt: string | null;
      username: string;
      role: CrmRole;
      isActive: number;
      lastLoginAt: string | null;
    }>();

  if (!session || session.revokedAt || !session.isActive) {
    return { ok: false, status: 401, body: { ok: false, message: 'ورود CRM معتبر نیست.' } };
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await revokeCrmSession(c.env, session.sessionId);
    return { ok: false, status: 401, body: { ok: false, message: 'نشست CRM منقضی شده است.' } };
  }

  if (session.roleSnapshot !== session.role || session.crmUserId !== payload.crmUserId) {
    return { ok: false, status: 401, body: { ok: false, message: 'ورود CRM معتبر نیست.' } };
  }

  return {
    ok: true,
    session: payload,
    user: {
      id: session.crmUserId,
      username: session.username,
      role: session.role,
      allowedRoles: CRM_ALLOWED_ROLES,
      lastLoginAt: session.lastLoginAt,
    },
  };
}

async function revokeCrmSession(env: CrmEnv, sessionId: string) {
  await env.DB.prepare(`UPDATE crm_sessions SET revoked_at = ? WHERE session_id = ?`).bind(new Date().toISOString(), sessionId).run();
}

async function getCrmUserByUsername(env: CrmEnv, username: string) {
  return env.DB.prepare(
    `SELECT id, username, role, password_hash AS passwordHash, password_salt AS passwordSalt, created_at AS createdAt, updated_at AS updatedAt, last_login_at AS lastLoginAt, is_active AS isActive
     FROM crm_users
     WHERE username = ?`,
  )
    .bind(username)
    .first<CrmUserRecord>();
}

async function maybeBootstrapCrmUser(env: CrmEnv, username: string, password: string) {
  const bootstrapUsername = env.CRM_BOOTSTRAP_USERNAME?.trim();
  const bootstrapPassword = env.CRM_BOOTSTRAP_PASSWORD ?? '';
  const bootstrapRole = normalizeCrmRole(env.CRM_BOOTSTRAP_ROLE) ?? 'super_admin';
  if (!bootstrapUsername || !bootstrapPassword || username !== bootstrapUsername || password !== bootstrapPassword) {
    return { ok: false as const };
  }

  const count = await env.DB.prepare(`SELECT COUNT(*) as count FROM crm_users`).first<{ count: number }>();
  if ((count?.count ?? 0) > 0) {
    const user = await getCrmUserByUsername(env, username);
    if (!user) return { ok: false as const };
    const valid = await verifyCrmPassword(password, user.passwordSalt, user.passwordHash);
    if (!valid) return { ok: false as const };
    return { ok: true as const, user };
  }

  const now = new Date().toISOString();
  const { salt, hash } = await hashCrmPassword(password);
  await env.DB.prepare(
    `INSERT INTO crm_users (username, password_hash, password_salt, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
  )
    .bind(username, hash, salt, bootstrapRole, now, now)
    .run();

  const user = await getCrmUserByUsername(env, username);
  return user ? ({ ok: true as const, user } as const) : ({ ok: false as const } as const);
}

async function updateCrmLastLogin(env: CrmEnv, crmUserId: number) {
  await env.DB.prepare(`UPDATE crm_users SET last_login_at = ?, updated_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), new Date().toISOString(), crmUserId)
    .run();
}

async function listCrmUsers(env: CrmEnv, filters: {
  search: string;
  verificationStatus: string;
  accessLevel: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}) {
  const where: string[] = [];
  const bind: Array<string | number> = [];

  if (filters.search.trim()) {
    const like = `%${filters.search.trim()}%`;
    where.push(`(
      u.telegram_user_id LIKE ? COLLATE NOCASE OR
      COALESCE(u.telegram_username, '') LIKE ? COLLATE NOCASE OR
      COALESCE(u.first_name, '') LIKE ? COLLATE NOCASE OR
      COALESCE(u.last_name, '') LIKE ? COLLATE NOCASE OR
      COALESCE(u.xt_uid, '') LIKE ? COLLATE NOCASE OR
      u.verification_status LIKE ? COLLATE NOCASE OR
      u.access_level LIKE ? COLLATE NOCASE
    )`);
    bind.push(like, like, like, like, like, like, like);
  }

  if (filters.verificationStatus.trim()) {
    where.push(`u.verification_status = ?`);
    bind.push(filters.verificationStatus.trim());
  }

  if (filters.accessLevel.trim()) {
    where.push(`u.access_level = ?`);
    bind.push(filters.accessLevel.trim());
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const query = `
    FROM users u
    LEFT JOIN crm_activity_events e ON e.telegram_user_id = u.telegram_user_id
    ${whereSql}
    GROUP BY u.telegram_user_id
  `;

  const countRow = await env.DB.prepare(`SELECT COUNT(*) as total FROM (SELECT u.telegram_user_id ${query}) AS filtered`).bind(...bind).first<{ total: number }>();

  const sortExpression = getSortExpression(filters.sortBy);
  const rows = await env.DB.prepare(
    `
    SELECT
      u.telegram_user_id AS telegramUserId,
      u.telegram_username AS telegramUsername,
      u.first_name AS firstName,
      u.last_name AS lastName,
      u.xt_uid AS xtUid,
      u.verification_status AS verificationStatus,
      u.access_level AS accessLevel,
      u.created_at AS createdAt,
      u.updated_at AS updatedAt,
      u.verified_at AS verifiedAt,
      COUNT(e.id) AS activityCount,
      MAX(e.created_at) AS lastActivityAt
    ${query}
    ORDER BY ${sortExpression} ${filters.sortDir}, u.updated_at DESC, u.telegram_user_id ASC
    LIMIT ? OFFSET ?
    `,
  )
    .bind(...bind, filters.pageSize, (filters.page - 1) * filters.pageSize)
    .all<CrmUserListRow>();

  return {
    rows: rows.results ?? [],
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      pageCount: Math.max(1, Math.ceil((countRow?.total ?? 0) / filters.pageSize)),
      total: countRow?.total ?? 0,
    },
  };
}

async function getCrmUserDetail(env: CrmEnv, telegramUserId: string) {
  const user = await env.DB.prepare(
    `SELECT
      u.telegram_user_id AS telegramUserId,
      u.telegram_username AS telegramUsername,
      u.first_name AS firstName,
      u.last_name AS lastName,
      u.xt_uid AS xtUid,
      u.verification_status AS verificationStatus,
      u.access_level AS accessLevel,
      u.created_at AS createdAt,
      u.updated_at AS updatedAt,
      u.verified_at AS verifiedAt,
      NULL AS lastLoginAt,
      COUNT(e.id) AS activityCount,
      MAX(e.created_at) AS lastActivityAt
     FROM users u
     LEFT JOIN crm_activity_events e ON e.telegram_user_id = u.telegram_user_id
     WHERE u.telegram_user_id = ?
     GROUP BY u.telegram_user_id`,
  )
    .bind(telegramUserId)
    .first<CrmUserListRow & { lastLoginAt: string | null }>();

  if (!user) return null;

  const activity = await env.DB.prepare(
    `SELECT id, event_type, telegram_user_id, crm_user_id, xt_uid, actor_role, title, details_json, created_at
     FROM crm_activity_events
     WHERE telegram_user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 100`,
  )
    .bind(telegramUserId)
    .all<CrmTimelineEvent>();

  return {
    user: { ...user, lastLoginAt: null },
    activity: activity.results ?? [],
  };
}

export async function logCrmEvent(
  env: CrmEnv,
  event: {
    eventType: string;
    title: string;
    details?: unknown;
    telegramUserId?: string | null;
    crmUserId?: number | null;
    xtUid?: string | null;
    actorRole?: CrmRole | null;
  },
) {
  await env.DB.prepare(
    `INSERT INTO crm_activity_events (event_type, telegram_user_id, crm_user_id, xt_uid, actor_role, title, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      event.eventType,
      event.telegramUserId ?? null,
      event.crmUserId ?? null,
      event.xtUid ?? null,
      event.actorRole ?? null,
      event.title,
      event.details ? JSON.stringify(event.details) : null,
      new Date().toISOString(),
    )
    .run();
}

function getSortExpression(sortBy: string) {
  switch (sortBy) {
    case 'telegramUserId':
      return 'u.telegram_user_id';
    case 'telegramUsername':
      return 'u.telegram_username';
    case 'xtUid':
      return 'u.xt_uid';
    case 'verificationStatus':
      return 'u.verification_status';
    case 'accessLevel':
      return 'u.access_level';
    case 'createdAt':
      return 'u.created_at';
    case 'updatedAt':
      return 'u.updated_at';
    case 'verifiedAt':
      return 'u.verified_at';
    case 'activityCount':
      return 'COUNT(e.id)';
    case 'lastActivityAt':
      return 'MAX(e.created_at)';
    default:
      return 'u.updated_at';
  }
}

function toSessionUser(user: CrmUserRecord): CrmSessionUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    allowedRoles: CRM_ALLOWED_ROLES,
    lastLoginAt: user.lastLoginAt,
  };
}

function isSecureRequest(url: string) {
  return new URL(url).protocol === 'https:';
}
