import { Redis } from "@upstash/redis"
import { TIER_LABELS, RESULT_TIERS } from "./scoring"
import { AI_CANONICAL_LEVELS } from "./constants"

function getRedis(): Redis {
  return Redis.fromEnv()
}

const PREFIX = "cortex:"

// Legacy Chinese label ↔ canonical key mapping for Redis backward compat
const TIER_LABEL_TO_KEY: Record<string, string> = {}
const TIER_KEY_TO_LABEL: Record<string, string> = {}
for (const t of RESULT_TIERS) {
  TIER_LABEL_TO_KEY[t.label] = t.tierKey
  TIER_KEY_TO_LABEL[t.tierKey] = t.label
}
const TIER_LEGACY_LABELS = Object.keys(TIER_LABEL_TO_KEY)

export interface StatsData {
  totalTests: number
  avgDegradation: number | null
  distribution: number[]
  tierCounts: Record<string, number>
  aiUsageCounts: Record<string, number>
  sumDegradation: number
  irtCount: number
  pctCount: number
  countryCounts: Record<string, number>
  avgElapsedMs: number | null
}

export async function getStats(): Promise<StatsData> {
  const redis = getRedis()

  // First, get the set of known country codes
  let countries: string[] = []
  try {
    countries = await redis.smembers(PREFIX + "countries")
  } catch {
    // ignore (set may not exist yet)
  }
  if (countries.length === 0) {
    try {
      const keys = await redis.keys(PREFIX + "country:*")
      countries = keys.map((k: string) => k.slice(PREFIX.length + "country:".length))
    } catch {
      // ignore
    }
  }

  const p = redis.pipeline()
  p.get(PREFIX + "total")
  p.get(PREFIX + "sum_degradation")
  for (let i = 0; i < 10; i++) p.get(PREFIX + `dist:${i}`)
  for (const label of TIER_LABELS) p.get(PREFIX + `tier:${label}`)
  // Also read legacy Chinese keys for backward compat
  for (const cnLabel of TIER_LEGACY_LABELS) p.get(PREFIX + `tier:${cnLabel}`)
  for (const level of AI_CANONICAL_LEVELS) p.get(PREFIX + `ai:${level}`)
  p.get(PREFIX + "irt_count")
  p.get(PREFIX + "pct_count")
  for (const code of countries) p.get(PREFIX + `country:${code}`)
  // Elapsed time
  p.get(PREFIX + "sum_elapsed")
  p.get(PREFIX + "elapsed_count")

  const results = await p.exec<(number | null)[]>()
  let idx = 0

  const total = (results[idx++] as number) ?? 0
  const sumDegradation = (results[idx++] as number) ?? 0

  const distribution: number[] = []
  for (let i = 0; i < 10; i++) distribution.push((results[idx++] as number) ?? 0)

  const tierCounts: Record<string, number> = {}
  for (const label of TIER_LABELS) tierCounts[label] = (results[idx++] as number) ?? 0
  // Merge legacy Chinese key counts into canonical keys
  for (const cnLabel of TIER_LEGACY_LABELS) {
    const key = TIER_LABEL_TO_KEY[cnLabel]
    if (key) {
      tierCounts[key] = (tierCounts[key] ?? 0) + ((results[idx++] as number) ?? 0)
    }
  }

  const aiUsageCounts: Record<string, number> = {}
  for (const level of AI_CANONICAL_LEVELS) aiUsageCounts[level] = (results[idx++] as number) ?? 0

  const irtCount = (results[idx++] as number) ?? 0
  const pctCount = (results[idx++] as number) ?? 0

  const countryCounts: Record<string, number> = {}
  for (const code of countries) {
    countryCounts[code] = (results[idx++] as number) ?? 0
  }

  // Elapsed time
  const sumElapsed = (results[idx++] as number) ?? 0
  const elapsedCount = (results[idx++] as number) ?? 0

  return {
    totalTests: total,
    avgDegradation: total ? Math.round((sumDegradation / total) * 10) / 10 : null,
    distribution,
    tierCounts,
    aiUsageCounts,
    sumDegradation,
    irtCount,
    pctCount,
    countryCounts,
    avgElapsedMs: elapsedCount ? Math.round(sumElapsed / elapsedCount) : null,
  }
}

const RATE_LIMIT_MAX = 5 // max submissions per hour per IP
const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds

export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = PREFIX + `rate:${ip}`
  const count = await getRedis().incr(key)
  if (count === 1) {
    await getRedis().expire(key, RATE_LIMIT_WINDOW)
  }
  return count <= RATE_LIMIT_MAX
}

export async function saveResult(result: {
  degradationIndex: number
  tierLabel: string
  aiUsageLevel: string | null
  estimationMethod?: "percentage" | "irt"
  country?: string | null
  elapsedMs?: number | null
}): Promise<void> {
  const bucket = Math.min(Math.floor(result.degradationIndex / 10), 9)

  const redis = getRedis()
  const p = redis.pipeline()
  p.incr(PREFIX + "total")
  p.incrby(PREFIX + "sum_degradation", result.degradationIndex)
  p.incr(PREFIX + `dist:${bucket}`)
  // Write primary key + legacy counterpart for backward compat
  p.incr(PREFIX + `tier:${result.tierLabel}`)
  const legacyLabel = TIER_KEY_TO_LABEL[result.tierLabel]
  if (legacyLabel) p.incr(PREFIX + `tier:${legacyLabel}`)
  const canonicalKey = TIER_LABEL_TO_KEY[result.tierLabel]
  if (canonicalKey) p.incr(PREFIX + `tier:${canonicalKey}`)
  if (result.aiUsageLevel) {
    p.incr(PREFIX + `ai:${result.aiUsageLevel}`)
  }
  if (result.estimationMethod === "irt") {
    p.incr(PREFIX + "irt_count")
  } else {
    p.incr(PREFIX + "pct_count")
  }
  if (result.country) {
    p.incr(PREFIX + `country:${result.country}`)
    p.sadd(PREFIX + "countries", result.country)
  }
  if (result.elapsedMs && result.elapsedMs > 0) {
    p.incrby(PREFIX + "sum_elapsed", Math.round(result.elapsedMs))
    p.incr(PREFIX + "elapsed_count")
  }
  await p.exec()
}
