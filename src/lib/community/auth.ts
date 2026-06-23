import { cookies } from "next/headers"
import { getAdminById, getSession as getDbSession } from "./d1"

const SESSION_COOKIE = "admin_session"
const PEPPER = "cortex-admin-v1"

/**
 * Verify the password against the stored SHA-256 hash.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const hash = await sha256(password + PEPPER)
  return hash === stored
}

/**
 * Hash a password for storage. Returns hex-encoded SHA-256.
 */
export async function hashPassword(password: string): Promise<string> {
  return sha256(password + PEPPER)
}

function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  return crypto.subtle.digest("SHA-256", data).then((hash) => {
    return bytesToHex(new Uint8Array(hash))
  })
}

/**
 * Generate a UUID v4 session ID.
 */
export function generateSessionId(): string {
  return crypto.randomUUID()
}

/**
 * Get the current admin from the session cookie.
 * Returns { id, username, role } or null if not authenticated.
 */
export async function getCurrentAdmin(): Promise<{ id: number; username: string; role: string; nickname: string | null } | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value
    if (!sessionId) return null

    const session = await getDbSession(sessionId)
    if (!session) return null

    const admin = await getAdminById(session.admin_id)
    if (!admin) return null

    return { id: admin.id, username: admin.username, role: admin.role, nickname: admin.nickname }
  } catch {
    return null
  }
}

// --- Hex helpers ---

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
}
