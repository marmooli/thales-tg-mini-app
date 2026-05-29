import { useEffect, useState } from 'react';
import { copy } from './copy';
import { toPersianDigits } from './shared';

const thalesRoundLogoUrl = '/assets/thales-logo-round-yellow.svg';
const isLocalDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

type Status = 'not_verified' | 'pending_review' | 'verified' | 'rejected';

type MeResponse =
  | {
      ok: true;
      user: {
        telegramUserId: string;
        verificationStatus: Status;
        accessLevel: string;
        features: { xtCard48Discount: boolean };
      };
    }
  | { ok: false; message: string };

type FeatureResponse =
  | { ok: true; allowed: boolean; title: string; body: string; cta: string }
  | { ok: false; message: string };

function getTelegramInitData() {
  // Telegram WebApp injects this at runtime. In local dev we allow empty initData.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData ?? '';
}

export function App() {
  const [status, setStatus] = useState<Status>('not_verified');
  const [uid, setUid] = useState('');
  const [message, setMessage] = useState(copy.welcome);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [features, setFeatures] = useState({ xtCard48Discount: false });
  const [discountCopy, setDiscountCopy] = useState<{ title: string; body: string; cta: string; allowed: boolean } | null>(null);
  const [initData, setInitData] = useState('');
  const [sessionState, setSessionState] = useState<'waiting' | 'ready' | 'missing'>('waiting');

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tg = (window as any).Telegram?.WebApp;
    tg?.ready?.();
    tg?.expand?.();

    const syncInitData = () => {
      const next = getTelegramInitData();
      if (!cancelled && next) {
        setInitData(next);
        setSessionState('ready');
        return true;
      }
      return false;
    };

    if (syncInitData()) return;

    const timer = window.setInterval(() => {
      if (syncInitData()) {
        window.clearInterval(timer);
      }
    }, 100);

    const timeout = window.setTimeout(() => {
      window.clearInterval(timer);
      if (!cancelled && !initData) {
        setLoading(false);
        setSessionState('missing');
        setMessage(isLocalDev ? copy.welcome : 'اطلاعات ورود تلگرام هنوز در دسترس نیست.');
      }
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [initData]);

  useEffect(() => {
    if (!initData) return;
    void (async () => {
      try {
        const res = await fetch('/api/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });
        const data = (await res.json()) as MeResponse;
        if (data.ok) {
          setStatus(data.user.verificationStatus);
          setFeatures(data.user.features);
        } else {
          setMessage(data.message);
        }
      } catch {
        setMessage('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      } finally {
        setLoading(false);
      }
    })();
  }, [initData]);

  useEffect(() => {
    if (!initData) return;
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
  }, [initData, features.xtCard48Discount]);

  async function submitUid() {
    const currentInitData = initData || getTelegramInitData();
    if (!currentInitData && !isLocalDev) {
      setSessionState('missing');
      setSubmitFeedback('اطلاعات ورود تلگرام هنوز در دسترس نیست.');
      return;
    }
    const initDataForSubmit = currentInitData || '';
    const normalized = uid.trim();
    if (!normalized) {
      setSubmitFeedback('لطفاً شناسه XT را وارد کنید.');
      return;
    }

    setSubmitFeedback('در حال بررسی شناسه...');
    setSubmitting(true);
    try {
      const res = await fetch('/api/verify/xt-uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initDataForSubmit, xtUid: normalized }),
      });
      const data = (await res.json()) as
        | { ok: true; status: Status; message: string }
        | { ok: false; message?: string };
      if (data.ok) {
        setStatus(data.status);
        setSubmitFeedback(data.message);
        setMessage(
          data.status === 'verified'
            ? 'شناسه شما تأیید شد.'
            : data.status === 'pending_review'
              ? 'یا شناسه اشتباه وارد شده یا این شناسه با کد طالس ثبت‌نام نکرده است.'
              : 'امکان تأیید این شناسه وجود نداشت.',
        );
        setFeatures({ xtCard48Discount: data.status === 'verified' });
      } else {
        setSubmitFeedback(data.message ?? 'خطایی رخ داد.');
      }
    } catch {
      setSubmitFeedback('خطا در بررسی شناسه. لطفاً بعداً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Shell title={copy.title} verified={false}>{copy.loading}</Shell>;

  return (
    <Shell title={copy.title} verified={status === 'verified'}>
      <p className="lead page-message">{message}</p>

      {status !== 'verified' ? (
        <section className="card panel-accent stack">
          <div className="section-title">
            <h2>{copy.verify}</h2>
            <span>مرحله {toPersianDigits(1)}</span>
          </div>
          <p>{copy.info}</p>
          <p>{copy.safety}</p>
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
          {sessionState === 'missing' && !isLocalDev ? <p className="feedback">این Mini App باید از داخل Telegram و از دکمه‌ی Open Thales App باز شود.</p> : null}
          {submitFeedback ? <p className="feedback">{submitFeedback}</p> : null}
        </section>
      ) : null}

      <section className="card stack">
        <div className="section-title">
          <h2>{discountCopy?.title ?? copy.discountTitle}</h2>
          <span>{discountCopy?.allowed ? 'باز' : 'قفل'}</span>
        </div>
        {discountCopy?.allowed ? (
          <>
            <p>{discountCopy.body}</p>
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
              <p>{copy.welcome}</p>
            </div>
          </div>
          <div className="subtitle">نسخه موبایل‌محور برای مشتریان ثالس</div>
        </header>
        {children}
      </div>
    </main>
  );
}
