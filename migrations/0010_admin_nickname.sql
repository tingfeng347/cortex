-- Add optional nickname column to admins table
-- Nickname is used as display name in review info; falls back to username if null
ALTER TABLE admins ADD COLUMN nickname TEXT UNIQUE;
