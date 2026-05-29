## Why

The Mini App home page still shows the XT-UID verification card after a user has already completed verification. That creates unnecessary clutter and repeats an onboarding step the user no longer needs. Hiding the card for verified users makes the home screen cleaner and better reflects the user's current state.

## What Changes

- Hide the `تأیید شناسه` entry card from the Mini App home page once a user is verified.
- Keep the verification page and its back navigation unchanged for unverified users and for direct route access.
- Preserve the verified-state cues that still matter on the home page, such as the unlocked discount flow and any verified indicators already shown elsewhere.
- Keep the behavior driven by the persisted user verification status so the card remains hidden on later visits after a successful verification.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `xt-uid-verification-flow`: the home-page verification entry card must no longer render for users whose verification status is `verified`.

## Impact

- Mini App home-page rendering logic.
- Verified-state navigation and conditional UI.
- Tests that cover the home page and verified state visibility.
- No backend schema changes are required for this update.
