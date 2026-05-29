import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSignedSession } from '../src/crm-logic';
import { registerCrmRoutes } from '../src/crm-server';

type MockState = {
  user: {
    telegramUserId: string;
    couponSentAt: string | null;
  };
  crmSession: {
    sessionId: string;
    crmUserId: number;
    roleSnapshot: 'super_admin';
    expiresAt: string;
    revokedAt: string | null;
  };
  events: Array<Record<string, unknown>>;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function createDb(state: MockState) {
  return {
    prepare(sql: string) {
      const entry = { sql, binds: [] as unknown[] };
      return {
        bind(...values: unknown[]) {
          entry.binds = values;
          return this;
        },
        async first<T>() {
          if (sql.includes('FROM crm_sessions s')) {
            return {
              sessionId: state.crmSession.sessionId,
              crmUserId: state.crmSession.crmUserId,
              roleSnapshot: state.crmSession.roleSnapshot,
              expiresAt: state.crmSession.expiresAt,
              revokedAt: state.crmSession.revokedAt,
              username: 'admin',
              role: 'super_admin',
              isActive: 1,
              lastLoginAt: null,
            } as T;
          }

          if (sql.includes('SELECT telegram_user_id FROM users WHERE telegram_user_id = ?')) {
            return state.user ? ({ telegram_user_id: state.user.telegramUserId } as T) : (null as T);
          }

          if (sql.includes('SELECT coupon_sent_at AS couponSentAt FROM users')) {
            return { couponSentAt: state.user.couponSentAt } as T;
          }

          return null as T;
        },
        async run() {
          if (sql.includes('UPDATE users') && sql.includes('coupon_sent_at = ?')) {
            state.user.couponSentAt = (entry.binds[0] as string | null) ?? null;
          }
          if (sql.includes('INSERT INTO crm_activity_events')) {
            state.events.push({
              eventType: entry.binds[0],
              telegramUserId: entry.binds[1],
              crmUserId: entry.binds[2],
              xtUid: entry.binds[3],
              actorRole: entry.binds[4],
              title: entry.binds[5],
              detailsJson: entry.binds[6],
              createdAt: entry.binds[7],
            });
          }
          return { success: true };
        },
        async all() {
          return { results: [] };
        },
      };
    },
  } as unknown as D1Database;
}

function createApp(state: MockState) {
  const app = new Hono<{
    Bindings: {
      DB: D1Database;
      TELEGRAM_BOT_TOKEN: string;
      CRM_SESSION_SECRET: string;
    };
  }>();
  registerCrmRoutes(app);
  return app;
}

describe('crm coupon sent route', () => {
  it('sends the Telegram message and persists coupon_sent_at when enabled', async () => {
    const state: MockState = {
      user: { telegramUserId: '1314254592', couponSentAt: null },
      crmSession: {
        sessionId: 'session-1',
        crmUserId: 1,
        roleSnapshot: 'super_admin',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        revokedAt: null,
      },
      events: [],
    };
    const app = createApp(state);
    const token = await createSignedSession('secret', {
      sessionId: state.crmSession.sessionId,
      crmUserId: state.crmSession.crmUserId,
      role: state.crmSession.roleSnapshot,
      expiresAt: Date.parse(state.crmSession.expiresAt),
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ ok: true }),
      })),
    );

    const response = await app.fetch(
      new Request('http://localhost/api/crm/users/1314254592/coupon-sent-status', {
        method: 'POST',
        headers: {
          cookie: `crm_session=${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ status: 'sent' }),
      }),
      {
        DB: createDb(state),
        TELEGRAM_BOT_TOKEN: 'bot-token',
        CRM_SESSION_SECRET: 'secret',
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      couponSentAt: expect.any(String),
    });
    expect(state.user.couponSentAt).not.toBeNull();
    expect(state.events.map((event) => event.eventType)).toContain('crm_mark_coupon_sent');
    expect(vi.mocked(fetch)).toHaveBeenCalled();
  });

  it('clears coupon_sent_at when the toggle is turned off', async () => {
    const state: MockState = {
      user: { telegramUserId: '1314254592', couponSentAt: '2026-05-29T12:00:00.000Z' },
      crmSession: {
        sessionId: 'session-1',
        crmUserId: 1,
        roleSnapshot: 'super_admin',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        revokedAt: null,
      },
      events: [],
    };
    const app = createApp(state);
    const token = await createSignedSession('secret', {
      sessionId: state.crmSession.sessionId,
      crmUserId: state.crmSession.crmUserId,
      role: state.crmSession.roleSnapshot,
      expiresAt: Date.parse(state.crmSession.expiresAt),
    });

    const response = await app.fetch(
      new Request('http://localhost/api/crm/users/1314254592/coupon-sent-status', {
        method: 'POST',
        headers: {
          cookie: `crm_session=${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ status: 'none' }),
      }),
      {
        DB: createDb(state),
        TELEGRAM_BOT_TOKEN: 'bot-token',
        CRM_SESSION_SECRET: 'secret',
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      couponSentAt: null,
    });
    expect(state.user.couponSentAt).toBeNull();
    expect(state.events.map((event) => event.eventType)).toContain('crm_mark_coupon_pending_review');
  });

  it('returns a CRM error when Telegram delivery fails', async () => {
    const state: MockState = {
      user: { telegramUserId: '1314254592', couponSentAt: null },
      crmSession: {
        sessionId: 'session-1',
        crmUserId: 1,
        roleSnapshot: 'super_admin',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        revokedAt: null,
      },
      events: [],
    };
    const app = createApp(state);
    const token = await createSignedSession('secret', {
      sessionId: state.crmSession.sessionId,
      crmUserId: state.crmSession.crmUserId,
      role: state.crmSession.roleSnapshot,
      expiresAt: Date.parse(state.crmSession.expiresAt),
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        text: async () => 'boom',
      })),
    );

    const response = await app.fetch(
      new Request('http://localhost/api/crm/users/1314254592/coupon-sent-status', {
        method: 'POST',
        headers: {
          cookie: `crm_session=${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ status: 'sent' }),
      }),
      {
        DB: createDb(state),
        TELEGRAM_BOT_TOKEN: 'bot-token',
        CRM_SESSION_SECRET: 'secret',
      },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'ارسال پیام به کاربر موفق نبود.',
    });
    expect(state.user.couponSentAt).toBeNull();
    expect(state.events.map((event) => event.eventType)).toContain('crm_coupon_notification_failed');
  });
});
