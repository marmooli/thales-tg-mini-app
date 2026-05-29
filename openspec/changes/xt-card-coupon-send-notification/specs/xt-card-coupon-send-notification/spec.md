## ADDED Requirements

### Requirement: Store coupon-sent state on the shared user record
The system MUST store whether a user's coupon has been sent on the shared Mini App user record.

#### Scenario: Coupon is marked sent
- **WHEN** an authorized CRM user marks the coupon as sent for a user
- **THEN** the system MUST persist `coupon_sent_at` for that user
- **AND** it MUST record when the coupon was last marked sent

#### Scenario: Coupon state is cleared
- **WHEN** an authorized CRM user clears the coupon-sent state for a user
- **THEN** the system MUST clear `coupon_sent_at`
- **AND** it MUST leave the user's other Mini App data unchanged

### Requirement: Send a Telegram notification when the coupon is marked sent
The system MUST send a Telegram direct message to the customer when the coupon-sent state is enabled.

#### Scenario: Coupon is sent successfully
- **WHEN** the CRM marks a user's coupon as sent
- **THEN** the system MUST send the customer the message `تبریک! کوپن ۳۸ دلاری تخفیف کارت برای شما آزاد شد. اکنون می‌توانید کارت XT خود را بصورت رایگان فعال کنید.`
- **AND** it MUST use Persian digits in the notification text
- **AND** it MUST only persist `coupon_sent_at` after the Telegram message succeeds

#### Scenario: Telegram delivery fails
- **WHEN** Telegram delivery fails while marking the coupon as sent
- **THEN** the system MUST keep the coupon-sent state unchanged
- **AND** it MUST return an error to the CRM user

### Requirement: Allow repeat coupon notifications after the state is cleared and re-enabled
The system MUST send the Telegram notification again if the coupon-sent state is cleared and then enabled later for the same user.

#### Scenario: Coupon is re-enabled later
- **WHEN** an authorized CRM user clears the coupon-sent state and later marks it sent again
- **THEN** the system MUST send the notification again
- **AND** it MUST update the stored `coupon_sent_at` timestamp

### Requirement: Reflect coupon-sent state in the Mini App
The system MUST show the coupon-sent status in the customer-facing Mini App when the state has been enabled.

#### Scenario: Coupon has been sent
- **WHEN** a verified user opens the Mini App after the coupon was marked sent
- **THEN** the system MUST show the status `کوپن ۳۸ دلاری ارسال شد`
- **AND** it MUST no longer present the coupon as pending review

#### Scenario: Coupon state has been cleared
- **WHEN** the coupon-sent state is cleared for a verified user
- **THEN** the system MUST stop showing the sent status
- **AND** it MUST fall back to the existing discount-flow state for that user

### Requirement: Log coupon dispatch activity
The system MUST record coupon-sent state changes and delivery outcomes as activity events.

#### Scenario: Coupon dispatch is recorded
- **WHEN** the CRM user marks the coupon as sent or clears that state
- **THEN** the system MUST log the transition in the database
- **AND** it MUST include enough context to audit when the coupon was sent or resent

#### Scenario: Delivery outcome is recorded
- **WHEN** the Telegram notification succeeds or fails
- **THEN** the system MUST log the delivery outcome in the database
