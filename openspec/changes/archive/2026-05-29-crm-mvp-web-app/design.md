## Context

This change adds an internal CRM web app for operational visibility into Mini App users. The CRM must read from the same D1 database as the Telegram Mini App, stay Cloudflare-first, and remain separate from the customer-facing app. The MVP is read-only, but the data model and boundaries must allow later editing without a redesign.

Implementation boundary for MVP:
- Same repository as the Mini App.
- Separate CRM route namespace and CRM UI entry point.
- Shared D1 database as the source of truth.

## Goals / Non-Goals

**Goals:**
- Provide internal access to Mini App user data and activity logs.
- Support role-based access with configurable roles.
- Allow list browsing, detail inspection, filtering, sorting, search, pagination, and CSV export.
- Keep the CRM separate from the Mini App while using the same Cloudflare account and D1 source of truth.
- Preserve a path to future edit actions without changing the data ownership model.

**Non-Goals:**
- No customer-facing CRM features.
- No write/edit functionality in MVP.
- No Telegram-based login for the CRM.
- No separate data store or sync layer in MVP.

## Decisions

### 1. Separate web app, same Cloudflare account
The CRM will be deployed as a distinct web app and route namespace, not folded into the customer Mini App UI, but it will live in the same repository and deploy pipeline.
Rationale: internal tooling should stay isolated from customer flow, and a separate app makes permissions and future expansion cleaner.
Alternatives considered:
- Embed CRM inside the Mini App repo UI: rejected because it blurs internal vs customer surfaces.
- Separate infrastructure/account: rejected for MVP because it adds operational overhead without product value.

### 2. Read directly from the existing D1 database
The CRM will read user and activity data from the same D1 database used by the Mini App.
Rationale: it avoids duplication and keeps the Mini App as the source of truth.
Alternatives considered:
- Duplicate data into a CRM-specific database: rejected for MVP because it adds sync complexity.
- Query the Mini App through an API only: rejected because the CRM needs flexible browsing and filtering.

### 3. Role-based internal authentication
The CRM will use internal login with configurable roles such as `super_admin`, `admin`, and `viewer`, backed by session cookies and persisted CRM user records.
Rationale: the CRM needs access control now, and later role changes should be possible without refactoring the app.
Alternatives considered:
- Single shared password: rejected because it cannot support role segmentation.
- Telegram auth: rejected because the CRM is an internal web app, not a Telegram surface.

Authentication model for MVP:
- Username/password login.
- Session cookie for the active CRM user.
- Roles stored with the CRM user record and evaluated on every protected request.
- Passwords stored as salted hashes, not plaintext.

### 4. Activity log as an append-only timeline
Every operational Mini App event will be stored as an activity record and shown in reverse chronological order in the CRM detail view.
Rationale: support and operational review depend on a complete timeline.
Alternatives considered:
- Only store latest status: rejected because it loses operational history.
- Store partial event summaries only: rejected because it weakens audit value.

MVP activity event scope:
- `telegram_auth_success`
- `telegram_auth_failed`
- `uid_submit`
- `uid_verified`
- `uid_pending_review`
- `uid_rejected`
- `crm_login_success`
- `crm_login_failed`
- `crm_role_changed` only if role editing is introduced later
- CRM-side read events are not required.

### 5. Read-only MVP with edit-ready boundaries
The CRM UI and data access layer will be structured so update actions can be added later, but MVP ship scope remains read-only.
Rationale: this avoids a rewrite when edit workflows are introduced.
Alternatives considered:
- Build edit now: rejected because it expands scope and introduces policy complexity before the read path is validated.

Later edit readiness:
- Keep service boundaries around user reads and mutations separate.
- Keep role checks in middleware rather than UI only.
- Do not expose mutation endpoints in MVP.

## Risks / Trade-offs

- [Sensitive internal data exposure] → Mitigate with role-based access, least-privilege defaults, and clear separation of CRM and customer app routes.
- [Large activity tables become slow] → Mitigate with pagination, indexed filters, and bounded query windows.
- [Future edit requirements change access patterns] → Mitigate by keeping repository boundaries and service layers clean now.
- [CSV export grows beyond MVP] → Mitigate by exporting only table columns initially and expanding later if needed.
- [Session theft or stale login state] → Mitigate with short-lived signed sessions, logout support, and role checks on every protected request.
- [Password leakage risk] → Mitigate with salted password hashes and no plaintext credential storage.

## Migration Plan

1. Add CRM auth and access-control tables or fields in D1.
2. Add activity logging to the Mini App for the operational events that must appear in CRM timelines.
3. Build CRM read endpoints and UI against the existing D1 schema.
4. Deploy the CRM as a separate Cloudflare web app on the same account.
5. Validate role access, list browsing, detail views, and CSV export.

Rollback strategy:
- Disable CRM routes or deployment without affecting the Mini App database or customer-facing flow.

## Open Questions

- None blocking for MVP.
