import { NextResponse } from "next/server"
import { validateLicense, getLicenseResults } from "@/lib/auth/license"
import { generateCSV } from "@/lib/premium/export"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const licenseKey = auth.slice(7)

  const valid = await validateLicense(licenseKey)
  if (!valid.valid) {
    return NextResponse.json({ error: "invalid_license" }, { status: 403 })
  }

  try {
    const results = await getLicenseResults(licenseKey)
    const csv = generateCSV(
      results.map((r) => ({
        degradationIndex: r.degradation_index,
        tierKey: r.tier_key,
        correctCount: r.correct_count,
        totalQuestions: r.total_questions,
        dimensionScores: safeParse(r.dimension_scores),
        aiUsageLevel: r.ai_usage_level,
        estimationMethod: r.estimation_method,
        elapsedMs: r.elapsed_ms,
        createdAt: r.created_at,
      })),
    )

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cognitive-rust-results.csv"`,
      },
    })
  } catch (error) {
    console.error("[premium/export] Error:", error)
    return NextResponse.json({ error: "export_failed" }, { status: 500 })
  }
}

function safeParse(str: string): Record<string, number | null> | null {
  try { return str ? JSON.parse(str) : null } catch { return null }
}
