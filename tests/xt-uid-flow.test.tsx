import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getOrCreateVerificationSessionId,
  getXtUidFlowBackLabel,
  getXtUidFlowPageTitle,
  resolveXtUidFlowRoute,
  shouldRevealXtUidSupport,
} from '../src/xt-uid-flow';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('xt uid flow helpers', () => {
  it('creates and reuses a session-scoped verification id', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('session-123');

    expect(getOrCreateVerificationSessionId(storage)).toBe('session-123');
    expect(getOrCreateVerificationSessionId(storage)).toBe('session-123');
  });

  it('resolves helper routes and page titles', () => {
    expect(resolveXtUidFlowRoute('/xt-uid-help')).toBe('xt-uid-help');
    expect(resolveXtUidFlowRoute('/xt-registration-guide')).toBe('xt-registration-guide');
    expect(resolveXtUidFlowRoute('/support')).toBe('support');
    expect(getXtUidFlowPageTitle('xt-uid-help')).toBe('راهنمای پیدا کردن UID');
    expect(getXtUidFlowPageTitle('xt-registration-guide')).toBe('راهنمای ثبت‌نام با کد طالس');
    expect(getXtUidFlowPageTitle('support')).toBe('تماس با پشتیبانی');
    expect(getXtUidFlowBackLabel()).toBe('بازگشت');
  });

  it('reveals support only after three failed attempts', () => {
    expect(shouldRevealXtUidSupport(0)).toBe(false);
    expect(shouldRevealXtUidSupport(2)).toBe(false);
    expect(shouldRevealXtUidSupport(3)).toBe(true);
  });

  it('renders helper placeholder content with only a title and back button', async () => {
    vi.stubGlobal('window', {
      location: { hostname: 'localhost', pathname: '/' },
    } as Window);

    const { RoutePlaceholderPage } = await import('../src/app');
    const html = renderToStaticMarkup(
      <RoutePlaceholderPage title="راهنمای پیدا کردن UID" onBack={() => undefined} />,
    );

    expect(html).toContain('راهنمای پیدا کردن UID');
    expect(html).toContain('بازگشت');
  });
});
