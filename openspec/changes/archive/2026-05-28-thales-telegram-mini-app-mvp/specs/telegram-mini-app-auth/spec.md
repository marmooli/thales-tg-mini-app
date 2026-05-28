## ADDED Requirements

### Requirement: Validate Telegram session on the backend
The system MUST validate Telegram `initData` server-side using the bot token before trusting any Telegram identity data.

#### Scenario: Valid Telegram session
- **WHEN** the client submits a non-empty `initData` value
- **AND** the backend verifies the signature and freshness successfully
- **THEN** the system MUST accept the session as authenticated
- **AND** derive the Telegram user identity from the validated payload

#### Scenario: Invalid Telegram session
- **WHEN** the client submits missing, expired, or invalid `initData`
- **THEN** the system MUST reject the session
- **AND** it MUST NOT create or update a user record

### Requirement: Create or update Telegram user records
The system MUST create or update a user record after successful Telegram session validation.

#### Scenario: New Telegram user
- **WHEN** a valid Telegram session is received for a user not yet stored
- **THEN** the system MUST create a new user record with the Telegram user ID and available profile fields

#### Scenario: Existing Telegram user
- **WHEN** a valid Telegram session is received for an existing user
- **THEN** the system MUST update the stored Telegram profile fields and refresh the updated timestamp

### Requirement: Return current user access state
The system MUST return the user's current verification status and access level after Telegram authentication.

#### Scenario: Authenticated user profile lookup
- **WHEN** the client calls the Telegram auth endpoint with valid `initData`
- **THEN** the system MUST return the user profile
- **AND** it MUST include the current verification status and access level

### Requirement: Present Persian user-facing content
The system MUST present all user-facing Telegram Mini App content in Persian.

#### Scenario: Welcome and status screens
- **WHEN** a user opens the Mini App
- **THEN** the system MUST show Persian labels, instructions, and status messages

#### Scenario: Authentication and error messages
- **WHEN** the system returns an authentication response or validation error
- **THEN** the user-facing message MUST be Persian
