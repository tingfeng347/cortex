import { QUESTIONS_PER_TEST } from "@/lib/questions"
import { RESULT_TIERS } from "@/lib/scoring"

const TIER_CONFIG: Record<string, { label: string; color: string }> = {}
for (const t of RESULT_TIERS) {
  TIER_CONFIG[t.tierKey] = { label: t.label, color: t.ringColor }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const index = Math.min(100, Math.max(0, Number(searchParams.get("i") ?? 50)))
    const tierKey = searchParams.get("t") ?? "moderateDecline"
    const correct = searchParams.get("c") ?? "?"
    const total = searchParams.get("n") ?? String(QUESTIONS_PER_TEST)
    const challengeText = searchParams.get("challenge") ?? ""

    const tier = TIER_CONFIG[tierKey] ?? TIER_CONFIG["moderateDecline"]

    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fafafa"/>
      <stop offset="100%" stop-color="#f0f0f0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="90" text-anchor="middle" font-size="28" fill="#888" font-weight="500" font-family="sans-serif">认知防锈 · 基线测试</text>

  <circle cx="600" cy="260" r="100" fill="white" stroke="${esc(tier.color)}" stroke-width="12"/>
  <text x="600" y="245" text-anchor="middle" font-size="72" font-weight="800" fill="#111" font-family="sans-serif">${index}</text>
  <text x="600" y="278" text-anchor="middle" font-size="18" fill="#888" font-family="sans-serif">/ 100</text>

  <rect x="${600 - (esc(tier.label).length * 14 + 48) / 2}" y="350" width="${esc(tier.label).length * 14 + 48}" height="42" rx="21" fill="${esc(tier.color)}"/>
  <text x="600" y="378" text-anchor="middle" font-size="20" font-weight="600" fill="white" font-family="sans-serif">${esc(tier.label)}</text>

  <text x="600" y="428" text-anchor="middle" font-size="18" fill="#666" font-family="sans-serif">${esc(correct)} / ${esc(total)} 正确</text>
${challengeText ? `  <text x="600" y="478" text-anchor="middle" font-size="20" fill="#444" font-family="sans-serif">${esc(challengeText)}</text>\n` : ""}
  <text x="600" y="580" text-anchor="middle" font-size="16" fill="#aaa" font-family="sans-serif">cortex.hydroroll.team</text>
</svg>`

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    })
  } catch (err) {
    console.error("OG image error:", err)
    return new Response("OG generation failed", { status: 500 })
  }
}
