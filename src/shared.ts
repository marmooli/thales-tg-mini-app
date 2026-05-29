export type VerificationStatus = 'not_verified' | 'pending_review' | 'verified' | 'rejected';

export type TelegramUserProfile = {
  telegramUserId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
};

export function normalizeUid(value: string) {
  return value.trim().replace(/\s+/g, '');
}

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

export function isUidAllowedByFormat(value: string) {
  return /^[A-Za-z0-9_-]{4,32}$/.test(value);
}

export function buildTelegramStartKeyboard(appUrl: string) {
  return {
    inline_keyboard: [[{ text: 'Open Thales App', web_app: { url: appUrl } }]],
  };
}

export function buildBotStartMessage() {
  return 'به اپلیکیشن مشتری ثالس خوش آمدید.\nبرای تأیید شناسه XT و دسترسی به مزایا، اپ را باز کنید.';
}

export function getDiscountAccessCopy(isVerified: boolean) {
  if (isVerified) {
    return {
      allowed: true,
      title: 'دریافت تخفیف ۳۸ دلاری کارت XT',
      body: 'این مزیت فقط برای مشتریان تأییدشده ثالس فعال است. جزئیات کامل بعداً اضافه می‌شود.',
      cta: 'دریافت تخفیف ۳۸ دلاری کارت XT',
    } as const;
  }

  return {
    allowed: false,
    title: 'دریافت تخفیف ۳۸ دلاری کارت XT',
    body: 'این بخش فقط پس از تأیید شناسه در دسترس است.',
    cta: 'تأیید شناسه XT',
  } as const;
}
