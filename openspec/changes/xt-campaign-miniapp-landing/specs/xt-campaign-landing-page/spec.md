## ADDED Requirements

### Requirement: Campaign landing page is available inside the Mini App
The system MUST provide a native Mini App route for the XT campaign landing page so Telegram users can open the campaign experience without leaving the app shell.

#### Scenario: Open landing route from the Mini App
- **WHEN** a user navigates to the campaign route inside the Mini App
- **THEN** the XT campaign landing content SHALL render within the app shell
- **AND** the user SHALL remain inside the Telegram Mini App experience

### Requirement: Campaign landing page is reachable from the home page
The system MUST expose a visible link or button on the Mini App home page that navigates to the XT campaign landing page.

#### Scenario: User opens campaign from home page
- **WHEN** a user views the Mini App home page
- **THEN** the page SHALL include a direct entry point to the XT campaign landing page
- **AND** activating that entry point SHALL navigate to the landing route inside the app shell

### Requirement: Campaign landing reuses the existing marketing content
The system MUST present the XT campaign landing experience using the existing campaign content structure and assets as the visual and informational source.

#### Scenario: Landing content is displayed
- **WHEN** the campaign route is opened
- **THEN** the page SHALL show the XT campaign content in Persian
- **AND** the landing SHALL use the imported campaign visuals and sections expected by the standalone landing

### Requirement: Campaign landing remains mobile-first and RTL
The system MUST render the campaign landing page in a mobile-first RTL layout that fits the current Mini App design language.

#### Scenario: Rendering on a phone viewport
- **WHEN** the campaign landing page is opened on a narrow viewport
- **THEN** the content SHALL remain readable, RTL-aligned, and touch-friendly
- **AND** the page SHALL fit the existing Mini App theme and spacing rules
