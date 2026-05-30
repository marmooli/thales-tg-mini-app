## Why

Verified users need a clear, in-product support path that stays inside the Mini App instead of forcing them to leave the flow. A dedicated support card on the home page makes help discoverable at the right moment: after successful verification, when users may need to ask questions or request assistance.

## What Changes

- Add a new lowest-position support card to the Mini App home page.
- Gate the support card behind successful XT UID verification so unverified users see it locked.
- Reuse the existing lock/unlock pattern already used by the discount card so the support experience matches the rest of the app.
- Open an internal support page from the card instead of sending users directly to Telegram.
- Reuse the same internal `/support` route for the home-page card and the verification-flow support action.
- Show the support page content with a clickable Telegram link to `https://t.me/Ssameti`.
- Keep a back button at the bottom of the support page that returns to the Mini App home page.
- Keep the database schema, database contents, and verification data unchanged.

## Capabilities

### New Capabilities
- `xt-support-card-page`: support card entry point and internal support page for verified Mini App users.

### Modified Capabilities
- `xt-uid-verification-flow`: the home page gains another gated card whose visibility depends on verification status, and the support route becomes part of the verified-user navigation surface.

## Impact

- Mini App home page layout and card order.
- Mini App route navigation for support.
- Shared unlock logic for verified users.
- Internal support page content and back navigation.
- No database schema, migration, or content mutation is required for this change.
