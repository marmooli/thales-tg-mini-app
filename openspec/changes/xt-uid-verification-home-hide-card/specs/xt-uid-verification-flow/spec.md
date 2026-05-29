## ADDED Requirements

### Requirement: Hide the verification entry card after success
The system MUST hide the `تأیید شناسه` entry card from the Mini App home page when the current user verification status is `verified`.

#### Scenario: Verified user opens the home page
- **WHEN** a verified user opens the Mini App home page
- **THEN** the system MUST not render the `تأیید شناسه` entry card
- **AND** it MUST continue to render the rest of the home page content

#### Scenario: Unverified user opens the home page
- **WHEN** a user whose verification status is not `verified` opens the Mini App home page
- **THEN** the system MUST render the `تأیید شناسه` entry card
- **AND** it MUST keep the existing home-page verification entry point available

#### Scenario: Pending or rejected user opens the home page
- **WHEN** a user whose verification status is `pending_review` or `rejected` opens the Mini App home page
- **THEN** the system MUST render the `تأیید شناسه` entry card
- **AND** it MUST keep the existing home-page verification entry point available

#### Scenario: Returning verified user reloads the home page
- **WHEN** a verified user reloads or returns to the Mini App home page
- **THEN** the system MUST continue to keep the `تأیید شناسه` entry card hidden
- **AND** it MUST derive that visibility from the persisted verification status

### Requirement: Return to home after successful verification
The system MUST navigate the user back to the Mini App home page after a verification attempt succeeds with status `verified`.

#### Scenario: Verification succeeds
- **WHEN** a user submits an XT-UID and the verification result is `verified`
- **THEN** the system MUST return the user to the Mini App home page
- **AND** the home page MUST reflect the verified state without the `تأیید شناسه` entry card
