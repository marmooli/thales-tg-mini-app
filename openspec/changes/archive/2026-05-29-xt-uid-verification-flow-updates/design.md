## Context

The current Mini App verification screen already works, but the UX is too generic for the intended customer journey. The product now needs a more explicit verification frame, helper pages for self-service guidance, and a support escalation path that activates only after repeated failed attempts in the same user session.

This change remains inside the existing Cloudflare-first repository and should continue to use the same D1 source of truth and Persian-first UI conventions. The Mini App must stay read-only in this area; the update is about flow clarity, session-scoped escalation, and logging, not about changing the verification authority.

## Goals / Non-Goals

**Goals:**
- Make the XT-UID verification screen more explicit and more guided.
- Show helper routes for UID discovery and referral registration guidance.
- Reveal support escalation only after three failed attempts in the same session.
- Log verification attempts and helper/support navigation in the shared database.
- Keep the implementation compatible with the existing Mini App routing and D1-based data model.

**Non-Goals:**
- No change to the underlying XT verification authority.
- No customer-facing support backend or ticketing integration yet.
- No new write/edit workflows outside the verification flow itself.
- No redesign of the CRM or other existing app surfaces.

## Decisions

### 1. Use a dedicated verification session id for attempt tracking
Each browser/app session will get a client-generated verification session id that is stored in `sessionStorage` and sent with every XT-UID verification attempt.

Rationale: the requirement is to count three failed attempts "in the same session". A session-scoped id makes that rule deterministic without tying it to device identity or Telegram login state.

Alternatives considered:
- Count by Telegram user id only: rejected because it would persist across sessions and not match the requested behavior.
- Count only in memory on the client: rejected because the attempts also need to be logged in the database and the count must survive page refreshes within the same session.

### 2. Extend the attempt log with session context
Verification attempts will continue to be stored in the shared D1 database, but the attempt record must also carry the client verification session id so the backend can count failed attempts in the current session.

Rationale: the app already logs interaction events to D1, and this change needs the same data to drive support escalation and auditability.

Alternatives considered:
- Separate session table: possible, but unnecessary for the MVP because the existing attempt log can carry the extra session dimension.
- Derive the count purely from UI state: rejected because it would not be auditable.

### 3. Keep helper and support destinations as route-backed pages with lightweight content
The helper actions will route to standalone pages. The UID help page will show the guide image and a back button, while the registration guide page will show guidance copy, registration link buttons, and a back button.

Route plan:
- `/xt-uid-help`
- `/xt-registration-guide`
- `/support`

Rationale: these pages are still lightweight, but they now carry the concrete guidance needed for the current flow and remain route-backed for testing and future extension.

Alternatives considered:
- Open a modal instead of a route: rejected because route-backed pages are easier to test and extend later.
- Keep everything on one page: rejected because it would make the flow harder to read and less maintainable.

### 4. Maintain Persian-first copy and compact mobile layout
The new text hierarchy will prioritize the heading, explanatory message, input, inline errors, helper buttons, and then the support action when eligible.

Rationale: the Mini App is Persian-first and mobile-first. The most important action should be visible immediately after the explanation, while helper routes should remain secondary.

## Risks / Trade-offs

- [Session id resets when the browser session ends] → Mitigate by treating the escalation rule as session-scoped by design and making the helper/support flow visible again in the next session.
- [More UI state to manage] → Mitigate with a single verification flow state machine and a small set of route-backed placeholder pages.
- [Database query complexity for failed-attempt counting] → Mitigate by keeping the attempt log append-only and indexing the session id field.
- [Support button appears too late or too early] → Mitigate by counting only failed verification submissions in the same verification session and by logging every attempt.

## Migration Plan

1. Add the verification session id to the Mini App flow and persist it client-side for the active session.
2. Extend the verification attempt logging so each attempt can be counted by session.
3. Update the verification UI copy and restructure the screen into explanation, input, inline feedback, helper buttons, and conditional support action.
4. Add route-backed empty pages for UID help, referral-registration help, and support contact.
5. Validate that three failed attempts in the same session reveal the support action and that logging remains intact.

Rollback strategy:
- Revert the UI and logging changes without altering the existing XT verification authority or broader Mini App data model.

## Open Questions

- None blocking for MVP.
