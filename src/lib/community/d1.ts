import { getDB, d1Query, d1First, d1Run } from "@/lib/auth/d1-client"

export interface CommunityQuestionRow {
  id: number
  type: string
  question: string
  options: string  // JSON array
  correct_answer: number
  explanation: string
  submitter_email: string
  submitter_name: string
  status: "pending" | "approved" | "rejected"
  admin_notes: string
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string
}

export interface AdminRow {
  id: number
  username: string
  password_hash: string
  role: "super_admin" | "reviewer"
  created_at: string
}

export interface SessionRow {
  id: string
  admin_id: number
  created_at: string
}

export interface VoteRow {
  id: number
  question_id: number
  ip_address: string
  vote: number
  created_at: string
  updated_at: string
}

export interface QuestionWithVotes extends CommunityQuestionRow {
  upvotes: number
  downvotes: number
  reviewer_name: string | null
}

export function extractClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

// --- Community Questions ---

export async function submitQuestion(data: {
  type: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  submitterEmail: string
  submitterName: string
}): Promise<void> {
  await d1Run(
    `INSERT INTO community_questions (type, question, options, correct_answer, explanation, submitter_email, submitter_name)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.type, data.question, JSON.stringify(data.options), data.correctAnswer, data.explanation, data.submitterEmail, data.submitterName]
  )
}

export async function getApprovedQuestions(): Promise<CommunityQuestionRow[]> {
  return d1Query<CommunityQuestionRow>(
    "SELECT * FROM community_questions WHERE status = 'approved' ORDER BY id DESC"
  )
}

export async function getQuestionsByStatus(status: string): Promise<CommunityQuestionRow[]> {
  return d1Query<CommunityQuestionRow>(
    "SELECT * FROM community_questions WHERE status = ? ORDER BY created_at DESC",
    [status]
  )
}

export async function getAllQuestionsWithStatus(): Promise<CommunityQuestionRow[]> {
  return d1Query<CommunityQuestionRow>(
    "SELECT * FROM community_questions ORDER BY created_at DESC"
  )
}

export async function getQuestionById(id: number): Promise<CommunityQuestionRow | null> {
  return d1First<CommunityQuestionRow>(
    "SELECT * FROM community_questions WHERE id = ?",
    [id]
  )
}

export async function reviewQuestion(
  id: number,
  status: "approved" | "rejected",
  adminId: number,
  adminNotes: string
): Promise<void> {
  await d1Run(
    `UPDATE community_questions SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'), admin_notes = ? WHERE id = ?`,
    [status, adminId, adminNotes, id]
  )
}

export async function getPendingCount(): Promise<number> {
  const rows = await d1Query<{ count: number }>(
    "SELECT COUNT(*) as count FROM community_questions WHERE status = 'pending'"
  )
  return rows[0]?.count ?? 0
}

export async function getApprovedCount(): Promise<number> {
  const rows = await d1Query<{ count: number }>(
    "SELECT COUNT(*) as count FROM community_questions WHERE status = 'approved'"
  )
  return rows[0]?.count ?? 0
}

export async function getRejectedCount(): Promise<number> {
  const rows = await d1Query<{ count: number }>(
    "SELECT COUNT(*) as count FROM community_questions WHERE status = 'rejected'"
  )
  return rows[0]?.count ?? 0
}

export async function getQuestionsWithVotes(): Promise<QuestionWithVotes[]> {
  return d1Query<QuestionWithVotes>(
    `SELECT
      q.*,
      COALESCE(SUM(CASE WHEN v.vote = 1 THEN 1 ELSE 0 END), 0) as upvotes,
      COALESCE(SUM(CASE WHEN v.vote = -1 THEN 1 ELSE 0 END), 0) as downvotes,
      a.username as reviewer_name
    FROM community_questions q
    LEFT JOIN question_votes v ON v.question_id = q.id
    LEFT JOIN admins a ON a.id = q.reviewed_by
    GROUP BY q.id
    ORDER BY q.created_at DESC`
  )
}

export async function getUserVote(questionId: number, ipAddress: string): Promise<VoteRow | null> {
  return d1First<VoteRow>(
    "SELECT * FROM question_votes WHERE question_id = ? AND ip_address = ?",
    [questionId, ipAddress]
  )
}

