import { ImageResponse } from "@vercel/og"
import { QUESTIONS_PER_TEST } from "@/lib/questions"
import { RESULT_TIERS } from "@/lib/scoring"

export const runtime = "edge"

const TIER_CONFIG: Record<string, { label: string; color: string }> = {}
for (const t of RESULT_TIERS) {
  TIER_CONFIG[t.tierKey] = { label: t.label, color: t.ringColor }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const index = Math.min(100, Math.max(0, Number(searchParams.get("i") ?? 50)))
  const tierLabel = searchParams.get("t") ?? "moderateDecline"
  const correct = searchParams.get("c") ?? "?"
  const total = searchParams.get("n") ?? String(QUESTIONS_PER_TEST)

  const tier = TIER_CONFIG[tierLabel] ?? TIER_CONFIG["moderateDecline"]

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom, #fafafa, #f0f0f0)",
          fontFamily: '"Geist Sans", sans-serif',
          padding: "60px",
        }}
      >
        {/* Top section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "28px", color: "#888", fontWeight: 500 }}>
            认知防锈 · 基线测试
          </span>
        </div>

        {/* Degradation index circle */}
        <div
          style={{
            marginTop: "32px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            border: `12px solid ${tier.color}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
          }}
        >
          <span style={{ fontSize: "72px", fontWeight: 800, color: "#111", lineHeight: 1 }}>
            {index}
          </span>
          <span style={{ fontSize: "18px", color: "#888", marginTop: "4px" }}>/ 100</span>
        </div>

        {/* Tier badge */}
        <div
          style={{
            marginTop: "24px",
            padding: "8px 24px",
            borderRadius: "9999px",
            background: tier.color,
            color: "white",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          {tier.label}
        </div>

        {/* Correct count */}
        <div style={{ marginTop: "16px", fontSize: "18px", color: "#666" }}>
          {correct} / {total} 正确
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "16px",
            color: "#aaa",
          }}
        >
          cortex.hydroroll.team
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
