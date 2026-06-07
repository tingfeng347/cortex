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
}

export async function getStats(): Promise<StatsData> {
  const p = getRedis().pipeline()
  p.get(PREFIX + "total")
  p.get(PREFIX + "sum_degradation")
  for (let i = 0; i < 10; i++) p.get(PREFIX + `dist:${i}`)
  for (const label of TIER_LABELS) p.get(PREFIX + `tier:${label}`)
  // Also read legacy Chinese keys for backward compat
  for (const cnLabel of TIER_LEGACY_LABELS) p.get(PREFIX + `tier:${cnLabel}`)
  for (const level of AI_CANONICAL_LEVELS) p.get(PREFIX + `ai:${level}`)
  p.get(PREFIX + "irt_count")
  p.get(PREFIX + "pct_count")

  const results = await p.exec<(number | null)[]>()
  let idx = 0

  const total = results[idx++] ?? 0
  const sumDegradation = results[idx++] ?? 0

  const distribution: number[] = []
  for (let i = 0; i < 10; i++) distribution.push(results[idx++] ?? 0)

  const tierCounts: Record<string, number> = {}
  for (const label of TIER_LABELS) tierCounts[label] = results[idx++] ?? 0
  // Merge legacy Chinese key counts into canonical keys
  for (const cnLabel of TIER_LEGACY_LABELS) {
    const key = TIER_LABEL_TO_KEY[cnLabel]
    if (key) {
      tierCounts[key] = (tierCounts[key] ?? 0) + ((results[idx++] as number) ?? 0)
    }
  }

  const aiUsageCounts: Record<string, number> = {}
  for (const level of AI_CANONICAL_LEVELS) aiUsageCounts[level] = results[idx++] ?? 0

  const irtCount = results[idx++] ?? 0
  const pctCount = results[idx++] ?? 0

  return {
    totalTests: total as number,
    avgDegradation: total ? Math.round(((sumDegradation as number) / (total as number)) * 10) / 10 : null,
    distribution,
    tierCounts,
    aiUsageCounts,
    sumDegradation: sumDegradation as number,
    irtCount: irtCount as number,
    pctCount: pctCount as number,
  }
}

export async function saveResult(result: {
  degradationIndex: number
  tierLabel: string
  aiUsageLevel: string | null
  estimationMethod?: "percentage" | "irt"
  country?: string | null
}): Promise<void> {
  const bucket = Math.min(Math.floor(result.degradationIndex / 10), 9)

  const p = getRedis().pipeline()
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
  }
  await p.exec()
}
