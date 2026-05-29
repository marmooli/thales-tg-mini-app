type CouponSentEnv = {
  DB: D1Database;
};

export type CouponSentState = {
  couponSentAt: string | null;
};

export function getCouponSentStatus(couponSentAt: string | null) {
  return couponSentAt ? ('sent' as const) : ('none' as const);
}

export async function getCouponSentState(env: CouponSentEnv, telegramUserId: string): Promise<CouponSentState> {
  const row = await env.DB.prepare(`SELECT coupon_sent_at AS couponSentAt FROM users WHERE telegram_user_id = ?`)
    .bind(telegramUserId)
    .first<{ couponSentAt: string | null }>();

  return {
    couponSentAt: row?.couponSentAt ?? null,
  };
}

export async function setCouponSentState(
  env: CouponSentEnv,
  telegramUserId: string,
  couponSentAt: string | null,
) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE users
     SET coupon_sent_at = ?, updated_at = ?
     WHERE telegram_user_id = ?`,
  )
    .bind(couponSentAt, now, telegramUserId)
    .run();

  return { couponSentAt };
}
