import { describe, expect, it } from 'vitest';
import { recordXtUidFlowNavigationEvent, recordXtUidVerificationAttempt } from '../src/xt-uid-flow-server';

function createMockDb() {
  const queries: Array<{ sql: string; binds: unknown[] }> = [];
  const db = {
    prepare(sql: string) {
      const entry = { sql, binds: [] as unknown[] };
      queries.push(entry);
      return {
        bind(...values: unknown[]) {
          entry.binds = values;
          return this;
        },
        run: async () => ({ success: true }),
        first: async () => {
          if (sql.includes('COUNT(*) AS count')) {
            return { count: 3 };
          }
          return null;
        },
        all: async () => ({ results: [] }),
      };
    },
  } as unknown as D1Database;

  return { db, queries };
}

describe('xt uid flow server helpers', () => {
  it('persists verification attempts with session context and returns the session failure count', async () => {
    const { db, queries } = createMockDb();

    const result = await recordXtUidVerificationAttempt(
      { DB: db },
      {
        telegramUserId: 'tg-user',
        xtUid: '8081552376479',
        verificationSessionId: 'session-123',
        result: {
          status: 'pending_review',
          source: 'xt_api_proxy',
          rawResult: { invite: false },
        },
      },
    );

    expect(queries[0]?.sql).toContain('verification_session_id');
    expect(queries[0]?.binds).toContain('session-123');
    expect(result.failedAttemptsInSession).toBe(3);
    expect(result.showSupport).toBe(true);
  });

  it('logs helper navigation events with route context', async () => {
    const { db, queries } = createMockDb();

    await recordXtUidFlowNavigationEvent(
      { DB: db },
      {
        telegramUserId: 'tg-user',
        verificationSessionId: 'session-123',
        route: 'support',
      },
    );

    expect(queries[0]?.sql).toContain('crm_activity_events');
    expect(queries[0]?.binds[0]).toBe('xt_support_opened');
    expect(queries[0]?.binds[1]).toBe('tg-user');
    expect(JSON.parse(String(queries[0]?.binds[6]))).toMatchObject({
      route: 'support',
      verificationSessionId: 'session-123',
    });
  });
});
