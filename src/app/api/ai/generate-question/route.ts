import { NextResponse } from "next/server";
import { validateAICall, countPremiumForQuota } from "@/lib/ai-auth";
import {
  findAiQuestionInPool,
  saveAiQuestion,
  incrementAiQuestionUsage,
  loadAiPoolQuestions,
  type AiQuestionRow,
} from "@/lib/ai/questions-d1";
import { readDailyQuota, recordNeuronUsage, getAverageNeuronCost } from "@/lib/ai/quota-kv";

// Model: @cf/qwen/qwen3-30b-a3b-fp8
// Input:  4,625 neurons / 1M tokens
// Output: 30,475 neurons / 1M tokens
const INPUT_NEURON_RATE = 4625 / 1_000_000;
const OUTPUT_NEURON_RATE = 30475 / 1_000_000;
const DAILY_NEURON_LIMIT = 10000;

interface RequestBody {
  locale: string;
  type: "logic" | "math" | "vocab" | "event";
  theta: number;
  recentTypes: string[];
  recentKeywords: string[];
}

// ─── Locale-specific system prompts ───────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  "zh-CN": `你是认知测试的出题专家。你的任务是根据要求生成一道高质量的多选题。

## 出题原则
1. 题目必须有真实的生活场景，贴合"现代人过度依赖AI后认知能力退化"的主题
2. 不考纯知识记忆，考逻辑推理、日常计算、语言敏感度、事理分析
3. 答案必须唯一且可严格证明——不能是"最佳答案"，必须是筛掉错误选项后唯一可能的结果
4. 每个干扰项都要有独立的迷惑性：看起来有道理但存在硬伤，不能一眼排除，也不能非黑即白
5. 题干、选项和解析中不得出现"选项A/B/C/D"、"正确答案是……"等硬编码文字
6. 所有选项长度和风格相近，不暗示正确答案

## 题目格式要求
- 如果題干超过 2 句话，必须用自然段分隔，段间空一行，不要堆成一大段
- 选项一句话说完，不要嵌套解释

## 数学题特殊要求
- 计算量必须在 30 秒内心算完成，偏向估算推理而非解方程
- 如果解题需要列二元一次方程，说明题目太复杂，改用比例法或代入法即可求解的场景
- 优先考数据敏感性（数量级估算、百分比比较、速率推理）

## 输出格式
必须输出纯 JSON，不要 markdown 包裹，不要其他文字：
{
  "question": "题干文本",
  "options": ["选项1", "选项2", "选项3", "选项4"],
  "answer": 0,
  "explanation": "详细的解析，分步说明为什么正确选项唯一"
}`,

  en: `You are a cognitive test question designer. Create a high-quality multiple-choice question.

## Principles
1. Use realistic everyday scenarios related to "cognitive decline from over-reliance on AI"
2. Test reasoning, mental math, language sensitivity, and event analysis — NOT rote knowledge
3. Rigorous logic with a single, provably correct answer
4. Never hardcode "Option A/B/C/D" or "the correct answer is…" in the question, options, or explanation
5. All options should be similar in length and style

## Output format
Pure JSON, no markdown wrapping, no extra text:
{
  "question": "Question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "answer": 0,
  "explanation": "Step-by-step explanation of the correct answer"
}`,

  ja: `あなたは認知テストの問題作成者です。高品質な選択問題を作成してください。

## 原則
1. AIへの過度な依存による認知能力低下に関連する、現実的な日常シーンを使用
2. 丸暗記ではなく、論理的推論、暗算、言語感覚、事象分析をテスト
3. 厳密な論理で、唯一の正解が導けること
4. 問題文・選択肢・解説に「選択肢A/B/C/D」や「正解は…」などのハードコードをしない
5. すべての選択肢の長さとスタイルを揃える

