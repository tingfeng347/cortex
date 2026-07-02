import { NextResponse } from "next/server";
import { validateAICall } from "@/lib/ai-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const INTERPRET_DAILY_LIMIT = 1;

async function getKV() {
  const { env } = await getCloudflareContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).CORTEX_KV;
}

function dailyKey(licenseKey: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `ai-interpret:daily:${today}:${licenseKey}`;
}

async function checkInterpretLimit(licenseKey: string): Promise<boolean> {
  try {
    const kv = await getKV();
    if (!kv) return false;
    const key = dailyKey(licenseKey);
    const count = parseInt((await kv.get(key)) ?? "0", 10) || 0;
    return count >= INTERPRET_DAILY_LIMIT;
  } catch {
    return false;
  }
}

async function recordInterpretUse(licenseKey: string): Promise<void> {
  try {
    const kv = await getKV();
    if (!kv) return;
    const key = dailyKey(licenseKey);
    const count = (parseInt((await kv.get(key)) ?? "0", 10) || 0) + 1;
    await kv.put(key, String(count), { expirationTtl: 86400 });
  } catch {
    /* non-critical */
  }
}

interface InterpretBody {
  locale: string;
  degradationIndex: number;
  tierLabelKey: string;
  dimensionScores: {
    logic: number | null;
    math: number | null;
    vocab: number | null;
    event: number | null;
  };
  thetaByType?: Record<string, { theta: number; se: number } | null>;
  prevResult?: {
    degradationIndex: number;
    timestamp: number;
    dimensionScores?: Record<string, number | null>;
  } | null;
  testCount?: number;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  "zh-CN": `你是一位专业的认知科学研究助理。你的任务是根据用户的认知测试结果，提供简洁、科学、有洞察力的分析。

分析要点：
1. 指出整体退化指数在什么水平，以及各维度的强项和弱项
2. 如果有历史数据，指出趋势变化
3. 针对弱项给出改善建议（不要推荐具体游戏或第三方工具）
4. 语气专业、鼓励，不要制造焦虑
5. 控制在 150 字以内，用中文回复
6. 不要有任何markdown内容`,

  ja: `あなたは認知科学研究アシスタントです。テスト結果に基づいて簡潔で科学的な洞察を提供してください。

分析ポイント：
1. 全体的な退化指数と各次元の強み・弱み
2. 過去データがある場合は傾向
3. 弱みに対する改善アドバイス（具体的なゲームやツールの推薦はしない）
4. 専門的で励ます口調で
5. 150字以内、日本語で回答`,

  en: `You are a cognitive research assistant. Provide concise, scientific insights based on the test results.

Points:
1. Overall degradation index level and dimension strengths/weaknesses
2. Trend if historical data exists
3. Improvement suggestions for weak areas (don't recommend specific games or tools)
4. Professional, encouraging tone
5. Keep under 150 words, reply in English
6. Do not contain any markdown content`,
};

