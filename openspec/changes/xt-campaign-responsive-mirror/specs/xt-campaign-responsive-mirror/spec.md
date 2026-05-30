## ADDED Requirements

### Requirement: Responsive XT campaign landing page
The system MUST render the XT campaign landing page at `/xt-campaign` as a responsive mobile-first mirror of the original landing experience.

#### Scenario: Campaign landing renders with original hierarchy
- **WHEN** a user opens the XT campaign route inside the Mini App
- **THEN** the system MUST render the campaign landing content in a responsive layout
- **AND** it MUST preserve the original landing's section hierarchy and call-to-action flow
- **AND** it MUST keep the content inside the Mini App shell
- **AND** it MUST render the landing with the same visible section order as the original experience

#### Scenario: Campaign landing adapts to narrow screens
- **WHEN** the page is viewed on a narrow mobile viewport
- **THEN** the system MUST stack the landing sections vertically
- **AND** it MUST keep the content readable without horizontal overflow
- **AND** it MUST preserve the visual relationship between hero, feature, and call-to-action sections
- **AND** it MUST maintain a polished mobile presentation rather than a compressed card layout

### Requirement: Campaign landing reuses the campaign content and assets
The system MUST reuse the existing XT campaign content, assets, and CTA labels when rendering the responsive mirror page.

#### Scenario: Campaign assets are displayed
- **WHEN** the campaign landing page renders
- **THEN** the system MUST show the campaign images and campaign-specific call-to-action content already used by the XT campaign experience
- **AND** it MUST not replace the landing with unrelated placeholder content
- **AND** it MUST preserve the hero, feature cards, campaign callout, and CTA/footer sections

### Requirement: Campaign landing remains navigable from the Mini App
The system MUST allow the user to open the XT campaign landing page from the Mini App and return to the home page.

#### Scenario: Home page opens campaign landing
- **WHEN** the user taps the campaign entry point from the home page
- **THEN** the system MUST navigate to the XT campaign landing page

#### Scenario: Back action returns home
- **WHEN** the user taps the back action on the campaign landing page
- **THEN** the system MUST return the user to the Mini App home page
