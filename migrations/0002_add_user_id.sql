ALTER TABLE licenses ADD COLUMN afdian_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_user ON licenses(afdian_user_id, status);
