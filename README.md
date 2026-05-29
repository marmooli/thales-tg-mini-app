# thales-tg-mini-app

Telegram Mini App MVP for Persian Thales customer access.

## What this repo contains

- Persian-first mobile UI
- Telegram initData validation
- XT UID verification against a D1 allowlist
- Backend-gated access for `XT Card $48 Discount`
- Internal CRM web app at `/crm` with role-based login, user browsing, detail view, and CSV export
- Cloudflare-first layout for later deployment on Pages/Workers + D1

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from `.env.example`.
   - For local testing, keep `APP_BASE_URL=http://localhost:5173`.
   - For Telegram production deploys, use the Cloudflare Worker URL from `wrangler.toml`.
   - For the CRM, set `CRM_SESSION_SECRET` and optionally `CRM_BOOTSTRAP_USERNAME`, `CRM_BOOTSTRAP_PASSWORD`, and `CRM_BOOTSTRAP_ROLE`.

3. For local development without a real Telegram session, set `DEV_BYPASS_TELEGRAM_AUTH=true`.

4. Create a Wrangler dev env file from `.dev.vars.example`.
   - Wrangler reads `.dev.vars` for `npm run dev:worker`.
   - Put the CRM bootstrap credentials there so the `/crm` login works locally.

5. Run the app:

```bash
npm run dev
```

If you want the API locally as well, run Wrangler in a second terminal:

```bash
npm run dev:worker
```

If the CRM login returns "نام کاربری یا رمز عبور نادرست است", make sure:
- `CRM_SESSION_SECRET` is set in `.dev.vars`
- `CRM_BOOTSTRAP_USERNAME` and `CRM_BOOTSTRAP_PASSWORD` match the values you use in `/crm`
- the worker process was restarted after changing `.dev.vars`

## Cloudflare deployment path

- Build the frontend with `npm run build`
- Deploy the Worker/API and static assets with Wrangler:

```bash
npx wrangler deploy
```
- Bind the D1 database using `wrangler.toml`
- Apply the schema in `migrations/sqlite.sql`
- Configure `XT_API_PROXY_BASE_URL` if the proxy base URL changes from the default
- Set `CRM_SESSION_SECRET` before using the CRM web app in production
- Set `CRM_BOOTSTRAP_USERNAME` and `CRM_BOOTSTRAP_PASSWORD` once to create the first CRM admin user
- No GitHub Actions deployment workflow is used in this repo.
- `APP_BASE_URL` in `wrangler.toml` is the production bot/webhook URL, while `.env` can keep the local `localhost` value for browser testing.

## Notes

- All user-facing copy is intended to remain Persian.
- The app is designed so the verification service can later be swapped from allowlist-based checks to an XT integration without changing the frontend flow.
- The CRM is read-only in the MVP and uses the same D1 source of truth as the Mini App.
