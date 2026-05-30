## Context

The CRM already reads Mini App user records from the shared D1 database and currently exposes the core fields needed for support, review, and export. Discount email addresses are already stored on the same `users` record, and the CRM list data path already carries that field through the API, but it is not surfaced in the main table. Operations need that email to be visible directly in the main list so they can triage users faster, and CSV exports should carry the same data for offline processing.

This is a focused CRM-only change. It does not alter Mini App flows, CRM auth, or the underlying data model. It only expands how existing user data is surfaced in the CRM list and export surface.

## Goals / Non-Goals

**Goals:**
- Show the stored Mini App email in the CRM main user table.
- Include the same email column in CSV exports.
- Keep the current CRM table behavior, filters, sorting, pagination, and detail pages intact.
- Reuse the existing `users.discount_email` field as the source of truth.

**Non-Goals:**
- Do not change how the Mini App collects or stores emails.
- Do not add a new database migration.
- Do not change database structure, database contents, or perform any backfill/rewrite of rows.
- Do not alter CRM access control, roles, or authentication.
- Do not change the user detail view unless required for consistency.

## Decisions

### 1. Reuse the existing `discount_email` column from `users`
The CRM should keep reading the email from the same field the Mini App already writes, and the main table should render the already-available CRM API field.

Why:
- The data already exists in the source of truth.
- The CRM list query already exposes the field, so no backend schema or API shape change is needed.
- This avoids introducing a duplicate field or a synchronization problem.
- The change stays read-only from the CRM perspective.
- No data migration or database content mutation is allowed as part of this change.

Alternatives considered:
- Creating a separate CRM-specific email column. Rejected because it duplicates Mini App data and complicates ownership.
- Deriving the email only in the detail view. Rejected because the whole point is visibility in the main table.

### 2. Add the email as a visible table column and CSV column
The CRM main list and CSV export should present the same email field so the list and exported file stay aligned.

Why:
- Support and operations can inspect the email without opening each user.
- CSV exports become a faithful offline representation of the list.

Alternatives considered:
- Showing email only in the detail view. Rejected because it does not solve the support workflow problem.
- Adding email only to CSV. Rejected because the list itself would still hide the data.

### 3. Keep the rest of the CRM list behavior unchanged
Search, filters, sorting, pagination, and role behavior remain the same.

Why:
- This is a narrow data-surface expansion, not a CRM redesign.
- Limiting the change reduces regression risk.

### 4. Render blank cells for users without an email
If a user has not submitted a discount email, the CRM table should keep the cell empty instead of fabricating placeholder data.

Why:
- It makes the absence of data explicit.
- It avoids confusion between “not provided” and “error”.

## Risks / Trade-offs

- [Risk] The main table becomes wider and may feel denser on smaller screens. → Mitigation: keep the current responsive table pattern and make the email column compact.
- [Risk] CSV exports may become more sensitive to privacy concerns because they now carry an additional personal field. → Mitigation: keep CSV export restricted to authorized CRM users.
- [Risk] If the email field is blank for many users, the added column may appear noisy. → Mitigation: render blank cells cleanly and preserve the existing table styling.

## Migration Plan

1. Update the CRM main table to read and display the existing email field.
2. Update the CSV export serializer to include the same column.
3. Add or update tests for list rendering and CSV output.
4. Verify locally, then deploy.

Rollback:
- Remove the email column from the CRM list and CSV serializer if the wider table causes usability issues.

## Open Questions

- None. The source of truth is the existing `users.discount_email` column.
