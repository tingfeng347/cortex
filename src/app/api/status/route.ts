import { NextResponse } from "next/server"
import { getDB } from "@/lib/auth/d1-client"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { readDailyQuota } from "@/lib/ai/quota-kv"
import { countActiveLicenses } from "@/lib/auth/license"
import { getStats } from "@/lib/storage"

// ---- GraphQL client ----

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql"
const CORTEX_DB_ID = "1e4abc9a-cad9-4796-85d0-4c8be768ca2e"

const STATUS_CACHE_KEY = "status:dashboard"
const CACHE_TTL = 300 // 5 minutes

interface CfMetrics {
  traffic: { requestsToday: number; requestsPerHour: [number, number][]; cpuP50: number; cpuP99: number; errors: number }
  d1: { readQueries: number; writeQueries: number; rowsRead: number; rowsWritten: number }
  kv: { reads: number; writes: number; lists: number; deletes: number }
}

interface InternalMetrics {
  ai: { neuronsUsed: number; neuronsLimit: number; neuronsRemaining: number; questionsInPool: number; questionsGeneratedToday: number; avgNeuronCost: number; totalInputTokens: number; totalOutputTokens: number }
  app: { totalTests: number; activeLicenses: number; itemResponses: number; degradationAvg: number | null }
}

interface StatusPayload extends CfMetrics, InternalMetrics {
  cached: boolean
  cachedAt: string
}

