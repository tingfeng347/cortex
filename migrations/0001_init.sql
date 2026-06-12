-- Phase 1: Monetization schema
-- Run: wrangler d1 execute CORTEX_DB --file=migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT UNIQUE NOT NULL,
  afdian_order_id TEXT UNIQUE,
  afdian_plan_id TEXT,
  status TEXT DEFAULT 'active',
  device_count INTEGER DEFAULT 0,
  max_devices INTEGER DEFAULT 3,
  created_at TEXT DEFAULT (datetime('now')),
  redeemed_at TEXT
);

CREATE TABLE IF NOT EXISTS devices (
  license_key TEXT NOT NULL,
  device_id TEXT NOT NULL,
  activated_at TEXT DEFAULT (datetime('now')),
  last_seen TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (license_key, device_id)
);

CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT NOT NULL,
  degradation_index INTEGER NOT NULL,
  tier_key TEXT NOT NULL,
  correct_count INTEGER,
  total_questions INTEGER,
  dimension_scores TEXT,
  ai_usage_level TEXT,
  estimation_method TEXT,
  theta REAL,
  theta_se REAL,
  theta_by_type TEXT,
  elapsed_ms INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_test_results_license ON test_results(license_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_licenses_order ON licenses(afdian_order_id);
