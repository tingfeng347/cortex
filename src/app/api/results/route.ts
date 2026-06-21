import { NextResponse } from "next/server"
import { saveResult } from "@/lib/storage"
import { getDB } from "@/lib/auth/d1-client"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { TIER_KEYS } from "@/lib/scoring"
import { AI_CANONICAL_LEVELS } from "@/lib/constants"

export async function POST(request: Request) {
  try {
    // Reject automated requests (Vercel BotID)
    if (request.headers.get("x-vercel-bot") === "1") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    // ---- Hard-block known abusive IPs ----
    const ip = request.headers.get("cf-connecting-ip")
      ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? "unknown"
    const blockedIPs = [
      "240b:10:bf05:5f01:20c:29ff:fe54:a4d1",
      "2001:1af8:4700:a0df:6::112",
      "2607:5300:20b:2b01::1",
      "15.235.117.43",
    ]
    if (blockedIPs.includes(ip)) {
      console.warn(`[abuse] blocked request from known abusive IP: ${ip}`)
      return NextResponse.json({ error: "blocked" }, { status: 403 })
    }

    // ---- Rate limiting (IP + rolling 7-day window via KV) ----
    const rateLimitKey = `rl7:${ip}`
    const SEVEN_DAYS_SEC = 604_800

    try {
      const { env } = await getCloudflareContext()
      const current = await env.CORTEX_KV.get(rateLimitKey)
      const count = current ? parseInt(current, 10) : 0
      if (count >= 7) {
        return NextResponse.json({
          error: "too_many_requests",
          message: "每 7 天最多提交 7 次测试结果，请稍后再试",
        }, { status: 429 })
      }
      await env.CORTEX_KV.put(rateLimitKey, String(count + 1), { expirationTtl: SEVEN_DAYS_SEC })
    } catch {
      // Fail open: rate limiting unavailable, allow request
    }

    const body = await request.json()
    const { degradationIndex, tierLabel, correctCount, totalQuestions, aiUsageLevel, estimationMethod, elapsedMs } = body

    if (
      typeof degradationIndex !== "number" ||
      !Number.isInteger(degradationIndex) ||
      degradationIndex < 0 ||
      degradationIndex > 100 ||
      !(TIER_KEYS as readonly string[]).includes(tierLabel) ||
      typeof correctCount !== "number" ||
      !Number.isInteger(correctCount) ||
      correctCount < 0 ||
      typeof totalQuestions !== "number" ||
      !Number.isInteger(totalQuestions) ||
      totalQuestions < 1 ||
      correctCount > totalQuestions ||
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

    // ---- Verify result consistency against raw responses ----
    if (body.responses && Array.isArray(body.responses) && body.responses.length > 0) {
      const responseCount = body.responses.length
      const responseCorrect = body.responses.filter((r: { correct?: number }) => r.correct === 1).length
      // responses length must match totalQuestions
      if (responseCount !== totalQuestions) {
        return NextResponse.json({ error: "response_count_mismatch" }, { status: 400 })
      }
      // correctCount must match the number of correct responses
      if (responseCorrect !== correctCount) {
        return NextResponse.json({ error: "score_mismatch" }, { status: 400 })
      }
    }

    // Note: minimum duration check intentionally removed — it was
    // causing false rejections for real users completing the test quickly.

    await saveResult({
      degradationIndex,
      tierLabel,
      aiUsageLevel: aiUsageLevel ?? null,
      estimationMethod: estimationMethod === "irt" ? "irt" : "percentage",
    })

    // Store per-question response records for IRT calibration (best-effort, silent fail)
    if (body.responses && Array.isArray(body.responses) && body.responses.length > 0) {
      const userId = typeof body.deviceId === "string" ? body.deviceId : "anon"
      const thetaVal = typeof body.theta === "number" ? body.theta : null
      try {
        const db = await getDB()
        const stmts = body.responses
          .filter((r: { questionId?: number }) => typeof r?.questionId === "number")
          .map((r: { questionId: number; correct: number }) =>
            db.prepare("INSERT INTO item_responses (question_id, user_id, correct, theta) VALUES (?, ?, ?, ?)")
              .bind(r.questionId, userId, r.correct ? 1 : 0, thetaVal)
          )
        if (stmts.length > 0) await db.batch(stmts)
      } catch {
        // Silently skip batch insert failures
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/results error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
