import React, { useEffect, useRef, useState } from 'react';
import { CrmApp } from './crm-app';
import { copy } from './copy';
import { getCouponSentStatus } from './coupon-sent';
import { XT_CAMPAIGN_ROUTE_PATH, XtCampaignLandingPage } from './xt-campaign';
import {
  blockPaste,
  XT_CARD_COUPON_VIDEO_PATH,
  XT_CARD_DISCOUNT_PROCESS_PATH,
  validateDiscountEmailPair,
} from './xt-card-discount';
import {
  getOrCreateVerificationSessionId,
  getXtUidFlowBackLabel,
  getXtUidFlowPageTitle,
  resolveXtUidFlowRoute,
  type XtUidFlowRoute,
} from './xt-uid-flow';
import { normalizeUid } from './shared';

const thalesRoundLogoUrl = '/assets/thales-logo-round-yellow.svg';
const xtUidGuideImageUrl = '/assets/xt-uid-guide-v2.jpg';
const xtCardActivationVideoUrl = '/assets/XT card activation.mp4';
const supportTelegramUrl = 'https://t.me/Ssameti';
const xtRegistrationLinkDomestic = 'https://www.xtcorenet.com/fa/accounts/register?ref=THALES3';
const xtRegistrationLinkInternational = 'https://www.xtfarsi.net/fa/accounts/register?ref=THALES3';
const xtRegistrationLinkOutsideIran = 'https://www.xt.com/fa/accounts/register?ref=THALES3';
const isLocalDev =
  import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

type Status = 'not_verified' | 'pending_review' | 'verified' | 'rejected';

export function App() {
  if (window.location.pathname.startsWith('/crm')) {
    return (
      <CrmErrorBoundary>
        <CrmApp />
      </CrmErrorBoundary>
    );
  }

  return <MiniApp />;
}

class CrmErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error?.message || 'خطای نامشخص در CRM رخ داده است.',
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="crm-app">
          <div className="crm-shell">
            <section className="card crm-viewport">
              <p className="crm-eyebrow">خطا در CRM</p>
              <h2>رابط کاربری CRM بارگذاری نشد</h2>
              <p className="crm-feedback crm-feedback-error">{this.state.message}</p>
              <p className="crm-muted">
                صفحه را یک بار hard refresh کن. اگر مشکل ادامه داشت، متن خطا را برای من بفرست تا مستقیم رفعش کنم.
              </p>
            </section>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

type MeResponse =
  | {
      ok: true;
      user: {
        telegramUserId: string;
        verificationStatus: Status;
        accessLevel: string;
        discountEmail: string | null;
        discountEmailSentAt: string | null;
        discountEmailStatus: 'none' | 'pending_review' | 'sent';
        couponSentAt: string | null;
        couponSentStatus: 'none' | 'sent';
        features: { xtCard48Discount: boolean };
      };
      verificationFlow: {
        failedAttemptsInSession: number;
        showSupport: boolean;
      };
    }
  | { ok: false; message: string };

type FeatureResponse =
  | {
      ok: true;
      allowed: boolean;
      title: string;
      body: string;
      cta: string;
      discountEmailStatus: 'none' | 'pending_review' | 'sent';
      couponSentAt: string | null;
      couponSentStatus: 'none' | 'sent';
    }
  | { ok: false; message: string };

type VerifyResponse =
  | {
      ok: true;
      status: Status;
      message: string;
      verificationFlow: {
        failedAttemptsInSession: number;
        showSupport: boolean;
      };
    }
  | { ok: false; message?: string };

type DiscountEmailResponse =
  | { ok: true; message: string; discountEmail: string }
  | { ok: false; message: string; reason?: string };

function getTelegramInitData() {
  // Telegram WebApp injects this at runtime. In local dev we allow empty initData.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData ?? '';
}

