## Why

The current XT UID verification screen is functional but too generic for the intended customer journey. We need a clearer, more guided flow that explains the purpose of verification, reduces ambiguity around the input field, and gives users simple self-serve help before escalating to support.

## What Changes

- Rename the verification heading from `تأیید شناسه XT` to `تأیید شناسۀ XT-UID`.
- Replace the existing explanatory copy with a more explicit access message for Thales-exclusive services and a direct request to enter the XT-UID.
- Place the XT-UID input and submit action immediately after the explanation, with validation and error messages shown directly under the field.
- Add two small helper actions:
  - `راهنمای پیدا کردن UID`
  - `راهنمای ثبت‌نام با کد طالس`
- Route each helper action to a dedicated route-backed page. The UID help page shows the guide image and a back button, while the registration guide page shows guidance copy, registration link buttons, and a back button. Proposed routes: `/xt-uid-help` and `/xt-registration-guide`.
- Track failed verification attempts within the same user session and, after three failed attempts for that user in the same session, reveal a `تماس با پشتیبانی` action.
- Route the support action to a dedicated route-backed page with only a title and a back button for now. Proposed route: `/support`.
- Continue logging user interaction events in the database so the flow remains auditable and supportable.

## Capabilities

### New Capabilities
- `xt-uid-verification-flow`: Guided XT-UID verification UX, helper pages, session-based failed-attempt escalation, and interaction logging for the Mini App.

### Modified Capabilities
- None

## Impact

- Mini App frontend copy, layout, and navigation for the verification path.
- Worker/API logic for session-scoped failed-attempt tracking and logging.
- Database event logging for verification attempts and help/support navigation.
- New route handling for the three helper/support pages.
