/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import {
  buildBotStartMessage,
  buildTelegramStartKeyboard,
  getDiscountAccessCopy,
  normalizeUid,
  type VerificationStatus,
} from '../src/shared';
import { logCrmEvent, registerCrmRoutes } from '../src/crm-server';
import { verifyXtReferral } from '../src/xt-verification';

type Env = {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_USERNAME: string;
  APP_BASE_URL: string;
  XT_API_PROXY_BASE_URL?: string;
  DEV_BYPASS_TELEGRAM_AUTH?: string;
  CRM_SESSION_SECRET?: string;
  CRM_BOOTSTRAP_USERNAME?: string;
  CRM_BOOTSTRAP_PASSWORD?: string;
  CRM_BOOTSTRAP_ROLE?: string;
  DB: D1Database;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();
registerCrmRoutes(app);

app.post('/api/auth/telegram', async (c) => {
  const { initData } = await c.req.json<{ initData?: string }>().catch(() => ({ initData: '' }));
  const user = await authenticateTelegram(c.env, initData ?? '');
  if (!user.ok) return c.json(user, 401);
  return c.json({ ok: true, user: user.user });
});

app.post('/api/me', async (c) => {
  const { initData } = await c.req.json<{ initData?: string }>().catch(() => ({ initData: '' }));
  const user = await authenticateTelegram(c.env, initData ?? '');
  if (!user.ok) return c.json(user, 401);
  return c.json({
    ok: true,
    user: {
      telegramUserId: user.user.telegramUserId,
      verificationStatus: user.user.verificationStatus,
      accessLevel: user.user.accessLevel,
      features: { xtCard48Discount: user.user.verificationStatus === 'verified' },
    },
  });
});

app.post('/api/verify/xt-uid', async (c) => {
  const { initData, xtUid } = await c.req.json<{ initData?: string; xtUid?: string }>().catch(() => ({ initData: '', xtUid: '' }));
  const auth = await authenticateTelegram(c.env, initData ?? '');
  if (!auth.ok) return c.json(auth, 401);
  const normalized = normalizeUid(xtUid ?? '');
  if (!normalized) {
    await logCrmEvent(c.env, {
      eventType: 'uid_submit',
      telegramUserId: auth.user.telegramUserId,
      title: 'ثبت شناسه XT نامعتبر',
      details: { reason: 'missing_or_empty_uid' },
    });
    return c.json({ ok: false, message: 'شناسه XT معتبر نیست.' }, 400);
  }
  await logCrmEvent(c.env, {
    eventType: 'uid_submit',
    telegramUserId: auth.user.telegramUserId,
    xtUid: normalized,
    title: 'ثبت شناسه XT',
    details: { xtUid: normalized },
  });
  const result = await verifyXtReferral(c.env, normalized, auth.user.telegramUserId, fallbackAllowlistCheck(c.env));
  await persistVerificationAttempt(c.env, auth.user.telegramUserId, normalized, result);
  await applyVerificationResult(c.env, auth.user.telegramUserId, normalized, result.status);
  await logCrmEvent(c.env, {
    eventType: result.status === 'verified' ? 'uid_verified' : 'uid_pending_review',
    telegramUserId: auth.user.telegramUserId,
    xtUid: normalized,
    title: result.status === 'verified' ? 'شناسه XT تأیید شد' : 'شناسه XT در انتظار بررسی است',
    details: {
      source: result.source,
      rawResult: result.rawResult,
      fallbackUsed: result.fallbackUsed,
    },
  });
    return c.json({
      ok: true,
      status: result.status,
      message:
        result.status === 'verified'
          ? 'شناسه شما با موفقیت تأیید شد.'
        : 'یا شناسه اشتباه وارد شده یا این شناسه با کد طالس ثبت‌نام نکرده است.',
    });
});

app.post('/api/feature/xt-card-48', async (c) => {
  const { initData } = await c.req.json<{ initData?: string }>().catch(() => ({ initData: '' }));
  const auth = await authenticateTelegram(c.env, initData ?? '');
  if (!auth.ok) return c.json(auth, 401);
  const discount = getDiscountAccessCopy(auth.user.verificationStatus === 'verified');
  return c.json({ ok: true, ...discount });
});

app.post('/api/telegram/webhook', async (c) => {
  const update = await c.req.json<any>().catch(() => null);
  if (!update) return c.json({ ok: false }, 400);
  if (update.message?.text === '/start' && update.message?.chat?.id) {
    const chatId = update.message.chat.id;
    await sendTelegramMessage(c.env, chatId, buildBotStartMessage(), buildTelegramStartKeyboard(c.env.APP_BASE_URL));
  }
  return c.json({ ok: true });
});

app.get('/crm', async (c) => c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url))));
app.get('/crm/*', async (c) => c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url))));

app.get('*', async (c) => {
  const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
  if (assetResponse.status !== 404 || c.req.path.startsWith('/assets/') || c.req.path.startsWith('/api/')) {
    return assetResponse;
  }

  const fallbackRequest = new Request(new URL('/index.html', c.req.url), c.req.raw);
  return c.env.ASSETS.fetch(fallbackRequest);
});

