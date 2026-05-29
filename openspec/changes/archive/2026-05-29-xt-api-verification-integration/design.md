## Context

The current Mini App verifies XT UIDs using a local allowlist. That model is intentionally simple, but it is not the best long-term source of truth now that a signed XT referral proxy is available at `xt-api.metagitic.com`. The app already has a Telegram-authenticated flow, a verification state machine, and backend-enforced access control, so this change should replace only the verification source, not the rest of the product.

This integration introduces an external dependency and changes the trust boundary. The frontend must remain unchanged from a user perspective, while the backend verification layer becomes proxy-first and continues to store audit data.

## Goals / Non-Goals

**Goals:**
- Use the XT proxy as the primary source of truth for UID verification.
- Preserve the existing Telegram auth and Mini App UX.
- Keep backend access control authoritative.
- Continue storing verification attempts and response metadata.
- Maintain a safe fallback path for incomplete or ambiguous proxy responses.

**Non-Goals:**
- Changing the app UI flow.
- Adding payment or KYC enforcement to the current gating model.
- Removing the existing allowlist completely from the system during the first cut.

## Decisions

### 1. Proxy-first verification
Use `invite/check` from the signed proxy as the primary signal for whether a UID is verified. If the proxy indicates the UID is invited, mark the user `verified`. If the proxy does not confirm invitation, default to `pending_review` unless another clearly disqualifying signal is introduced later.

Rationale: the proxy is the newest authoritative referral signal available and is designed to replace the temporary local allowlist.

Alternatives considered:
- Keep allowlist primary: rejected because it does not scale or reflect live referral state.
- Use multiple XT endpoints equally: rejected for the initial cut because the invite decision can be made from `invite/check`, with other endpoints used for enrichment.

### 2. Enrichment without extra gating complexity
Use `single/user/info` and `kyc/status` as supporting data, not as the primary gating rule. Store them for debugging, support, and future policy changes, but do not require them for the MVP’s access decision.

Rationale: inviting the user is the core referral signal; adding hard KYC gates now would overcomplicate the Mini App and may cause false negatives.

Alternatives considered:
- Require KYC for verified status: rejected for MVP because it changes the product contract and may block legitimate users.

### 3. Preserve auditability
Persist raw proxy results alongside the normalized verification result in the existing verification-attempt flow.

Rationale: the proxy is external and may evolve. Keeping raw response metadata makes debugging and future migration possible.

Alternatives considered:
- Store only normalized status: rejected because it makes proxy behavior opaque and hard to troubleshoot.

### 4. Keep a fallback path
Retain the local allowlist as a fallback or bridge while the proxy integration stabilizes.

Rationale: this reduces rollout risk and gives a safe fallback if proxy responses are temporarily unavailable or ambiguous.

Alternatives considered:
- Hard cutover with no fallback: rejected because it increases operational risk during the first rollout.

Fallback behavior:
- If the proxy is unreachable, times out, or returns an unexpected payload, the system should not auto-reject the user.
- In that case, keep the user in `pending_review` and persist the failure context for audit/review.

### 5. Replace, not rewrite
Keep the verification boundary behind a single service abstraction so the UI, auth flow, and access control remain unchanged.

Rationale: only the verification source should change. Everything else already works and should not be reworked.

Alternatives considered:
- Embed proxy calls directly in route handlers: rejected because it would make future changes harder and spread proxy assumptions through the codebase.

## Risks / Trade-offs

- [Proxy availability or latency] → Add timeout handling, fallback behavior, and safe `pending_review` defaults.
- [Proxy schema changes] → Keep raw responses in audit storage and isolate parsing logic in one service.
- [False positives/negatives from proxy data] → Use conservative status mapping and avoid auto-rejecting ambiguous cases.
- [Mixing local allowlist and proxy logic] → Define precedence clearly so there is a single deterministic verification path.

## Migration Plan

1. Introduce a proxy-backed verification service behind the existing abstraction.
2. Keep the current allowlist as fallback data during rollout.
3. Map proxy responses to normalized statuses and store raw metadata.
4. Verify the Telegram auth and gated access paths still behave the same from the user perspective.
5. After confidence is gained, decide whether the allowlist fallback should remain or be reduced to emergency-only usage.

Implementation notes:
- The proxy base URL should be configurable, but no separate proxy credential is assumed unless the proxy operator introduces one later.
- The proxy client should centralize endpoint paths and parsing so the exact referral contract is isolated in one module.

Rollback strategy:
- If the proxy becomes unreliable, switch the service boundary back to the allowlist fallback without changing the frontend or Telegram auth flow.

## Open Questions

- Should the allowlist remain as a permanent fallback or only a temporary migration bridge?
- What timeout and retry policy should the proxy client use?
- Do we want to expose KYC status anywhere in the UI later, or keep it internal only?
