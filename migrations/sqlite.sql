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
