-- Community Question Marketplace: IP-based voting
-- 2026-06-22

CREATE TABLE IF NOT EXISTS question_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  vote INTEGER NOT NULL CHECK(vote IN (1, -1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(question_id, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_question_votes_question_id ON question_votes(question_id);
