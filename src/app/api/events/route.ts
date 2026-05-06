import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, tier } = body

    if (typeof name !== "string") {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 })
    }

    const key = tier ? `cortex:events:${name}:${tier}` : `cortex:events:${name}`
    await redis.incr(key)

    // Set a TTL so we don't accumulate stale keys forever
    await redis.expire(key, 60 * 60 * 24 * 365)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
