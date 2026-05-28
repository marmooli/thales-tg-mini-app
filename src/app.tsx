import { useEffect, useMemo, useState } from 'react';
import { copy } from './copy';

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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [features, setFeatures] = useState({ xtCard48Discount: false });
  const [discountCopy, setDiscountCopy] = useState<{ title: string; body: string; cta: string; allowed: boolean } | null>(null);
  const initData = useMemo(() => getTelegramInitData(), []);

  useEffect(() => {
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
    const normalized = uid.trim();
    if (!normalized) {
      setMessage('لطفاً شناسه XT را وارد کنید.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/verify/xt-uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, xtUid: normalized }),
      });
      const data = (await res.json()) as
        | { ok: true; status: Status; message: string }
        | { ok: false; message?: string };
      if (data.ok) {
        setStatus(data.status);
        setMessage(
          data.status === 'verified'
            ? 'شناسه شما تأیید شد.'
            : data.status === 'pending_review'
              ? 'شناسه شما ثبت شد و در حال بررسی است.'
              : 'امکان تأیید این شناسه وجود نداشت.',
        );
        setFeatures({ xtCard48Discount: data.status === 'verified' });
      } else {
        setMessage(data.message ?? 'خطایی رخ داد.');
      }
    } catch {
      setMessage('خطا در بررسی شناسه. لطفاً بعداً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Shell title={copy.title}>{copy.loading}</Shell>;

  return (
    <Shell title={copy.title}>
      <section className="hero card">
        <div className="eyebrow">Mini App مشتریان ثالس</div>
        <p className="lead">{message}</p>
        <StatusCard status={status} />
      </section>

      <section className="card panel-accent">
        <div className="section-title">
          <h2>{copy.verify}</h2>
          <span>مرحله ۱</span>
        </div>
        <p>{copy.info}</p>
        <p>{copy.safety}</p>
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
        <button className="primary" onClick={submitUid} disabled={submitting}>
          {submitting ? copy.loading : copy.submit}
        </button>
      </section>

      <section className="card">
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

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="app">
      <div className="backdrop backdrop-a" />
      <div className="backdrop backdrop-b" />
      <div className="frame">
        <header className="masthead card">
          <div className="brand-row">
            <div className="brand-mark">T</div>
            <div>
              <h1>{title}</h1>
              <p>{copy.welcome}</p>
            </div>
          </div>
          <div className="subtitle">دسترسی مشتریان، به زبان فارسی و با احراز هویت امن Telegram</div>
        </header>
        {children}
      </div>
    </main>
  );
}

function StatusCard({ status }: { status: Status }) {
  const map = {
    not_verified: 'تأیید نشده',
    pending_review: 'در حال بررسی',
    verified: 'تأیید شده',
    rejected: 'رد شده',
  } as const;
  return (
    <section className={`card status status-${status}`}>
      <span>{copy.currentStatus}</span>
      <strong>{map[status]}</strong>
    </section>
  );
}
