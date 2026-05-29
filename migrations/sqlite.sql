CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_user_id TEXT NOT NULL UNIQUE,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  xt_uid TEXT,
  verification_status TEXT NOT NULL DEFAULT 'not_verified',
  access_level TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  verified_at TEXT
);

CREATE TABLE IF NOT EXISTS uid_verification_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_user_id TEXT NOT NULL,
  xt_uid TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT NOT NULL,
  raw_result TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS allowed_xt_uids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  xt_uid TEXT NOT NULL UNIQUE,
  source TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS crm_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS crm_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE,
  crm_user_id INTEGER NOT NULL,
  role_snapshot TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (crm_user_id) REFERENCES crm_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crm_activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  telegram_user_id TEXT,
  crm_user_id INTEGER,
  xt_uid TEXT,
  actor_role TEXT,
  title TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (crm_user_id) REFERENCES crm_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_sessions_session_id ON crm_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_crm_sessions_expires_at ON crm_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_crm_activity_events_telegram_user_id ON crm_activity_events(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_events_event_type ON crm_activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_crm_activity_events_created_at ON crm_activity_events(created_at);
