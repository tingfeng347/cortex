import { NextResponse } from "next/server"
import { validateLicense, getLicenseResults, saveTestResult } from "@/lib/auth/license"
import { normalizeDimensionScores, normalizeThetaByType } from "@/lib/scoring"

function getLicenseKey(request: Request): string | null {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice(7)
}

export async function GET(request: Request) {
  const licenseKey = getLicenseKey(request)
  if (!licenseKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const valid = await validateLicense(licenseKey)
  if (!valid.valid) {
    return NextResponse.json({ error: "invalid_license" }, { status: 403 })
  }

  try {
    const results = await getLicenseResults(licenseKey)
    return NextResponse.json({
      results: results.map((r) => ({
        degradationIndex: r.degradation_index,
        tierKey: r.tier_key,
        correctCount: r.correct_count,
        totalQuestions: r.total_questions,
        dimensionScores: normalizeDimensionScores(safeJsonParse(r.dimension_scores)),
        aiUsageLevel: r.ai_usage_level,
        estimationMethod: r.estimation_method,
        theta: r.theta,
        thetaSE: r.theta_se,
        thetaByType: normalizeThetaByType(safeJsonParse(r.theta_by_type ?? null)),
        elapsedMs: r.elapsed_ms,
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    console.error("[results/sync] GET error:", error)
    return NextResponse.json({ error: "sync_failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const licenseKey = getLicenseKey(request)
  if (!licenseKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const valid = await validateLicense(licenseKey)
  if (!valid.valid) {
    return NextResponse.json({ error: "invalid_license" }, { status: 403 })
  }

  try {
    const { results } = (await request.json()) as {
      results?: Array<{
        degradationIndex: number
        tierKey: string
        correctCount: number
        totalQuestions: number
        dimensionScores: Record<string, number | null>
        aiUsageLevel: string | null
        estimationMethod: string
        theta: number | null
        thetaSE: number | null
        thetaByType: Record<string, number> | null
        elapsedMs: number
      }>
    }

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 })
    }

    for (const r of results) {
      await saveTestResult(licenseKey, {
        degradationIndex: r.degradationIndex,
        tierKey: r.tierKey,
        correctCount: r.correctCount,
        totalQuestions: r.totalQuestions,
        dimensionScores: JSON.stringify(r.dimensionScores),
        aiUsageLevel: r.aiUsageLevel,
        estimationMethod: r.estimationMethod,
        theta: r.theta ?? null,
        thetaSE: r.thetaSE ?? null,
        thetaByType: r.thetaByType ? JSON.stringify(r.thetaByType) : null,
        elapsedMs: r.elapsedMs,
      })
    }

    return NextResponse.json({ ok: true, count: results.length })
  } catch (error) {
    console.error("[results/sync] POST error:", error)
    return NextResponse.json({ error: "sync_failed" }, { status: 500 })
  }
}

function safeJsonParse(str: string | null): unknown {
  if (!str) return null
  try { return JSON.parse(str) } catch { return null }
}