async function authenticateTelegram(env: Env, initData: string) {
  console.log('telegram auth start', {
    hasInitData: Boolean(initData),
    initDataLength: initData.length,
    bypass: env.DEV_BYPASS_TELEGRAM_AUTH === 'true',
  });
  if (!initData && env.DEV_BYPASS_TELEGRAM_AUTH === 'true') {
    const telegramUserId = 'dev-demo-user';
    await upsertUser(env, {
      telegramUserId,
      username: 'dev',
      firstName: 'Dev',
      lastName: 'User',
    });
    const stored = await getUser(env, telegramUserId);
    await logCrmEvent(env, {
      eventType: 'telegram_auth_success',
      telegramUserId,
      title: 'ورود تلگرام موفق',
      details: { bypass: true },
    });
    return { ok: true, user: stored } as const;
  }

  if (!initData) {
    await logCrmEvent(env, {
      eventType: 'telegram_auth_failed',
      title: 'ورود تلگرام ناموفق',
      details: { reason: 'missing_initData' },
    });
    return { ok: false, message: 'اطلاعات ورود تلگرام دریافت نشد.' } as const;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const authDate = Number(params.get('auth_date') ?? 0);
  const userJson = params.get('user');
  console.log('telegram auth parsed', {
    hasHash: Boolean(hash),
    hasAuthDate: Boolean(authDate),
    hasUser: Boolean(userJson),
    authDate,
  });
  if (!hash || !authDate || !userJson) {
    await logCrmEvent(env, {
      eventType: 'telegram_auth_failed',
      title: 'ورود تلگرام ناموفق',
      details: { reason: 'missing_required_fields', hasHash: Boolean(hash), hasAuthDate: Boolean(authDate), hasUser: Boolean(userJson) },
    });
    return { ok: false, message: 'اطلاعات ورود تلگرام ناقص است.' } as const;
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds < 0 || ageSeconds > 86400) {
    await logCrmEvent(env, {
      eventType: 'telegram_auth_failed',
      title: 'ورود تلگرام ناموفق',
      details: { reason: 'expired', ageSeconds },
    });
    return { ok: false, message: 'اطلاعات ورود تلگرام منقضی شده است.' } as const;
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const webAppDataKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const secret = await crypto.subtle.sign('HMAC', webAppDataKey, new TextEncoder().encode(env.TELEGRAM_BOT_TOKEN));
  const hmacKey = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(dataCheckString));
  const computed = [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
  console.log('telegram auth hash check', {
    authDate,
    computedMatches: computed === hash,
  });
  if (computed !== hash) {
    await logCrmEvent(env, {
      eventType: 'telegram_auth_failed',
      title: 'ورود تلگرام ناموفق',
      details: { reason: 'invalid_signature' },
    });
    return { ok: false, message: 'امضای ورود تلگرام معتبر نیست.' } as const;
  }

  const user = JSON.parse(userJson) as { id: number; username?: string; first_name?: string; last_name?: string };
  const telegramUserId = String(user.id);
  await upsertUser(env, {
    telegramUserId,
    username: user.username ?? null,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null,
  });
  await logCrmEvent(env, {
    eventType: 'telegram_auth_success',
    telegramUserId,
    title: 'ورود تلگرام موفق',
    details: {
      username: user.username ?? null,
    },
  });
  const stored = await getUser(env, telegramUserId);
  return { ok: true, user: stored } as const;
}

async function upsertUser(
  env: Env,
  user: { telegramUserId: string; username: string | null; firstName: string | null; lastName: string | null },
) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO users (telegram_user_id, telegram_username, first_name, last_name, verification_status, access_level, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'not_verified', 'none', ?, ?)
     ON CONFLICT(telegram_user_id) DO UPDATE SET
       telegram_username=excluded.telegram_username,
       first_name=excluded.first_name,
       last_name=excluded.last_name,
       updated_at=excluded.updated_at`,
  )
    .bind(user.telegramUserId, user.username, user.firstName, user.lastName, now, now)
    .run();
}

function fallbackAllowlistCheck(env: Env) {
  return async (uid: string) => {
    const row = await env.DB.prepare(`SELECT xt_uid FROM allowed_xt_uids WHERE xt_uid = ?`).bind(uid).first();
    return Boolean(row);
  };
}

async function persistVerificationAttempt(
  env: Env,
  telegramUserId: string,
  xtUid: string,
  result: Awaited<ReturnType<typeof verifyXtReferral>>,
) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO uid_verification_attempts (telegram_user_id, xt_uid, status, source, raw_result, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(telegramUserId, xtUid, result.status, result.source, JSON.stringify(result.rawResult), now)
    .run();
}

async function applyVerificationResult(
  env: Env,
  telegramUserId: string,
  xtUid: string,
  status: VerificationStatus,
) {
  const now = new Date().toISOString();
  const accessLevel = status === 'verified' ? 'verified_referral' : 'none';
  await env.DB.prepare(
    `UPDATE users
     SET xt_uid = ?, verification_status = ?, access_level = ?, verified_at = CASE WHEN ? = 'verified' THEN ? ELSE verified_at END, updated_at = ?
     WHERE telegram_user_id = ?`,
  )
    .bind(xtUid, status, accessLevel, status, now, now, telegramUserId)
    .run();
}

async function getUser(env: Env, telegramUserId: string) {
  const row = await env.DB.prepare(`SELECT telegram_user_id, verification_status, access_level FROM users WHERE telegram_user_id = ?`)
    .bind(telegramUserId)
    .first<{
      telegram_user_id: string;
      verification_status: VerificationStatus;
      access_level: string;
    }>();
  return {
    telegramUserId,
    verificationStatus: row?.verification_status ?? 'not_verified',
    accessLevel: row?.access_level ?? 'none',
  };
}

async function sendTelegramMessage(env: Env, chatId: number | string, text: string, replyMarkup?: unknown) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }
}

export default app;
