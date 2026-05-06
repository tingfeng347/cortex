import { put, get } from "@vercel/blob"

const STATS_KEY = "stats.json"
const RESULTS_PREFIX = "results/"

export interface ResultData {
  degradationIndex: number
  tierLabel: string
  correctCount: number
  totalQuestions: number
  timestamp: number
}

export interface StatsData {
  totalTests: number
  avgDegradation: number | null
  distribution: number[]
  tierCounts: Record<string, number>
  /** running sum of degradationIndex for avg calculation */
  sumDegradation: number
}

function emptyStats(): StatsData {
  return {
    totalTests: 0,
    avgDegradation: null,
    distribution: Array(10).fill(0),
    tierCounts: {},
    sumDegradation: 0,
  }
}

export async function getStats(): Promise<StatsData> {
  try {
    const result = await get(STATS_KEY, { access: "private" })
    if (!result || !result.stream) return emptyStats()
    const reader = result.stream.getReader()
    const decoder = new TextDecoder()
    let text = ""
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
    return JSON.parse(text) as StatsData
  } catch {
    return emptyStats()
  }
}

export async function saveResultAndUpdateStats(result: ResultData): Promise<void> {
  // Save individual result blob
  const id = crypto.randomUUID().slice(0, 12)
  await put(`${RESULTS_PREFIX}${id}.json`, JSON.stringify(result), {
    contentType: "application/json",
    access: "private",
  })

  // Update aggregated stats (O(1) — no full scan)
  const stats = await getStats()
  stats.totalTests++
  stats.sumDegradation += result.degradationIndex
  stats.avgDegradation = Math.round((stats.sumDegradation / stats.totalTests) * 10) / 10

  stats.tierCounts[result.tierLabel] = (stats.tierCounts[result.tierLabel] ?? 0) + 1

  const bucket = Math.min(Math.floor(result.degradationIndex / 10), 9)
  stats.distribution[bucket]++

  await put(STATS_KEY, JSON.stringify(stats), {
    contentType: "application/json",
    access: "private",
    allowOverwrite: true,
  })
}
