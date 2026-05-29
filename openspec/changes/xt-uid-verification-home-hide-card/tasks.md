## 1. Home-page visibility

- [x] 1.1 Update the Mini App home-page rendering so the `تأیید شناسه` entry card is not rendered when the current user is verified.
- [x] 1.2 Keep the verification entry card visible for unverified, pending-review, and rejected users.
- [x] 1.3 Preserve the rest of the home-page layout, including the discount and campaign sections, when the verification card is hidden.

## 2. Verification-state behavior

- [x] 2.1 Ensure the home-page hide/show decision uses the persisted verification status returned from `/api/me`.
- [x] 2.2 Keep the `/verify` route, helper pages, and back navigation unchanged.
- [x] 2.3 Verify that a returning verified user continues to see the card hidden after refresh or re-entry.
- [x] 2.4 Return the user to the home page automatically after a successful verification.

## 3. Tests and validation

- [x] 3.1 Add or update rendering tests for the verified home page so the verification entry card is absent.
- [x] 3.2 Add or update rendering tests for the unverified home page so the verification entry card remains visible.
- [x] 3.3 Run build and typecheck to confirm the visibility change does not break the Mini App.
- [x] 3.4 Add or update tests for automatic home-page navigation after successful verification.
