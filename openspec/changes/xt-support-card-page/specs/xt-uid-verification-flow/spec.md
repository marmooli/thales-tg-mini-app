## MODIFIED Requirements

### Requirement: Reveal support only after three failed attempts in the same session
The system MUST reveal a `تماس با پشتیبانی` action only after three failed XT-UID verification attempts for the same user in the same session.

#### Scenario: First failed attempt
- **WHEN** the user submits an XT-UID that is not verified
- **THEN** the system MUST record the failed attempt for the current verification session
- **AND** it MUST keep the support action hidden on the verification page

#### Scenario: Third failed attempt
- **WHEN** the user completes the third failed XT-UID verification attempt in the same session
- **THEN** the system MUST reveal the `تماس با پشتیبانی` action on the verification page
- **AND** it MUST continue to keep the verification screen available

#### Scenario: New session starts
- **WHEN** the user starts a new verification session
- **THEN** the system MUST count failed attempts within the new session independently

#### Scenario: Support page opens
- **WHEN** the user selects `تماس با پشتیبانی`
- **THEN** the system MUST navigate to the `/support` route
- **AND** it MUST show the internal support page with the support copy, clickable Telegram link, and a back button

#### Scenario: Support becomes visible
- **WHEN** the user has three failed XT-UID verification attempts in the same session
- **THEN** the system MUST make the support action visible in the verification UI

### Requirement: Present the support page as an internal Mini App page
The system MUST render the support page inside the Mini App shell and return the user to the home page when back navigation is used.

#### Scenario: Support page is rendered
- **WHEN** the user opens the `/support` route
- **THEN** the system MUST render the page inside the Mini App shell
- **AND** it MUST show the page title `پشتیبانی اختصاصی`
- **AND** it MUST show a back button at the bottom of the page

#### Scenario: Back navigation is used
- **WHEN** the user selects the back button on the support page
- **THEN** the system MUST navigate back to the Mini App home page

### Requirement: Gate the home-page support card by verification state
The system MUST show the home-page support card only for verified users and MUST keep it locked for all other verification states.

#### Scenario: Verified user sees the support card unlocked
- **WHEN** the home page is rendered for a verified user
- **THEN** the system MUST show the new support card in unlocked state
- **AND** it MUST place the support card as the lowest card on the home page

#### Scenario: Non-verified user sees the support card locked
- **WHEN** the home page is rendered for an unverified, pending-review, or rejected user
- **THEN** the system MUST show the support card in locked state
- **AND** it MUST preserve the same locked-card interaction model used by the discount card

