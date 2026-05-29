## 1. Integration Setup

- [x] 1.1 Add XT proxy configuration and environment variables for the proxy base URL and any optional proxy credentials
- [x] 1.2 Create a dedicated XT proxy client/service boundary for referral and user lookups
- [x] 1.3 Add response parsing and normalization for invite, user info, and KYC endpoints

## 2. Verification Flow

- [x] 2.1 Replace allowlist-primary verification with proxy-first verification logic
- [x] 2.2 Map proxy invite results to `verified` and proxy failures to `pending_review`
- [x] 2.3 Preserve a fallback path for proxy failures or ambiguous responses without auto-rejecting users
- [x] 2.4 Update audit storage to persist raw proxy payloads and normalized outcomes

## 3. Access Control and Data

- [x] 3.1 Keep backend-enforced access control unchanged while switching the verification source
- [x] 3.2 Update the verification attempt schema or persistence layer to support proxy metadata
- [x] 3.3 Ensure the allowlist remains available only as a fallback or migration bridge

## 4. Testing and Validation

- [x] 4.1 Add tests for proxy invite confirmation mapping to verified status
- [x] 4.2 Add tests for proxy failure behavior mapping to safe pending review outcomes
- [x] 4.3 Add tests for storing raw proxy audit data
- [x] 4.4 Validate the Mini App UI still behaves the same for Persian copy and access gating
