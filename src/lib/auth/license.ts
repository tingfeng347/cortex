import { d1First, d1Run, d1Query } from "./d1-client"

const KEY_PREFIX = "cx_"
const KEY_LENGTH = 16
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no I/O/0/1 to avoid confusion

function randomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n)
  crypto.getRandomValues(arr)
  return arr
}

export function generateLicenseKey(): string {
  const bytes = randomBytes(KEY_LENGTH)
  let key = KEY_PREFIX
  for (const b of bytes) {
    key += CHARS[b % CHARS.length]
  }
  return key
}

export interface LicenseInfo {
  licenseKey: string
  status: string
  deviceCount: number
  maxDevices: number
  createdAt: string
  expiresAt?: string
}

export async function validateLicense(
  licenseKey: string,
): Promise<{ valid: boolean; license?: LicenseInfo; reason?: string }> {
  // Development-only bypass key
  const DEV_LICENSE_KEY = "cx_DEV_DEV_DEV_DEV_DEV_DEV_DEV"
  if (process.env.NODE_ENV === "development" && licenseKey === DEV_LICENSE_KEY) {
    return {
      valid: true,
      license: {
        licenseKey: DEV_LICENSE_KEY,
        status: "active",
        deviceCount: 0,
        maxDevices: 99,
        createdAt: new Date().toISOString(),
      },
    }
  }

  const row = await d1First<{
    license_key: string
    status: string
    device_count: number
    max_devices: number
    created_at: string
    expires_at: string | null
  }>("SELECT license_key, status, device_count, max_devices, created_at, expires_at FROM licenses WHERE license_key = ?", [
    licenseKey,
  ])

  if (!row) {
    return { valid: false, reason: "not_found" }
  }
  if (row.status !== "active") {
    return { valid: false, reason: row.status }
  }

  // Check TTL expiry
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { valid: false, reason: "expired" }
  }

  return {
    valid: true,
    license: {
      licenseKey: row.license_key,
      status: row.status,
      deviceCount: row.device_count,
      maxDevices: row.max_devices,
      createdAt: row.created_at,
      expiresAt: row.expires_at ?? undefined,
    },
  }
}

export async function activateDevice(
  licenseKey: string,
  deviceId: string,
): Promise<{ success: boolean; reason?: string; deviceCount?: number; maxDevices?: number }> {
  const license = await validateLicense(licenseKey)
  if (!license.valid) {
    return { success: false, reason: license.reason }
  }

  // Check if this device is already registered
  const existing = await d1First<{ license_key: string }>(
    "SELECT license_key FROM devices WHERE license_key = ? AND device_id = ?",
    [licenseKey, deviceId],
  )
  if (existing) {
    // Already registered — update last_seen and return success
    await d1Run("UPDATE devices SET last_seen = datetime('now') WHERE license_key = ? AND device_id = ?", [
      licenseKey,
      deviceId,
    ])
    return {
      success: true,
      deviceCount: license.license!.deviceCount,
      maxDevices: license.license!.maxDevices,
    }
  }

  // Check device limit
  if (license.license!.deviceCount >= license.license!.maxDevices) {
    return {
      success: false,
      reason: "device_limit",
      deviceCount: license.license!.deviceCount,
      maxDevices: license.license!.maxDevices,
    }
  }

  // Insert device and increment counter
  await d1Run("INSERT INTO devices (license_key, device_id) VALUES (?, ?)", [licenseKey, deviceId])
  await d1Run("UPDATE licenses SET device_count = device_count + 1, redeemed_at = datetime('now') WHERE license_key = ?", [
    licenseKey,
  ])

  return {
    success: true,
    deviceCount: license.license!.deviceCount + 1,
    maxDevices: license.license!.maxDevices,
  }
}

export async function findExistingLicenseByUser(userId: string): Promise<string | null> {
  const row = await d1First<{ license_key: string }>(
    "SELECT license_key FROM licenses WHERE afdian_user_id = ? AND status = 'active' LIMIT 1",
    [userId],
  )
  return row?.license_key ?? null
}

export async function createLicenseFromOrder(
  orderId: string,
  planId: string,
  userId?: string,
): Promise<{ success: boolean; licenseKey?: string; reason?: string }> {
  // Check if order already has a license
  const existing = await d1First<{ license_key: string }>(
    "SELECT license_key FROM licenses WHERE afdian_order_id = ?",
    [orderId],
  )
  if (existing) {
    return { success: true, licenseKey: existing.license_key }
  }

  // Check if user already has an active license
  if (userId) {
    const userLicense = await findExistingLicenseByUser(userId)
    if (userLicense) {
      // User already has a license — re-use it, just record this order
      await d1Run(
        "INSERT INTO licenses (license_key, afdian_order_id, afdian_plan_id, afdian_user_id, status) VALUES (?, ?, ?, ?, 'active')",
        [userLicense, orderId, planId, userId],
      )
      return { success: true, licenseKey: userLicense }
    }
  }

  const licenseKey = generateLicenseKey()
  await d1Run(
    "INSERT INTO licenses (license_key, afdian_order_id, afdian_plan_id, afdian_user_id, status) VALUES (?, ?, ?, ?, 'active')",
    [licenseKey, orderId, planId, userId ?? null],
  )

  return { success: true, licenseKey }
}

