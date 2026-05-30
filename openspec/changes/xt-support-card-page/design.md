## Context

The Mini App already has a verified-user home layout, a locked/unlocked card pattern, and a `/support` route that currently acts as a simple support entry point in the verification flow. The requested change adds a new lowest-position support card to the home page and turns the support route into a dedicated internal support page with richer copy and a clickable Telegram link. The same `/support` route should serve both entry points: the home support card and the verification-flow support action.

The implementation must stay inside the existing Cloudflare-first stack and must not require any database schema changes, migrations, or content mutations. The support card should follow the same visual lock/unlock behavior already used by the discount card so verified users experience a consistent product surface.

## Goals / Non-Goals

**Goals:**
- Add a gated support card at the bottom of the Mini App home page.
- Reuse the existing verified-state lock/unlock pattern for the support card.
- Keep the support page internal to the Mini App.
- Show the requested Persian support copy and a clickable Telegram link to `https://t.me/Ssameti`.
- Keep the support page back button returning to the home page.
- Keep database structure and stored data unchanged.

**Non-Goals:**
- Do not add or alter any database tables or columns.
- Do not add a new backend workflow for sending messages.
- Do not change verification semantics or the discount-card flow.
- Do not add new auth systems or role models.
- Do not change the support Telegram target.

## Decisions

### 1. Reuse the existing verified gate for the support card
The support card should be rendered only when the user is verified, using the same `status === 'verified'` gate that already controls the discount card.

Why:
- The app already has a clear verified-state boundary.
- Reusing the gate avoids introducing a second source of truth for unlock logic.
- The support card remains consistent with the discount card behavior.

Alternatives considered:
- Introduce a separate support eligibility flag. Rejected because it duplicates the verified gate without a product need.
- Always show the card but disable it. Rejected because the request explicitly calls for locked/unlocked behavior.

### 2. Keep `/support` as an internal route
The support card should navigate to the internal `/support` page rather than linking directly to Telegram.

Why:
- The requested experience is a Mini App page with back navigation.
- The page can present the support guidance first and still expose the Telegram contact link.
- This keeps the product flow inside the Mini App shell.
- The same route can be reused by both the home card and the verification-flow support action.

Alternatives considered:
- Direct link to Telegram from the card. Rejected because the user explicitly requested an internal page.

### 3. Render the Telegram handle as a clickable link inside the support page
The page should include the text and a clickable `https://t.me/Ssameti` link.

Why:
- It preserves the support contact information while keeping the page internal.
- A clickable link is the lowest-friction way to hand off to Telegram when needed.

Alternatives considered:
- Put only a button. Rejected because the requested copy includes the full Telegram reference and should remain readable in-body.

### 4. Keep the implementation read-only with respect to data
No database mutation or migration is needed for the support card/page.

Why:
- The change is purely navigational and presentational.
- The verified state already exists in the current data model.

## Risks / Trade-offs

- [Risk] Adding one more card makes the home page longer. → Mitigation: place it at the bottom and keep the card visually aligned with the existing discount card pattern.
- [Risk] Users may confuse the internal support page with Telegram itself. → Mitigation: keep the page copy explicit and include the clickable Telegram link with the handle text.
- [Risk] The support route could drift from the verified gate in future edits. → Mitigation: add tests that assert the card is only visible for verified users.

## Migration Plan

1. Add the new support card to the home page and gate it behind verified state.
2. Update the internal `/support` route to render the requested support copy and link.
3. Update or add tests for gated rendering and route content.
4. Verify locally, then deploy.

Rollback:
- Remove the support card from the home page and revert `/support` to the previous simple support page behavior if needed.
