import { describe, expect, it } from 'vitest';
import { buildCouponSentNotificationMessage } from '../src/telegram-bot';
import { getCouponSentState, getCouponSentStatus, setCouponSentState } from '../src/coupon-sent';

function createMockDb() {
  const state = {
    couponSentAt: null as string | null,
  };

  const db = {
    prepare(sql: string) {
      const entry = { sql, binds: [] as unknown[] };
      return {
        bind(...values: unknown[]) {
          entry.binds = values;
          return this;
        },
        async first() {
          if (sql.includes('SELECT coupon_sent_at AS couponSentAt')) {
            return { couponSentAt: state.couponSentAt };
          }
          return null;
        },
        async run() {
          if (sql.includes('UPDATE users') && sql.includes('coupon_sent_at')) {
            state.couponSentAt = (entry.binds[0] as string | null) ?? null;
          }
          return { success: true };
        },
        async all() {
          return { results: [] };
        },
      };
    },
  } as unknown as D1Database;

  return { db, state };
}

describe('coupon sent helpers', () => {
  it('builds the Telegram notification text', () => {
    expect(buildCouponSentNotificationMessage()).toBe(
      'تبریک! کوپن ۳۸ دلاری تخفیف کارت برای شما آزاد شد. اکنون می‌توانید کارت XT خود را بصورت رایگان فعال کنید.',
    );
  });

  it('maps coupon sent state to sent/none status', () => {
    expect(getCouponSentStatus(null)).toBe('none');
    expect(getCouponSentStatus('2026-05-29T12:00:00.000Z')).toBe('sent');
  });

  it('reads and writes coupon sent state on the user record', async () => {
    const { db, state } = createMockDb();

    expect(await getCouponSentState({ DB: db }, 'tg-user')).toEqual({ couponSentAt: null });

    const updated = await setCouponSentState({ DB: db }, 'tg-user', '2026-05-29T12:00:00.000Z');
    expect(updated).toEqual({ couponSentAt: '2026-05-29T12:00:00.000Z' });
    expect(state.couponSentAt).toBe('2026-05-29T12:00:00.000Z');

    expect(await getCouponSentState({ DB: db }, 'tg-user')).toEqual({ couponSentAt: '2026-05-29T12:00:00.000Z' });
  });
});
