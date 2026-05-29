## Why

The current unlocked discount action is too shallow for the intended customer journey. When a verified user taps the discount button, we need a dedicated guided flow that collects an email address, confirms it safely, and prepares the user for a later coupon and activation step.

## What Changes

- When the discount action is unlocked, the user is routed to a new guided page titled `فرایند دریافت تخفیف ۳۸ دلاری کارت XT`.
- The guided page presents four explicit steps:
  - a spot-balance prerequisite message
  - email capture and confirmation
  - coupon delivery notice
  - post-email instruction for free card activation
- The flow stores the user email on the existing user record in the shared D1 database, using the new `discount_email` field.
- The confirmation email field must block paste so the user types it manually for extra confirmation.
- The flow validates email format and field equality, and shows inline errors when the values do not match or are invalid.
- If the user returns to the page later, the first email field should be prefilled from the stored value while the confirmation field remains empty.
- A new placeholder route is introduced for the follow-up video guide: `ویدیوی راهنمای فعال کردن رایگان کارت`.
- **Modified** `xt-uid-verification-flow`: the unlocked discount button now leads into the new discount process page instead of behaving like a final static benefit screen.

## Capabilities

### New Capabilities
- `xt-card-discount-process`: guided discount checkout-style flow for verified users, including email capture, confirmation, persistence, and a future video-guide placeholder route.

### Modified Capabilities
- `xt-uid-verification-flow`: update the verified-user discount action so it opens the new process page and reflects the new guided discount journey.

## Impact

- Mini App verified-state UI and navigation.
- New route-backed discount process page and video-guide placeholder page.
- Shared D1 `users` table, including a new `discount_email` field for verified users.
- Form validation and inline error messaging for the discount process.
- A dedicated backend endpoint for saving the discount email after `initData` auth.
- Returning-user prefill behavior for the saved email.
