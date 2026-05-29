## 1. Data Model and Backend Storage

- [x] 1.1 Add the `discount_email` column to the shared `users` table and create the required D1 migration
- [x] 1.2 Add backend helpers and `POST /api/xt-card-discount-process/email` to validate a verified user and persist the discount email on the same user record
- [x] 1.3 Extend the authenticated user payload so the discount process can detect and prefill an already stored `discount_email`
- [x] 1.4 Log discount email submissions and video-guide openings as database activity events

## 2. Discount Process UI

- [x] 2.1 Add the `/xt-card-discount-process` route-backed page with the requested Persian title and four-step flow
- [x] 2.2 Add the email and confirmation fields, inline validation area, and submit action in the required order
- [x] 2.3 Implement email format validation and equality checks with clear inline error states
- [x] 2.4 Block paste into the confirmation email field while keeping manual typing available
- [x] 2.5 Prefill the primary email field from the stored user record on return visits
- [x] 2.6 Show the success state and reveal the `ویدیوی راهنمای فعال کردن رایگان کارت` action after a valid submission
- [x] 2.7 Add the `/xt-card-coupon-video` placeholder route with only a title and back button

## 3. Verified-User Entry Point

- [x] 3.1 Update the verified discount action in `xt-uid-verification-flow` so it opens the new discount process route
- [x] 3.2 Keep the discount action hidden or locked for unverified users and block direct access to the process page
- [x] 3.3 Ensure the discount process loads the existing stored email state when a user returns to the page

## 4. Validation

- [x] 4.1 Add tests for discount email validation, mismatch handling, and paste blocking
- [x] 4.2 Add tests for email persistence on the user record and access-guard behavior
- [x] 4.3 Add tests for the verified discount action routing and the video-guide placeholder route
