ALTER TABLE licenses ADD COLUMN expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
