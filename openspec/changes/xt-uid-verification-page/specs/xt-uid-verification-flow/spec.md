## MODIFIED Requirements

### Requirement: Present a guided XT-UID verification screen
The system MUST present a guided XT-UID verification page with a clear heading, explanation, input field, inline error area, submit action, and back action in that order.

#### Scenario: Verification screen renders
- **WHEN** an unverified user opens the XT-UID verification page
- **THEN** the system MUST show the heading `تأیید شناسه`
- **AND** it MUST show the explanation `دسترسی به خدمات اختصاصی طالس فقط برای کاربرانی فراهم است که با کد طالس در صرافی XT حساب داشته باشند. لطفاً برای آزاد شدن دسترسی شناسۀ XT-UID خود را وارد کنید.`
- **AND** it MUST show the verification explanation before the XT-UID input field
- **AND** it MUST show the XT-UID input field immediately before the submit action
- **AND** it MUST reserve a visible inline area directly under the input field for validation and submit feedback
- **AND** it MUST show a back action that returns the user to the Mini App home page

### Requirement: Log verification interactions in the database
The system MUST log XT-UID verification attempts and helper/support navigation events in the database, including entry into the dedicated verification page.

#### Scenario: Verification page is opened
- **WHEN** the user opens the dedicated XT-UID verification page from the home page
- **THEN** the system MUST store the navigation event in the shared database

#### Scenario: Verification attempt is submitted
- **WHEN** the user submits an XT-UID for verification
- **THEN** the system MUST store the attempt in the shared database
- **AND** it MUST include enough session context to count attempts within the same verification session
- **AND** it MUST keep the failed-attempt count scoped to that verification session

#### Scenario: Helper navigation is opened
- **WHEN** the user opens a helper or support page
- **THEN** the system MUST store the interaction as a database event
