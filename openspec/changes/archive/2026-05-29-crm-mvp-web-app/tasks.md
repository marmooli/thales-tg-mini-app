## 1. CRM Foundation

- [x] 1.1 Add CRM route namespace and entry points separate from the Mini App
- [x] 1.2 Add CRM environment/config support for shared D1, session secrets, and role settings
- [x] 1.3 Create the CRM page shell, Persian layout, and internal navigation frame
- [x] 1.4 Add CRM deployment wiring for Cloudflare-first deployment on the same account

## 2. Authentication and Authorization

- [x] 2.1 Create internal CRM login and logout flow
- [x] 2.2 Persist authenticated CRM sessions with signed cookies
- [x] 2.3 Store CRM passwords as salted hashes
- [x] 2.4 Add role-based authorization for `super_admin`, `admin`, and `viewer`
- [x] 2.5 Add route and API access guards that deny unauthorized CRM requests and views
- [x] 2.6 Prepare permission boundaries for future role editing without exposing mutation endpoints in MVP

## 3. User Browsing and Detail Views

- [x] 3.1 Build the CRM user table with the core Mini App columns
- [x] 3.2 Add search, filters, sorting, and pagination to the user table
- [x] 3.3 Add a user detail view with profile information and verification state
- [x] 3.4 Add a reverse-chronological activity timeline with date and time stamps
- [x] 3.5 Add route navigation from table row to detail view and back
- [x] 3.6 Keep the table and detail routes Persian-localized for internal operators

## 4. Audit and Export

- [x] 4.1 Add Mini App activity logging for operational events shown in CRM
- [x] 4.2 Add persistence for activity events in the shared D1 database
- [x] 4.3 Add CSV export for the currently filtered CRM user table columns
- [x] 4.4 Ensure CRM reads directly from the shared D1 data source with no sync layer
- [x] 4.5 Add support for future edit-oriented boundaries without changing source-of-truth ownership
- [x] 4.6 Limit operational logging to the bounded CRM activity taxonomy

## 5. Validation

- [x] 5.1 Add tests for internal login and role-based access control
- [x] 5.2 Add tests for table filtering, sorting, and pagination behavior
- [x] 5.3 Add tests for user detail timeline rendering and CSV export
- [x] 5.4 Validate Persian copy and read-only MVP behavior in the CRM UI
- [x] 5.5 Validate unauthorized users cannot access protected CRM routes or APIs
- [x] 5.6 Validate password hashing and session cookie handling
