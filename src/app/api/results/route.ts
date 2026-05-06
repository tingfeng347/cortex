import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { degradationIndex, tierLabel, correctCount, totalQuestions } = body

    if (typeof degradationIndex !== "number") {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 })
    }

    const id = crypto.randomUUID().slice(0, 12)
    const now = Date.now()

    // Sorted set for distribution stats
    await redis.zadd("cortex:scores", { score: degradationIndex, member: id })
    // Total test counter
    await redis.incr("cortex:total")
    // Per-tier counter
    await redis.incr(`cortex:tier:${tierLabel}`)
    // Full result detail (expire after 30 days)
    await redis.hset(`cortex:result:${id}`, {
      degradationIndex,
      tierLabel,
      correctCount,
      totalQuestions,
      timestamp: now,
    })
    await redis.expire(`cortex:result:${id}`, 60 * 60 * 24 * 30)

    return NextResponse.json({ id })
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
