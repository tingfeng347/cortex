import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const total = await redis.get<number>("cortex:total")

    if (!total || total === 0) {
      return NextResponse.json({
        totalTests: 0,
        avgDegradation: null,
        distribution: Array(10).fill(0),
        tierCounts: {},
      })
    }

    // Build distribution: 10 buckets (0-10, 11-20, ..., 91-100)
    const distribution: number[] = []
    for (let i = 0; i < 10; i++) {
      const min = i * 10
      const max = (i + 1) * 10 - 0.5 // non-inclusive upper bound
      const count = await redis.zcount("cortex:scores", min, max)
      distribution.push(count)
    }

    // Average: get all scores via zrange withScores
    const all = await redis.zrange<string[]>("cortex:scores", 0, -1, {
      withScores: true,
    })

    let sum = 0
    let count = 0
    if (all) {
      for (let i = 1; i < all.length; i += 2) {
        sum += Number(all[i])
        count++
      }
    }

    const avgDegradation = count > 0 ? Math.round((sum / count) * 10) / 10 : 0

    // Get tier counts
    const tierLabels = [
      "认知巅峰",
      "轻度退化",
      "中度退化",
      "明显退化",
      "严重退化",
    ]
    const tierCounts: Record<string, number> = {}
    for (const label of tierLabels) {
      const c = await redis.get<number>(`cortex:tier:${label}`)
      if (c) tierCounts[label] = c
    }

    return NextResponse.json({
      totalTests: total,
      avgDegradation,
      distribution,
      tierCounts,
    })
  } catch (e) {
    console.error("stats error", e)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