async function graphql(query: string, variables: Record<string, unknown>): Promise<unknown> {
  // In opennextjs/cloudflare Workers, secrets set via `wrangler secret put` are available
  // through the Cloudflare env binding, not process.env.
  const { env } = await getCloudflareContext()
  const token = (env as Record<string, string>).CLOUDFLARE_API_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN not available in Worker env or process.env")

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json() as { data: unknown; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "))
  return json.data
}

// ---- Data fetchers ----

async function fetchCloudflareMetrics(): Promise<CfMetrics> {
  const today = new Date().toISOString().slice(0, 10)
  const start = `${today}T00:00:00Z`
  const end = new Date().toISOString()

  const { env } = await getCloudflareContext()
  const accountId = (env as Record<string, string>).CLOUDFLARE_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? "d6b620c5ad2c4ca81de6c0b76c719995"

  const data = await graphql(
    `query($accountTag: string!, $start: Time!, $end: Time!, $dateStart: Date!, $dateEnd: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          worker: workersInvocationsAdaptive(
            filter: { datetime_gt: $start, datetime_lt: $end }
            limit: 24
            orderBy: [datetimeHour_ASC]
          ) {
            sum { requests errors }
            quantiles { cpuTimeP50 cpuTimeP99 }
            dimensions { datetimeHour }
          }
          workerTotal: workersInvocationsAdaptive(
            filter: { datetime_gt: $start, datetime_lt: $end }
            limit: 1
          ) {
            sum { requests errors }
            quantiles { cpuTimeP50 cpuTimeP99 }
          }
          d1: d1AnalyticsAdaptiveGroups(
            filter: { date_geq: $dateStart, date_leq: $dateEnd, databaseId: "${CORTEX_DB_ID}" }
            limit: 1
            orderBy: [date_DESC]
          ) {
            sum { readQueries writeQueries rowsRead rowsWritten }
          }
          kv: kvOperationsAdaptiveGroups(
            filter: { date_geq: $dateStart, date_leq: $dateEnd }
            limit: 10
          ) {
            dimensions { actionType }
            sum { requests }
          }
        }
      }
    }`,
    { accountTag: accountId, start, end, dateStart: today, dateEnd: today },
  ) as {
    viewer: {
      accounts: [{
        worker: Array<{ sum: { requests: number; errors: number }; quantiles: { cpuTimeP50: number; cpuTimeP99: number }; dimensions: { datetimeHour: string } }>
        workerTotal: Array<{ sum: { requests: number; errors: number }; quantiles: { cpuTimeP50: number; cpuTimeP99: number } }>
        d1: Array<{ sum: { readQueries: number; writeQueries: number; rowsRead: number; rowsWritten: number } }>
        kv: Array<{ dimensions: { actionType: string }; sum: { requests: number } }>
      }]
    }
  }

  const acc = data.viewer.accounts[0]

  // Traffic
  const requestsPerHour: [number, number][] = acc.worker.map((w) => {
    const hour = new Date(w.dimensions.datetimeHour).getUTCHours()
    return [hour, w.sum.requests]
  })
  const totalReq = acc.workerTotal[0]?.sum?.requests ?? 0
  const totalErrors = acc.workerTotal[0]?.sum?.errors ?? 0
  const cpuP50 = acc.workerTotal[0]?.quantiles?.cpuTimeP50 ?? 0
  const cpuP99 = acc.workerTotal[0]?.quantiles?.cpuTimeP99 ?? 0

  // D1
  const d1Data = acc.d1[0]?.sum ?? { readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 }

  // KV
  let kvReads = 0, kvWrites = 0, kvLists = 0, kvDeletes = 0
  for (const k of acc.kv) {
    switch (k.dimensions.actionType) {
      case "read": kvReads = k.sum.requests; break
      case "write": kvWrites = k.sum.requests; break
      case "list": kvLists = k.sum.requests; break
      case "delete": kvDeletes = k.sum.requests; break
    }
  }

  return {
    traffic: {
      requestsToday: totalReq,
      requestsPerHour,
      cpuP50: Math.round(cpuP50 / 1000 * 10) / 10, // µs -> ms
      cpuP99: Math.round(cpuP99 / 1000 * 10) / 10,
      errors: totalErrors,
    },
    d1: d1Data,
    kv: {
      reads: kvReads,
      writes: kvWrites,
      lists: kvLists,
      deletes: kvDeletes,
    },
  }
}

async function fetchInternalMetrics(): Promise<InternalMetrics> {
  const today = new Date().toISOString().slice(0, 10)

  // AI neuron quota
  const quota = await readDailyQuota()
  const NEURON_LIMIT = 10000

  // AI questions pool stats
  let questionsInPool = 0
  let questionsGeneratedToday = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0
  try {
    const db = await getDB()
    const poolRow = await db.prepare("SELECT COUNT(*) AS count FROM ai_generated_questions").first<{ count: number }>()
    questionsInPool = poolRow?.count ?? 0

    const todayRow = await db.prepare(
      "SELECT COUNT(*) AS count, SUM(input_tokens) AS inputSum, SUM(output_tokens) AS outputSum FROM ai_generated_questions WHERE DATE(created_at) = ?",
    ).bind(today).first<{ count: number; inputSum: number | null; outputSum: number | null }>()
    questionsGeneratedToday = todayRow?.count ?? 0
    totalInputTokens = todayRow?.inputSum ?? 0
    totalOutputTokens = todayRow?.outputSum ?? 0
  } catch { /* D1 query failure — return zeros */ }

  // Item responses count
  let itemResponses = 0
  try {
    const db = await getDB()
    const row = await db.prepare("SELECT COUNT(*) AS count FROM item_responses").first<{ count: number }>()
    itemResponses = row?.count ?? 0
  } catch { /* ignore */ }

  // App stats
  let totalTests = 0
  let degradationAvg: number | null = null
  try {
    const stats = await getStats()
    totalTests = stats.totalTests
    degradationAvg = stats.avgDegradation
  } catch { /* ignore */ }

  // Active licenses
  let activeLicenses = 0
  try {
    activeLicenses = await countActiveLicenses()
  } catch { /* ignore */ }

  return {
    ai: {
      neuronsUsed: Math.round(quota.totalNeurons),
      neuronsLimit: NEURON_LIMIT,
      neuronsRemaining: Math.max(0, NEURON_LIMIT - Math.round(quota.totalNeurons)),
      questionsInPool,
      questionsGeneratedToday,
      avgNeuronCost: quota.totalQuestions > 0 ? Math.round(quota.totalNeurons / quota.totalQuestions * 10) / 10 : 0,
      totalInputTokens,
      totalOutputTokens,
    },
    app: {
      totalTests,
      activeLicenses,
      itemResponses,
      degradationAvg,
    },
  }
}

// ---- KV cache helpers ----

async function getKvForCache() {
  try {
    const { env } = await getCloudflareContext()
    if (env.CORTEX_KV) return env.CORTEX_KV
  } catch { /* fall through */ }
  return null
}

async function readCache(): Promise<StatusPayload | null> {
  try {
    const kv = await getKvForCache()
    if (!kv) return null
    const raw = await kv.get(STATUS_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StatusPayload
  } catch {
    return null
  }
}

async function writeCache(payload: StatusPayload): Promise<void> {
  try {
    const kv = await getKvForCache()
    if (!kv) return
    await kv.put(STATUS_CACHE_KEY, JSON.stringify(payload), { expirationTtl: CACHE_TTL })
  } catch { /* non-critical */ }
}

// ---- Route ----

export const dynamic = "force-dynamic"

export async function GET() {
  // Check cache
  const cached = await readCache()
  if (cached) {
    cached.cached = true
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    })
  }

  // Fetch fresh data in parallel
  const [cfMetrics, internalMetrics] = await Promise.allSettled([
    fetchCloudflareMetrics(),
    fetchInternalMetrics(),
  ])

  const fallbackCf: CfMetrics = {
    traffic: { requestsToday: 0, requestsPerHour: [], cpuP50: 0, cpuP99: 0, errors: 0 },
    d1: { readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 },
    kv: { reads: 0, writes: 0, lists: 0, deletes: 0 },
  }
  const fallbackInternal: InternalMetrics = {
    ai: { neuronsUsed: 0, neuronsLimit: 10000, neuronsRemaining: 10000, questionsInPool: 0, questionsGeneratedToday: 0, avgNeuronCost: 0, totalInputTokens: 0, totalOutputTokens: 0 },
    app: { totalTests: 0, activeLicenses: 0, itemResponses: 0, degradationAvg: null },
  }

  let cfError: string | null = null
  if (cfMetrics.status === "rejected") {
    cfError = cfMetrics.reason instanceof Error ? cfMetrics.reason.message : String(cfMetrics.reason)
    console.error("[status] Cloudflare metrics failed:", cfError)
  }

  const cf = cfMetrics.status === "fulfilled" ? cfMetrics.value : fallbackCf
  const internal = internalMetrics.status === "fulfilled" ? internalMetrics.value : fallbackInternal

  const payload: StatusPayload & { _cfError?: string | null } = {
    cached: false,
    cachedAt: new Date().toISOString(),
    ...cf,
    ...internal,
    _cfError: cfError,
  }

  // Write cache in background
  writeCache(payload).catch(() => {})

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  })
}
