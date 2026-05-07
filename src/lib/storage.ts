import { Redis } from "@upstash/redis"
import { TIER_LABELS } from "./scoring"
import { AI_CANONICAL_LEVELS } from "./constants"

function getRedis(): Redis {
  return Redis.fromEnv()
}

const PREFIX = "cortex:"

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
}): Promise<void> {
  const bucket = Math.min(Math.floor(result.degradationIndex / 10), 9)

  const p = getRedis().pipeline()
  p.incr(PREFIX + "total")
  p.incrby(PREFIX + "sum_degradation", result.degradationIndex)
  p.incr(PREFIX + `dist:${bucket}`)
  p.incr(PREFIX + `tier:${result.tierLabel}`)
  if (result.aiUsageLevel) {
    p.incr(PREFIX + `ai:${result.aiUsageLevel}`)
  }
  if (result.estimationMethod === "irt") {
    p.incr(PREFIX + "irt_count")
  } else {
    p.incr(PREFIX + "pct_count")
  }
  await p.exec()
}
