## Context

This change introduces a Telegram Mini App for Thales customers with a single gated benefit: `XT Card $48 Discount`. The app must validate Telegram `initData` on the backend, accept an XT UID, verify it against an MVP allowlist, and expose the discount only to verified users.

The repo currently has no application code, so the design should establish a clean starting architecture rather than adapt to an existing stack. The product must be fully Persian-facing, mobile-first, and Cloudflare-friendly from the beginning so deployment to Cloudflare Pages/Workers with D1 is straightforward later.

The implementation should use a single Cloudflare project with separate route handlers for the Mini App, API endpoints, and Telegram bot webhook so the operational footprint stays small.

## Goals / Non-Goals

**Goals:**
- Provide a secure Telegram-authenticated entry flow.
- Keep verification logic isolated behind a replaceable service boundary.
- Enforce backend access control for gated content.
- Make the app fully Persian in user-facing text.
- Choose an architecture that maps cleanly to Cloudflare Pages, Workers, and D1.

**Non-Goals:**
- Full XT API integration.
- Admin dashboard.
- Payments or checkout flows.
- Multi-language support in MVP.
- Advanced analytics, notifications, or CRM.

## Decisions

### 1. Cloudflare-native architecture first
Use a frontend that can be deployed as static assets on Cloudflare Pages and backend endpoints that can run as Pages Functions or Workers. Use D1 for persistence. Keep the app, API, and bot webhook in one repository and one Cloudflare deployment target with route separation rather than multiple services.

Rationale: the repo is empty, so choosing a Cloudflare-aligned structure now avoids a later migration. The MVP scope is small enough that a Cloudflare stack is sufficient and keeps operational complexity low.

Alternatives considered:
- Node/Express with a separate server: faster for local development, but introduces avoidable deployment divergence.
- Supabase/Postgres: viable, but less aligned with the requested Cloudflare deployment path.
- Separate frontend and backend repos: rejected because it adds coordination overhead without helping the MVP.

### 2. Verification service boundary
Implement verification behind a function such as `verifyXtReferral(xtUid, telegramUserId)` that returns a normalized result plus source metadata.

Rationale: the MVP allowlist is temporary. A service boundary lets the allowlist be replaced later by XT affiliate or API integration without changing the UI flow or access-control model.

Alternatives considered:
- Inline verification logic in the request handler: simpler short term, but harder to replace and test.
- Direct external API dependency now: too risky because the external source is not guaranteed to exist yet.

### 3. Backend-enforced access control
The frontend may hide or show routes, but the backend must decide whether gated content can be returned.

Rationale: route-level UI gating alone is not secure. The backend must derive access from verified status stored in the database and the validated Telegram session.

Alternatives considered:
- Frontend-only gating: rejected because direct URL access would bypass it.
- Client-stored access flags: rejected because they are not trustworthy.

### 4. D1-backed persistence
Store users, verification attempts, and allowlisted UIDs in D1 with a simple relational schema.

Rationale: the data model is small and auditability matters. D1 is a natural fit for a Cloudflare deployment and keeps the schema easy to migrate later if needed.

Alternatives considered:
- SQLite file on a server: workable locally, but not aligned with the target platform.
- No persistence for attempts: rejected because the MVP needs auditability and repeat submissions need tracking.

### 5. Persian-first UX
All user-facing text, states, buttons, and errors will be Persian. Internal identifiers and schema names remain English for maintainability.

Rationale: the product requirement is a Persian Mini App. Separating internal code language from UI language keeps the codebase maintainable while meeting the UX constraint.

Alternatives considered:
- English UI with later localization: rejected because the Persian requirement is part of the MVP.

### 6. Telegram authentication via server validation only
The backend will validate `initData` using the bot token and never trust `initDataUnsafe` from the client.

Rationale: Telegram session data is security-sensitive. The backend must own identity validation and user record creation/update.

Alternatives considered:
- Client-only identity handling: rejected for security reasons.

## Risks / Trade-offs

- [Cloudflare worker runtime constraints] → Keep backend code runtime-agnostic, avoid Node-specific APIs, and prefer standard Web APIs.
- [Over-scoping verification state] → Keep only the minimum statuses required for the MVP and model the allowlist as a replaceable source.
- [Persian text quality and consistency] → Centralize copy strings so UX text can be reviewed and updated without code changes across many files.
- [Telegram auth mistakes] → Add tests around `initData` validation and user identity extraction before implementation.

## Migration Plan

1. Start with a Cloudflare-aligned project structure from day one.
2. Create the D1 schema for users, attempts, and allowlist entries.
3. Implement Telegram auth validation and user upsert.
4. Implement XT UID submission and allowlist verification.
5. Gate the discount route behind backend status checks.
6. Add Persian UI copy and mobile-first pages.

Rollback strategy:
- Keep the MVP verification logic behind a small service boundary so allowlist behavior can be disabled or replaced without changing app routing.
- If Cloudflare deployment surfaces runtime issues, the code should remain portable enough to run on a standard Node adapter during local development.

## Open Questions

- What exact XT UID format should be accepted for validation if the format is not purely numeric?
- Will support contact details be a static text block or a configurable value?
