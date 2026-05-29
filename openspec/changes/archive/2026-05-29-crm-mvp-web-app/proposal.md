## Why

We need an internal CRM MVP to observe and review users who enter the Thales Telegram Mini App. Today, operational visibility is spread across the Mini App database and manual checks, which makes support, review, and future admin workflows slower than necessary.

## What Changes

- Add a separate CRM web app in the same repository, deployed on the same Cloudflare account as the Mini App, with its own route namespace.
- Provide internal login with role-based access control and configurable roles.
- Show a searchable, filterable, sortable, paginated table of Mini App users.
- Show a detail view per user with profile data, verification state, and a timestamped activity timeline.
- Store and surface all operational Mini App activity events in the CRM detail view.
- Support CSV export of the user table columns.
- Keep the CRM read-only for MVP, while designing the architecture so edit actions can be added later without restructuring the data layer.

## Capabilities

### New Capabilities
- `crm-web-app`: Internal CRM UI, authentication, role-based access, user list, user detail, activity timeline, filtering, sorting, pagination, and CSV export for Mini App data.

### Modified Capabilities
- None

## Impact

- New web app routes and UI separate from the Telegram Mini App.
- D1 data model and read paths for user records and activity logs.
- Internal authentication and role/permission handling with session cookies.
- CSV export support and UI for list/detail browsing.
- Cloudflare deployment configuration for a separate CRM web app on the same account.
