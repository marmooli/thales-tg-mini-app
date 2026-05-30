## 1. CRM list and export data surface

- [x] 1.1 Map the existing stored Mini App email field into the CRM main-table column configuration.
- [x] 1.2 Render the email as a visible column in the CRM main user table, leaving blank cells for users without an email.
- [x] 1.3 Include the same email column in the CRM CSV export serializer and keep the export headers aligned with the table.

## 2. Tests and validation

- [x] 2.1 Add or update tests for CRM table rendering so the email column appears in the list.
- [x] 2.2 Add or update tests for CSV export so the email column is present in the exported file.
- [x] 2.3 Run build and typecheck to confirm the CRM email column change does not break the app.