function MiniApp() {
  const [route, setRoute] = useState<XtUidFlowRoute>(() => resolveXtUidFlowRoute(window.location.pathname));
  const [verificationSessionId] = useState(() => getOrCreateVerificationSessionId(safeSessionStorage()));
  const [status, setStatus] = useState<Status>('not_verified');
  const [uid, setUid] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [features, setFeatures] = useState({ xtCard48Discount: false });
  const [discountCopy, setDiscountCopy] = useState<{ title: string; body: string; cta: string; allowed: boolean } | null>(null);
  const [storedDiscountEmail, setStoredDiscountEmail] = useState('');
  const [discountEmailStatus, setDiscountEmailStatus] = useState<'none' | 'pending_review' | 'sent'>('none');
  const [couponSentStatus, setCouponSentStatus] = useState<'none' | 'sent'>('none');
  const [discountEmailInput, setDiscountEmailInput] = useState('');
  const [discountEmailConfirmation, setDiscountEmailConfirmation] = useState('');
  const [discountEmailFeedback, setDiscountEmailFeedback] = useState<string | null>(null);
  const [discountEmailSubmitting, setDiscountEmailSubmitting] = useState(false);
  const [discountEmailSuccess, setDiscountEmailSuccess] = useState(false);
  const [initData, setInitData] = useState('');
  const [verificationFlow, setVerificationFlow] = useState({ failedAttemptsInSession: 0, showSupport: false });
  const lastLoggedRouteRef = useRef<XtUidFlowRoute | null>(null);

  useEffect(() => {
    const syncRoute = () => {
      setRoute(resolveXtUidFlowRoute(window.location.pathname));
    };

    const syncInitData = () => {
      const next = getTelegramInitData();
      if (next) {
        setInitData(next);
        return true;
      }
      return false;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tg = (window as any).Telegram?.WebApp;
    tg?.ready?.();
    tg?.expand?.();

    syncRoute();
    if (syncInitData()) {
      setLoading(false);
      return;
    }

    if (isLocalDev) {
      setLoading(false);
      return;
    }

    const timer = window.setInterval(() => {
      if (syncInitData()) {
        window.clearInterval(timer);
        setLoading(false);
      }
    }, 100);

    const timeout = window.setTimeout(() => {
      window.clearInterval(timer);
      if (!getTelegramInitData()) {
        setLoading(false);
        setStatusMessage(isLocalDev ? null : 'اطلاعات ورود تلگرام هنوز در دسترس نیست.');
      }
    }, 10000);

    const onPopState = () => {
      syncRoute();
    };

    window.addEventListener('popstate', onPopState);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(timeout);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    if (!initData && !isLocalDev) return;

    void (async () => {
      try {
        const res = await fetch('/api/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData, verificationSessionId }),
        });
        const data = (await res.json()) as MeResponse;
        if (data.ok) {
          setStatus(data.user.verificationStatus);
          setFeatures(data.user.features);
          setVerificationFlow(data.verificationFlow);
          setStoredDiscountEmail(data.user.discountEmail ?? '');
          setDiscountEmailStatus(data.user.discountEmailStatus);
          setCouponSentStatus(getCouponSentStatus(data.user.couponSentAt));
          setDiscountEmailSuccess(data.user.verificationStatus === 'verified' && Boolean(data.user.discountEmail));
          setStatusMessage(null);
        } else {
          setStatusMessage(data.message);
        }
      } catch {
        setStatusMessage('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData, verificationSessionId]);

  useEffect(() => {
    if (!initData && !isLocalDev) return;
    if (!features.xtCard48Discount) return;

    void (async () => {
      try {
        const res = await fetch('/api/feature/xt-card-48', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });
        const data = (await res.json()) as FeatureResponse;
        if (data.ok) {
          setDiscountCopy(data);
          setDiscountEmailStatus(data.discountEmailStatus);
          setCouponSentStatus(getCouponSentStatus(data.couponSentAt));
        }
      } catch {
        setDiscountCopy(null);
      }
    })();
  }, [features.xtCard48Discount, initData]);

  useEffect(() => {
    if (route === 'xt-card-discount-process' && storedDiscountEmail && !discountEmailInput) {
      setDiscountEmailInput(storedDiscountEmail);
    }
  }, [route, storedDiscountEmail, discountEmailInput]);

  useEffect(() => {
    if (route === 'main') {
      lastLoggedRouteRef.current = null;
      return;
    }

    const currentInitData = initData || getTelegramInitData();
    if (!currentInitData && !isLocalDev) return;
    if (lastLoggedRouteRef.current === route) return;
    lastLoggedRouteRef.current = route;

    void (async () => {
      try {
        await fetch('/api/xt-uid/navigation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: currentInitData,
            verificationSessionId,
            route,
          }),
        });
      } catch {
        // Ignore navigation logging failures in the UI.
      }
    })();
  }, [route, initData, verificationSessionId]);

  async function submitUid() {
    const currentInitData = initData || getTelegramInitData();
    if (!currentInitData && !isLocalDev) {
      setSubmitFeedback('این Mini App باید از داخل Telegram و از دکمۀ Open Thales App باز شود.');
      return;
    }

    const normalized = normalizeUid(uid);
    if (!normalized) {
      setSubmitFeedback('لطفاً شناسۀ XT-UID را وارد کنید.');
      return;
    }

    setSubmitFeedback(copy.loading);
    setSubmitting(true);
    try {
      const res = await fetch('/api/verify/xt-uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: currentInitData || '',
          xtUid: normalized,
          verificationSessionId,
        }),
      });
      const data = (await res.json()) as VerifyResponse;
      if (data.ok) {
        setStatus(data.status);
        setVerificationFlow(data.verificationFlow);
        setSubmitFeedback(data.message);
        setStatusMessage(null);
        setFeatures({ xtCard48Discount: data.status === 'verified' });
      } else {
        setSubmitFeedback(data.message ?? copy.verificationPending);
      }
    } catch {
      setSubmitFeedback('خطا در بررسی شناسه. لطفاً بعداً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDiscountEmail(params: {
    email: string;
    confirmationEmail: string;
  }) {
    const currentInitData = initData || getTelegramInitData();
    if (!currentInitData && !isLocalDev) {
      setDiscountEmailFeedback('این Mini App باید از داخل Telegram و از دکمۀ Open Thales App باز شود.');
      return;
    }

    const validation = validateDiscountEmailPair(params.email, params.confirmationEmail);
    if (!validation.ok) {
      setDiscountEmailFeedback(discountEmailErrorMessage(validation.reason));
      return;
    }

    setDiscountEmailFeedback(copy.discountProcess.loading);
    setDiscountEmailSubmitting(true);
    try {
      const res = await fetch('/api/xt-card-discount-process/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: currentInitData || '',
          verificationSessionId,
          email: validation.email,
          confirmEmail: params.confirmationEmail,
        }),
      });
      const data = (await res.json()) as DiscountEmailResponse;
      if (data.ok) {
        setStoredDiscountEmail(data.discountEmail);
        setDiscountEmailInput(data.discountEmail);
        setDiscountEmailStatus('pending_review');
        setDiscountEmailConfirmation('');
        setDiscountEmailSuccess(true);
        setDiscountEmailFeedback(data.message);
      } else {
        setDiscountEmailFeedback(data.message ?? discountEmailErrorMessage('invalid_email'));
      }
    } catch {
      setDiscountEmailFeedback('خطا در ذخیره ایمیل. لطفاً بعداً دوباره تلاش کنید.');
    } finally {
      setDiscountEmailSubmitting(false);
    }
  }

  function handleDiscountEmailChange(value: string) {
    setDiscountEmailInput(value);
    if (discountEmailSuccess) setDiscountEmailSuccess(false);
    if (discountEmailFeedback) setDiscountEmailFeedback(null);
  }

  function handleDiscountEmailConfirmationChange(value: string) {
    setDiscountEmailConfirmation(value);
    if (discountEmailSuccess) setDiscountEmailSuccess(false);
    if (discountEmailFeedback) setDiscountEmailFeedback(null);
  }

  if (loading) return <Shell title={copy.title} verified={false}>{copy.loading}</Shell>;

  if (route !== 'main') {
    if (route === 'xt-campaign') {
      return (
        <Shell title={copy.title} verified={status === 'verified'}>
          {statusMessage ? <p className="lead page-message">{statusMessage}</p> : null}
          <XtCampaignLandingPage
            onOpenDiscountProcess={() => navigateTo(setRoute, XT_CARD_DISCOUNT_PROCESS_PATH)}
            onBack={() => navigateTo(setRoute, '/')}
          />
        </Shell>
      );
    }

    if (route === 'xt-uid-help') {
      return (
        <Shell title={copy.title} verified={status === 'verified'}>
          {statusMessage ? <p className="lead page-message">{statusMessage}</p> : null}
          <RouteGuidePage
            title={getXtUidFlowPageTitle(route)}
            imageSrc={xtUidGuideImageUrl}
            imageAlt="راهنمای پیدا کردن UID"
            onBack={() => navigateTo(setRoute, '/')}
          />
        </Shell>
      );
    }

    if (route === 'xt-registration-guide') {
      return (
        <Shell title={copy.title} verified={status === 'verified'}>
          {statusMessage ? <p className="lead page-message">{statusMessage}</p> : null}
          <RouteRegistrationGuidePage
            title={getXtUidFlowPageTitle(route)}
            onBack={() => navigateTo(setRoute, '/')}
          />
        </Shell>
      );
    }

    if (route === 'xt-card-discount-process') {
      return (
        <Shell title={copy.title} verified={status === 'verified'}>
          {statusMessage ? <p className="lead page-message">{statusMessage}</p> : null}
          <DiscountProcessPage
            verified={status === 'verified'}
            storedDiscountEmail={storedDiscountEmail}
            email={discountEmailInput}
            confirmationEmail={discountEmailConfirmation}
            feedback={discountEmailFeedback}
            submitting={discountEmailSubmitting}
            success={discountEmailSuccess}
            onEmailChange={handleDiscountEmailChange}
            onConfirmationChange={handleDiscountEmailConfirmationChange}
            onSubmit={() =>
              void submitDiscountEmail({
                email: discountEmailInput,
                confirmationEmail: discountEmailConfirmation,
              })
            }
            onOpenVideo={() => navigateTo(setRoute, XT_CARD_COUPON_VIDEO_PATH)}
            onBack={() => navigateTo(setRoute, '/')}
          />
        </Shell>
      );
    }

    if (route === 'xt-card-coupon-video') {
      return (
        <Shell title={copy.title} verified={status === 'verified'}>
          {statusMessage ? <p className="lead page-message">{statusMessage}</p> : null}
          <RouteVideoGuidePage
            title={getXtUidFlowPageTitle(route)}
            videoSrc={xtCardActivationVideoUrl}
            onBack={() => navigateTo(setRoute, XT_CARD_DISCOUNT_PROCESS_PATH)}
          />
        </Shell>
      );
    }

    if (route === 'support') {
      return (
        <Shell title={copy.title} verified={status === 'verified'}>
          {statusMessage ? <p className="lead page-message">{statusMessage}</p> : null}
          <RouteSupportPage title={getXtUidFlowPageTitle(route)} supportUrl={supportTelegramUrl} onBack={() => navigateTo(setRoute, '/')} />
        </Shell>
      );
    }

    return (
      <Shell title={copy.title} verified={status === 'verified'}>
        {statusMessage ? <p className="lead page-message">{statusMessage}</p> : null}
        <RoutePlaceholderPage title={getXtUidFlowPageTitle(route)} onBack={() => navigateTo(setRoute, '/')} />
      </Shell>
    );
  }

  const supportVisible = verificationFlow.showSupport && status !== 'verified';

  return (
    <Shell title={copy.title} verified={status === 'verified'}>
      {statusMessage ? <p className="lead page-message">{statusMessage}</p> : null}

      {status !== 'verified' ? (
        <section className="card panel-accent stack">
          <div className="section-title">
            <h2>{copy.verifyHeading}</h2>
          </div>
          <p>{copy.verifyDescription}</p>
          <p>{copy.verifyInstruction}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitUid();
            }}
          >
            <label>
              {copy.uidLabel}
              <input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder={copy.uidPlaceholder}
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? copy.loading : copy.submit}
            </button>
          </form>
          {submitFeedback ? (
            <p className="feedback feedback-error" aria-live="polite" aria-atomic="true">
              {submitFeedback}
            </p>
          ) : null}
          <div className="xt-helper-actions">
            <button className="xt-helper-button secondary" type="button" onClick={() => navigateTo(setRoute, '/xt-uid-help')}>
              {copy.helperUid}
            </button>
            <button
              className="xt-helper-button secondary"
              type="button"
              onClick={() => navigateTo(setRoute, '/xt-registration-guide')}
            >
              {copy.helperRegistration}
            </button>
          </div>
          {supportVisible ? (
            <button className="xt-helper-button primary" type="button" onClick={() => navigateTo(setRoute, '/support')}>
              {copy.support}
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="card stack panel-accent campaign-entry-card">
        <div className="section-title">
          <h2>معرفی کارت اعتباری XT</h2>
          <div className="status-lock status-lock-open" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M8 11V8a4 4 0 0 1 4-4c1.7 0 3.2 1 3.8 2.6"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 10.5h9.8a2.2 2.2 0 0 1 2.2 2.2v5.8a2.2 2.2 0 0 1-2.2 2.2H4.5a2.2 2.2 0 0 1-2.2-2.2v-5.8a2.2 2.2 0 0 1 2.2-2.2Z"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <circle cx="9.4" cy="15.4" r="1.2" fill="#22c55e" />
            </svg>
          </div>
        </div>
        <div className="campaign-entry-shell">
          <div className="campaign-entry-copy">
            <p>کارت XT چیست و چه مزایایی دارد</p>
            <button
              className="primary campaign-entry-button"
              type="button"
              onClick={() => navigateTo(setRoute, XT_CAMPAIGN_ROUTE_PATH)}
            >
              معرفی کارت اعتباری XT
            </button>
          </div>
        </div>
      </section>

      <section className="card stack">
        <div className="section-title">
          <h2>{discountCopy?.title ?? copy.discountTitle}</h2>
          <div className={`status-lock ${discountCopy?.allowed ? 'status-lock-open' : 'status-lock-closed'}`} aria-hidden="true">
            {discountCopy?.allowed ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M8 11V8a4 4 0 0 1 4-4c1.7 0 3.2 1 3.8 2.6"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.5 10.5h9.8a2.2 2.2 0 0 1 2.2 2.2v5.8a2.2 2.2 0 0 1-2.2 2.2H4.5a2.2 2.2 0 0 1-2.2-2.2v-5.8a2.2 2.2 0 0 1 2.2-2.2Z"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.3"
                  strokeLinejoin="round"
                />
                <circle cx="9.4" cy="15.4" r="1.2" fill="#22c55e" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M8 11V8a4 4 0 0 1 8 0v3"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="4.5" y="10.5" width="13" height="10" rx="2.2" fill="none" stroke="#ef4444" strokeWidth="2.3" />
                <circle cx="9.4" cy="15.4" r="1.2" fill="#ef4444" />
              </svg>
            )}
          </div>
        </div>
        {couponSentStatus === 'sent' ? (
          <strong className="discount-sent-badge">کوپن ۳۸ دلاری ارسال شد</strong>
        ) : discountEmailStatus === 'pending_review' ? (
          <strong className="discount-review-badge">در دست بررسی...</strong>
        ) : null}
        {discountCopy?.allowed ? (
          <>
            <button className="secondary" type="button" onClick={() => navigateTo(setRoute, XT_CARD_DISCOUNT_PROCESS_PATH)}>
              {discountCopy.cta}
            </button>
          </>
        ) : (
          <p>{discountCopy?.body ?? copy.locked}</p>
        )}
      </section>
    </Shell>
  );
}

