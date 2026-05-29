## Why

We already have a polished XT Card campaign landing page in a separate static site repo, and we want users to reach that experience from inside the Telegram Mini App as a single, consistent entry point. Bringing it into the Mini App removes context switching, keeps the Telegram flow intact, and lets us reuse the existing landing content and assets without maintaining a second parallel user journey.

## What Changes

- Add a new internal Mini App route for the XT campaign landing page.
- Add a visible link or button from the Mini App home page to the XT campaign landing page.
- Recreate the existing XT campaign landing experience inside the Mini App shell so users can open it from Telegram and stay in the app.
- Reuse the landing content structure, visuals, and Persian copy from the existing static landing.
- Preserve the current mini-app auth and verification flow without changing its requirements.
- Keep the implementation Cloudflare-first so the landing route deploys with the same Worker/Pages flow as the rest of the app.

## Capabilities

### New Capabilities

- `xt-campaign-landing-page`: Persian XT campaign landing page rendered as a native route inside the Telegram Mini App, including static marketing content and asset-backed sections.

### Modified Capabilities

- `xt-uid-verification-flow`: the Mini App home page gains a new entry link to the XT campaign landing page, changing navigation but not the underlying auth/verification rules.

## Impact

- Mini App route structure: new landing route inside the existing app shell.
- Mini App home page navigation: add a direct entry point to the new landing route.
- Frontend rendering: add a page that maps the landing content into the current UI framework and mobile-first layout system.
- Assets: reuse or import the XT campaign images, video, and related static assets into the Mini App build/deploy path.
- Deployment: the landing page becomes part of the same Cloudflare deployment as the Mini App, instead of requiring a separate site.
