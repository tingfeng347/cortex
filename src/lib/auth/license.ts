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
}

export async function validateLicense(
  licenseKey: string,
): Promise<{ valid: boolean; license?: LicenseInfo; reason?: string }> {
  const row = await d1First<{
    license_key: string
    status: string
    device_count: number
    max_devices: number
    created_at: string
  }>("SELECT license_key, status, device_count, max_devices, created_at FROM licenses WHERE license_key = ?", [
    licenseKey,
  ])

  if (!row) {
    return { valid: false, reason: "not_found" }
  }
  if (row.status !== "active") {
    return { valid: false, reason: row.status }
  }

  return {
    valid: true,
    license: {
      licenseKey: row.license_key,
      status: row.status,
      deviceCount: row.device_count,
      maxDevices: row.max_devices,
      createdAt: row.created_at,
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
      dimension_scores, ai_usage_level, estimation_method, theta, theta_se, theta_by_type, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ],
  )
}
