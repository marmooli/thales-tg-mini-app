export const XT_CARD_DISCOUNT_PROCESS_PATH = '/xt-card-discount-process';
export const XT_CARD_COUPON_VIDEO_PATH = '/xt-card-coupon-video';

export type DiscountEmailValidationResult =
  | {
      ok: true;
      email: string;
    }
  | {
      ok: false;
      reason: 'missing_email' | 'invalid_email' | 'missing_confirmation' | 'mismatch';
    };

export function normalizeDiscountEmail(value: string) {
  return value.trim();
}

export function isValidDiscountEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function validateDiscountEmailPair(email: string, confirmation: string): DiscountEmailValidationResult {
  const primary = normalizeDiscountEmail(email);
  const confirm = normalizeDiscountEmail(confirmation);

  if (!primary) {
    return { ok: false, reason: 'missing_email' };
  }

  if (!isValidDiscountEmail(primary)) {
    return { ok: false, reason: 'invalid_email' };
  }

  if (!confirm) {
    return { ok: false, reason: 'missing_confirmation' };
  }

  if (primary.toLowerCase() !== confirm.toLowerCase()) {
    return { ok: false, reason: 'mismatch' };
  }

  return { ok: true, email: primary };
}

export function blockPaste(event: { preventDefault(): void }) {
  event.preventDefault();
}
