import { Redis } from "@upstash/redis"
import { TIER_KEYS, RESULT_TIERS } from "./scoring"
import { AI_CANONICAL_LEVELS } from "./constants"

let redis: Redis | null = null
type RedisScript<TResult> = {
  exec(keys: string[], args: string[]): Promise<TResult>
}
let statsScripts: {
  read: RedisScript<[unknown, number[], unknown]>
  write: RedisScript<number>
} | null = null

let rateLimitedSaveScript: RedisScript<number> | null = null

function getRedis(): Redis {
  redis ??= Redis.fromEnv()
  return redis
}

function getStatsScripts() {
  const redis = getRedis()
  statsScripts ??= {
    read: redis.createScript<[unknown, number[], unknown], true>(READ_STATS_SCRIPT, {
      readonly: true,
    }),
    write: redis.createScript<number>(WRITE_STATS_SCRIPT),
  }
  return statsScripts
}

function getRateLimitedSaveScript() {
  rateLimitedSaveScript ??= getRedis().createScript<number>(
    RATE_LIMITED_SAVE_SCRIPT,
  )
  return rateLimitedSaveScript
}

const PREFIX = "cortex:"
const STATS_HASH_KEY = PREFIX + "stats"
const COUNTRIES_SET_KEY = PREFIX + "countries"

// Legacy Chinese label -> canonical key mapping for Redis backward compat.
const TIER_LABEL_TO_KEY: Record<string, string> = {}
for (const t of RESULT_TIERS) {
  TIER_LABEL_TO_KEY[t.label] = t.tierKey
}
const TIER_LEGACY_LABELS = Object.keys(TIER_LABEL_TO_KEY)

const LEGACY_KEYS = [
  PREFIX + "total",
  PREFIX + "sum_degradation",
  ...Array.from({ length: 10 }, (_, i) => PREFIX + `dist:${i}`),
  ...TIER_KEYS.map((key) => PREFIX + `tier:${key}`),
  ...TIER_LEGACY_LABELS.map((label) => PREFIX + `tier:${label}`),
  ...AI_CANONICAL_LEVELS.map((level) => PREFIX + `ai:${level}`),
  PREFIX + "irt_count",
  PREFIX + "pct_count",
  PREFIX + "sum_elapsed",
  PREFIX + "elapsed_count",
]

const READ_STATS_SCRIPT = `
local hash_pairs = redis.call("HGETALL", KEYS[1])
local legacy_values = {}
for i = 3, #KEYS do
  legacy_values[#legacy_values + 1] = tonumber(redis.call("GET", KEYS[i]) or "0") or 0
end

local legacy_country_pairs = {}
local countries = redis.call("SMEMBERS", KEYS[2])
for _, code in ipairs(countries) do
  legacy_country_pairs[#legacy_country_pairs + 1] = code
  legacy_country_pairs[#legacy_country_pairs + 1] = tonumber(redis.call("GET", ARGV[1] .. "country:" .. code) or "0") or 0
end

return { hash_pairs, legacy_values, legacy_country_pairs }
`

const WRITE_STATS_SCRIPT = `
local key = KEYS[1]
local degradation = tonumber(ARGV[1])
local bucket = ARGV[2]
local tier = ARGV[3]
local ai = ARGV[4]
local method = ARGV[5]
local country = ARGV[6]
local elapsed = tonumber(ARGV[7])

redis.call("HINCRBY", key, "total", 1)
redis.call("HINCRBY", key, "sum_degradation", degradation)
redis.call("HINCRBY", key, "dist:" .. bucket, 1)
redis.call("HINCRBY", key, "tier:" .. tier, 1)
if ai ~= "" then
  redis.call("HINCRBY", key, "ai:" .. ai, 1)
end
redis.call("HINCRBY", key, "method:" .. method, 1)
if country ~= "" then
  redis.call("HINCRBY", key, "country:" .. country, 1)
end
if elapsed > 0 then
  redis.call("HINCRBY", key, "sum_elapsed", elapsed)
  redis.call("HINCRBY", key, "elapsed_count", 1)
end

return 1
`

