## Why

The current UID verification section is embedded on the Mini App home page, which makes the main screen too crowded and mixes onboarding content with the primary status/discount flow. Moving the verification content to its own page creates a clearer mobile-first experience and gives the home page a simple, obvious entry point.

## What Changes

- Move the entire UID verification section from the Mini App home page to a dedicated page titled `تأیید شناسه`.
- Add a primary button on the Mini App home page labeled `تأیید شناسه` that navigates to the new page.
- Add a back action on the new verification page that returns the user to the Mini App home page.
- Keep the existing verification behavior, validation, and backend flow unchanged aside from the new page placement.
- Keep the rest of the home page content and discount flow intact.

## Capabilities

### New Capabilities

- `xt-uid-verification-page`: dedicated verification page with home-page entry and back navigation.

### Modified Capabilities

- `xt-uid-verification-flow`: the verification UI is no longer rendered inline on the home page and is instead exposed through a separate page with navigation back to home.

## Impact

- Mini App frontend routes and navigation.
- UID verification page layout and copy.
- Home page CTA placement.
- Existing verification flow rendering logic.
- Related tests for route resolution, navigation, and rendering.
