## 1. Route Refactor

- [x] 1.1 Add a dedicated XT-UID verification route and page component.
- [x] 1.2 Remove the inline verification form from the home page rendering path.
- [x] 1.3 Add a top-level home-page CTA labeled `تأیید شناسه` above the discount cards that opens the verification page.

## 2. Back Navigation

- [x] 2.1 Add a back action on the verification page that returns to the home page.
- [x] 2.2 Preserve the existing verification session state across navigation between home and verification page.
- [x] 2.3 Keep the home-page scroll and shell state consistent when returning from the verification page.

## 3. Flow Wiring

- [x] 3.1 Keep the existing XT-UID verification API calls and session-scoped attempt counting unchanged.
- [x] 3.2 Update route resolution and navigation logging for the new verification page.

## 4. Tests and Validation

- [x] 4.1 Add or update route tests for the new verification page and home-page CTA.
- [x] 4.2 Add or update rendering tests to confirm the verification form appears only on the dedicated page.
- [x] 4.3 Run build and typecheck to verify the refactor does not break the Mini App.
