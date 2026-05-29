## MODIFIED Requirements

### Requirement: Keep CRM read-only in the MVP
The system MUST keep the CRM read-only for general Mini App user data in the MVP while allowing the narrowly scoped coupon-sent operational action.

#### Scenario: General edit attempt is rejected
- **WHEN** a CRM user attempts to modify a Mini App user field other than the coupon-sent state
- **THEN** the system MUST reject the edit
- **AND** it MUST present the CRM as read-only for general customer data

#### Scenario: Coupon-sent toggle is allowed
- **WHEN** an authorized CRM user toggles the coupon-sent control for a user
- **THEN** the system MUST allow the action
- **AND** it MUST persist the new coupon-sent state on `coupon_sent_at`

### Requirement: Show user detail and activity timeline
The system MUST provide a detail view for each user with profile data, coupon-sent state, and a timestamped activity timeline.

#### Scenario: User detail opens
- **WHEN** an authorized user selects a user row
- **THEN** the system MUST show detailed user information
- **AND** it MUST show the current coupon-sent state derived from `coupon_sent_at`
- **AND** it MUST show Mini App activity events in reverse chronological order
- **AND** it MUST show timestamps down to date and time

### Requirement: Define a limited operational activity taxonomy
The system MUST store operational Mini App events using a bounded event taxonomy for CRM timelines, including coupon dispatch actions.

#### Scenario: Operational event is recorded
- **WHEN** the Mini App or CRM emits an operational event related to coupon dispatch
- **THEN** the system MUST store it using a known CRM activity event type
- **AND** it MUST keep the event timeline usable for support and review

## ADDED Requirements

### Requirement: Expose coupon-sent control in the CRM
The system MUST allow authorized CRM users to mark a user's coupon as sent and to clear that state from the user detail view.

#### Scenario: Coupon is marked sent
- **WHEN** an authorized CRM user clicks the coupon-sent control for a user
- **THEN** the system MUST update `coupon_sent_at` for that user
- **AND** it MUST trigger the customer notification flow

#### Scenario: Coupon state is cleared
- **WHEN** an authorized CRM user clears the coupon-sent control for a user
- **THEN** the system MUST clear `coupon_sent_at`
- **AND** it MUST allow the action to be repeated later
