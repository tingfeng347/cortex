import { NextResponse } from "next/server"
import { saveResult } from "@/lib/storage"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { degradationIndex, tierLabel, aiUsageLevel, estimationMethod } = body

    if (typeof degradationIndex !== "number") {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 })
    }

    const country = request.headers.get("x-vercel-ip-country") ?? undefined

    await saveResult({
      degradationIndex,
      tierLabel,
      aiUsageLevel: aiUsageLevel ?? null,
      estimationMethod: estimationMethod === "irt" ? "irt" : "percentage",
      country,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/results error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
