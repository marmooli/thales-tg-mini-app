# crm-web-app Specification

## Purpose
Provide an internal, role-gated CRM web app for browsing, reviewing, exporting, and inspecting Mini App user data and activity history.
## Requirements
### Requirement: Provide an internal CRM web app
The system MUST provide a separate internal CRM web app for reviewing Mini App user data.

#### Scenario: CRM app opens
- **WHEN** an internal user opens the CRM web app
- **THEN** the system MUST present a CRM interface separate from the customer Mini App
- **AND** it MUST load data from the Mini App database source of truth
- **AND** it MUST keep the CRM in the same repository or deployment family as the Mini App for Cloudflare-first operations

### Requirement: Enforce role-based internal access
The system MUST restrict CRM access using internal role-based authentication.

#### Scenario: Authorized role
- **WHEN** a logged-in internal user has an allowed CRM role
- **THEN** the system MUST allow access to the CRM features permitted by that role

#### Scenario: Unauthorized role
- **WHEN** a user without an allowed role tries to access the CRM
- **THEN** the system MUST deny access
- **AND** it MUST show a simple unauthorized state

### Requirement: Display a browsable Mini App user table
The system MUST present a user table with search, filtering, sorting, and pagination.

#### Scenario: Table view loads
- **WHEN** an authorized user opens the CRM user list
- **THEN** the system MUST show user rows with key Mini App fields
- **AND** it MUST support search, filters, sorting, and pagination
- **AND** it MUST support filtering by telegram user id, username, XT UID, and verification status
- **AND** it MUST export the currently filtered result set when CSV export is requested

### Requirement: Show user detail and activity timeline
The system MUST provide a detail view for each user with profile data and a timestamped activity timeline.

#### Scenario: User detail opens
- **WHEN** an authorized user selects a user row
- **THEN** the system MUST show detailed user information
- **AND** it MUST show Mini App activity events in reverse chronological order
- **AND** it MUST show timestamps down to date and time

### Requirement: Use internal username/password login
The system MUST authenticate CRM users with an internal username/password login.

#### Scenario: Login succeeds
- **WHEN** a user enters valid CRM credentials
- **THEN** the system MUST create a signed CRM session

#### Scenario: Login fails
- **WHEN** a user enters invalid CRM credentials
- **THEN** the system MUST deny access
- **AND** it MUST keep the CRM session unauthenticated

### Requirement: Support CSV export from the user table
The system MUST allow authorized CRM users to export the visible user table columns as CSV.

#### Scenario: Export requested
- **WHEN** an authorized user requests CSV export
- **THEN** the system MUST return a CSV file containing the table columns
- **AND** the CSV MUST include the same visible table columns and current filter context

### Requirement: Keep CRM read-only in the MVP
The system MUST keep the CRM read-only in the MVP while preserving a design path for future edits.

#### Scenario: Edit attempt
- **WHEN** a CRM user attempts to change a Mini App user record
- **THEN** the system MUST reject the change in MVP
- **AND** it MUST present the CRM as read-only
- **AND** it MUST allow the architecture to add edit actions later without changing the source of truth

### Requirement: Define a limited operational activity taxonomy
The system MUST store operational Mini App events using a bounded event taxonomy for CRM timelines.

#### Scenario: Operational event is recorded
- **WHEN** the Mini App emits an operational event
- **THEN** the system MUST store it using a known CRM activity event type
- **AND** it MUST keep the event timeline usable for support and review

### Requirement: Present CRM content in Persian
The system MUST present CRM user-facing labels, messages, and controls in Persian.

#### Scenario: CRM interface renders
- **WHEN** an authorized user views the CRM
- **THEN** the interface copy MUST be Persian
