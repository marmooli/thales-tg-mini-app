## Context

The Mini App already has a verified-user discount entry point, but the current behavior is too shallow for the coupon-based onboarding journey. Verified users need a dedicated guided flow that collects and confirms an email address, stores that email on the existing user record, and provides a next-step video guide placeholder for future activation instructions.

This change must remain Cloudflare-first, Persian-first, and compatible with the current D1-backed architecture. It also needs to preserve the existing authentication boundary: only verified Telegram users should be able to complete the discount process.

## Goals / Non-Goals

**Goals:**
- Turn the unlocked discount action into a guided, route-backed process.
- Collect and confirm the user's email address before storing it.
- Store the email on the existing `users` row in the shared D1 database as `discount_email`.
- Add a placeholder route for the follow-up activation video.
- Keep the flow Persian-first and mobile-first.
- Preserve access control so only verified users can complete the flow.

**Non-Goals:**
- No actual coupon delivery integration yet.
- No real video player or embedded media yet.
- No new authentication system.
- No separate discount-request table unless future requirements need it.

## Decisions

### 1. Store the email on the existing user record
The email will be persisted directly on the existing `users` row, using a new `discount_email` column rather than introducing a separate table.

Rationale: the user explicitly asked for the email to be stored on the same record. This keeps the model simple and avoids introducing a second lookup path for a single-user flow.

Alternatives considered:
- Separate `discount_requests` table: rejected because the requirement is to persist on the same user record.
- Local-only state: rejected because the email must survive refreshes and support later CRM visibility.

Implementation detail:
- The backend can reuse the existing `updated_at` column for audit freshness when `discount_email` changes.
- The authenticated user payload should expose `discount_email` so the client can prefill the first email field on subsequent visits.

### 2. Introduce a dedicated process route and a dedicated video placeholder route
The verified discount button will navigate to `/xt-card-discount-process`. The follow-up placeholder route will be `/xt-card-coupon-video`.

The discount form submission endpoint will be a dedicated API route for the process, for example `POST /api/xt-card-discount-process/email`, so the discount flow remains separate from the XT verification endpoints and can reuse the same authenticated-user guard pattern.

Rationale: route-backed pages are easier to test, easier to guard, and easier to extend than modals or inline panels.

Alternatives considered:
- Modal-based flow: rejected because the process is multi-step and route history is useful.
- Keeping the discount action static: rejected because the new flow has explicit steps and persistence.

### 3. Validate email on both client and server
The first email field will use standard email input behavior, and the confirmation field will reject paste attempts in the UI. The backend must still validate format and equality before persisting anything.

Rationale: paste blocking is only a UX control. The real guarantee must come from backend validation to prevent partial or malformed data from being stored.

Alternatives considered:
- Client-only validation: rejected because it is easy to bypass.
- Server-only validation: rejected because the confirmation field UX explicitly asks for no-paste behavior.

### 4. Keep access control verified-only
The new process should only be usable by verified users. If a user is not verified, the page must not present the email submission form.

Rationale: the discount process is a post-verification step and must not leak a conversion path to unverified users.

Alternatives considered:
- Public process route: rejected because it weakens the gating rule already established in the Mini App.

### 5. Reuse the existing worker/D1/CRM logging pattern
Email submissions should be logged as activity events in the shared database, keeping the flow auditable and visible in CRM.

Rationale: the repo already uses D1 as the source of truth and activity logging as an audit trail. Reusing that pattern keeps the implementation coherent.

## Risks / Trade-offs

- [Paste blocking can be bypassed by browser devtools] → Mitigation: treat paste blocking as UX only and enforce equality/format checks on the server.
- [Email data may need correction later] → Mitigation: allow the same user record to be updated with a newer verified email if the user re-submits the process.
- [Access guard may be inconsistent between frontend and backend] → Mitigation: gate the process route in the UI and validate the verified state before accepting the email submission.
- [Adding a column to `users` changes the DB schema] → Mitigation: keep the migration small and additive, with a rollback that drops only the new discount email column if needed.
- [Returning users may see stale prefilled data] → Mitigation: always source the first field from the authenticated record and leave the confirmation field blank on load.

## Migration Plan

1. Add the new `discount_email` column to the `users` table.
2. Add a backend endpoint that validates the authenticated verified user and persists the email on the same row.
3. Add the verified-user discount process route and the placeholder video route.
4. Update the verified discount action so it opens the new process page.
5. Add tests for validation, persistence, route guard behavior, and the video placeholder.
6. Deploy after local verification.

Rollback strategy:
- Remove the new route(s), API endpoint, and discount email columns if needed, then restore the previous verified discount action behavior.

## Open Questions

- None blocking for MVP.
