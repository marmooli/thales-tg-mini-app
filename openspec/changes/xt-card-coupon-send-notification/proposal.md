## Why

When support manually marks a coupon as sent, the customer should receive an immediate, consistent notification from the bot instead of relying on a separate follow-up step. This reduces operational friction, makes the CRM action observable to the user, and keeps the coupon lifecycle state synchronized across the CRM and the Mini App.

## What Changes

- Add a dedicated `coupon_sent_at` state to the shared user record in the Mini App database.
- Add a CRM control so internal users can mark the coupon as sent or revert it back.
- Send a Telegram bot message to the customer when the coupon-sent control is enabled.
- Allow repeated notifications if an admin unchecks and checks the control again.
- Update the Mini App to reflect the coupon-sent state when it changes.
- Keep the CRM action auditable through the existing activity/event history.

## Capabilities

### New Capabilities
- `xt-card-coupon-send-notification`: manage coupon-sent state, notify the customer through the bot, and keep the Mini App state in sync.

### Modified Capabilities
- `crm-web-app`: expose a CRM action for toggling coupon-sent state on a user record and surface the resulting state in the internal user detail view.
- `xt-card-discount-process`: reflect the coupon-sent state in the customer-facing discount flow.

## Impact

- Shared D1 schema for Mini App and CRM user records.
- Telegram bot webhook/message flow for customer notifications.
- CRM user detail and action controls.
- Mini App user status rendering for coupon state.
- Database activity logging for coupon-sent state transitions.
