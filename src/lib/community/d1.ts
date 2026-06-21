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
