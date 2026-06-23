import { NextResponse } from "next/server"
import { getQuestionsWithVotes } from "@/lib/community/d1"

export async function GET() {
  try {
    const questions = await getQuestionsWithVotes()
    return NextResponse.json({ questions })
  } catch (err) {
    console.error("GET /api/community/marketplace error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
