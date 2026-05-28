## Why

Thales needs a minimal Telegram Mini App that can securely identify a Telegram user, verify an XT UID, and unlock a single gated customer benefit only for eligible users. This MVP establishes the access-control foundation now, before the discount content or future customer features are added.

## What Changes

- Add a Telegram Mini App entry flow launched from a bot button.
- Validate Telegram `initData` server-side and create/update a user profile from Telegram identity data.
- Add XT UID submission and verification status tracking.
- Introduce a gated feature named `XT Card $48 Discount`.
- Store verification attempts for auditability.
- Add a simple MVP allowlist-backed verification source that can be replaced later by an external XT verification service.
- Enforce backend access control so gated content is unavailable unless the user is verified.
- Add minimal mobile-first pages for welcome, UID verification, result states, and the gated discount page.
- Localize the full Mini App experience to Persian (`fa`), including all user-facing copy, labels, buttons, and error messages.
- Keep the architecture Cloudflare-friendly from day one so the app can later be deployed cleanly on Cloudflare Pages/Workers with D1 and minimal refactoring.

## Capabilities

### New Capabilities

- `telegram-mini-app-auth`: Telegram Mini App session validation, user creation/update, and current-user status lookup.
- `xt-referral-verification`: XT UID submission, allowlist-based verification, status persistence, and gated access checks for `XT Card $48 Discount`.

### Modified Capabilities

- None.

## Impact

- New backend endpoints for Telegram auth, me/status lookup, and XT UID verification.
- New database tables for users, UID verification attempts, and XT allowlist entries.
- New Telegram bot entry point that opens the Mini App.
- New frontend routes and conditional access states for verified and unverified users.
- Environment configuration for Telegram bot credentials and app URL.
- Persian-first content and UI text across the entire Mini App.
- A deployment path that stays aligned with Cloudflare-native hosting, functions, and database bindings.
