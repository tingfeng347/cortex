import { NextResponse } from "next/server"
import { validateLicense } from "@/lib/auth/license"

interface InterpretBody {
  locale: string
  degradationIndex: number
  tierLabelKey: string
  dimensionScores: {
    logic: number | null
    math: number | null
    vocab: number | null
    event: number | null
  }
  thetaByType?: Record<string, { theta: number; se: number } | null>
  prevResult?: {
    degradationIndex: number
    timestamp: number
    dimensionScores?: Record<string, number | null>
  } | null
  testCount?: number
}

const SYSTEM_PROMPTS: Record<string, string> = {
  "zh-CN": `你是一位专业的认知科学研究助理。你的任务是根据用户的认知测试结果，提供简洁、科学、有洞察力的分析。

分析要点：
1. 指出整体退化指数在什么水平，以及各维度的强项和弱项
2. 如果有历史数据，指出趋势变化
3. 针对弱项给出改善建议（不要推荐具体游戏或第三方工具）
4. 语气专业、鼓励，不要制造焦虑
5. 控制在 150 字以内，用中文回复`,

  "ja": `あなたは認知科学研究アシスタントです。テスト結果に基づいて簡潔で科学的な洞察を提供してください。

分析ポイント：
1. 全体的な退化指数と各次元の強み・弱み
2. 過去データがある場合は傾向
3. 弱みに対する改善アドバイス（具体的なゲームやツールの推薦はしない）
4. 専門的で励ます口調で
5. 150字以内、日本語で回答`,

  "en": `You are a cognitive research assistant. Provide concise, scientific insights based on the test results.

Points:
1. Overall degradation index level and dimension strengths/weaknesses
2. Trend if historical data exists
3. Improvement suggestions for weak areas (don't recommend specific games or tools)
4. Professional, encouraging tone
5. Keep under 150 words, reply in English`,
}

