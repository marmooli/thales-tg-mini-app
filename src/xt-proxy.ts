export type XtProxyInviteCheck = {
  rc: number;
  mc: string;
  ma: unknown[];
  result: boolean;
};

export type XtProxyUserInfo = {
  rc: number;
  mc: string;
  ma: unknown[];
  result: {
    uid: number;
    registerTime: number;
    countryCode: number;
    mobile: string;
    email: string;
    riskControlStatus: number;
    kycStatus: number;
    registerInviteCode: string;
  };
};

export type XtProxyKycStatus = {
  rc: number;
  mc: string;
  ma: unknown[];
  result: {
    userid: number;
    status: number;
  };
};

export type XtProxyClient = {
  baseUrl: string;
  timeoutMs?: number;
};

async function requestJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`XT proxy HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkInvite(client: XtProxyClient, uid: string): Promise<XtProxyInviteCheck> {
  const url = new URL('/v4/referal/invite/check', client.baseUrl);
  url.searchParams.set('uid', uid);
  return requestJson<XtProxyInviteCheck>(url.toString(), client.timeoutMs);
}

export async function getUserInfo(client: XtProxyClient, uid: string): Promise<XtProxyUserInfo> {
  const url = new URL('/v4/referal/invite/single/user/info', client.baseUrl);
  url.searchParams.set('uid', uid);
  return requestJson<XtProxyUserInfo>(url.toString(), client.timeoutMs);
}

export async function getKycStatus(client: XtProxyClient, uid: string): Promise<XtProxyKycStatus> {
  const url = new URL('/v4/referal/invite/kyc/status', client.baseUrl);
  url.searchParams.set('uid', uid);
  return requestJson<XtProxyKycStatus>(url.toString(), client.timeoutMs);
}

