import { getCloudflareContext } from "@opennextjs/cloudflare"

const NEURON_DAILY_LIMIT = 10000

function dailyKey(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `ai-gen:daily:${today}`
}

async function getKV() {
  const { env } = await getCloudflareContext()
  return (env as any).CORTEX_KV
}

export interface DailyQuota {
  totalNeurons: number
  totalQuestions: number
}

/** Read today's neuron usage from KV */
export async function readDailyQuota(): Promise<DailyQuota> {
  try {
    const kv = await getKV()
    if (!kv) return { totalNeurons: 0, totalQuestions: 0 }
    const raw = await kv.get(dailyKey())
    if (!raw) return { totalNeurons: 0, totalQuestions: 0 }
    return JSON.parse(raw) as DailyQuota
  } catch {
    return { totalNeurons: 0, totalQuestions: 0 }
  }
}

/** Record neuron usage for a newly generated question */
export async function recordNeuronUsage(neuronCost: number): Promise<void> {
  try {
    const kv = await getKV()
    if (!kv) return
    const quota = await readDailyQuota()
    quota.totalNeurons += neuronCost
    quota.totalQuestions += 1
    await kv.put(dailyKey(), JSON.stringify(quota), { expirationTtl: 86400 })
  } catch {
    /* non-critical */
  }
}

/** Get average neuron cost per question today */
export async function getAverageNeuronCost(): Promise<number> {
  const quota = await readDailyQuota()
  if (quota.totalQuestions === 0) return 11 // default estimate
  return quota.totalNeurons / quota.totalQuestions
}
