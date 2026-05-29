export type XtUidFlowRoute = 'main' | 'xt-uid-help' | 'xt-registration-guide' | 'support';

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
    case '/xt-uid-help':
      return 'xt-uid-help';
    case '/xt-registration-guide':
      return 'xt-registration-guide';
    case '/support':
      return 'support';
    default:
      return 'main';
  }
}

export function getXtUidFlowRoutePath(route: XtUidFlowRoute) {
  switch (route) {
    case 'xt-uid-help':
      return '/xt-uid-help';
    case 'xt-registration-guide':
      return '/xt-registration-guide';
    case 'support':
      return '/support';
    default:
      return '/';
  }
}

export function getXtUidFlowPageTitle(route: Exclude<XtUidFlowRoute, 'main'>) {
  switch (route) {
    case 'xt-uid-help':
      return 'راهنمای پیدا کردن UID';
    case 'xt-registration-guide':
      return 'راهنمای ثبت‌نام با کد طالس';
    case 'support':
      return 'تماس با پشتیبانی';
  }
}

export function getXtUidFlowBackLabel() {
  return 'بازگشت';
}

export function getXtUidFlowNavigationEvent(route: Exclude<XtUidFlowRoute, 'main'>) {
  switch (route) {
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
  }
}

export function shouldRevealXtUidSupport(failedAttemptsInSession: number) {
  return failedAttemptsInSession >= 3;
}
