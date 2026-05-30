## Why

CRM already shows the core Mini App user profile in the main table, but it does not surface the discount email that users submit during the coupon flow. Support and operations need that email visible in the primary CRM list so they can review users faster without opening each detail page. The same data should also appear in CSV exports so offline review and follow-up workflows stay consistent.

## What Changes

- Add a visible email column to the CRM main user table.
- Show the stored email for users who have submitted a discount email in the Mini App.
- Keep the email column empty or blank for users who have not submitted an email.
- Include the same email column in CSV exports from the CRM user table.
- Keep the existing CRM table, filters, sorting, pagination, and detail view behavior unchanged.
- **MUST NOT** change database structure, migrate data, or mutate database contents as part of this change.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `crm-web-app`: the main user table and CSV export now include the stored Mini App email field as part of the supported CRM review surface.

## Impact

- CRM user table columns and row rendering.
- CRM CSV export serialization.
- CRM filter/search/sort presentation remains the same, but the exported dataset gains an email column.
- No Mini App flow or database schema change is required for this proposal.
- No database content backfill, rewrite, or structural migration is allowed for this proposal.
