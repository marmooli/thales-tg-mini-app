## MODIFIED Requirements

### Requirement: Accept XT UID submissions
The system MUST accept an XT UID submitted by an authenticated Telegram user.

#### Scenario: Valid UID submission
- **WHEN** an authenticated user submits a non-empty XT UID
- **THEN** the system MUST normalize and validate the UID
- **AND** it MUST store the submission attempt

#### Scenario: Missing UID submission
- **WHEN** the user submits an empty XT UID
- **THEN** the system MUST reject the submission
- **AND** it MUST return a simple user-facing error

### Requirement: Verify XT UID through a replaceable service boundary
The system MUST verify submitted XT UIDs through a service abstraction that can use the XT proxy now and a different source later.

#### Scenario: Proxy confirms invite
- **WHEN** the XT proxy confirms that the submitted UID is invited
- **THEN** the system MUST mark the user as `verified`
- **AND** it MUST set the access level to `verified_referral`
- **AND** it MUST record the verification source as `xt_api_proxy`

#### Scenario: Proxy does not confirm invite
- **WHEN** the XT proxy does not confirm the submitted UID as invited
- **THEN** the system MUST mark the user as `pending_review`
- **AND** it MUST keep the discount feature locked

#### Scenario: Proxy failure
- **WHEN** the XT proxy request fails or returns an unexpected response
- **THEN** the system MUST not auto-reject the user
- **AND** it MUST store the failure context for later review
- **AND** it MUST keep the access status at `pending_review`

### Requirement: Store verification attempts
The system MUST store every XT UID verification attempt for auditability.

#### Scenario: Verification attempt recorded
- **WHEN** a user submits an XT UID
- **THEN** the system MUST store the Telegram user ID, XT UID, status, source, and raw result data if available

### Requirement: Enforce gated access server-side
The system MUST return the `XT Card $48 Discount` content only when the verified status is present on the backend.

#### Scenario: Verified user access
- **WHEN** a verified user requests the discount content
- **THEN** the system MUST allow access to the gated content

#### Scenario: Unverified user access
- **WHEN** a non-verified user requests the discount content directly
- **THEN** the system MUST deny access
- **AND** it MUST return a locked-state response instead of the placeholder benefit content

### Requirement: Present Persian verification and access content
The system MUST present all XT verification and discount-related user-facing content in Persian.

#### Scenario: Verification flow
- **WHEN** the user views the verification form, progress, or result states
- **THEN** the instructions and messages MUST be Persian

#### Scenario: Discount page
- **WHEN** the user opens the `XT Card $48 Discount` page
- **THEN** the placeholder content and call-to-action MUST be Persian
