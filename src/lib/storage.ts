import { Redis } from "@upstash/redis"
import { TIER_LABELS } from "./scoring"

const redis = Redis.fromEnv()

const PREFIX = "cortex:"

export interface StatsData {
  totalTests: number
  avgDegradation: number | null
  distribution: number[]
  tierCounts: Record<string, number>
  aiUsageCounts: Record<string, number>
  sumDegradation: number
}

const AI_LEVELS = ["< 30 分钟", "30 分钟 - 2 小时", "2 - 5 小时", "> 5 小时"]

export async function getStats(): Promise<StatsData> {
  const p = redis.pipeline()
  p.get(PREFIX + "total")
  p.get(PREFIX + "sum_degradation")
  for (let i = 0; i < 10; i++) p.get(PREFIX + `dist:${i}`)
  for (const label of TIER_LABELS) p.get(PREFIX + `tier:${label}`)
  for (const level of AI_LEVELS) p.get(PREFIX + `ai:${level}`)

  const results = await p.exec<(number | null)[]>()
  let idx = 0

  const total = results[idx++] ?? 0
  const sumDegradation = results[idx++] ?? 0

  const distribution: number[] = []
  for (let i = 0; i < 10; i++) distribution.push(results[idx++] ?? 0)

  const tierCounts: Record<string, number> = {}
  for (const label of TIER_LABELS) tierCounts[label] = results[idx++] ?? 0

  const aiUsageCounts: Record<string, number> = {}
  for (const level of AI_LEVELS) aiUsageCounts[level] = results[idx++] ?? 0

  return {
    totalTests: total as number,
    avgDegradation: total ? Math.round(((sumDegradation as number) / (total as number)) * 10) / 10 : null,
    distribution,
    tierCounts,
    aiUsageCounts,
    sumDegradation: sumDegradation as number,
  }
}

export async function saveResult(result: {
  degradationIndex: number
  tierLabel: string
  aiUsageLevel: string | null
}): Promise<void> {
  const bucket = Math.min(Math.floor(result.degradationIndex / 10), 9)

  const p = redis.pipeline()
  p.incr(PREFIX + "total")
  p.incrby(PREFIX + "sum_degradation", result.degradationIndex)
  p.incr(PREFIX + `dist:${bucket}`)
  p.incr(PREFIX + `tier:${result.tierLabel}`)
  if (result.aiUsageLevel) {
    p.incr(PREFIX + `ai:${result.aiUsageLevel}`)
  }
  await p.exec()
}
