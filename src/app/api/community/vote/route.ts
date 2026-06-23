import { NextResponse } from "next/server"
import { upsertVote, extractClientIp } from "@/lib/community/d1"

export async function POST(request: Request) {
  try {
    const ip = extractClientIp(request)
    if (ip === "unknown") {
      return NextResponse.json({ error: "could not determine client identity" }, { status: 400 })
    }

    const body = await request.json()
    const { questionId, vote } = body

    if (typeof questionId !== "number" || ![1, -1].includes(vote)) {
      return NextResponse.json({ error: "invalid request" }, { status: 400 })
    }

    const result = await upsertVote(questionId, ip, vote)
    return NextResponse.json(result)
  } catch (err) {
    console.error("POST /api/community/vote error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
