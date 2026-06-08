import { NextResponse } from "next/server"
import { saveResult, checkRateLimit } from "@/lib/storage"

export async function POST(request: Request) {
  try {
    // Reject automated requests (Vercel BotID)
    if (request.headers.get("x-vercel-bot") === "1") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { degradationIndex, tierLabel, aiUsageLevel, estimationMethod, elapsedMs } = body

    // Score bounds check
    if (typeof degradationIndex !== "number" || degradationIndex < 0 || degradationIndex > 100) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 })
    }

    // Minimum test duration check (60 seconds)
    if (typeof elapsedMs === "number" && elapsedMs < 60_000) {
      return NextResponse.json({ error: "too fast" }, { status: 400 })
    }

    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const allowed = await checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json({ error: "rate limited" }, { status: 429 })
    }

    const country = request.headers.get("x-vercel-ip-country") ?? undefined

    await saveResult({
      degradationIndex,
      tierLabel,
      aiUsageLevel: aiUsageLevel ?? null,
      estimationMethod: estimationMethod === "irt" ? "irt" : "percentage",
      country,
      elapsedMs: typeof elapsedMs === "number" ? elapsedMs : null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/results error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
