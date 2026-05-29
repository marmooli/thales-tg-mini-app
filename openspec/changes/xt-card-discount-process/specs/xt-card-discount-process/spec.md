## ADDED Requirements

### Requirement: Present a guided discount process page
The system MUST present a guided discount process page for verified users.

#### Scenario: Discount process page renders
- **WHEN** a verified user opens the discount process
- **THEN** the system MUST show the title `فرایند دریافت تخفیف ۳۸ دلاری کارت XT`
- **AND** it MUST show the step 1 message about the spot account needing at least ۴۰ تتر
- **AND** it MUST show the email entry step immediately after the prerequisite message
- **AND** it MUST show the confirmation email field directly after the primary email field
- **AND** it MUST show the submit action directly after the email fields
- **AND** it MUST reserve a visible inline area directly under the email fields for validation and submit feedback

#### Scenario: Returning verified user sees stored email
- **WHEN** a verified user re-opens `/xt-card-discount-process` after a previous successful submission
- **THEN** the system MUST prefill the primary email field from the stored user record
- **AND** it MUST leave the confirmation field empty
- **AND** it MUST keep the inline validation area visible below the email fields

#### Scenario: Successful submission reveals the next step
- **WHEN** the user submits matching valid email values
- **THEN** the system MUST show the coupon delivery notice
- **AND** it MUST reveal the video guide action `ویدیوی راهنمای فعال کردن رایگان کارت`

### Requirement: Validate and persist the discount email on the user record
The system MUST validate the email pair and persist the verified email address on the existing user record in the shared database.

#### Scenario: Email values match and are valid
- **WHEN** the user submits a syntactically valid email and the confirmation field matches exactly
- **THEN** the system MUST persist the email on the current user record
- **AND** it MUST persist the same value in `discount_email`
- **AND** it MUST return a success state for the discount process

#### Scenario: Email values do not match
- **WHEN** the user submits two different email values
- **THEN** the system MUST reject the submission
- **AND** it MUST show an inline mismatch error
- **AND** it MUST not persist the email

#### Scenario: Email format is invalid
- **WHEN** the user submits an invalid email format
- **THEN** the system MUST reject the submission
- **AND** it MUST show an inline format error
- **AND** it MUST not persist the email

#### Scenario: Confirmation field paste is blocked
- **WHEN** the user attempts to paste into the confirmation email field
- **THEN** the system MUST prevent the pasted value from being accepted
- **AND** the user MUST still be able to type the confirmation email manually

#### Scenario: Email submission updates the existing stored value
- **WHEN** a verified user submits a new valid matching email after a previous successful submission
- **THEN** the system MUST update `discount_email` on the same user record
- **AND** it MUST treat the new value as the current stored email for future visits

### Requirement: Restrict the discount process to verified users
The system MUST allow only verified users to complete the discount process.

#### Scenario: Verified user opens the process
- **WHEN** a verified user opens `/xt-card-discount-process`
- **THEN** the system MUST show the discount process form and guidance

#### Scenario: Unverified user opens the process
- **WHEN** an unverified user opens `/xt-card-discount-process`
- **THEN** the system MUST show an access-locked state
- **AND** it MUST not expose the discount email form

### Requirement: Offer a placeholder video-guide page
The system MUST provide a placeholder page for `ویدیوی راهنمای فعال کردن رایگان کارت`.

#### Scenario: Video guide opens
- **WHEN** the user selects `ویدیوی راهنمای فعال کردن رایگان کارت`
- **THEN** the system MUST navigate to `/xt-card-coupon-video`
- **AND** it MUST show only the page title and a back button

### Requirement: Present the discount process in Persian
The system MUST present the discount process labels, guidance, and actions in Persian.

#### Scenario: Persian discount flow renders
- **WHEN** the discount process is shown to the user
- **THEN** the UI copy MUST be Persian
- **AND** the field labels and action labels MUST use the requested Persian text
