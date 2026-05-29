import { logCrmEvent } from './crm-server';
import { validateDiscountEmailPair } from './xt-card-discount';
import type { VerificationStatus } from './shared';

type DiscountServerEnv = {
  DB: D1Database;
};

export type DiscountEmailState = {
  discountEmail: string | null;
  discountEmailSentAt: string | null;
};

export async function getDiscountEmailState(env: DiscountServerEnv, telegramUserId: string): Promise<DiscountEmailState> {
  const row = await env.DB.prepare(
    `SELECT discount_email AS discountEmail, discount_email_sent_at AS discountEmailSentAt FROM users WHERE telegram_user_id = ?`,
  )
    .bind(telegramUserId)
    .first<{ discountEmail: string | null; discountEmailSentAt: string | null }>();

  return {
    discountEmail: row?.discountEmail ?? null,
    discountEmailSentAt: row?.discountEmailSentAt ?? null,
  };
}

export async function saveDiscountEmail(
  env: DiscountServerEnv,
  params: {
    telegramUserId: string;
    verificationStatus: VerificationStatus;
    email: string;
    confirmEmail: string;
    verificationSessionId: string;
  },
) {
  await logCrmEvent(env, {
    eventType: 'xt_card_discount_email_submitted',
    telegramUserId: params.telegramUserId,
    title: 'ارسال ایمیل تخفیف کارت XT',
    details: {
      verificationSessionId: params.verificationSessionId,
      hasEmail: Boolean(params.email?.trim()),
      hasConfirmation: Boolean(params.confirmEmail?.trim()),
    },
  });

  if (params.verificationStatus !== 'verified') {
    await logCrmEvent(env, {
      eventType: 'xt_card_discount_email_rejected',
      telegramUserId: params.telegramUserId,
      title: 'ارسال ایمیل تخفیف کارت XT رد شد',
      details: {
        verificationSessionId: params.verificationSessionId,
        reason: 'locked',
      },
    });
    return {
      ok: false as const,
      status: 403 as const,
      message: 'این بخش فقط پس از تأیید شناسه در دسترس است.',
      reason: 'locked' as const,
    };
  }

  const validation = validateDiscountEmailPair(params.email, params.confirmEmail);
  if (!validation.ok) {
    await logCrmEvent(env, {
      eventType: 'xt_card_discount_email_rejected',
      telegramUserId: params.telegramUserId,
      title: 'ارسال ایمیل تخفیف کارت XT رد شد',
      details: {
        verificationSessionId: params.verificationSessionId,
        reason: validation.reason,
      },
    });
    return {
      ok: false as const,
      status: 400 as const,
      message: discountValidationMessage(validation.reason),
      reason: validation.reason,
    };
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE users
     SET discount_email = ?, discount_email_sent_at = NULL, updated_at = ?
     WHERE telegram_user_id = ?`,
  )
    .bind(validation.email, now, params.telegramUserId)
    .run();

  await logCrmEvent(env, {
    eventType: 'xt_card_discount_email_saved',
    telegramUserId: params.telegramUserId,
    title: 'ذخیره ایمیل تخفیف کارت XT',
    details: {
      discountEmail: validation.email,
      verificationSessionId: params.verificationSessionId,
    },
  });

  return {
    ok: true as const,
    status: 200 as const,
    discountEmail: validation.email,
    message: 'ایمیل شما با موفقیت ذخیره شد.',
  };
}

function discountValidationMessage(reason: 'missing_email' | 'invalid_email' | 'missing_confirmation' | 'mismatch') {
  switch (reason) {
    case 'missing_email':
      return 'لطفاً آدرس ایمیل را وارد کنید.';
    case 'invalid_email':
      return 'لطفاً یک آدرس ایمیل معتبر وارد کنید.';
    case 'missing_confirmation':
      return 'لطفاً آدرس ایمیل را در فیلد تأیید هم وارد کنید.';
    case 'mismatch':
      return 'آدرس‌های ایمیل با هم یکسان نیستند.';
  }
}
