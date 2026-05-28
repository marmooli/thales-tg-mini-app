/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import {
  buildBotStartMessage,
  buildTelegramStartKeyboard,
  getDiscountAccessCopy,
  isUidAllowedByFormat,
  normalizeUid,
  type VerificationStatus,
} from '../src/shared';

type Env = {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_USERNAME: string;
  APP_BASE_URL: string;
  DEV_BYPASS_TELEGRAM_AUTH?: string;
  DB: D1Database;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();

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
  if (!normalized || !isUidAllowedByFormat(normalized)) {
    return c.json({ ok: false, message: 'شناسه XT معتبر نیست.' }, 400);
  }
  const result = await verifyXtReferral(c.env, normalized, auth.user.telegramUserId);
  return c.json({ ok: true, status: result.status, message: result.message });
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

app.get('*', async (c) => c.env.ASSETS.fetch(c.req.raw));

async function authenticateTelegram(env: Env, initData: string) {
  if (!initData && env.DEV_BYPASS_TELEGRAM_AUTH === 'true') {
    const telegramUserId = 'dev-demo-user';
    await upsertUser(env, {
      telegramUserId,
      username: 'dev',
      firstName: 'Dev',
      lastName: 'User',
    });
    const stored = await getUser(env, telegramUserId);
    return { ok: true, user: stored } as const;
  }

  if (!initData) return { ok: false, message: 'ورود تلگرام معتبر نیست.' } as const;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const authDate = Number(params.get('auth_date') ?? 0);
  const userJson = params.get('user');
  if (!hash || !authDate || !userJson) return { ok: false, message: 'ورود تلگرام معتبر نیست.' } as const;

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds < 0 || ageSeconds > 86400) return { ok: false, message: 'ورود تلگرام منقضی شده است.' } as const;

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const botTokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env.TELEGRAM_BOT_TOKEN));
  const secret = await crypto.subtle.importKey('raw', botTokenHash, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', secret, new TextEncoder().encode(dataCheckString));
  const computed = [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (computed !== hash) return { ok: false, message: 'ورود تلگرام معتبر نیست.' } as const;

  const user = JSON.parse(userJson) as { id: number; username?: string; first_name?: string; last_name?: string };
  const telegramUserId = String(user.id);
  await upsertUser(env, {
    telegramUserId,
    username: user.username ?? null,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null,
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

async function verifyXtReferral(env: Env, xtUid: string, telegramUserId: string) {
  const allowed = await env.DB.prepare(`SELECT xt_uid FROM allowed_xt_uids WHERE xt_uid = ?`).bind(xtUid).first();
  const now = new Date().toISOString();
  const status: VerificationStatus = allowed ? 'verified' : 'pending_review';
  const accessLevel = allowed ? 'verified_referral' : 'none';

  await env.DB.prepare(
    `UPDATE users
     SET xt_uid = ?, verification_status = ?, access_level = ?, verified_at = CASE WHEN ? = 'verified' THEN ? ELSE verified_at END, updated_at = ?
     WHERE telegram_user_id = ?`,
  )
    .bind(xtUid, status, accessLevel, status, now, now, telegramUserId)
    .run();

  await env.DB.prepare(
    `INSERT INTO uid_verification_attempts (telegram_user_id, xt_uid, status, source, raw_result, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(telegramUserId, xtUid, status, 'mvp_allowlist', JSON.stringify({ allowed: Boolean(allowed) }), now)
    .run();

  return {
    status,
    message: status === 'verified' ? 'شناسه شما با موفقیت تأیید شد.' : 'شناسه شما ثبت شد و در حال بررسی است.',
  } as const;
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
