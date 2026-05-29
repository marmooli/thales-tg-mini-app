## Purpose

Guided XT-UID verification flow for the Thales Mini App, including helper pages, session-scoped escalation, and interaction logging.

## Requirements

### Requirement: Present a guided XT-UID verification screen
The system MUST present a guided XT-UID verification screen with a clear heading, explanation, input field, inline error area, and submit action in that order.

#### Scenario: Verification screen renders
- **WHEN** an unverified user opens the verification screen
- **THEN** the system MUST show the heading `تأیید شناسۀ XT-UID`
- **AND** it MUST show the explanation `دسترسی به خدمات اختصاصی طالس فقط برای کاربرانی فراهم است که با کد طالس در صرافی XT حساب داشته باشند. لطفاً برای آزاد شدن دسترسی شناسۀ XT-UID خود را وارد کنید.`
- **AND** it MUST show the verification explanation before the XT-UID input field
- **AND** it MUST show the XT-UID input field immediately before the submit action
- **AND** it MUST reserve a visible inline area directly under the input field for validation and submit feedback

### Requirement: Offer self-service helper pages
The system MUST provide helper actions for UID discovery and registration guidance.

#### Scenario: UID help opens
- **WHEN** the user selects `راهنمای پیدا کردن UID`
- **THEN** the system MUST navigate to the `/xt-uid-help` route
- **AND** it MUST show the helper page title, the UID guide image, and a back button

#### Scenario: Referral help opens
- **WHEN** the user selects `راهنمای ثبت‌نام با کد طالس`
- **THEN** the system MUST navigate to the `/xt-registration-guide` route
- **AND** it MUST show the helper page title, the registration guidance copy, the registration link buttons, and a back button

### Requirement: Reveal support only after three failed attempts in the same session
The system MUST reveal a `تماس با پشتیبانی` action only after three failed XT-UID verification attempts for the same user in the same session.

#### Scenario: First failed attempt
- **WHEN** the user submits an XT-UID that is not verified
- **THEN** the system MUST record the failed attempt for the current verification session
- **AND** it MUST keep the support action hidden

#### Scenario: Third failed attempt
- **WHEN** the user completes the third failed XT-UID verification attempt in the same session
- **THEN** the system MUST reveal the `تماس با پشتیبانی` action
- **AND** it MUST continue to keep the verification screen available

#### Scenario: New session starts
- **WHEN** the user starts a new verification session
- **THEN** the system MUST count failed attempts within the new session independently

#### Scenario: Support page opens
- **WHEN** the user selects `تماس با پشتیبانی`
- **THEN** the system MUST navigate to the `/support` route
- **AND** it MUST show only the support page title and a back button

#### Scenario: Support becomes visible
- **WHEN** the user has three failed XT-UID verification attempts in the same session
- **THEN** the system MUST make the support action visible in the UI

### Requirement: Log verification interactions in the database
The system MUST log XT-UID verification attempts and helper/support navigation events in the database.

#### Scenario: Verification attempt is submitted
- **WHEN** the user submits an XT-UID for verification
- **THEN** the system MUST store the attempt in the shared database
- **AND** it MUST include enough session context to count attempts within the same verification session
- **AND** it MUST keep the failed-attempt count scoped to that verification session

#### Scenario: Helper navigation is opened
- **WHEN** the user opens a helper or support page
- **THEN** the system MUST store the interaction as a database event

### Requirement: Present the new flow in Persian
The system MUST present the XT-UID verification flow labels, messages, helper actions, and support action in Persian.

#### Scenario: Persian flow renders
- **WHEN** the verification flow is shown to the user
- **THEN** the UI copy MUST be Persian
- **AND** the helper actions MUST use the requested Persian labels
