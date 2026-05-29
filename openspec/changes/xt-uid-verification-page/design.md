## Context

The Mini App currently renders the XT-UID verification UI inline on the home page. That makes the main screen visually crowded and mixes onboarding, status, discount access, and verification into one long page. The requested change moves the verification section into its own dedicated page titled `تأیید شناسه`, while keeping the rest of the app flow intact.

The existing app already uses route-based navigation with `pushState`, a shared verification session id in `sessionStorage`, and a backend `/api/verify/xt-uid` endpoint. This change should reuse that infrastructure rather than introducing a modal or a separate app.

Stakeholders:
- Mini App users who need a clearer onboarding path.
- Support/operations, because the flow remains traceable through the existing verification events.
- Future maintainers, because the home page becomes shorter and the verification flow becomes a reusable route.

## Goals / Non-Goals

**Goals:**
- Move the XT-UID verification form to a dedicated route.
- Add a clear top-level CTA on the Mini App home page that opens the verification page.
- Add a back action from the verification page to the home page.
- Keep the verification API, session-scoped attempt counting, and helper/support routes unchanged.
- Preserve the Persian-first UI and the existing Cloudflare-first deployment model.

**Non-Goals:**
- No backend authentication redesign.
- No database schema changes.
- No change to helper/support page content.
- No change to discount flow logic.
- No introduction of a modal or third-party routing library.

## Decisions

1. **Use a dedicated route for verification instead of an inline section or modal.**
   - Rationale: the verification flow is a primary onboarding step and benefits from its own screen, especially on mobile.
   - Alternatives considered:
     - Inline section on the home page: rejected because the home page is already long and mixed-purpose.
     - Modal/bottom sheet: rejected because the flow includes multiple helper actions and a back path that are cleaner on a real page.

2. **Use a route under the existing app shell, not a separate app or iframe.**
   - Rationale: the app already has route handling and history management, so a local route keeps navigation, auth state, and session tracking simple.
   - Alternatives considered:
     - External page or iframe: rejected because it complicates Telegram mobile UX and adds dependency on cross-site framing behavior.

3. **Keep the same verification session id across home and verification page navigation.**
   - Rationale: failed-attempt counting is session-scoped and should not reset when the user navigates between home and the dedicated verification page.
   - Alternatives considered:
     - Generate a new session per page: rejected because it would break the current support-reveal behavior.

4. **Place the home-page verification CTA at the top of the home flow.**
   - Rationale: the user explicitly wants the entry point visible above other content, so the page is easier to discover.
   - Alternatives considered:
     - Put the CTA lower on the home page: rejected because it would be less visible and keep the page crowded.
   - Implementation note: the CTA should appear before the discount/access cards so it is visually the first explicit action on the home page.

5. **Keep the backend verification endpoint and event logging unchanged.**
   - Rationale: the work is a UI/route refactor, not a verification behavior change.
   - Alternatives considered:
     - Add new verification APIs: rejected as unnecessary.

## Risks / Trade-offs

- [Risk] Adding another page can increase tap count for first-time users. → [Mitigation] Place the CTA at the top of the home page and keep the back action obvious.
- [Risk] Route changes may break deep links or browser history if not wired consistently. → [Mitigation] Reuse the existing route resolution and `pushState` pattern already used by other pages.
- [Risk] Moving the form can accidentally reset user state if component state is not preserved correctly. → [Mitigation] Keep the verification session id in `sessionStorage` and continue using the shared API response to restore status.
- [Risk] The home page may still feel busy if the verification CTA is styled inconsistently. → [Mitigation] Reuse the app's existing card/button styling and keep the CTA minimal.

## Migration Plan

1. Add the new verification route and page component.
2. Extract the verification form UI from the home page into the new page.
3. Add a home-page CTA that opens the new route.
4. Update route resolution and navigation logging.
5. Update tests for the new route, CTA, and back navigation.
6. Deploy and validate that existing verification state and helper routes still behave the same.

Rollback strategy:
- Remove the dedicated route and render the verification form inline on the home page again.
- Keep the backend API and database schema unchanged so rollback is a UI-only revert.

## Open Questions

- None. The route title and CTA label are defined as `تأیید شناسه`, and the implementation should follow the existing route and history model.
