import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyXtReferral } from '../src/xt-verification';
import { checkInvite, getKycStatus, getUserInfo } from '../src/xt-proxy';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('xt verification', () => {
  it('calls the expected proxy endpoints with uid query params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ rc: 0, mc: 'ok', ma: [], result: true }), { status: 200 });
    });

    await checkInvite({ baseUrl: 'https://xt-api.metagitic.com', timeoutMs: 1234 }, '8081552376479');
    await getUserInfo({ baseUrl: 'https://xt-api.metagitic.com', timeoutMs: 1234 }, '8081552376479');
    await getKycStatus({ baseUrl: 'https://xt-api.metagitic.com', timeoutMs: 1234 }, '8081552376479');

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls[0]?.[0]).toContain('/v4/referal/invite/check?uid=8081552376479');
    expect(fetchSpy.mock.calls[1]?.[0]).toContain('/v4/referal/invite/single/user/info?uid=8081552376479');
    expect(fetchSpy.mock.calls[2]?.[0]).toContain('/v4/referal/invite/kyc/status?uid=8081552376479');
  });

  it('uses the proxy invite signal to verify a UID', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/invite/check')) {
        return new Response(JSON.stringify({ rc: 0, mc: 'ok', ma: [], result: true }), { status: 200 });
      }
      if (url.includes('/single/user/info')) {
        return new Response(JSON.stringify({ rc: 0, mc: 'ok', ma: [], result: { uid: 1, registerTime: 1, countryCode: 1, mobile: '', email: '', riskControlStatus: 0, kycStatus: 1, registerInviteCode: 'abc' } }), { status: 200 });
      }
      if (url.includes('/kyc/status')) {
        return new Response(JSON.stringify({ rc: 0, mc: 'ok', ma: [], result: { userid: 1, status: 1 } }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });

    const result = await verifyXtReferral(
      { XT_API_PROXY_BASE_URL: 'https://xt-api.metagitic.com', DB: {} as D1Database },
      '123456',
      'tg-user',
      async () => false,
    );

    expect(result.status).toBe('verified');
    expect(result.source).toBe('xt_api_proxy');
    expect(result.proxyInvite).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(result.proxyUserInfo).toBeTruthy();
    expect(result.proxyKycStatus).toBeTruthy();
  });

  it('marks proxy false results as pending review without fallback', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/invite/check')) {
        return new Response(JSON.stringify({ rc: 0, mc: 'ok', ma: [], result: false }), { status: 200 });
      }
      if (url.includes('/single/user/info')) {
        return new Response(JSON.stringify({ rc: 0, mc: 'ok', ma: [], result: { uid: 1, registerTime: 1, countryCode: 1, mobile: '', email: '', riskControlStatus: 0, kycStatus: 0, registerInviteCode: 'abc' } }), { status: 200 });
      }
      if (url.includes('/kyc/status')) {
        return new Response(JSON.stringify({ rc: 0, mc: 'ok', ma: [], result: { userid: 1, status: 0 } }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });

    const result = await verifyXtReferral(
      { XT_API_PROXY_BASE_URL: 'https://xt-api.metagitic.com', DB: {} as D1Database },
      '123456',
      'tg-user',
      async () => true,
    );

    expect(result.status).toBe('pending_review');
    expect(result.source).toBe('xt_api_proxy');
    expect(result.fallbackUsed).toBe(false);
  });

  it('falls back safely when the proxy fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    const result = await verifyXtReferral(
      { XT_API_PROXY_BASE_URL: 'https://xt-api.metagitic.com', DB: {} as D1Database },
      '123456',
      'tg-user',
      async (uid) => uid === '123456',
    );

    expect(result.status).toBe('verified');
    expect(result.source).toBe('mvp_allowlist');
    expect(result.fallbackUsed).toBe(true);
  });

  it('returns pending review when the proxy is unavailable and allowlist does not match', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    const result = await verifyXtReferral(
      { XT_API_PROXY_BASE_URL: 'https://xt-api.metagitic.com', DB: {} as D1Database },
      '123456',
      'tg-user',
      async () => false,
    );

    expect(result.status).toBe('pending_review');
    expect(result.source).toBe('mvp_allowlist');
    expect(result.fallbackUsed).toBe(true);
  });

  it('returns pending review for invalid UID format without hitting the proxy', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await verifyXtReferral(
      { XT_API_PROXY_BASE_URL: 'https://xt-api.metagitic.com', DB: {} as D1Database },
      'x',
      'tg-user',
      async () => false,
    );

    expect(result.status).toBe('pending_review');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.rawResult).toEqual({ reason: 'invalid_format' });
  });

  it('treats non-200 proxy responses as fallback-triggering failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));

    const result = await verifyXtReferral(
      { XT_API_PROXY_BASE_URL: 'https://xt-api.metagitic.com', DB: {} as D1Database },
      '123456',
      'tg-user',
      async () => true,
    );

    expect(result.status).toBe('verified');
    expect(result.source).toBe('mvp_allowlist');
    expect(result.fallbackUsed).toBe(true);
    expect(result.rawResult).toHaveProperty('proxyError');
  });

  it('uses fallback when no proxy base url is configured', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await verifyXtReferral(
      { DB: {} as D1Database },
      '123456',
      'tg-user',
      async () => true,
    );

    expect(result.status).toBe('verified');
    expect(result.source).toBe('mvp_allowlist');
    expect(result.fallbackUsed).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
