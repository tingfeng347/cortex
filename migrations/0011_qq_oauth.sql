-- QQ OAuth login support
-- Stores QQ-connected user accounts and their sessions

CREATE TABLE IF NOT EXISTS qq_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid TEXT NOT NULL UNIQUE,
  unionid TEXT,
  nickname TEXT,
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qq_sessions (
  id TEXT PRIMARY KEY,
  qq_user_id INTEGER NOT NULL REFERENCES qq_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