export async function POST(request: Request) {
  const startTs = Date.now()
  const logCtx: Record<string, any> = {}

  try {
    // Premium check
    const auth = request.headers.get("Authorization") ?? ""
    const licenseKey = auth.startsWith("Bearer ") ? auth.slice(7) : ""
    logCtx.licenseKey = licenseKey ? licenseKey.slice(0, 8) + "…" : null
    if (!licenseKey) {
      console.log("[ai/interpret] missing_license", logCtx)
      return NextResponse.json({ error: "missing_license" }, { status: 401 })
    }
    const license = await validateLicense(licenseKey)
    logCtx.licenseValid = license.valid
    if (!license.valid) {
      console.log("[ai/interpret] invalid_license", { ...logCtx, reason: license.reason })
      return NextResponse.json({ error: "invalid_license" }, { status: 403 })
    }

    const body: InterpretBody = await request.json()
    const { locale, degradationIndex, tierLabelKey, dimensionScores, thetaByType, prevResult, testCount } = body
    Object.assign(logCtx, {
      locale,
      degradationIndex,
      tierLabelKey,
      dimensionScores,
      hasTheta: !!thetaByType,
      hasPrevResult: !!prevResult,
      testCount,
    })
    console.log("[ai/interpret] request", logCtx)

    // Build the user prompt with test data
    const dimLines: string[] = []
    for (const [key, label] of [["logic", "逻辑推理/Logic"], ["math", "速算/Math"], ["vocab", "词汇语义/Vocab"], ["event", "事理分析/Event"]] as const) {
      const score = dimensionScores[key as keyof typeof dimensionScores]
      if (score !== null) {
        const theta = thetaByType?.[key]
        dimLines.push(`- ${label}: ${score}分${theta ? ` (IRT θ=${theta.theta.toFixed(2)}, SE=${theta.se.toFixed(2)})` : ""}`)
      }
    }

    let prompt = `## 当前测试\n- 退化指数: ${degradationIndex} (等级: ${tierLabelKey})\n- 各维度:\n${dimLines.join("\n")}`

    if (prevResult && testCount && testCount >= 2) {
      const prevDim = prevResult.dimensionScores
      const changes: string[] = []
      for (const dim of ["logic", "math", "vocab", "event"] as const) {
        const cur = dimensionScores[dim]
        const prev = prevDim?.[dim] ?? null
        if (cur !== null && prev !== null) {
          const delta = cur - prev
          changes.push(`${dim}: ${delta > 0 ? "+" : ""}${delta}`)
        }
      }
      prompt += `\n## 历史趋势 (第 ${testCount} 次测试)\n- 上次退化指数: ${prevResult.degradationIndex}\n- 变化: ${changes.join(", ")}`
    }

    const sysPrompt = SYSTEM_PROMPTS[locale] ?? SYSTEM_PROMPTS["en"]

    // Try Workers AI binding first (Cloudflare runtime)
    async function callAI(): Promise<string> {
      // 1) Try env.AI binding (production or wrangler dev)
      try {
        const { env } = await import("@opennextjs/cloudflare").then((m) =>
          m.getCloudflareContext(),
        )
        if ((env as any).AI) {
          console.log("[ai/interpret] method=env.AI", logCtx)
          const result = await Promise.race([
            (env as any).AI.run("@cf/qwen/qwen3-30b-a3b-fp8", {
              messages: [
                { role: "system", content: sysPrompt },
                { role: "user", content: prompt },
              ],
              max_tokens: 512,
              temperature: 0.5,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("env.AI timeout")), 5000)
            ),
          ])
          const analysisLen = (result as { response: string }).response.length
          const elapsed = Date.now() - startTs
          console.log("[ai/interpret] method=env.AI ok", { ...logCtx, analysisLen, elapsed })
          return (result as { response: string }).response
        }
      } catch (e) {
        console.warn("[ai/interpret] method=env.AI failed", { ...logCtx, error: String(e) })
      }

      // 2) Dev fallback: use REST API directly with Cloudflare credentials
      if (process.env.NODE_ENV === "development") {
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
        const apiToken = process.env.CLOUDFLARE_API_TOKEN
        if (accountId && apiToken) {
          console.log("[ai/interpret] method=REST", logCtx)
          try {
            const res = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/qwen/qwen3-30b-a3b-fp8`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  messages: [
                    { role: "system", content: sysPrompt },
                    { role: "user", content: prompt },
                  ],
                  max_tokens: 512,
                  temperature: 0.5,
                }),
              },
            )
            const data = await res.json()
            if (data.success && data.result?.response) {
              const analysisLen = data.result.response.length
              const elapsed = Date.now() - startTs
              console.log("[ai/interpret] method=REST ok", { ...logCtx, analysisLen, elapsed })
              return data.result.response
            }
            console.warn("[ai/interpret] method=REST api_error", { ...logCtx, status: res.status, apiResult: data })
          } catch (e) {
            console.warn("[ai/interpret] method=REST failed", { ...logCtx, error: String(e) })
          }
        } else {
          console.log("[ai/interpret] method=REST skipped (no credentials)", logCtx)
        }
      }

      // 3) Last resort: dev mock
      if (process.env.NODE_ENV === "development") {
        const mockAnalyses: Record<string, string> = {
          "zh-CN": `[DEV] 整体退化指数 ${degradationIndex}（${tierLabelKey}）。各维度：逻辑推理 ${dimensionScores.logic ?? "N/A"} 分、速算 ${dimensionScores.math ?? "N/A"} 分、词汇语义 ${dimensionScores.vocab ?? "N/A"} 分、事理分析 ${dimensionScores.event ?? "N/A"} 分。建议关注较低维度，定期复测追踪趋势。`,
          "ja": `[DEV] 全体的な退化指数 ${degradationIndex}（${tierLabelKey}）。各次元：論理 ${dimensionScores.logic ?? "N/A"}、暗算 ${dimensionScores.math ?? "N/A"}、語彙 ${dimensionScores.vocab ?? "N/A"}、事象 ${dimensionScores.event ?? "N/A"}。低い次元に注目し、定期的に再測定して傾向を追跡してください。`,
        }
        const mock = mockAnalyses[locale] ?? `[DEV] Overall degradation index ${degradationIndex} (${tierLabelKey}). Dimensions: logic ${dimensionScores.logic ?? "N/A"}, math ${dimensionScores.math ?? "N/A"}, vocab ${dimensionScores.vocab ?? "N/A"}, event ${dimensionScores.event ?? "N/A"}. Focus on weaker areas and retest regularly.`
        console.log("[ai/interpret] method=mock", { ...logCtx, analysisLen: mock.length })
        return mock
      }

      throw new Error("ai_unavailable")
    }

    const analysis = (await callAI()).trim()
    const elapsed = Date.now() - startTs
    console.log("[ai/interpret] response ok", { ...logCtx, analysisLen: analysis.length, analysisPreview: analysis.slice(0, 50), elapsed })
    return NextResponse.json({ analysis })
  } catch (err) {
    const elapsed = Date.now() - startTs
    console.error("[ai/interpret] Error:", { ...logCtx, error: String(err), elapsed })
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
