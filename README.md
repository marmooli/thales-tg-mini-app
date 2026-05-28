# thales-tg-mini-app

Telegram Mini App MVP for Persian Thales customer access.

## What this repo contains

- Persian-first mobile UI
- Telegram initData validation
- XT UID verification against a D1 allowlist
- Backend-gated access for `XT Card $48 Discount`
- Cloudflare-first layout for later deployment on Pages/Workers + D1

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from `.env.example`.

3. For local development without a real Telegram session, set `DEV_BYPASS_TELEGRAM_AUTH=true`.

4. Run the app:

```bash
npm run dev
```

If you want the API locally as well, run Wrangler in a second terminal:

```bash
npm run dev:worker
```

## Cloudflare deployment path

- Build the frontend with `npm run build`
- Deploy the Worker/API and static assets with Wrangler:

```bash
npx wrangler deploy
```
- Bind the D1 database using `wrangler.toml`
- Apply the schema in `migrations/sqlite.sql`
- Configure `XT_API_PROXY_BASE_URL` if the proxy base URL changes from the default
- No GitHub Actions deployment workflow is used in this repo.

## Notes

- All user-facing copy is intended to remain Persian.
- The app is designed so the verification service can later be swapped from allowlist-based checks to an XT integration without changing the frontend flow.
