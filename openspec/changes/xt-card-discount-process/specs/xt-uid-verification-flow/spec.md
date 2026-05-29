## ADDED Requirements

### Requirement: Route the verified discount action into the guided discount process
The system MUST route the verified user's discount action to the guided discount process page instead of a static benefit screen.

#### Scenario: Verified discount action opens the process page
- **WHEN** a verified user selects `دریافت تخفیف ۳۸ دلاری کارت XT`
- **THEN** the system MUST navigate to `/xt-card-discount-process`
- **AND** it MUST show the guided discount process page

#### Scenario: Unverified users do not get the unlocked action
- **WHEN** the user is not verified
- **THEN** the system MUST keep the discount action locked or hidden
- **AND** it MUST not route the user into the discount process
