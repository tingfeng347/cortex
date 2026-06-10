import { NextResponse } from "next/server"
import { saveResultWithRateLimit, syncStatsToEdgeConfig, saveResultToEdgeConfig } from "@/lib/storage"
import { TIER_KEYS } from "@/lib/scoring"
import { AI_CANONICAL_LEVELS } from "@/lib/constants"

export async function POST(request: Request) {
  try {
    // Reject automated requests (Vercel BotID)
    if (request.headers.get("x-vercel-bot") === "1") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { degradationIndex, tierLabel, aiUsageLevel, estimationMethod, elapsedMs } = body

    if (
      typeof degradationIndex !== "number" ||
      !Number.isInteger(degradationIndex) ||
      degradationIndex < 0 ||
      degradationIndex > 100 ||
      !(TIER_KEYS as readonly string[]).includes(tierLabel) ||
      (aiUsageLevel !== null &&
        aiUsageLevel !== undefined &&
        !(AI_CANONICAL_LEVELS as readonly string[]).includes(aiUsageLevel)) ||
      (estimationMethod !== undefined &&
        estimationMethod !== "percentage" &&
        estimationMethod !== "irt") ||
      (elapsedMs !== undefined && elapsedMs !== null && typeof elapsedMs !== "number")
    ) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 })
    }

    // Minimum test duration check (60 seconds)
    if (typeof elapsedMs === "number" && elapsedMs < 60_000) {
      return NextResponse.json({ error: "too fast" }, { status: 400 })
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const country = request.headers.get("x-vercel-ip-country") ?? undefined

    let saved = false

    try {
      const ok = await saveResultWithRateLimit(ip, {
        degradationIndex,
        tierLabel,
        aiUsageLevel: aiUsageLevel ?? null,
        estimationMethod: estimationMethod === "irt" ? "irt" : "percentage",
        country,
        elapsedMs: typeof elapsedMs === "number" ? elapsedMs : null,
      })
      if (!ok) {
        return NextResponse.json({ error: "rate limited" }, { status: 429 })
      }
      saved = true
    } catch (err) {
      console.warn("Redis save failed, falling back to Edge Config:", err)
    }

    if (!saved) {
      // Redis unavailable — save directly to Edge Config
      try {
        await saveResultToEdgeConfig({
          degradationIndex,
          tierLabel,
          aiUsageLevel: aiUsageLevel ?? null,
          estimationMethod: estimationMethod === "irt" ? "irt" : "percentage",
        })
      } catch (ecErr) {
        console.error("Edge Config fallback also failed:", ecErr)
        return NextResponse.json({ error: "internal error" }, { status: 500 })
      }
    } else {
      // Normal path: Redis succeeded, sync Edge Config in background
      syncStatsToEdgeConfig().catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/results error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
