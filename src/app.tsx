import { useEffect, useMemo, useState } from 'react';

type Status = 'not_verified' | 'pending_review' | 'verified' | 'rejected';

type MeResponse =
  | { ok: true; user: { telegramUserId: string; verificationStatus: Status; accessLevel: string; features: { xtCard48Discount: boolean } } }
  | { ok: false; message: string };

const copy = {
  title: 'اپلیکیشن مشتری ثالس',
  welcome: 'برای دسترسی به مزایای مشتریان، لطفاً شناسه XT خود را تأیید کنید.',
  currentStatus: 'وضعیت فعلی',
  verify: 'تأیید شناسه XT',
  openDiscount: 'باز کردن تخفیف XT Card $48',
  submit: 'ارسال شناسه',
  uidLabel: 'شناسه XT',
  uidPlaceholder: 'شناسه XT را وارد کنید',
  info: 'ما فقط از شناسه XT شما برای بررسی ثبت‌نام از مسیر معرفی ثالس استفاده می‌کنیم.',
  safety: 'ما به حساب، موجودی، رمز عبور یا داده‌های معاملاتی شما دسترسی نداریم.',
  discountTitle: 'XT Card $48 Discount',
  discountBody: 'این مزیت فقط برای مشتریان تأییدشده ثالس فعال است. جزئیات کامل بعداً اضافه می‌شود.',
  locked: 'این بخش فقط پس از تأیید شناسه در دسترس است.',
  loading: 'در حال بررسی...',
};

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
      <p className="lead">{message}</p>
      <StatusCard status={status} />

      <section className="card">
        <h2>{copy.verify}</h2>
        <p>{copy.info}</p>
        <p>{copy.safety}</p>
        <label>
          {copy.uidLabel}
          <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder={copy.uidPlaceholder} />
        </label>
        <button onClick={submitUid} disabled={submitting}>
          {submitting ? copy.loading : copy.submit}
        </button>
      </section>

      <section className="card">
        <h2>{copy.discountTitle}</h2>
        {features.xtCard48Discount ? (
          <>
            <p>{copy.discountBody}</p>
            <button>{copy.openDiscount}</button>
          </>
        ) : (
          <p>{copy.locked}</p>
        )}
      </section>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="app">
      <div className="frame">
        <header>
          <h1>{title}</h1>
          <p>{copy.welcome}</p>
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
    <section className="card status">
      <span>{copy.currentStatus}</span>
      <strong>{map[status]}</strong>
    </section>
  );
}
