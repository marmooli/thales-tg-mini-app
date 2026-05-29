import { describe, expect, it, vi } from 'vitest';
import { blockPaste, validateDiscountEmailPair } from '../src/xt-card-discount';
import { saveDiscountEmail } from '../src/xt-card-discount-server';

function createMockDb() {
  const queries: Array<{ sql: string; binds: unknown[] }> = [];
  const state = {
    user: {
      telegramUserId: 'tg-user',
      discountEmail: null as string | null,
    },
  };

  const db = {
    prepare(sql: string) {
      const entry = { sql, binds: [] as unknown[] };
      queries.push(entry);
      return {
        bind(...values: unknown[]) {
          entry.binds = values;
          return this;
        },
        async run() {
          if (sql.includes('UPDATE users') && sql.includes('discount_email')) {
            state.user.discountEmail = String(entry.binds[0] ?? '');
          }
          return { success: true };
        },
        async first() {
          if (sql.includes('SELECT discount_email')) {
            return { discountEmail: state.user.discountEmail };
          }
          return null;
        },
        async all() {
          return { results: [] };
        },
      };
    },
  } as unknown as D1Database;

  return { db, queries, state };
}

describe('xt card discount process', () => {
  it('validates matching email pairs', () => {
    expect(validateDiscountEmailPair('test@example.com', 'test@example.com')).toEqual({
      ok: true,
      email: 'test@example.com',
    });
    expect(validateDiscountEmailPair('test@example.com', 'other@example.com')).toEqual({
      ok: false,
      reason: 'mismatch',
    });
    expect(validateDiscountEmailPair('bad', 'bad')).toEqual({
      ok: false,
      reason: 'invalid_email',
    });
    expect(validateDiscountEmailPair('test@example.com', '')).toEqual({
      ok: false,
      reason: 'missing_confirmation',
    });
    expect(validateDiscountEmailPair('', 'test@example.com')).toEqual({
      ok: false,
      reason: 'missing_email',
    });
  });

  it('blocks paste into the confirmation email field', () => {
    const preventDefault = vi.fn();
    blockPaste({ preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('persists verified discount email on the user record and logs the submission', async () => {
    const { db, queries, state } = createMockDb();

    const result = await saveDiscountEmail(
      { DB: db },
      {
        telegramUserId: 'tg-user',
        verificationStatus: 'verified',
        email: 'customer@example.com',
        confirmEmail: 'customer@example.com',
        verificationSessionId: 'session-123',
      },
    );

    expect(result.ok).toBe(true);
    expect(state.user.discountEmail).toBe('customer@example.com');
    expect(queries.some((query) => query.binds[0] === 'xt_card_discount_email_submitted')).toBe(true);
    expect(queries.some((query) => query.binds[0] === 'xt_card_discount_email_saved')).toBe(true);
    expect(queries.some((query) => query.sql.includes('UPDATE users'))).toBe(true);
  });

  it('rejects mismatched discount email values', async () => {
    const { db, queries, state } = createMockDb();

    const result = await saveDiscountEmail(
      { DB: db },
      {
        telegramUserId: 'tg-user',
        verificationStatus: 'verified',
        email: 'customer@example.com',
        confirmEmail: 'other@example.com',
        verificationSessionId: 'session-123',
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('mismatch');
    }
    expect(state.user.discountEmail).toBeNull();
    expect(queries.some((query) => query.binds[0] === 'xt_card_discount_email_rejected')).toBe(true);
    expect(queries.some((query) => query.sql.includes('UPDATE users'))).toBe(false);
  });

  it('rejects saving discount email for unverified users', async () => {
    const { db, queries, state } = createMockDb();

    const result = await saveDiscountEmail(
      { DB: db },
      {
        telegramUserId: 'tg-user',
        verificationStatus: 'not_verified',
        email: 'customer@example.com',
        confirmEmail: 'customer@example.com',
        verificationSessionId: 'session-123',
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.reason).toBe('locked');
    }
    expect(state.user.discountEmail).toBeNull();
    expect(queries.some((query) => query.binds[0] === 'xt_card_discount_email_rejected')).toBe(true);
    expect(queries.some((query) => query.sql.includes('UPDATE users'))).toBe(false);
  });
});