const RATE_LIMITED_SAVE_SCRIPT = `
local stats_key = KEYS[1]
local rate_key = KEYS[2]

local rate_max = tonumber(ARGV[8])
local rate_ttl = tonumber(ARGV[9])

-- Check rate limit
local count = redis.call("INCR", rate_key)
if count == 1 then
  redis.call("EXPIRE", rate_key, rate_ttl)
end
if count > rate_max then
  return 0
end

-- Save stats
local degradation = tonumber(ARGV[1])
local bucket = ARGV[2]
local tier = ARGV[3]
local ai = ARGV[4]
local method = ARGV[5]
local country = ARGV[6]
local elapsed = tonumber(ARGV[7])

redis.call("HINCRBY", stats_key, "total", 1)
redis.call("HINCRBY", stats_key, "sum_degradation", degradation)
redis.call("HINCRBY", stats_key, "dist:" .. bucket, 1)
redis.call("HINCRBY", stats_key, "tier:" .. tier, 1)
if ai ~= "" then
  redis.call("HINCRBY", stats_key, "ai:" .. ai, 1)
end
redis.call("HINCRBY", stats_key, "method:" .. method, 1)
if country ~= "" then
  redis.call("HINCRBY", stats_key, "country:" .. country, 1)
end
if elapsed > 0 then
  redis.call("HINCRBY", stats_key, "sum_elapsed", elapsed)
  redis.call("HINCRBY", stats_key, "elapsed_count", 1)
end

return 1
`

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

function pairListToRecord(value: unknown): Record<string, number> {
  if (!value) return {}

  if (!Array.isArray(value) && typeof value === "object") {
    const record: Record<string, number> = {}
    for (const [key, raw] of Object.entries(value)) {
      record[key] = Number(raw) || 0
    }
    return record
  }

  if (!Array.isArray(value)) return {}

  const record: Record<string, number> = {}
  for (let i = 0; i < value.length; i += 2) {
    const key = String(value[i] ?? "")
    if (key) record[key] = Number(value[i + 1]) || 0
  }
  return record
}

export async function getStats(): Promise<StatsData> {
  const [hashPairs, legacyValues, legacyCountryPairs] = await getStatsScripts().read.exec(
    [STATS_HASH_KEY, COUNTRIES_SET_KEY, ...LEGACY_KEYS],
    [PREFIX],
  )
  const hash = pairListToRecord(hashPairs)
  let idx = 0

  const legacyTotal = legacyValues[idx++] ?? 0
  const legacySumDegradation = legacyValues[idx++] ?? 0

  const distribution: number[] = []
  for (let i = 0; i < 10; i++) {
    distribution.push((hash[`dist:${i}`] ?? 0) + (legacyValues[idx++] ?? 0))
  }

  const tierCounts: Record<string, number> = {}
  const legacyCanonicalTierCounts: Record<string, number> = {}
  for (const key of TIER_KEYS) {
    tierCounts[key] = hash[`tier:${key}`] ?? 0
    legacyCanonicalTierCounts[key] = legacyValues[idx++] ?? 0
  }

  const legacyChineseTierCounts: Record<string, number> = {}
  for (const cnLabel of TIER_LEGACY_LABELS) {
    legacyChineseTierCounts[cnLabel] = legacyValues[idx++] ?? 0
  }

  for (const cnLabel of TIER_LEGACY_LABELS) {
    const key = TIER_LABEL_TO_KEY[cnLabel]
    if (key) {
      const canonical = legacyCanonicalTierCounts[key] ?? 0
      const legacy = legacyChineseTierCounts[cnLabel] ?? 0
      tierCounts[key] = (tierCounts[key] ?? 0) + Math.max(canonical, legacy)
    }
  }

  const aiUsageCounts: Record<string, number> = {}
  for (const level of AI_CANONICAL_LEVELS) {
    aiUsageCounts[level] = (hash[`ai:${level}`] ?? 0) + (legacyValues[idx++] ?? 0)
  }

  const irtCount = (hash["method:irt"] ?? 0) + (legacyValues[idx++] ?? 0)
  const pctCount = (hash["method:pct"] ?? 0) + (legacyValues[idx++] ?? 0)
  const legacySumElapsed = legacyValues[idx++] ?? 0
  const legacyElapsedCount = legacyValues[idx++] ?? 0

  const countryCounts: Record<string, number> = {}
  for (const [field, count] of Object.entries(hash)) {
    if (field.startsWith("country:")) {
      countryCounts[field.slice("country:".length)] = count
    }
  }
  const legacyCountryCounts = pairListToRecord(legacyCountryPairs)
  for (const [code, count] of Object.entries(legacyCountryCounts)) {
    countryCounts[code] = (countryCounts[code] ?? 0) + count
  }

  const total = (hash.total ?? 0) + legacyTotal
  const sumDegradation = (hash.sum_degradation ?? 0) + legacySumDegradation
  const sumElapsed = (hash.sum_elapsed ?? 0) + legacySumElapsed
  const elapsedCount = (hash.elapsed_count ?? 0) + legacyElapsedCount

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
  const bucket = Math.max(0, Math.min(Math.floor(result.degradationIndex / 10), 9))
  const tierKey = TIER_LABEL_TO_KEY[result.tierLabel] ?? result.tierLabel
  const method = result.estimationMethod === "irt" ? "irt" : "pct"

  await getStatsScripts().write.exec([STATS_HASH_KEY], [
    String(result.degradationIndex),
    String(bucket),
    tierKey,
    result.aiUsageLevel ?? "",
    method,
    result.country ?? "",
    String(result.elapsedMs && result.elapsedMs > 0 ? Math.round(result.elapsedMs) : 0),
  ])
}

