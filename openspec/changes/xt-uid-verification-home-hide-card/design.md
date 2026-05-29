## Context

The Mini App already separates XT-UID verification into its own `/verify` route, but the home page still renders the verification entry card even after the user has successfully verified. That makes the verified home state feel unfinished and repeats a step the user no longer needs.

This change is intentionally small and UI-focused. It should reuse the existing verification status returned from `/api/me` and the current home-page rendering path. No database migration or new backend state is required.

## Goals / Non-Goals

**Goals:**
- Hide the `تأیید شناسه` home-page entry card for verified users.
- Keep the card visible for unverified, pending, and rejected users.
- Preserve the existing `/verify` route and its back navigation.
- Keep verified-state cues that are still useful on the home page, such as the unlocked discount flow and the verified logo badge.
- Return the user to the home page automatically after a successful verification so the hidden-card state is immediately visible.

**Non-Goals:**
- Do not change the verification flow itself.
- Do not change database schema or persistence behavior.
- Do not alter helper pages, discount flows, or CRM behavior.
- Do not add a new success page or modal.

## Decisions

### 1. Use the existing persisted verification status as the visibility gate
The home page should conditionally render the verification entry card based on the verified status already fetched from `/api/me`.

Why:
- The app already knows whether the current user is verified.
- This avoids introducing a new flag, migration, or duplicate state.
- The behavior stays consistent across refreshes and later visits.

Alternatives considered:
- Adding a new `verification_complete` flag. Rejected because it duplicates `verificationStatus`.
- Hiding the card only after a temporary client-side event. Rejected because the card would reappear on refresh.

### 2. Keep the verification page route intact
The `/verify` route remains the entry point for users who still need to verify.

Why:
- The current navigation model already relies on route-backed pages.
- Verified users do not need the entry card, but unverified users still need a discoverable way to reach verification.

Alternatives considered:
- Removing the `/verify` route entirely after success. Rejected because it would break re-entry and helper navigation.

### 3. Keep the rest of the home page layout stable
Only the verification card should be conditionally hidden. The discount and campaign sections should continue to render as before.

Why:
- This is a focused visibility change, not a home-page redesign.
- It minimizes layout churn and regression risk.

### 4. Navigate home after successful verification
After a user successfully verifies, the app should return to the home route rather than leaving the user on the verification screen.

Why:
- The success state is clearer when the user immediately sees the home page without the verification card.
- This reduces one extra tap and aligns the navigation with the new visibility rule.

Alternatives considered:
- Showing an intermediate success screen. Rejected because it adds an unnecessary extra state for this small change.
- Staying on `/verify` and expecting the user to navigate back manually. Rejected because it delays the visible effect of verification.

## Risks / Trade-offs

- [Risk] The home page may feel visually different depending on verification state. → Mitigation: keep spacing and ordering stable so the remaining cards retain the same structure.
- [Risk] If the verified state is delayed while loading, the card may briefly appear before disappearing. → Mitigation: use the existing loading and `/api/me` state flow so the home page renders after auth state is known.
- [Risk] Other parts of the UI may still show verification-related cues. → Mitigation: limit this change to the home-page card only.

## Migration Plan

1. Update the home-page render logic to hide the verification entry card when the user status is verified.
2. Update tests to cover verified and unverified home states.
3. Verify the change in local dev.
4. Deploy after tests pass.

Rollback:
- Restore the unconditional rendering of the verification card if the conditional hide causes confusion or regressions.

## Open Questions

- None. The visibility rule is straightforward: hide the home-page verification card when the user is verified.