export async function POST(request: Request) {
  const startTs = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logCtx: Record<string, any> = {};

  try {
    // Premium check
    const auth = request.headers.get("Authorization") ?? "";
    const licenseKey = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    logCtx.licenseKey = licenseKey ? licenseKey.slice(0, 8) + "…" : null;
    if (!licenseKey) {
      console.log("[ai/interpret] missing_license", logCtx);
      return NextResponse.json({ error: "missing_license" }, { status: 401 });
    }
    const license = await validateAICall(licenseKey);
    logCtx.licenseValid = license.valid;
    if (!license.valid) {
      console.log("[ai/interpret] invalid_license", {
        ...logCtx,
        reason: license.reason,
      });
      return NextResponse.json({ error: "invalid_license" }, { status: 403 });
    }

    // Daily retry limit (default: 1)
    if (await checkInterpretLimit(licenseKey)) {
      console.log("[ai/interpret] daily_limit_exhausted", logCtx);
      return NextResponse.json({ error: "daily_limit_exhausted" }, { status: 429 });
    }

    const body: InterpretBody = await request.json();
    const {
      locale,
      degradationIndex,
      tierLabelKey,
      dimensionScores,
      thetaByType,
      prevResult,
      testCount,
    } = body;
    Object.assign(logCtx, {
      locale,
      degradationIndex,
      tierLabelKey,
      dimensionScores,
      hasTheta: !!thetaByType,
      hasPrevResult: !!prevResult,
      testCount,
    });
    console.log("[ai/interpret] request", logCtx);

    // Build the user prompt with test data
    const dimLines: string[] = [];
    for (const [key, label] of [
      ["logic", "逻辑推理/Logic"],
      ["math", "速算/Math"],
      ["vocab", "词汇语义/Vocab"],
      ["event", "事理分析/Event"],
    ] as const) {
      const score = dimensionScores[key as keyof typeof dimensionScores];
      if (score !== null) {
        const theta = thetaByType?.[key];
        dimLines.push(
          `- ${label}: ${score}分${theta ? ` (IRT θ=${theta.theta.toFixed(2)}, SE=${theta.se.toFixed(2)})` : ""}`,
        );
      }
    }

    let prompt = `## 当前测试\n- 退化指数: ${degradationIndex} (等级: ${tierLabelKey})\n- 各维度:\n${dimLines.join("\n")}`;

    if (prevResult && testCount && testCount >= 2) {
      const prevDim = prevResult.dimensionScores;
      const changes: string[] = [];
      for (const dim of ["logic", "math", "vocab", "event"] as const) {
        const cur = dimensionScores[dim];
        const prev = prevDim?.[dim] ?? null;
        if (cur !== null && prev !== null) {
          const delta = cur - prev;
          changes.push(`${dim}: ${delta > 0 ? "+" : ""}${delta}`);
        }
      }
      prompt += `\n## 历史趋势 (第 ${testCount} 次测试)\n- 上次退化指数: ${prevResult.degradationIndex}\n- 变化: ${changes.join(", ")}`;
    }

    const sysPrompt = SYSTEM_PROMPTS[locale] ?? SYSTEM_PROMPTS["en"];

    // ─── Try streaming (collect full response server-side to avoid truncation) ──

    try {
      const stream = await callAIStream(sysPrompt, prompt);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let sseBuf = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuf += decoder.decode(value, { stream: true });

        const lines = sseBuf.split("\n");
        sseBuf = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              sseBuf = "";
              break;
            }
            try {
              const parsed = JSON.parse(data);
              // DeepSeek format: choices[0].delta.content
              if (parsed.choices?.[0]?.delta?.content) {
                fullText += parsed.choices[0].delta.content;
              }
              // CF Workers AI format: response
              else if (parsed.response) {
                fullText += parsed.response;
              }
            } catch {
              /* ignore */
            }
          }
        }
      }

      // Drain any remaining partial line
      if (sseBuf.startsWith("data: ") && sseBuf.slice(6) !== "[DONE]") {
        try {
          const parsed = JSON.parse(sseBuf.slice(6));
          if (parsed.choices?.[0]?.delta?.content) fullText += parsed.choices[0].delta.content;
          else if (parsed.response) fullText += parsed.response;
        } catch {
          /* ignore */
        }
      }

      if (fullText) {
        const analysis = fullText.trim();
        const elapsed = Date.now() - startTs;
        console.log("[ai/interpret] streaming ok", {
          ...logCtx,
          analysisLen: analysis.length,
          analysisPreview: analysis.slice(0, 50),
          elapsed,
        });
        recordInterpretUse(licenseKey).catch(() => {});
        return NextResponse.json({ analysis });
      }
    } catch (e) {
      console.warn("[ai/interpret] streaming failed, falling back:", {
        ...logCtx,
        error: String(e),
      });
    }

    // ─── Fallback: non-streaming ──────────────────────────────────────────────

    try {
      const analysis = await callAI(sysPrompt, prompt);
      const elapsed = Date.now() - startTs;
      console.log("[ai/interpret] response ok", {
        ...logCtx,
        analysisLen: analysis.length,
        analysisPreview: analysis.slice(0, 50),
        elapsed,
      });
      recordInterpretUse(licenseKey).catch(() => {});
      return NextResponse.json({ analysis });
    } catch (e) {
      console.warn("[ai/interpret] non-streaming also failed:", {
        ...logCtx,
        error: String(e),
      });
    }

    // ─── Dev mock (last resort) ──────────────────────────────────────────────

    if (process.env.NODE_ENV === "development") {
      const mockAnalyses: Record<string, string> = {
        "zh-CN": `[DEV] 整体退化指数 ${degradationIndex}（${tierLabelKey}）。各维度：逻辑推理 ${dimensionScores.logic ?? "N/A"} 分、速算 ${dimensionScores.math ?? "N/A"} 分、词汇语义 ${dimensionScores.vocab ?? "N/A"} 分、事理分析 ${dimensionScores.event ?? "N/A"} 分。建议关注较低维度，定期复测追踪趋势。`,
        ja: `[DEV] 全体的な退化指数 ${degradationIndex}（${tierLabelKey}）。各次元：論理 ${dimensionScores.logic ?? "N/A"}、暗算 ${dimensionScores.math ?? "N/A"}、語彙 ${dimensionScores.vocab ?? "N/A"}、事象 ${dimensionScores.event ?? "N/A"}。低い次元に注目し、定期的に再測定して傾向を追跡してください。`,
      };
      const mock =
        mockAnalyses[locale] ??
        `[DEV] Overall degradation index ${degradationIndex} (${tierLabelKey}). Dimensions: logic ${dimensionScores.logic ?? "N/A"}, math ${dimensionScores.math ?? "N/A"}, vocab ${dimensionScores.vocab ?? "N/A"}, event ${dimensionScores.event ?? "N/A"}. Focus on weaker areas and retest regularly.`;
      console.log("[ai/interpret] method=mock", {
        ...logCtx,
        analysisLen: mock.length,
      });
      return NextResponse.json({ analysis: mock });
    }

    throw new Error("ai_unavailable");
  } catch (err) {
    const elapsed = Date.now() - startTs;
    console.error("[ai/interpret] Error:", {
      ...logCtx,
      error: String(err),
      elapsed,
    });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// ─── Streaming AI call ─────────────────────────────────────────────────────

async function callAIStream(sysPrompt: string, userPrompt: string): Promise<ReadableStream> {
  // 1) DeepSeek streaming (primary)
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deepseekKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 512,
          temperature: 0.4,
          stream: true,
        }),
      });
      if (res.ok && res.body) return res.body;
      console.warn("[ai/interpret] DeepSeek streaming api_error", {
        status: res.status,
      });
    } catch (e) {
      console.warn("[ai/interpret] DeepSeek streaming failed:", String(e));
    }
  }

  // 2) CF Workers AI binding (fallback)
  try {
    const { env } = await import("@opennextjs/cloudflare").then((m) => m.getCloudflareContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((env as any).AI) {
      const stream = await Promise.race([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (env as any).AI.run("@cf/qwen/qwen3-30b-a3b-fp8", {
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 512,
          temperature: 0.5,
          stream: true,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("env.AI streaming startup timeout")), 15000),
        ),
      ]);
      return stream as ReadableStream;
    }
  } catch (e) {
    console.warn("[ai/interpret] env.AI streaming failed:", String(e));
  }

  throw new Error("streaming_unavailable");
}

// ─── Non-streaming AI call (fallback) ──────────────────────────────────────

async function callAI(sysPrompt: string, userPrompt: string): Promise<string> {
  // 1) DeepSeek (primary)
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deepseekKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 512,
          temperature: 0.4,
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
      console.warn("[ai/interpret] DeepSeek non-streaming api_error", {
        status: res.status,
      });
    } catch (e) {
      console.warn("[ai/interpret] DeepSeek non-streaming failed:", String(e));
    }
  }

  // 2) CF Workers AI binding (fallback)
  try {
    const { env } = await import("@opennextjs/cloudflare").then((m) => m.getCloudflareContext());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((env as any).AI) {
      const result = await Promise.race([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (env as any).AI.run("@cf/qwen/qwen3-30b-a3b-fp8", {
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 512,
          temperature: 0.5,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("env.AI timeout")), 30000),
        ),
      ]);
      return (result as { response: string }).response;
    }
  } catch (e) {
    console.warn("[ai/interpret] env.AI failed:", String(e));
  }

  throw new Error("ai_unavailable");
}
