// Client-side sync engine — bidirectional cloud sync for premium users

export interface SyncResult {
  degradationIndex: number
  tierKey: string
  correctCount: number
  totalQuestions: number
  dimensionScores: Record<string, number | null> | null
  aiUsageLevel: string | null
  estimationMethod: string
  theta: number | null
  thetaSE: number | null
  thetaByType: Record<string, { theta: number; se: number }> | null
  elapsedMs: number
  createdAt: string
}

export interface LocalHistoryEntry {
  degradationIndex: number
  tierLabel: string
  tierLabelKey: string
  tierColor: string
  correctCount: number
  totalQuestions: number
  dimensionScores?: Record<string, number | null>
  aiUsage?: number | null
  timestamp: number
  estimationMethod?: string
  theta?: number
  thetaSE?: number
  thetaByType?: unknown
}

const HISTORY_KEY = "cognitive-rust-history"
const RESULT_KEY = "cognitive-rust-result"
const FULL_RESULT_KEY = "cognitive-rust-full-result"

function getLocalHistory(): LocalHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setLocalHistory(entries: LocalHistoryEntry[]): void {
  // Keep max 20 entries locally (cloud has full history)
  if (entries.length > 20) {
    entries = entries.slice(-20)
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
}

export function getLocalResult(): LocalHistoryEntry | null {
  try {
    const raw = localStorage.getItem(RESULT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Convert local entries to cloud format for upload
function localToCloudEntries(entries: LocalHistoryEntry[]): {
  degradationIndex: number
  tierKey: string
  correctCount: number
  totalQuestions: number
  dimensionScores: Record<string, number | null>
  aiUsageLevel: string | null
  estimationMethod: string
  theta: number | null
  thetaSE: number | null
  thetaByType: Record<string, number> | null
  elapsedMs: number
}[] {
  return entries.map((e) => ({
    degradationIndex: e.degradationIndex,
    tierKey: e.tierLabelKey ?? e.tierLabel,
    correctCount: e.correctCount,
    totalQuestions: e.totalQuestions,
    dimensionScores: e.dimensionScores ?? {},
    aiUsageLevel: e.aiUsage !== null && e.aiUsage !== undefined ? String(e.aiUsage) : null,
    estimationMethod: e.estimationMethod ?? "percentage",
    theta: e.theta ?? null,
    thetaSE: e.thetaSE ?? null,
    thetaByType: (e.thetaByType as Record<string, number>) ?? null,
    elapsedMs: 0,
  }))
}

// Upload local history to cloud
export async function uploadResults(
  licenseKey: string,
  entries: LocalHistoryEntry[],
): Promise<{ ok: boolean; count: number }> {
  if (entries.length === 0) return { ok: true, count: 0 }

  const cloudEntries = localToCloudEntries(entries)
  try {
    const res = await fetch("/api/results/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${licenseKey}`,
      },
      body: JSON.stringify({ results: cloudEntries }),
    })
    const data = await res.json()
    if (data.ok !== undefined) return { ok: true, count: data.count ?? entries.length }
    return { ok: false, count: 0 }
  } catch {
    return { ok: false, count: 0 }
  }
}

// Download cloud results
export async function downloadResults(licenseKey: string): Promise<SyncResult[]> {
  try {
    const res = await fetch("/api/results/sync", {
      headers: { Authorization: `Bearer ${licenseKey}` },
    })
    const data = await res.json()
    if (data.results) return data.results
    return []
  } catch {
    return []
  }
}

// Merge cloud results into local history, deduplicating by timestamp proximity
function mergeResults(local: LocalHistoryEntry[], cloud: SyncResult[]): LocalHistoryEntry[] {
  const merged = new Map<string, LocalHistoryEntry>()

  // Add local entries first
  for (const e of local) {
    const key = `${e.degradationIndex}_${e.correctCount}_${e.totalQuestions}_${e.timestamp}`
    merged.set(key, e)
  }

  // Add/override with cloud entries
  for (const c of cloud) {
    const ts = new Date(c.createdAt).getTime()
    const key = `${c.degradationIndex}_${c.correctCount}_${c.totalQuestions}_${ts}`

    // Check for nearby duplicates (within 2 seconds)
    let isDuplicate = false
    for (const [existingKey] of merged) {
      const [di, cc, tq, ets] = existingKey.split("_")
      if (di === String(c.degradationIndex) && cc === String(c.correctCount) && tq === String(c.totalQuestions)) {
        const existingTs = parseInt(ets, 10)
        if (Math.abs(existingTs - ts) <= 2000) {
          // Cloud wins for identical timestamps, but keep local if more complete
          isDuplicate = true
          break
        }
      }
    }

    if (!isDuplicate || c.estimationMethod === "irt") {
      // Cloud entries with IRT data are preferred
      merged.set(key, {
        degradationIndex: c.degradationIndex,
        tierLabel: c.tierKey,
        tierLabelKey: c.tierKey,
        tierColor: "",
        correctCount: c.correctCount,
        totalQuestions: c.totalQuestions,
        dimensionScores: c.dimensionScores as Record<string, number | null>,
        timestamp: ts,
        estimationMethod: c.estimationMethod,
        theta: c.theta ?? undefined,
        thetaSE: c.thetaSE ?? undefined,
        thetaByType: c.thetaByType ?? undefined,
      })
    }
  }

  // Sort by timestamp ascending, return as array
  return Array.from(merged.values()).sort((a, b) => a.timestamp - b.timestamp)
}

// Full bidirectional sync
export async function performSync(licenseKey: string): Promise<{
  uploaded: number
  downloaded: number
  merged: LocalHistoryEntry[]
}> {
  const local = getLocalHistory()

  // Upload local to cloud
  const uploadResult = await uploadResults(licenseKey, local)

  // Download cloud results
  const cloud = await downloadResults(licenseKey)

  // Merge
  const merged = mergeResults(local, cloud)
  setLocalHistory(merged)

  // Update latest result if needed
  const latestLocal = getLocalResult()
  if (!latestLocal && merged.length > 0) {
    const latest = merged[merged.length - 1]
    localStorage.setItem(RESULT_KEY, JSON.stringify(latest))
  }

  return {
    uploaded: uploadResult.count,
    downloaded: cloud.length,
    merged,
  }
}
