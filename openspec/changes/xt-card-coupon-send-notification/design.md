## Context

The Mini App and CRM already share a single user database and a Telegram bot-based customer channel. Support currently needs a way to mark a coupon as sent from the CRM and have that state reflected immediately to the customer without a manual follow-up step.

This change adds a new operational state for coupon dispatch, a bot notification path, and a visible customer-facing status update in the Mini App.

## Goals / Non-Goals

**Goals:**
- Let authorized CRM users mark a coupon as sent for a given customer.
- Send a Telegram DM to the customer when the coupon-sent state turns on.
- Allow the notification to be sent again if the CRM toggles the state off and then back on.
- Surface the coupon-sent status in the Mini App.
- Keep the new state auditable in the existing activity history.

**Non-Goals:**
- Do not add a full coupon management system or coupon code generation flow.
- Do not add queued/retried background delivery for failed Telegram sends in the MVP.
- Do not introduce multi-channel notification support.
- Do not change the existing Telegram authentication model.

## Decisions

1. **Store coupon-sent state as a user-row timestamp**
   - Use a dedicated `coupon_sent_at` timestamp column on the shared user record to represent whether the coupon has been dispatched and when it was last marked sent.
   - **Why**: a timestamp is enough to show state, keeps the latest send time visible, and supports repeated sends after a clear/re-toggle cycle.
   - **Alternatives considered**:
     - Boolean flag only: simpler, but loses the last-send timestamp.
     - Separate coupon table: more flexible, but unnecessary for a single per-user operational state in the MVP.

2. **Send the Telegram message synchronously from the CRM action**
   - When an admin marks coupon-sent on, the backend sends the bot message immediately and only persists the sent state if the Telegram call succeeds.
   - **Why**: the admin gets immediate confirmation and the CRM does not record a sent state for a message that never left the system.
   - **Alternatives considered**:
     - Async queue/job: more resilient, but adds infrastructure and delayed operator feedback.
     - Persist first, send later: simpler flow, but risks a false sent state if delivery fails.

3. **Allow repeated notification via off/on transitions**
   - If an admin turns the state off and later back on, the system sends the bot message again and updates the timestamp.
   - **Why**: this matches the requested operational behavior and supports re-sends without creating a separate resend workflow.
   - **Alternatives considered**:
     - One-time send only: safer against duplicates, but does not support the requested re-send behavior.

4. **Expose the new state in the Mini App as a status indicator**
   - The customer-facing app reads the coupon-sent state and shows the corresponding status near the discount flow.
   - **Why**: the user should be able to see that support has completed the dispatch step and proceed to activation guidance.
   - **Alternatives considered**:
     - Bot message only: less UI work, but the app would not reflect the CRM state.

5. **Keep the CRM broadly read-only except for this operational toggle**
   - The CRM continues to avoid general editing of customer data, but it gets a narrowly scoped coupon-sent control for support operations.
   - **Why**: this preserves the read-only posture while enabling the specific workflow needed by support.

## Risks / Trade-offs

- [Telegram delivery failure] → The CRM action may fail if the bot cannot DM the user. Mitigation: surface the error immediately and do not mark the coupon as sent until delivery succeeds.
- [Duplicate notifications from repeated toggles] → Re-enabling the state intentionally resends the message, which is desired but can be misused. Mitigation: keep the action audit-logged and visible in the CRM timeline.
- [State drift between CRM and Mini App] → If state updates are only partially applied, UI and backend may diverge. Mitigation: persist the timestamp and log the event only after successful delivery.
- [Schema growth] → Another user-row timestamp increases the breadth of the shared schema. Mitigation: keep it on the existing user record rather than splitting into a new subsystem.

## Migration Plan

1. Add the new coupon-sent timestamp column to the shared user schema.
2. Update CRM user detail actions to toggle the state and send the bot notification.
3. Update the Mini App state fetch to include the new coupon-sent status.
4. Add the customer-facing Persian message and status copy.
5. Record the transition in the activity timeline so support can audit when the message was sent or resent.
6. Roll out with a migration that preserves existing user data and defaults the new state to unsent.
7. Keep the customer-facing discount flow aligned so it can show the sent state once `coupon_sent_at` is populated.
8. When `coupon_sent_at` is cleared, let the discount flow fall back to its existing state logic instead of showing the sent banner.