## 出力形式
JSONのみ、markdown wrapperなし、余計なテキストなし：
{
  "question": "問題文",
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "answer": 0,
  "explanation": "正解の段階的な解説"
}`,
};

// ─── Type-specific scenario guidance ──────────────────────────────────────

const TYPE_GUIDANCE: Record<string, Record<string, string>> = {
  "zh-CN": {
    logic:
      "场景：断案、证词矛盾、排班冲突、多人陈述的逻辑推理。关键：至少两个干扰项必须有看似合理的论证路径，但最终被一个小细节推翻。不能设一眼为假的选项。推理链条必须清晰。",
    math: "场景：日常消费计算、折扣分摊、时间差估算、概率估算、数据对比。必须能在 30 秒内心算完成。优先数量级估算、比例推理、代入排除法。不要出需要列方程组的题。",
    vocab: "场景：选择合适的词语/成语填入空白处。考察易混淆词、成语的适用语境、用词准确性。",
    event:
      "场景：给多个事件或句子，要求判断正确的时间顺序或因果链条。干扰项必须有同样看似合理的顺序，需要仔细分析才能区分。",
  },
  en: {
    logic:
      "Scenario: crime investigations, contradictory testimonies, scheduling conflicts, contract loopholes, multi-person logical reasoning. Must have a clear reasoning chain.",
    math: "Scenario: everyday purchase calculations, bill splitting, time estimation, probability estimation, data comparison. Requires mental math, no complex formulas.",
    vocab:
      "Scenario: choose the correct word/idiom to fill in a blank. Tests easily confused words, contextual appropriateness, word precision.",
    event:
      "Scenario: given multiple events or sentences, determine the correct temporal order or causal chain. Tests event analysis ability.",
  },
  ja: {
    logic:
      "シナリオ：事件捜査、矛盾する証言、スケジュール調整、契約の抜け穴、複数人物の論理的推論。明確な推理が必要。",
    math: "シナリオ：日常の買い物計算、割り勘、時間の見積もり、確率の推定、データ比較。暗算が必要で複雑な式は不要。",
    vocab:
      "シナリオ：空白に適切な語句/慣用句を選ぶ。紛らわしい語句、慣用句の適切な文脈、語彙の正確さをテスト。",
    event:
      "シナリオ：複数の出来事や文を与え、正しい時間順序や因果関係を判断する。事象分析力をテスト。",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  // Rough estimate: Chinese ~1.5 chars/token, mixed ~2 chars/token
  return Math.ceil(text.length / 2);
}

function calcNeurons(inputTokens: number, outputTokens: number): number {
  return inputTokens * INPUT_NEURON_RATE + outputTokens * OUTPUT_NEURON_RATE;
}

function getLicenseKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

// ─── Quota Check ──────────────────────────────────────────────────────────

async function checkQuota(
  isPremium: boolean,
  neuronCost: number,
): Promise<{ ok: boolean; reason?: string }> {
  const quota = await readDailyQuota();
  const totalUsed = quota.totalNeurons;

  // Hard limit
  if (totalUsed + neuronCost > DAILY_NEURON_LIMIT) {
    return { ok: false, reason: "daily_limit_exhausted" };
  }

  // Free users: must stay within non-reserved pool
  if (!isPremium) {
    const premiumCount = await countPremiumForQuota();
    const avgCost = await getAverageNeuronCost();
    const premiumReserved = premiumCount * 2 * Math.max(avgCost, 11);

    if (totalUsed + neuronCost > DAILY_NEURON_LIMIT - premiumReserved) {
      return { ok: false, reason: "free_quota_exhausted" };
    }
  }

  return { ok: true };
}

// ─── GET: Load AI pool questions for a locale ────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "zh-CN";

  try {
    const rows = await loadAiPoolQuestions(locale);
    const questions = rows.map((r: AiQuestionRow) => ({
      id: 100000 + r.id,
      type: r.type,
      category: r.type,
      question: r.question,
      options: JSON.parse(r.options),
      answer: r.answer,
      explanation: r.explanation,
      difficulty: r.difficulty,
      discrimination: r.discrimination,
      guessing: r.guessing,
      source: "llm-pool" as const,
    }));
    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[ai/generate-question] GET error:", err);
    return NextResponse.json({ questions: [] });
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { locale, type, theta, recentTypes, recentKeywords } = body;

    if (!locale || !type) {
      return NextResponse.json({ error: "missing locale or type" }, { status: 400 });
    }

    // Determine premium status
    const licenseKey = getLicenseKey(request);
    let isPremium = false;
    if (licenseKey) {
      const valid = await validateAICall(licenseKey);
      isPremium = valid.valid;
    }

    // Step 1: Try D1 pool first (no neuron cost)
    const poolQuestion = await findAiQuestionInPool(locale, type, theta, 0.5);
    if (poolQuestion) {
      await incrementAiQuestionUsage(poolQuestion.id);
      return NextResponse.json({
        question: {
          id: 100000 + poolQuestion.id,
          type: poolQuestion.type,
          category: poolQuestion.type,
          question: poolQuestion.question,
          options: JSON.parse(poolQuestion.options),
          answer: poolQuestion.answer,
          explanation: poolQuestion.explanation,
          difficulty: poolQuestion.difficulty,
          discrimination: poolQuestion.discrimination,
          guessing: poolQuestion.guessing,
          source: "llm-pool",
        },
        sourceType: "pool",
        neuronCost: 0,
        isPremium,
      });
    }

    // Step 2: Estimate neuron cost for quota check
    const sysPrompt = SYSTEM_PROMPTS[locale] ?? SYSTEM_PROMPTS["en"];
    const guidance = TYPE_GUIDANCE[locale]?.[type] ?? "";
    const recentStr =
      recentTypes.length > 0 ? `最近已出过的题目类型：${recentTypes.slice(-20).join("、")}` : "";
    const keywordStr =
      recentKeywords.length > 0
        ? `请避免与以下关键词重复的内容：${recentKeywords.slice(-20).join("、")}`
        : "";
    const diffDesc = theta <= -1 ? "较简单" : theta >= 1 ? "较难" : "中等难度";

    // Estimate token counts for quota check
    const estimatedInputTokens = estimateTokens(
      sysPrompt + guidance + recentStr + keywordStr + diffDesc,
    );
    const estimatedOutputTokens = 300;
    const estimatedNeuronCost = calcNeurons(estimatedInputTokens, estimatedOutputTokens);

    // Check quota using estimated cost
    const quota = await checkQuota(isPremium, estimatedNeuronCost);
    if (!quota.ok) {
      return NextResponse.json({
        question: null,
        sourceType: null,
        neuronCost: 0,
        isPremium,
        reason: quota.reason,
      });
    }

    // Step 3: Generate via AI
    const userPrompt = generatePrompt(
      locale,
      type,
      theta,
      guidance,
      recentStr,
      keywordStr,
      diffDesc,
    );

    const result = await callAI(sysPrompt, userPrompt);
    if (!result) {
      return NextResponse.json({
        question: null,
        sourceType: null,
        neuronCost: 0,
        isPremium,
        reason: "generation_failed",
      });
    }

    const { response: aiResponse, usage } = result;
    const inputTokens = usage?.prompt_tokens ?? estimatedInputTokens;
    const outputTokens = usage?.completion_tokens ?? estimatedOutputTokens;
    const actualNeuronCost = calcNeurons(inputTokens, outputTokens);

    // Parse JSON from AI response
    const parsed = parseJsonResponse(aiResponse);
    if (!parsed) {
      return NextResponse.json({
        question: null,
        sourceType: null,
        neuronCost: 0,
        isPremium,
        reason: "parse_failed",
      });
    }

    // Step 4: Build Question object
    const aiQuestion = {
      id: -(Date.now() % 1000000), // temporary negative ID
      type,
      category: type,
      question: parsed.question,
      options: parsed.options,
      answer: parsed.answer,
      explanation: parsed.explanation,
      difficulty: theta,
      discrimination: 1.0,
      guessing: 0.25,
      source: "llm" as const,
    };

    // Step 5: Store accounting data before returning, so status/quota cannot drift.
    try {
      await saveAiQuestion({
        locale,
        type,
        question: parsed.question,
        options: parsed.options,
        answer: parsed.answer,
        explanation: parsed.explanation,
        difficulty: theta,
        discrimination: 1.0,
        guessing: 0.25,
        inputTokens,
        outputTokens,
        neuronCost: actualNeuronCost,
        createdForLicense: isPremium ? (licenseKey ?? undefined) : undefined,
      });
      await recordNeuronUsage(actualNeuronCost);
    } catch (e) {
      console.error("[ai/generate-question] accounting failed:", e);
      return NextResponse.json(
        {
          question: null,
          sourceType: null,
          neuronCost: 0,
          isPremium,
          reason: "accounting_failed",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      question: aiQuestion,
      sourceType: "generated",
      neuronCost: actualNeuronCost,
      isPremium,
    });
  } catch (err) {
    console.error("[ai/generate-question] Error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// ─── Prompt Builder ───────────────────────────────────────────────────────

function generatePrompt(
  locale: string,
  type: string,
  theta: number,
  guidance: string,
  recentStr: string,
  keywordStr: string,
  diffDesc: string,
): string {
  const prompts: Record<string, string> = {
    "zh-CN": `请出一道「${typeLabel("zh-CN", type)}」类型的认知测试题。

