## MODIFIED Requirements

### Requirement: Mini App home page provides the campaign entry point
The system MUST show a visible entry point on the Mini App home page that opens the XT campaign landing page inside the app shell.

#### Scenario: Home page link opens campaign page
- **WHEN** a user opens the Mini App home page
- **THEN** the home page SHALL show a direct link or button to the XT campaign landing page
- **AND** selecting it SHALL navigate to the campaign landing route

### Requirement: User can access the discount flow from the Mini App
The system MUST allow a verified user to open the XT campaign/discount experience from inside the Mini App and navigate through the app shell without leaving Telegram.

#### Scenario: Verified user opens campaign landing
- **WHEN** a user with verified access opens the campaign route from the Mini App
- **THEN** the XT campaign landing page SHALL open inside the Mini App shell
- **AND** the user SHALL remain in the Telegram Mini App environment

#### Scenario: Unverified user is still gated
- **WHEN** a user without verified access opens the discount entry point
- **THEN** the system SHALL continue to block access to the gated discount experience
- **AND** the user SHALL be routed to the verification flow instead
