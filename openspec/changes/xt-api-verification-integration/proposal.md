## Why

The MVP currently verifies XT UID access through a local allowlist, but that is a temporary stopping point. We now have a signed XT referral proxy that can provide real referral and user signals, so the app should move to a more accurate verification path without rewriting the Mini App flow.

## What Changes

- Replace the local allowlist as the primary verification source with the XT API proxy at `xt-api.metagitic.com`.
- Use proxy-backed referral data to decide whether a UID is verified or still pending review.
- Keep the existing Mini App UX and Telegram authentication flow unchanged.
- Preserve a fallback path so the system can continue to handle uncertain or incomplete referral data safely.
- Continue storing verification attempts for auditability, now with proxy response metadata.
- Keep the verification service isolated so future XT contract changes do not force UI or access-control rewrites.

## Capabilities

### New Capabilities

- `xt-proxy-verification`: Verify XT UIDs through the signed proxy API, derive access status from proxy signals, and persist proxy-backed results.

### Modified Capabilities

- `xt-referral-verification`: Replace allowlist-only verification behavior with proxy-backed verification logic and proxy-derived status handling.

## Impact

- Backend verification flow changes from local allowlist lookup to remote proxy API calls.
- D1 storage needs to retain proxy response metadata for audit and debugging.
- Access-control decisions remain backend enforced, but the source of truth becomes the proxy instead of the local allowlist.
- Environment/configuration needs a proxy base URL, with no extra proxy credentials assumed in the first cut unless the proxy requires them later.
