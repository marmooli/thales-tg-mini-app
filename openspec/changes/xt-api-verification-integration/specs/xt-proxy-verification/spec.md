## ADDED Requirements

### Requirement: Verify XT UIDs through the signed proxy
The system MUST verify submitted XT UIDs using the signed XT API proxy as the primary verification source.

#### Scenario: Proxy confirms invite
- **WHEN** the proxy indicates that the submitted UID is invited
- **THEN** the system MUST mark the UID as verified
- **AND** it MUST allow access to verified referral features

#### Scenario: Proxy does not confirm invite
- **WHEN** the proxy does not confirm that the submitted UID is invited
- **THEN** the system MUST NOT auto-verify the user
- **AND** it MUST keep the access state at `pending_review` unless another explicit disqualifying rule applies

### Requirement: Store proxy response metadata
The system MUST store proxy response metadata for each XT verification attempt.

#### Scenario: Proxy call succeeds
- **WHEN** the system receives a response from the proxy
- **THEN** it MUST store the normalized verification result
- **AND** it MUST store the raw proxy response or a sufficient audit payload

#### Scenario: Proxy call fails
- **WHEN** the proxy request fails or times out
- **THEN** the system MUST store the failure context for auditability
- **AND** it MUST treat the verification outcome as `pending_review`
- **AND** it MUST return a safe non-sensitive user-facing status

### Requirement: Use supporting proxy signals without changing the public flow
The system MUST use supporting proxy signals such as user info or KYC status without changing the existing Mini App UX.

#### Scenario: Support data available
- **WHEN** the proxy returns additional user or KYC data
- **THEN** the system MUST store it or make it available for internal use
- **AND** it MUST NOT require the user to change the current Mini App flow