export interface AbilityProfileRow {
  overall_theta: number;
  overall_se: number;
  logic_theta: number | null;
  logic_se: number | null;
  math_theta: number | null;
  math_se: number | null;
  vocab_theta: number | null;
  vocab_se: number | null;
  event_theta: number | null;
  event_se: number | null;
  questions_answered: number;
  updated_at: string;
}

export async function getAbilityProfile(licenseKey: string): Promise<AbilityProfileRow | null> {
  return d1First<AbilityProfileRow>(
    "SELECT * FROM ability_profiles WHERE license_key = ?",
    [licenseKey],
  );
}

export async function saveAbilityProfile(
  licenseKey: string,
  profile: {
    overallTheta: number;
    overallSe: number;
    logicTheta: number | null;
    logicSe: number | null;
    mathTheta: number | null;
    mathSe: number | null;
    vocabTheta: number | null;
    vocabSe: number | null;
    eventTheta: number | null;
    eventSe: number | null;
    questionsAnswered: number;
  },
): Promise<void> {
  await d1Run(
    `INSERT INTO ability_profiles
     (license_key, overall_theta, overall_se,
      logic_theta, logic_se, math_theta, math_se,
      vocab_theta, vocab_se, event_theta, event_se,
      questions_answered, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(license_key) DO UPDATE SET
      overall_theta = excluded.overall_theta,
      overall_se = excluded.overall_se,
      logic_theta = excluded.logic_theta,
      logic_se = excluded.logic_se,
      math_theta = excluded.math_theta,
      math_se = excluded.math_se,
      vocab_theta = excluded.vocab_theta,
      vocab_se = excluded.vocab_se,
      event_theta = excluded.event_theta,
      event_se = excluded.event_se,
      questions_answered = excluded.questions_answered,
      updated_at = datetime('now')`,
    [
      licenseKey,
      profile.overallTheta,
      profile.overallSe,
      profile.logicTheta,
      profile.logicSe,
      profile.mathTheta,
      profile.mathSe,
      profile.vocabTheta,
      profile.vocabSe,
      profile.eventTheta,
      profile.eventSe,
      profile.questionsAnswered,
    ],
  );
}

/** Count active (non-expired, non-dev) licenses for premium user statistics */
export async function countActiveLicenses(): Promise<number> {
  const row = await d1First<{ count: number }>(
    `SELECT COUNT(*) AS count FROM licenses
     WHERE status = 'active'
     AND license_key != 'cx_DEV_DEV_DEV_DEV_DEV_DEV_DEV'
     AND (expires_at IS NULL OR expires_at > datetime('now'))`,
  )
  return row?.count ?? 0
}

export async function getLicenseResults(licenseKey: string) {
  return d1Query<{
    id: number
    degradation_index: number
    tier_key: string
    correct_count: number
    total_questions: number
    dimension_scores: string
    ai_usage_level: string
    estimation_method: string
    theta: number | null
    theta_se: number | null
    theta_by_type: string | null
    elapsed_ms: number
    created_at: string
  }>("SELECT * FROM test_results WHERE license_key = ? ORDER BY created_at DESC", [licenseKey])
}

export async function saveTestResult(
  licenseKey: string,
  result: {
    degradationIndex: number
    tierKey: string
    correctCount: number
    totalQuestions: number
    dimensionScores: string // JSON string
    aiUsageLevel: string | null
    estimationMethod: string
    theta: number | null
    thetaSE: number | null
    thetaByType: string | null // JSON string
    elapsedMs: number
    flaggedIds?: string | null // JSON string array
  },
) {
  // Dedup: skip if an identical result was saved within the last 10 seconds
  const dup = await d1First<{ id: number }>(
    `SELECT id FROM test_results
     WHERE license_key = ? AND degradation_index = ? AND correct_count = ? AND total_questions = ?
     AND created_at > datetime('now', '-10 seconds')
     LIMIT 1`,
    [licenseKey, result.degradationIndex, result.correctCount, result.totalQuestions],
  )
  if (dup) return // duplicate, skip

  await d1Run(
    `INSERT INTO test_results
     (license_key, degradation_index, tier_key, correct_count, total_questions,
      dimension_scores, ai_usage_level, estimation_method, theta, theta_se, theta_by_type, elapsed_ms, flagged_ids)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      licenseKey,
      result.degradationIndex,
      result.tierKey,
      result.correctCount,
      result.totalQuestions,
      result.dimensionScores,
      result.aiUsageLevel,
      result.estimationMethod,
      result.theta,
      result.thetaSE,
      result.thetaByType,
      result.elapsedMs,
      result.flaggedIds ?? null,
    ],
  )
}
