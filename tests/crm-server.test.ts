import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { registerCrmRoutes } from '../src/crm-server';

describe('crm server guards', () => {
  it('rejects crm requests without a valid session', async () => {
    const app = new Hono<{
      Bindings: {
        DB: D1Database;
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
        CRM_SESSION_SECRET: 'secret',
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: 'ورود CRM معتبر نیست.',
    });
  });
});
