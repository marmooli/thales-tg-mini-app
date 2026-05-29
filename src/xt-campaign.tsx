import React from 'react';

export const XT_CAMPAIGN_ROUTE_PATH = '/xt-campaign';

const XT_CAMPAIGN_HERO_IMAGE = '/assets/monitor-card.jpg';
const XT_CAMPAIGN_CARD_IMAGE = '/assets/card-mobile-vertical.jpg';
const XT_CAMPAIGN_CHATGPT_IMAGE = '/assets/upgrade chatgpt.jpg';
const XT_CAMPAIGN_PAY_IMAGE = '/assets/oogle pay.jpg';
const XT_CAMPAIGN_FREEZE_IMAGE = '/assets/freeze card.jpg';
const XT_CAMPAIGN_CHARGE_IMAGE = '/assets/charge card.jpg';

type XtCampaignLandingPageProps = {
  onOpenDiscountProcess: () => void;
  onBack: () => void;
};

export function XtCampaignLandingPage({ onOpenDiscountProcess, onBack }: XtCampaignLandingPageProps) {
  return (
    <section className="campaign-page">
      <div className="campaign-shell">
        <div className="campaign-hero">
          <div className="campaign-hero-copy">
            <p className="campaign-eyebrow">XT Card</p>
            <h2 className="campaign-title">صفحه فرود کمپین XT Card</h2>
          </div>
          <div className="campaign-hero-media">
            <img src={XT_CAMPAIGN_HERO_IMAGE} alt="نمای کارت XT روی نمایشگر" className="campaign-hero-image" />
          </div>
        </div>

        <div className="campaign-grid">
          <article className="campaign-feature-card">
            <img src={XT_CAMPAIGN_CARD_IMAGE} alt="نمونه نمای کارت روی موبایل" className="campaign-feature-image" />
            <h3>فعال‌سازی سریع</h3>
            <p>پس از تکمیل مراحل، کارت را طبق راهنمای داخل Mini App فعال کنید و روند را بدون خروج از تلگرام ادامه دهید.</p>
          </article>
          <article className="campaign-feature-card">
            <img src={XT_CAMPAIGN_PAY_IMAGE} alt="پرداخت بین‌المللی با کارت" className="campaign-feature-image" />
            <h3>پرداخت بین‌المللی</h3>
            <p>برای پرداخت‌های آنلاین و بین‌المللی از تجربه‌ای ساده و موبایل‌محور استفاده کنید.</p>
          </article>
          <article className="campaign-feature-card">
            <img src={XT_CAMPAIGN_CHARGE_IMAGE} alt="شارژ کارت با کریپتو" className="campaign-feature-image" />
            <h3>شارژ با رمزارز</h3>
            <p>کارت خود را با رمزارز شارژ کنید و فرایند را از مسیر راهنمای داخل اپ پیگیری کنید.</p>
          </article>
          <article className="campaign-feature-card">
            <img src={XT_CAMPAIGN_FREEZE_IMAGE} alt="فریز کردن کارت" className="campaign-feature-image" />
            <h3>مدیریت امن کارت</h3>
            <p>در صورت نیاز، کارت را فریز کنید و کنترل بیشتری روی وضعیت آن داشته باشید.</p>
          </article>
        </div>

        <section className="campaign-callout">
          <div className="campaign-callout-copy">
            <p className="campaign-callout-kicker">دریافت تخفیف ۳۸ دلاری</p>
            <h3>از همین‌جا وارد فرایند دریافت تخفیف شوید</h3>
            <p>
              اگر کاربر واجد شرایط باشید، می‌توانید مستقیم از همین Mini App وارد فرایند دریافت تخفیف ۳۸ دلاری کارت XT
              شوید.
            </p>
            <p className="route-guide-copy campaign-intro">
              این صفحه، خلاصه‌ای از مزایای کارت XT را نشان می‌دهد. مسیر دریافت تخفیف ۳۸ دلاری در پایین همین صفحه قرار
              دارد.
            </p>
          </div>
          <div className="campaign-callout-media">
            <img
              src={XT_CAMPAIGN_CHATGPT_IMAGE}
              alt="نمونه کاربرد کارت برای خدمات آنلاین"
              className="campaign-callout-image"
            />
          </div>
          <div className="campaign-hero-actions campaign-callout-actions">
            <button className="primary campaign-primary" type="button" onClick={onOpenDiscountProcess}>
              شروع فرایند دریافت تخفیف ۳۸ دلاری
            </button>
            <button className="secondary xt-helper-button campaign-secondary" type="button" onClick={onBack}>
              بازگشت
            </button>
          </div>
        </section>

        <div className="campaign-footnote route-guide-copy">
          برای مشاهده راهنماها و ادامه مسیر، از دکمه‌های داخل Mini App استفاده کنید و از همان‌جا به مسیر مناسب بروید.
        </div>
      </div>
    </section>
  );
}
