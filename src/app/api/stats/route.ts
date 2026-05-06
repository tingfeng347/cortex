import { NextResponse } from "next/server"
import { getStats } from "@/lib/blob"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json({
      totalTests: stats.totalTests,
      avgDegradation: stats.avgDegradation,
      distribution: stats.distribution,
      tierCounts: stats.tierCounts,
      aiUsageCounts: stats.aiUsageCounts,
    })
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
