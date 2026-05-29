## 1. Verification Flow State

- [x] 1.1 Add a session-scoped verification id that persists for the active browser session
- [x] 1.2 Extend XT-UID submission handling to send the verification session id with each attempt
- [x] 1.3 Track failed verification attempts per user per session and reveal support after the third failure

## 2. Backend Logging and Routes

- [x] 2.1 Persist verification attempts with session context in the shared D1 database
- [x] 2.2 Log helper-page and support-page navigation events as database activity events
- [x] 2.3 Add backend routes for `/xt-uid-help`, `/xt-registration-guide`, and `/support`

## 3. Mini App UX

- [x] 3.1 Update the verification heading and explanatory copy to the new Persian text
- [x] 3.2 Rebuild the verification section so the input, submit button, and inline feedback appear in the requested order
- [x] 3.3 Add helper buttons for `راهنمای پیدا کردن UID` and `راهنمای ثبت‌نام با کد طالس`
- [x] 3.4 Add the conditional `تماس با پشتیبانی` button after three failed attempts in the same session

## 4. Validation

- [x] 4.1 Add tests for session-scoped failed-attempt counting and support-button reveal
- [x] 4.2 Add tests for helper/support route rendering and back navigation on `/xt-uid-help`, `/xt-registration-guide`, and `/support`
- [x] 4.3 Add tests for verification attempt logging and helper navigation logging
