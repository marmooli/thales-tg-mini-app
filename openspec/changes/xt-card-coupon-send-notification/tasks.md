## 1. Data model and migration

- [x] 1.1 Add `coupon_sent_at` to the shared user schema
- [x] 1.2 Create a migration that applies `coupon_sent_at` to local and remote D1
- [x] 1.3 Update shared data access helpers to read and write `coupon_sent_at`

## 2. CRM coupon-sent control

- [x] 2.1 Add a coupon-sent toggle in the CRM user detail view
- [x] 2.2 Persist coupon-sent state changes from the CRM to `coupon_sent_at`
- [x] 2.3 Surface a CRM error when Telegram notification delivery fails
- [x] 2.4 Record coupon-sent transitions in the CRM activity timeline

## 3. Telegram bot notification

- [x] 3.1 Send the coupon-sent notification from the bot when the CRM marks `coupon_sent_at`
- [x] 3.2 Clear `coupon_sent_at` when the CRM toggles the state off
- [x] 3.3 Allow a later off/on toggle to resend the Telegram notification

## 4. Mini App status and messaging

- [x] 4.1 Read `coupon_sent_at` in the Mini App user status endpoint
- [x] 4.2 Show `کوپن ۳۸ دلاری ارسال شد` in the discount flow when the coupon has been dispatched
- [x] 4.3 Keep the existing pending-review state unchanged when the coupon has not yet been sent
- [x] 4.4 Fall back to the existing discount-flow state when `coupon_sent_at` is cleared

## 5. Validation and release

- [x] 5.1 Add or update tests for the CRM toggle, notification send, and Mini App status rendering
- [x] 5.2 Run build, test, and typecheck to verify the change
- [x] 5.3 Deploy the updated worker and confirm the CRM and Mini App behavior end to end