难度：${diffDesc}（theta=${theta.toFixed(2)}，范围 -3 到 +3，越高越难）
${guidance}
${recentStr}
${keywordStr}

以指定 JSON 格式输出，题目要有场景感，答案必须严谨唯一。`,

    en: `Create a cognitive test question of type "${typeLabel("en", type)}".

Difficulty: ${diffDesc} (theta=${theta.toFixed(2)}, range -3 to +3, higher = harder)
${guidance}
${recentStr}
${keywordStr}

Output in the specified JSON format. The question must have a realistic scenario.`,

    ja: `「${typeLabel("ja", type)}」タイプの認知テスト問題を作成してください。

難易度：${diffDesc}（theta=${theta.toFixed(2)}、-3〜+3、高いほど難しい）
${guidance}
${recentStr}
${keywordStr}

指定されたJSON形式で出力。現実的なシナリオを含めること。`,
  };

  return prompts[locale] ?? prompts["en"];
}

function typeLabel(locale: string, type: string): string {
  const labels: Record<string, Record<string, string>> = {
    "zh-CN": { logic: "逻辑推理", math: "速算", vocab: "词汇语义", event: "事理分析" },
    en: { logic: "Logic", math: "Math", vocab: "Vocabulary", event: "Event Analysis" },
    ja: { logic: "論理", math: "暗算", vocab: "語彙", event: "事象分析" },
  };
  return labels[locale]?.[type] ?? type;
}

// ─── AI Call ──────────────────────────────────────────────────────────────

async function callAI(
  sysPrompt: string,
  userPrompt: string,
): Promise<{
  response: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
} | null> {
  // Primary: DeepSeek REST API
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
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return {
          response: data.choices[0].message.content,
          usage: data.usage,
        };
      }
      console.warn(
        "[ai/generate-question] DeepSeek unexpected response:",
        JSON.stringify(data).slice(0, 200),
      );
    } catch (e) {
      console.warn("[ai/generate-question] DeepSeek failed:", String(e));
    }
  }

  // Fallback: CF Workers AI binding
  try {
    const { env } = await import("@opennextjs/cloudflare").then((m) => m.getCloudflareContext());
    const ai = (
      env as CloudflareEnv & {
        AI?: {
          run: (model: string, input: unknown) => Promise<unknown>;
        };
      }
    ).AI;
    if (ai) {
      const result = await Promise.race([
        ai.run("@cf/qwen/qwen3-30b-a3b-fp8", {
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1024,
          temperature: 0.4,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("env.AI timeout")), 30000),
        ),
      ]);
      const r = result as {
        response?: unknown;
        usage?: { prompt_tokens: number; completion_tokens: number };
      };
      if (r) {
        if (typeof r.response === "string") return { response: r.response, usage: r.usage };
        if (typeof r.response === "object" && r.response !== null) {
          return { response: JSON.stringify(r.response), usage: r.usage };
        }
      }
    }
  } catch (e) {
    console.warn("[ai/generate-question] env.AI failed:", String(e));
  }

  return null;
}

// ─── JSON Parser ──────────────────────────────────────────────────────────

interface ParsedAiQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

function isParsedAiQuestion(value: unknown): value is ParsedAiQuestion {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ParsedAiQuestion>;
  return (
    typeof candidate.question === "string" &&
    Array.isArray(candidate.options) &&
    candidate.options.every((option) => typeof option === "string") &&
    typeof candidate.answer === "number" &&
    typeof candidate.explanation === "string"
  );
}

function parseJsonResponse(text: unknown): {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
} | null {
  if (typeof text !== "string") return null;
  try {
    // Try direct parse first
    const trimmed = text.trim();
    const parsed: unknown = JSON.parse(trimmed);
    if (isParsedAiQuestion(parsed)) {
      return parsed;
    }
  } catch {
    // Try extracting JSON from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        const parsed: unknown = JSON.parse(match[1].trim());
        if (isParsedAiQuestion(parsed)) {
          return parsed;
        }
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}
