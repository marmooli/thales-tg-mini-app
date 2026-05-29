import { checkInvite, getKycStatus, getUserInfo, type XtProxyClient } from './xt-proxy';
import { isUidAllowedByFormat } from './shared';

export type XtVerificationStatus = 'verified' | 'pending_review';

export type XtVerificationAttempt = {
  status: XtVerificationStatus;
  source: 'xt_api_proxy' | 'mvp_allowlist';
  rawResult: unknown;
  proxyInvite?: boolean;
  proxyUserInfo?: unknown;
  proxyKycStatus?: unknown;
  fallbackUsed?: boolean;
};

export type XtVerificationEnv = {
  XT_API_PROXY_BASE_URL?: string;
  DEV_DISABLE_XT_API_PROXY?: string;
  DB: D1Database;
};

export async function verifyXtReferral(
  env: XtVerificationEnv,
  xtUid: string,
  telegramUserId: string,
  fallbackCheck: (uid: string) => Promise<boolean>,
): Promise<XtVerificationAttempt> {
  if (!isUidAllowedByFormat(xtUid)) {
    return {
      status: 'pending_review',
      source: 'xt_api_proxy',
      rawResult: { reason: 'invalid_format' },
    };
  }

  if (env.DEV_DISABLE_XT_API_PROXY === 'true') {
    return verifyViaFallback(xtUid, fallbackCheck);
  }

  const baseUrl = env.XT_API_PROXY_BASE_URL?.trim();
  if (!baseUrl) {
    return verifyViaFallback(xtUid, fallbackCheck);
  }

  const client: XtProxyClient = { baseUrl };
  try {
    const invite = await checkInvite(client, xtUid);
    const userInfo = await getUserInfo(client, xtUid).catch(() => null);
    const kycStatus = await getKycStatus(client, xtUid).catch(() => null);

    const status: XtVerificationStatus = invite.result ? 'verified' : 'pending_review';
    return {
      status,
      source: 'xt_api_proxy',
      rawResult: {
        invite,
        userInfo,
        kycStatus,
      },
      proxyInvite: invite.result,
      proxyUserInfo: userInfo ?? undefined,
      proxyKycStatus: kycStatus ?? undefined,
      fallbackUsed: false,
    };
  } catch (error) {
    const fallback = await verifyViaFallback(xtUid, fallbackCheck);
    return {
      ...fallback,
      rawResult: {
        proxyError: error instanceof Error ? error.message : String(error),
        fallback: fallback.rawResult,
      },
      fallbackUsed: true,
    };
  }
}

async function verifyViaFallback(xtUid: string, fallbackCheck: (uid: string) => Promise<boolean>): Promise<XtVerificationAttempt> {
  const allowed = await fallbackCheck(xtUid);
  return {
    status: allowed ? 'verified' : 'pending_review',
    source: 'mvp_allowlist',
    rawResult: { allowed },
    fallbackUsed: true,
  };
}
