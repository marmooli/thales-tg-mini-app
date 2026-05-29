ALTER TABLE uid_verification_attempts ADD COLUMN verification_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_uid_verification_attempts_session ON uid_verification_attempts(
  telegram_user_id,
  verification_session_id,
  created_at
);