export async function saveResultWithRateLimit(
  ip: string,
  result: {
    degradationIndex: number
    tierLabel: string
    aiUsageLevel: string | null
    estimationMethod?: "percentage" | "irt"
    country?: string | null
    elapsedMs?: number | null
  },
): Promise<boolean> {
  const bucket = Math.max(0, Math.min(Math.floor(result.degradationIndex / 10), 9))
  const tierKey = TIER_LABEL_TO_KEY[result.tierLabel] ?? result.tierLabel
  const method = result.estimationMethod === "irt" ? "irt" : "pct"
  const rateKey = PREFIX + `rate:${ip}`

  const ok = await getRateLimitedSaveScript().exec(
    [STATS_HASH_KEY, rateKey],
    [
      String(result.degradationIndex),
      String(bucket),
      tierKey,
      result.aiUsageLevel ?? "",
      method,
      result.country ?? "",
      String(result.elapsedMs && result.elapsedMs > 0 ? Math.round(result.elapsedMs) : 0),
    String(RATE_LIMIT_MAX),
      String(RATE_LIMIT_WINDOW),
    ],
  )
  return ok === 1
}

const EDGE_CONFIG_ID = "ecfg_u1649pkjevm409mhfgpmyxny5nfs"

async function patchEdgeConfig(items: Record<string, unknown>): Promise<void> {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) return

  const ops = Object.entries(items).map(([key, value]) => ({
    operation: "upsert" as const,
    key,
    value,
  }))

  await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items: ops }),
  })
}

export async function syncStatsToEdgeConfig(): Promise<void> {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) return

  const stats = await getStats()
  await patchEdgeConfig({
    totalTests: stats.totalTests,
    avgDegradation: stats.avgDegradation,
    distribution: stats.distribution,
    tierCounts: stats.tierCounts,
    aiUsageCounts: stats.aiUsageCounts,
    irtCount: stats.irtCount,
    pctCount: stats.pctCount,
  })
}

export async function saveResultToEdgeConfig(result: {
  degradationIndex: number
  tierLabel: string
  aiUsageLevel: string | null
  estimationMethod?: "percentage" | "irt"
}): Promise<void> {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new Error("VERCEL_API_TOKEN not set")

  // Read current stats from Edge Config (use SDK for optimized read)
  const { getAll } = await import("@vercel/edge-config")
  const current = (await getAll()) as Record<string, unknown> | undefined

  const totalTests = ((current?.totalTests as number) ?? 0) + 1
  const sumDegradation =
    (current?.avgDegradation as number ?? 0) * ((current?.totalTests as number) ?? 0) +
    result.degradationIndex
  const avgDegradation = Math.round((sumDegradation / totalTests) * 10) / 10

  const bucket = Math.max(0, Math.min(Math.floor(result.degradationIndex / 10), 9))
  const distribution = [...((current?.distribution as number[]) ?? Array(10).fill(0))]
  distribution[bucket] += 1

  const tierCounts = { ...((current?.tierCounts as Record<string, number>) ?? {}) }
  const tierKey = TIER_LABEL_TO_KEY[result.tierLabel] ?? result.tierLabel
  tierCounts[tierKey] = (tierCounts[tierKey] ?? 0) + 1

  const aiUsageCounts = { ...((current?.aiUsageCounts as Record<string, number>) ?? {}) }
  if (result.aiUsageLevel) {
    aiUsageCounts[result.aiUsageLevel] = (aiUsageCounts[result.aiUsageLevel] ?? 0) + 1
  }

  const irtCount = ((current?.irtCount as number) ?? 0) + (result.estimationMethod === "irt" ? 1 : 0)
  const pctCount = ((current?.pctCount as number) ?? 0) + (result.estimationMethod !== "irt" ? 1 : 0)

  await patchEdgeConfig({
    totalTests,
    avgDegradation,
    distribution,
    tierCounts,
    aiUsageCounts,
    irtCount,
    pctCount,
  })
}
