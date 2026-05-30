## ADDED Requirements

### Requirement: Show a gated support card on the Mini App home page
The system MUST show a support card at the bottom of the Mini App home page for verified users and MUST keep it locked for users who are not verified.

#### Scenario: Verified user sees the support card
- **WHEN** the home page is rendered for a verified user
- **THEN** the system MUST show a support card titled `پشتیبانی اختصاصی`
- **AND** it MUST show the subtitle `هر پرسشی دارید یا هر کمکی لازم دارید با ما مطرح کنید`
- **AND** it MUST present the card as unlocked

#### Scenario: Unverified user sees the support card locked
- **WHEN** the home page is rendered for a user whose verification status is not verified
- **THEN** the system MUST show the support card in locked state
- **AND** it MUST preserve the same lock/unlock visual pattern used by the discount card

### Requirement: Open an internal support page from the support card
The system MUST navigate to an internal support page when the user activates the support card.

#### Scenario: Support card is activated
- **WHEN** the user activates the unlocked support card
- **THEN** the system MUST navigate to the `/support` route
- **AND** it MUST keep the user inside the Mini App shell

### Requirement: Present support guidance and Telegram contact on the internal support page
The system MUST show the requested Persian support guidance and a clickable Telegram link on the internal support page.

#### Scenario: Support page renders
- **WHEN** the user opens the `/support` route
- **THEN** the system MUST show the title `پشتیبانی اختصاصی`
- **AND** it MUST show the support guidance text explaining that the user can ask questions or request help
- **AND** it MUST show a clickable link to `https://t.me/Ssameti`

### Requirement: Provide back navigation from the support page
The system MUST provide a back button on the internal support page that returns the user to the Mini App home page.

#### Scenario: Back button is selected
- **WHEN** the user selects the back button on the `/support` page
- **THEN** the system MUST navigate back to the Mini App home page

