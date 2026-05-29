export type XtUidFlowRoute =
  | 'main'
  | 'verify'
  | 'xt-campaign'
  | 'xt-uid-help'
  | 'xt-registration-guide'
  | 'support'
  | 'xt-card-discount-process'
  | 'xt-card-coupon-video';

export const XT_UID_FLOW_SESSION_STORAGE_KEY = 'thales_xt_uid_verification_session_id';

export function createVerificationSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `xt-uid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getOrCreateVerificationSessionId(storage?: Pick<Storage, 'getItem' | 'setItem'> | null) {
  if (!storage) {
    return createVerificationSessionId();
  }

  try {
    const current = storage.getItem(XT_UID_FLOW_SESSION_STORAGE_KEY);
    if (current) return current;

    const next = createVerificationSessionId();
    storage.setItem(XT_UID_FLOW_SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return createVerificationSessionId();
  }
}

export function resolveXtUidFlowRoute(pathname: string): XtUidFlowRoute {
  switch (pathname) {
    case '/verify':
      return 'verify';
    case '/xt-campaign':
      return 'xt-campaign';
    case '/xt-uid-help':
      return 'xt-uid-help';
    case '/xt-registration-guide':
      return 'xt-registration-guide';
    case '/support':
      return 'support';
    case '/xt-card-discount-process':
      return 'xt-card-discount-process';
    case '/xt-card-coupon-video':
      return 'xt-card-coupon-video';
    default:
      return 'main';
  }
}

export function getXtUidFlowRoutePath(route: XtUidFlowRoute) {
  switch (route) {
    case 'verify':
      return '/verify';
    case 'xt-campaign':
      return '/xt-campaign';
    case 'xt-uid-help':
      return '/xt-uid-help';
    case 'xt-registration-guide':
      return '/xt-registration-guide';
    case 'support':
      return '/support';
    case 'xt-card-discount-process':
      return '/xt-card-discount-process';
    case 'xt-card-coupon-video':
      return '/xt-card-coupon-video';
    default:
      return '/';
  }
}

export function getXtUidFlowPageTitle(route: Exclude<XtUidFlowRoute, 'main'>) {
  switch (route) {
    case 'verify':
      return 'تأیید شناسه';
    case 'xt-campaign':
      return 'صفحه فرود XT Card';
    case 'xt-uid-help':
      return 'راهنمای پیدا کردن UID';
    case 'xt-registration-guide':
      return 'راهنمای ثبت‌نام با کد طالس';
    case 'support':
      return 'تماس با پشتیبانی';
    case 'xt-card-discount-process':
      return 'فرایند دریافت تخفیف ۳۸ دلاری کارت XT';
    case 'xt-card-coupon-video':
      return 'ویدیوی راهنمای فعال کردن رایگان کارت';
  }
}

export function getXtUidFlowBackLabel() {
  return 'بازگشت';
}

export function getXtUidFlowNavigationEvent(route: Exclude<XtUidFlowRoute, 'main'>) {
  switch (route) {
    case 'verify':
      return {
        eventType: 'xt_verification_page_opened',
        title: 'مشاهده صفحه تأیید شناسه',
      } as const;
    case 'xt-campaign':
      return {
        eventType: 'xt_campaign_opened',
        title: 'مشاهده صفحه فرود XT Card',
      } as const;
    case 'xt-uid-help':
      return {
        eventType: 'xt_uid_help_opened',
        title: 'مشاهده راهنمای پیدا کردن UID',
      } as const;
    case 'xt-registration-guide':
      return {
        eventType: 'xt_registration_guide_opened',
        title: 'مشاهده راهنمای ثبت‌نام با کد طالس',
      } as const;
    case 'support':
      return {
        eventType: 'xt_support_opened',
        title: 'مشاهده صفحه پشتیبانی',
      } as const;
    case 'xt-card-discount-process':
      return {
        eventType: 'xt_card_discount_process_opened',
        title: 'مشاهده فرایند دریافت تخفیف ۳۸ دلاری کارت XT',
      } as const;
    case 'xt-card-coupon-video':
      return {
        eventType: 'xt_card_coupon_video_opened',
        title: 'مشاهده ویدیوی راهنمای فعال کردن رایگان کارت',
      } as const;
  }
}

export function shouldRevealXtUidSupport(failedAttemptsInSession: number) {
  return failedAttemptsInSession >= 3;
}

export function shouldReturnHomeAfterVerification(status: 'not_verified' | 'pending_review' | 'verified' | 'rejected') {
  return status === 'verified';
}
