import { NextResponse } from "next/server"
import { extractClientIp } from "@/lib/community/d1"
import { d1Query } from "@/lib/auth/d1-client"

export async function GET(request: Request) {
  try {
    const ip = extractClientIp(request)
    if (ip === "unknown") {
      return NextResponse.json({ votes: [] })
    }
    const votes = await d1Query<{ question_id: number; vote: number }>(
      "SELECT question_id, vote FROM question_votes WHERE ip_address = ?",
      [ip]
    )
    return NextResponse.json({ votes })
  } catch (err) {
    console.error("GET /api/community/my-votes error:", err)
    return NextResponse.json({ votes: [] })
  }
}