function Shell({ title, verified, children }: { title: string; verified: boolean; children: React.ReactNode }) {
  return (
    <main className="app">
      <div className="backdrop backdrop-a" />
      <div className="backdrop backdrop-b" />
      <div className="frame">
        <header className="masthead card">
          <div className="brand-row">
            <div className={`brand-mark${verified ? ' brand-mark-verified' : ''}`}>
              <img src={thalesRoundLogoUrl} alt="Thales" className="brand-logo" />
              {verified ? <span className="verified-badge">✓</span> : null}
            </div>
            <div>
              <h1>{title}</h1>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function RoutePlaceholderPage({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <section className="card stack route-card">
      <div className="section-title">
        <h2>{title}</h2>
      </div>
      <button className="secondary xt-helper-button" type="button" onClick={onBack}>
        {getXtUidFlowBackLabel()}
      </button>
    </section>
  );
}

export function RouteGuidePage({
  title,
  imageSrc,
  imageAlt,
  onBack,
}: {
  title: string;
  imageSrc: string;
  imageAlt: string;
  onBack: () => void;
}) {
  return (
    <section className="card route-card route-card-guide">
      <div className="route-guide-hero">
        <div className="section-title route-guide-title">
          <h2>{title}</h2>
        </div>
        <div className="route-guide-media">
          <img src={imageSrc} alt={imageAlt} className="route-guide-image" />
        </div>
      </div>
      <button className="secondary xt-helper-button route-guide-back route-guide-button" type="button" onClick={onBack}>
        {getXtUidFlowBackLabel()}
      </button>
    </section>
  );
}

export function RouteVideoGuidePage({
  title,
  videoSrc,
  onBack,
}: {
  title: string;
  videoSrc: string;
  onBack: () => void;
}) {
  return (
    <section className="card route-card route-card-guide route-card-video">
      <div className="route-guide-hero">
        <div className="section-title route-guide-title">
          <h2>{title}</h2>
        </div>
        <div className="route-guide-media route-guide-video-media">
          <video className="route-guide-video" controls playsInline preload="metadata">
            <source src={videoSrc} type="video/mp4" />
            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
          </video>
        </div>
      </div>
      <button className="secondary xt-helper-button route-guide-back route-guide-button" type="button" onClick={onBack}>
        {getXtUidFlowBackLabel()}
      </button>
    </section>
  );
}

export function RouteSupportPage({
  title,
  supportUrl,
  onBack,
}: {
  title: string;
  supportUrl: string;
  onBack: () => void;
}) {
  return (
    <section className="card route-card route-card-guide route-card-support">
      <div className="route-guide-hero">
        <div className="section-title route-guide-title">
          <h2>{title}</h2>
        </div>
        <p className="route-guide-copy">
          برای دریافت پشتیبانی مستقیماً از طریق تلگرام با آقای صامتی (
          <a href={supportUrl} target="_blank" rel="noreferrer">
            {supportUrl}
          </a>
          ) از پشتیبانی طالس تماس بگیرید و مورد خود را با ایشان مطرح کنید تا پیگیری بشود.
        </p>
        <a className="secondary xt-helper-button route-guide-button" href={supportUrl} target="_blank" rel="noreferrer">
          باز کردن چت
        </a>
      </div>
      <button className="secondary xt-helper-button route-guide-back route-guide-button" type="button" onClick={onBack}>
        {getXtUidFlowBackLabel()}
      </button>
    </section>
  );
}

export function RouteRegistrationGuidePage({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <section className="card route-card route-card-guide route-card-registration">
      <div className="route-guide-hero">
        <div className="section-title route-guide-title">
          <h2>{title}</h2>
        </div>
        <p className="route-guide-copy">
          به علت مسائل فیلترینگ یا قطع اینترنت در ایران ممکن است گاهی برخی از لینک‌های زیر کار نکنند. اگر یک لینک کار
          نکرد لینک‌های دیگر را هم امتحان کنید.
        </p>
        <div className="xt-helper-actions route-guide-links">
          <a
            className="secondary xt-helper-button route-guide-link route-guide-button"
            href={xtRegistrationLinkDomestic}
            target="_blank"
            rel="noreferrer"
          >
            لینک اینترنت داخلی برای داخل ایران
          </a>
          <a
            className="secondary xt-helper-button route-guide-link route-guide-button"
            href={xtRegistrationLinkInternational}
            target="_blank"
            rel="noreferrer"
          >
            لینک کاربران داخل ایران (اینترنت بین‌المللی)
          </a>
          <a
            className="secondary xt-helper-button route-guide-link route-guide-button"
            href={xtRegistrationLinkOutsideIran}
            target="_blank"
            rel="noreferrer"
          >
            لینک کاربران خارج از ایران
          </a>
        </div>
        <p className="route-guide-copy route-guide-footnote">
          پس از بازکردن حساب با کد طالس مجدداً به مینی‌اپ بازگردید و ارسال شناسه را تکمیل کنید.
        </p>
      </div>
      <button className="secondary xt-helper-button route-guide-back route-guide-button" type="button" onClick={onBack}>
        {getXtUidFlowBackLabel()}
      </button>
    </section>
  );
}

function DiscountProcessPage({
  verified,
  storedDiscountEmail,
  email,
  confirmationEmail,
  feedback,
  submitting,
  success,
  onEmailChange,
  onConfirmationChange,
  onSubmit,
  onOpenVideo,
  onBack,
}: {
  verified: boolean;
  storedDiscountEmail: string;
  email: string;
  confirmationEmail: string;
  feedback: string | null;
  submitting: boolean;
  success: boolean;
  onEmailChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  onSubmit: () => void;
  onOpenVideo: () => void;
  onBack: () => void;
}) {
  if (!verified) {
    return (
      <section className="card route-card route-card-guide route-card-discount">
        <div className="route-guide-hero">
          <div className="section-title route-guide-title">
            <h2>{copy.discountProcess.title}</h2>
          </div>
          <p className="route-guide-copy">{copy.discountProcess.accessLocked}</p>
        </div>
        <button className="secondary xt-helper-button route-guide-back route-guide-button" type="button" onClick={onBack}>
          {getXtUidFlowBackLabel()}
        </button>
      </section>
    );
  }

  return (
    <section className="card route-card route-card-guide route-card-discount">
      <div className="route-guide-hero">
        <div className="section-title route-guide-title">
          <h2>{copy.discountProcess.title}</h2>
        </div>
        {!success ? (
          <>
            <p className="route-guide-copy">{copy.discountProcess.intro}</p>
            <ol className="discount-process-steps">
              <li>{copy.discountProcess.step1}</li>
              <li>{copy.discountProcess.step2}</li>
            </ol>
            <form
              className="discount-process-form"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              <label>
                {copy.discountProcess.emailLabel}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder={copy.discountProcess.emailPlaceholder}
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                />
              </label>
              <label>
                {copy.discountProcess.confirmLabel}
                <input
                  type="email"
                  value={confirmationEmail}
                  onChange={(event) => onConfirmationChange(event.target.value)}
                  onPaste={blockPaste}
                  onDrop={blockPaste}
                  placeholder={copy.discountProcess.confirmPlaceholder}
                  autoComplete="off"
                  inputMode="email"
                  spellCheck={false}
                />
              </label>
              <div className="feedback discount-feedback" aria-live="polite" aria-atomic="true">
                {feedback ?? ''}
              </div>
              <button className="primary" type="submit" disabled={submitting}>
                {submitting ? copy.discountProcess.loading : copy.discountProcess.submit}
              </button>
            </form>
          </>
        ) : (
                    <div className="discount-process-success stack">
            <p className="route-guide-copy">{copy.discountProcess.step1}</p>
            <p className="route-guide-copy">{copy.discountProcess.step2}</p>
            <p className="route-guide-copy discount-success-line">
              ایمیل شما با موفقیت ذخیره شد: {storedDiscountEmail || email}
            </p>
            <p className="route-guide-copy discount-step3-emphasis">{copy.discountProcess.step3}</p>
            <p className="route-guide-copy">{copy.discountProcess.step4}</p>
            <button className="secondary route-guide-button" type="button" onClick={onOpenVideo}>
              {copy.discountProcess.videoAction}
            </button>
          </div>
        )}
        {!success && storedDiscountEmail ? (
          <p className="route-guide-copy discount-stored-email">
            {copy.discountProcess.storedEmailLabel}: {storedDiscountEmail}
          </p>
        ) : null}
      </div>
      <button className="secondary xt-helper-button route-guide-back route-guide-button" type="button" onClick={onBack}>
        {getXtUidFlowBackLabel()}
      </button>
    </section>
  );
}

function navigateTo(setRoute: React.Dispatch<React.SetStateAction<XtUidFlowRoute>>, path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  setRoute(resolveXtUidFlowRoute(path));
}

function discountEmailErrorMessage(reason: 'missing_email' | 'invalid_email' | 'missing_confirmation' | 'mismatch') {
  switch (reason) {
    case 'missing_email':
      return copy.discountProcess.missingEmail;
    case 'invalid_email':
      return copy.discountProcess.invalidEmail;
    case 'missing_confirmation':
      return copy.discountProcess.missingConfirmation;
    case 'mismatch':
      return copy.discountProcess.mismatch;
  }
}

function safeSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

