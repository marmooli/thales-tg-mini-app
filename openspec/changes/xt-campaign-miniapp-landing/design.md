## Context

The current Mini App already runs as a Cloudflare-first Telegram web app with Persian mobile UI, Telegram auth, and existing verification/discount routes. Separately, the `marmooli/xt-card-pages` repository contains a static XT campaign landing page built with HTML, CSS, JavaScript, and static assets. The goal is to bring that landing experience into the Mini App as a native route so users can open it from Telegram and stay inside the same app shell.

The Mini App home page also needs a visible entry point to the new landing route so users can reach the campaign from the primary screen without guessing a URL.

This change affects the frontend route structure and static asset packaging only. It does not change authentication, referral verification, CRM behavior, or the existing discount and support flows.

## Goals / Non-Goals

**Goals:**
- Expose the XT campaign landing page as a route inside the Mini App.
- Add a clear home-page link into the XT campaign landing page.
- Reuse the existing landing content and assets so the design remains familiar.
- Keep the landing route compatible with the current Cloudflare deploy path.
- Preserve Persian RTL behavior and the current mobile-first visual system.

**Non-Goals:**
- Rebuilding the campaign landing as a separate standalone website.
- Changing Telegram auth, UID verification, CRM, or coupon notification behavior.
- Introducing new backend APIs or database tables.
- Rewriting the landing content beyond what is required to fit the existing Mini App shell.

## Decisions

1. **Implement the landing as a native Mini App route instead of embedding the external site**
   - The landing will live inside the same app shell as the rest of the Telegram Mini App.
   - This avoids iframe/CSP limitations, preserves consistent navigation, and keeps the user in Telegram.
   - Alternatives considered:
     - Embedding the external site in an iframe: rejected because it is brittle and often blocked.
     - Linking out to the separate site: rejected because it breaks the in-app flow.

2. **Treat the existing static landing as the source content and asset reference**
   - The `xt-card-pages` repo is already a static Cloudflare Pages site, which makes its assets and content easy to reuse.
   - The route in this repo can mirror the structure and visual language while still using the current Mini App shell.
   - Alternatives considered:
     - Copying the content manually without asset reuse: rejected because it duplicates work and increases drift.
     - Trying to mount the entire static site as-is: rejected because it would not integrate cleanly with the Telegram app shell.

3. **Keep deployment unified under the current Cloudflare stack**
   - The new route will ship with the same Worker/asset deployment used by the Mini App.
   - This keeps operational complexity low and ensures the landing is available wherever the Mini App is deployed.
   - Alternatives considered:
     - Hosting the campaign page separately on Cloudflare Pages: rejected for this use case because it adds another deploy surface.

4. **Preserve existing Persian-first mobile behavior**
   - The landing must render RTL, remain touch-friendly, and fit the app's existing typography and dark theme.
   - This keeps the campaign page consistent with the current Mini App experience.

5. **Expose the landing route from the Mini App home page**
   - The primary screen in the Mini App should include a visible link or button to the XT campaign landing page.
   - This keeps discovery simple and avoids requiring users to know the route manually.
   - Alternatives considered:
     - Hiding the landing route behind only deep links: rejected because the user asked for a home-page entry point.
     - Using the campaign page as the default home: rejected because it would disrupt the existing verification-centric home flow.

## Risks / Trade-offs

- [Asset duplication] → Reusing static assets inside the Mini App may increase repo size. Mitigation: only import the assets actually needed for the landing route.
- [Content drift] → The native route may diverge from the standalone landing over time. Mitigation: keep the landing route scoped to a dedicated capability and treat the source landing as the reference.
- [Layout mismatch] → The static landing was designed for a standalone site, so some sections may need adaptation for the Mini App shell. Mitigation: keep the route responsive and mobile-first, and adjust spacing rather than changing the content model.
- [Navigation clutter] → Adding a new home-page entry can crowd the current main screen. Mitigation: use a single clear CTA and keep it visually subordinate to the primary verification flow.
- [Deployment coupling] → The landing now depends on the Mini App deploy. Mitigation: keep the route self-contained so failures are isolated to that route, not the auth/verification flows.
