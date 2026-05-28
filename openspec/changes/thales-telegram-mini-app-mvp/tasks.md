## 1. Project Setup

- [x] 1.1 Scaffold a single Cloudflare-ready repository with route separation for the Mini App, API handlers, and Telegram bot webhook
- [x] 1.2 Add environment variable examples for Telegram bot token, bot username, app base URL, and D1 binding
- [x] 1.3 Add README setup notes for local development and Cloudflare deployment path
- [x] 1.4 Define the project copy source so all user-facing text is centralized in Persian

## 2. Telegram Authentication

- [x] 2.1 Implement server-side Telegram `initData` validation using the bot token
- [x] 2.2 Implement authenticated user creation and update from validated Telegram payloads
- [x] 2.3 Add `POST /api/auth/telegram` and `POST /api/me` handlers with verified user state responses

## 3. Data Model

- [x] 3.1 Create database schema for users, UID verification attempts, and allowed XT UIDs
- [x] 3.2 Add persistence helpers for reading and updating user verification state
- [x] 3.3 Add persistence helpers for storing verification attempts and allowlist lookups

## 4. XT UID Verification

- [x] 4.1 Implement a replaceable `verifyXtReferral` service abstraction
- [x] 4.2 Implement MVP allowlist-based verification logic
- [x] 4.3 Add `POST /api/verify/xt-uid` with UID normalization, attempt storage, and status updates
- [x] 4.4 Ensure repeated or invalid submissions return simple, safe error responses

## 5. Access Control

- [x] 5.1 Implement backend access checks for `XT Card $48 Discount`
- [x] 5.2 Ensure direct route access returns locked content unless the user is verified
- [x] 5.3 Prevent frontend state from being treated as authorization

## 6. Persian Mini App UI

- [x] 6.1 Create the Persian welcome screen with status display and navigation actions
- [x] 6.2 Create the Persian UID verification screen with validation and submission states
- [x] 6.3 Create the Persian verification result states for verified, pending review, rejected, and error
- [x] 6.4 Create the gated `XT Card $48 Discount` page with placeholder content for verified users
- [x] 6.5 Add Telegram WebApp initialization and session bootstrap on the frontend

## 7. Telegram Bot and Release Readiness

- [x] 7.1 Add or wire the bot `/start` message with an `Open Thales App` button
- [x] 7.2 Add tests for Telegram auth, verification logic, and access control
- [x] 7.3 Verify the app is deployable on a Cloudflare path with minimal refactoring
- [x] 7.4 Confirm the Mini App, API, and bot webhook can be deployed from the same Cloudflare project
