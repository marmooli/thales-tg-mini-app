import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { XtCampaignLandingPage } from '../src/xt-campaign';
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
    expect(resolveXtUidFlowRoute('/xt-campaign')).toBe('xt-campaign');
    expect(resolveXtUidFlowRoute('/xt-uid-help')).toBe('xt-uid-help');
    expect(resolveXtUidFlowRoute('/xt-registration-guide')).toBe('xt-registration-guide');
    expect(resolveXtUidFlowRoute('/support')).toBe('support');
    expect(resolveXtUidFlowRoute('/xt-card-discount-process')).toBe('xt-card-discount-process');
    expect(resolveXtUidFlowRoute('/xt-card-coupon-video')).toBe('xt-card-coupon-video');
    expect(getXtUidFlowPageTitle('xt-campaign')).toBe('صفحه فرود XT Card');
    expect(getXtUidFlowPageTitle('xt-uid-help')).toBe('راهنمای پیدا کردن UID');
    expect(getXtUidFlowPageTitle('xt-registration-guide')).toBe('راهنمای ثبت‌نام با کد طالس');
    expect(getXtUidFlowPageTitle('support')).toBe('تماس با پشتیبانی');
    expect(getXtUidFlowPageTitle('xt-card-discount-process')).toBe('فرایند دریافت تخفیف ۳۸ دلاری کارت XT');
    expect(getXtUidFlowPageTitle('xt-card-coupon-video')).toBe('ویدیوی راهنمای فعال کردن رایگان کارت');
    expect(getXtUidFlowBackLabel()).toBe('بازگشت');
  });

  it('reveals support only after three failed attempts', () => {
    expect(shouldRevealXtUidSupport(0)).toBe(false);
    expect(shouldRevealXtUidSupport(2)).toBe(false);
    expect(shouldRevealXtUidSupport(3)).toBe(true);
  });

  it('renders the xt campaign landing page with a home entry and discount action', () => {
    const html = renderToStaticMarkup(
      <XtCampaignLandingPage onOpenDiscountProcess={() => undefined} onBack={() => undefined} />,
    );

    expect(html).toContain('صفحه فرود کمپین XT Card');
    expect(html).toContain('شروع فرایند دریافت تخفیف ۳۸ دلاری');
    expect(html).toContain('/assets/monitor-card.jpg');
    expect(html).toContain('/assets/card-mobile-vertical.jpg');
  });

  it('renders helper pages with their expected content and back actions', async () => {
    vi.stubGlobal('window', {
      location: { hostname: 'localhost', pathname: '/' },
    } as Window);

    const { RoutePlaceholderPage, RouteGuidePage, RouteRegistrationGuidePage } = await import('../src/app');
    const html = renderToStaticMarkup(
      <RoutePlaceholderPage title="راهنمای پیدا کردن UID" onBack={() => undefined} />,
    );

    expect(html).toContain('راهنمای پیدا کردن UID');
    expect(html).toContain('بازگشت');

    const guideHtml = renderToStaticMarkup(
      <RouteGuidePage
        title="راهنمای پیدا کردن UID"
        imageSrc="/assets/xt-uid-guide-v2.jpg"
        imageAlt="راهنمای پیدا کردن UID"
        onBack={() => undefined}
      />,
    );

    expect(guideHtml).toContain('/assets/xt-uid-guide-v2.jpg');
    expect(guideHtml).toContain('راهنمای پیدا کردن UID');
    expect(guideHtml).toContain('بازگشت');

    const registrationHtml = renderToStaticMarkup(
      <RouteRegistrationGuidePage title="راهنمای ثبت‌نام با کد طالس" onBack={() => undefined} />,
    );

    expect(registrationHtml).toContain('به علت مسائل فیلترینگ یا قطع اینترنت در ایران');
    expect(registrationHtml).toContain('لینک اینترنت داخلی برای داخل ایران');
    expect(registrationHtml).toContain('لینک کاربران داخل ایران (اینترنت بین‌المللی)');
    expect(registrationHtml).toContain('لینک کاربران خارج از ایران');
    expect(registrationHtml).toContain('پس از بازکردن حساب با کد طالس مجدداً به مینی‌اپ بازگردید');
    expect(registrationHtml).toContain('https://www.xtcorenet.com/fa/accounts/register?ref=THALES3');

    const videoHtml = renderToStaticMarkup(
      <RoutePlaceholderPage title="ویدیوی راهنمای فعال کردن رایگان کارت" onBack={() => undefined} />,
    );

    expect(videoHtml).toContain('ویدیوی راهنمای فعال کردن رایگان کارت');
    expect(videoHtml).toContain('بازگشت');
  });
});
