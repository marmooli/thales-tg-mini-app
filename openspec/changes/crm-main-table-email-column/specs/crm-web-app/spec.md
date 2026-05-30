## MODIFIED Requirements

### Requirement: Display a browsable Mini App user table
The system MUST present a user table with search, filtering, sorting, and pagination.

#### Scenario: Table view loads
- **WHEN** an authorized user opens the CRM user list
- **THEN** the system MUST show user rows with key Mini App fields
- **AND** it MUST support search, filters, sorting, and pagination
- **AND** it MUST show the stored Mini App email in a visible email column for users who have submitted one
- **AND** it MUST render the email cell blank for users who have not submitted an email
- **AND** it MUST support filtering by telegram user id, username, XT UID, and verification status
- **AND** it MUST export the currently filtered result set when CSV export is requested

### Requirement: Support CSV export from the user table
The system MUST allow authorized CRM users to export the visible user table columns as CSV.

#### Scenario: Export requested
- **WHEN** an authorized user requests CSV export
- **THEN** the system MUST return a CSV file containing the table columns
- **AND** the CSV MUST include the stored email column alongside the existing visible table columns
- **AND** the CSV MUST include the current filter context