export async function upsertVote(
  questionId: number,
  ipAddress: string,
  vote: 1 | -1
): Promise<{ action: "inserted" | "updated" | "deleted" }> {
  const existing = await getUserVote(questionId, ipAddress)
  if (!existing) {
    await d1Run(
      "INSERT INTO question_votes (question_id, ip_address, vote) VALUES (?, ?, ?)",
      [questionId, ipAddress, vote]
    )
    return { action: "inserted" }
  }
  if (existing.vote === vote) {
    // Same vote → toggle off (delete)
    await d1Run("DELETE FROM question_votes WHERE id = ?", [existing.id])
    return { action: "deleted" }
  }
  // Different vote → update
  await d1Run(
    "UPDATE question_votes SET vote = ?, updated_at = datetime('now') WHERE id = ?",
    [vote, existing.id]
  )
  return { action: "updated" }
}

export async function deleteQuestion(id: number): Promise<void> {
  await d1Run("DELETE FROM community_questions WHERE id = ?", [id])
}

export async function updateQuestion(
  id: number,
  data: {
    type?: string
    question?: string
    options?: string[]
    correct_answer?: number
    explanation?: string
  }
): Promise<void> {
  const sets: string[] = []
  const vals: (string | number)[] = []
  if (data.type) {
    sets.push("type = ?")
    vals.push(data.type)
  }
  if (data.question) {
    sets.push("question = ?")
    vals.push(data.question)
  }
  if (data.options) {
    sets.push("options = ?")
    vals.push(JSON.stringify(data.options))
  }
  if (data.correct_answer !== undefined) {
    sets.push("correct_answer = ?")
    vals.push(data.correct_answer)
  }
  if (data.explanation !== undefined) {
    sets.push("explanation = ?")
    vals.push(data.explanation)
  }
  if (sets.length === 0) return
  vals.push(id)
  await d1Run(`UPDATE community_questions SET ${sets.join(", ")} WHERE id = ?`, vals)
}

// --- Admins ---

export async function getAdminByUsername(username: string): Promise<AdminRow | null> {
  return d1First<AdminRow>("SELECT * FROM admins WHERE username = ?", [username])
}

export async function getAdminById(id: number): Promise<AdminRow | null> {
  return d1First<AdminRow>("SELECT * FROM admins WHERE id = ?", [id])
}

export async function getAllAdmins(): Promise<AdminRow[]> {
  return d1Query<AdminRow>("SELECT id, username, role, created_at FROM admins ORDER BY id")
}

export async function createAdmin(username: string, passwordHash: string, role: string): Promise<void> {
  await d1Run(
    "INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)",
    [username, passwordHash, role]
  )
}

export async function deleteAdmin(id: number): Promise<void> {
  await d1Run("DELETE FROM admins WHERE id = ?", [id])
  await d1Run("DELETE FROM admin_sessions WHERE admin_id = ?", [id])
}

export async function updateAdmin(id: number, data: { passwordHash?: string; role?: string }): Promise<void> {
  const sets: string[] = []
  const vals: (string | number)[] = []
  if (data.passwordHash) {
    sets.push("password_hash = ?")
    vals.push(data.passwordHash)
  }
  if (data.role) {
    sets.push("role = ?")
    vals.push(data.role)
  }
  if (sets.length === 0) return
  vals.push(id)
  await d1Run(`UPDATE admins SET ${sets.join(", ")} WHERE id = ?`, vals)
}

export async function getAdminPasswordHash(id: number): Promise<string | null> {
  const row = await d1First<{ password_hash: string }>(
    "SELECT password_hash FROM admins WHERE id = ?",
    [id]
  )
  return row?.password_hash ?? null
}

// --- Sessions ---

export async function createSession(sessionId: string, adminId: number): Promise<void> {
  await d1Run(
    "INSERT INTO admin_sessions (id, admin_id) VALUES (?, ?)",
    [sessionId, adminId]
  )
}

export async function getSession(sessionId: string): Promise<SessionRow | null> {
  return d1First<SessionRow>("SELECT * FROM admin_sessions WHERE id = ?", [sessionId])
}

export async function deleteSession(sessionId: string): Promise<void> {
  await d1Run("DELETE FROM admin_sessions WHERE id = ?", [sessionId])
}
