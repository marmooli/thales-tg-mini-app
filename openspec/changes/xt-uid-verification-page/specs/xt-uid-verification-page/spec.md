## ADDED Requirements

### Requirement: Dedicated XT-UID verification page
The system MUST provide a dedicated XT-UID verification page titled `تأیید شناسه` that is separate from the Mini App home page.

#### Scenario: Verification page opens
- **WHEN** a user navigates to the XT-UID verification route
- **THEN** the system MUST show a dedicated page titled `تأیید شناسه`
- **AND** it MUST render the XT-UID verification content on that page
- **AND** it MUST not render the verification form inline on the home page

### Requirement: Home page exposes the verification entry point
The system MUST show a visible home-page button labeled `تأیید شناسه` that opens the dedicated verification page.

#### Scenario: Home page CTA is available
- **WHEN** a user opens the Mini App home page
- **THEN** the system MUST show a button labeled `تأیید شناسه` near the top of the home content
- **AND** it MUST appear before the discount access cards
- **AND** tapping the button MUST navigate to the dedicated XT-UID verification page

### Requirement: Verification page supports returning home
The system MUST provide a back action on the dedicated XT-UID verification page that returns the user to the Mini App home page.

#### Scenario: Back action returns home
- **WHEN** a user taps the back action on the verification page
- **THEN** the system MUST navigate back to the home page
- **AND** it MUST return to the same home page state the user had before entering the verification page
- **AND** it MUST preserve the existing verification session state
