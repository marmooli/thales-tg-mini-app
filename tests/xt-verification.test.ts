import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyXtReferral } from '../src/xt-verification';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('xt verification', () => {
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
  });
});
