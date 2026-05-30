import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { createSignedSession } from '../src/crm-logic';
import { registerCrmRoutes } from '../src/crm-server';

function createDbWithCrmUserListRow() {
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
              sessionId: 'session-1',
              crmUserId: 1,
              roleSnapshot: 'super_admin',
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
              revokedAt: null,
              username: 'admin',
              role: 'super_admin',
              isActive: 1,
              lastLoginAt: null,
            } as T;
          }

          if (sql.includes('COUNT(*) as total FROM (SELECT u.telegram_user_id')) {
            return { total: 1 } as T;
          }

          return null as T;
        },
        async all<T>() {
          if (sql.includes('SELECT') && sql.includes('u.discount_email AS discountEmail') && sql.includes('COUNT(e.id) AS activityCount')) {
            return {
              results: [
                {
                  telegramUserId: '1314254592',
                  telegramUsername: 'hsblkbrd',
                  firstName: 'Hamed',
                  lastName: 'Saffarian',
                  xtUid: 'XT-123',
                  discountEmail: 'hamed.saffarian@gmail.com',
                  verificationStatus: 'verified',
                  accessLevel: 'verified_referral',
                  createdAt: '2026-05-29T10:00:00.000Z',
                  updatedAt: '2026-05-29T11:00:00.000Z',
                  verifiedAt: '2026-05-29T11:05:00.000Z',
                  activityCount: 3,
                  lastActivityAt: '2026-05-29T11:05:00.000Z',
                },
              ],
            } as T;
          }

          return { results: [] } as T;
        },
        async run() {
          return { success: true };
        },
      };
    },
  } as unknown as D1Database;
}

describe('crm server guards', () => {
  it('rejects crm requests without a valid session', async () => {
    const app = new Hono<{
      Bindings: {
        DB: D1Database;
        TELEGRAM_BOT_TOKEN: string;
        CRM_SESSION_SECRET: string;
      };
    }>();

    registerCrmRoutes(app);

    const response = await app.fetch(
      new Request('http://localhost/api/crm/me'),
      {
        DB: {
          prepare() {
            throw new Error('DB should not be called for missing CRM session');
          },
        } as D1Database,
        TELEGRAM_BOT_TOKEN: 'bot-token',
        CRM_SESSION_SECRET: 'secret',
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'ورود CRM معتبر نیست.',
    });
  });

  it('returns the discount email in the CRM user list response', async () => {
    const app = new Hono<{
      Bindings: {
        DB: D1Database;
        TELEGRAM_BOT_TOKEN: string;
        CRM_SESSION_SECRET: string;
      };
    }>();

    registerCrmRoutes(app);
    const token = await createSignedSession('secret', {
      sessionId: 'session-1',
      crmUserId: 1,
      role: 'super_admin',
      expiresAt: Date.now() + 60_000,
    });

    const response = await app.fetch(
      new Request('http://localhost/api/crm/users', {
        headers: {
          cookie: `crm_session=${token}`,
        },
      }),
      {
        DB: createDbWithCrmUserListRow(),
        TELEGRAM_BOT_TOKEN: 'bot-token',
        CRM_SESSION_SECRET: 'secret',
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      users: [
        {
          telegramUserId: '1314254592',
          discountEmail: 'hamed.saffarian@gmail.com',
        },
      ],
    });
  });
});
