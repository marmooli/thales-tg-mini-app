import React, { useEffect, useRef, useState } from 'react';
import { CrmApp } from './crm-app';
import { copy } from './copy';
import {
  getOrCreateVerificationSessionId,
  getXtUidFlowBackLabel,
  getXtUidFlowPageTitle,
  resolveXtUidFlowRoute,
  type XtUidFlowRoute,
} from './xt-uid-flow';
import { normalizeUid } from './shared';

const thalesRoundLogoUrl = '/assets/thales-logo-round-yellow.svg';
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
        features: { xtCard48Discount: boolean };
      };
      verificationFlow: {
        failedAttemptsInSession: number;
        showSupport: boolean;
      };
    }
  | { ok: false; message: string };

type FeatureResponse =
  | { ok: true; allowed: boolean; title: string; body: string; cta: string }
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
        if (data.ok) setDiscountCopy(data);
      } catch {
        setDiscountCopy(null);
      }
    })();
  }, [features.xtCard48Discount, initData]);

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

  if (route !== 'main') {
    return (
      <Shell title={copy.title} verified={status === 'verified'}>
        <RoutePlaceholderPage
          title={getXtUidFlowPageTitle(route)}
          onBack={() => navigateTo(setRoute, '/')}
        />
      </Shell>
    );
  }

  if (loading) return <Shell title={copy.title} verified={false}>{copy.loading}</Shell>;

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
            <p className="feedback" aria-live="polite" aria-atomic="true">
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
        {discountCopy?.allowed ? (
          <>
            <button className="secondary">{discountCopy.cta}</button>
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

function navigateTo(setRoute: React.Dispatch<React.SetStateAction<XtUidFlowRoute>>, path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  setRoute(resolveXtUidFlowRoute(path));
}

function safeSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
