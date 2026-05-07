import type { Question } from "./questions"

export interface DimensionScores {
  logic: number | null // percentage correct (0-100), null if no questions of this type
  math: number | null
  vocab: number | null
}

export const DIMENSION_LABELS: Record<string, string> = {
  logic: "逻辑推理",
  math: "速算",
  vocab: "词汇语义",
}

export interface ResultTier {
  min: number
  max: number
  label: string
  description: string
  advice: string
  color: string
  ringColor: string
}

export const TIER_LABELS = ["认知巅峰", "轻度退化", "中度退化", "明显退化", "严重退化"] as const

export const TIER_COLORS = ["#16a34a", "#65a30d", "#d97706", "#ea580c", "#dc2626"] as const

// Map from Chinese tier label → color (for legacy Redis data lookup)
export const TIER_COLOR_MAP: Record<string, string> = {
  认知巅峰: "#16a34a",
  轻度退化: "#65a30d",
  中度退化: "#d97706",
  明显退化: "#ea580c",
  严重退化: "#dc2626",
}

export function getTierByIndex(index: number): ResultTier {
  return RESULT_TIERS.find((t) => index >= t.min && index <= t.max) ?? RESULT_TIERS[0]
}

export const RESULT_TIERS: ResultTier[] = [
  {
    min: 0,
    max: 20,
    label: "认知巅峰",
    description:
      "你的核心认知能力处于极佳状态。即使频繁使用 AI 工具，你依然保持着独立的深度思考习惯。你很可能在使用 AI 时保持批判性思维，将其视为工具而非替代品。",
    advice: "继续保持你当前的使用习惯。你证明了 AI 和独立思考可以共存。",
    color: "text-green-600",
    ringColor: "#16a34a",
  },
  {
    min: 21,
    max: 40,
    label: "轻度退化",
    description:
      "你的认知能力整体保持良好，但已经出现了一些轻微的退化信号。可能在某些类型的思考上开始不自觉依赖 AI。",
    advice:
      "在请 AI 帮忙之前，先给自己 30 秒独立思考的时间。这个小习惯能有效阻止退化趋势。",
    color: "text-lime-600",
    ringColor: "#65a30d",
  },
  {
    min: 41,
    max: 60,
    label: "中度退化",
    description:
      "你的认知活跃度已经出现明显下降。日常过度依赖 AI 完成思考任务，可能在不知不觉中削弱了你的独立分析能力。",
    advice:
      '建议每天留出 15 分钟的"无 AI 深度阅读/思考时间"，让大脑重新习惯独立运转。',
    color: "text-amber-600",
    ringColor: "#d97706",
  },
  {
    min: 61,
    max: 80,
    label: "明显退化",
    description:
      "检测到显著的认知能力下降。你可能已经习惯了让 AI 替你完成本应由自己完成的思考工作。",
    advice:
      "建议立即行动：1) 减少 50% 的 AI 使用量，持续一周 2) 每天做一道不借助 AI 的逻辑题 3) 一个月后重新测试。",
    color: "text-orange-600",
    ringColor: "#ea580c",
  },
  {
    min: 81,
    max: 100,
    label: "严重退化",
    description:
      '你的认知评分处于最低区间。长期依赖 AI 替代独立思考已经产生了明显影响。你的大脑正在经历"用进废退"的效应。',
    advice:
      "请认真对待这个信号。建议：1) 立即开始每日认知训练 2) 逐步延长不使用 AI 的连续思考时间 3) 培养先自己思考、再求助 AI 的习惯 4) 一个月后重新评估。",
    color: "text-red-600",
    ringColor: "#dc2626",
  },
]

export interface TestResult {
  score: number
  degradationIndex: number
  correctCount: number
  totalQuestions: number
  tier: ResultTier
  dimensionScores: DimensionScores
  answers: (number | null)[]
  timeouts: boolean[]
  questions: Question[]
}

/**
 * Calculate test result from user's answers.
 */
export function calculateResult(
  answers: (number | null)[],
  timeouts: boolean[],
  questions: Question[],
): TestResult {
  const correctCount = answers.reduce<number>((count, answer, i) => {
    if (answer === null) return count
    return count + (answer === questions[i].answer ? 1 : 0)
  }, 0)

  const score = (correctCount / questions.length) * 100
  const degradationIndex = 100 - score

  const tier =
    RESULT_TIERS.find(
      (t) => degradationIndex >= t.min && degradationIndex <= t.max,
    ) ?? RESULT_TIERS[0]

  // Per-dimension scores
  const dimCorrect: Record<string, { correct: number; total: number }> = {}
  for (let i = 0; i < questions.length; i++) {
    const type = questions[i].type
    if (!dimCorrect[type]) dimCorrect[type] = { correct: 0, total: 0 }
    dimCorrect[type].total++
    if (answers[i] !== null && answers[i] === questions[i].answer) {
      dimCorrect[type].correct++
    }
  }

  const dimensionScores: DimensionScores = {
    logic: dimCorrect.logic
      ? Math.round((dimCorrect.logic.correct / dimCorrect.logic.total) * 100)
      : null,
    math: dimCorrect.math
      ? Math.round((dimCorrect.math.correct / dimCorrect.math.total) * 100)
      : null,
    vocab: dimCorrect.vocab
      ? Math.round((dimCorrect.vocab.correct / dimCorrect.vocab.total) * 100)
      : null,
  }

  return {
    score,
    degradationIndex,
    correctCount,
    totalQuestions: questions.length,
    tier,
    dimensionScores,
    answers,
    timeouts,
    questions,
  }
}

export function generateShareText(result: TestResult): string {
  const lines = [
    "认知防锈 · 基线测试结果",
    "",
    `退化指数：${result.degradationIndex}/100 — ${result.tier.label}`,
    `正确：${result.correctCount}/${result.totalQuestions}`,
  ]

  // Add dimension scores
  const dimParts: string[] = []
  if (result.dimensionScores.logic !== null)
    dimParts.push(`逻辑 ${result.dimensionScores.logic}%`)
  if (result.dimensionScores.math !== null)
    dimParts.push(`速算 ${result.dimensionScores.math}%`)
  if (result.dimensionScores.vocab !== null)
    dimParts.push(`词汇 ${result.dimensionScores.vocab}%`)
  if (dimParts.length > 0) lines.push("", dimParts.join(" · "))

  lines.push("", result.tier.description, "", result.tier.advice, "")
  lines.push("在 https://cortex.hydroroll.team 测试你的认知状态")
  return lines.join("\n")
}
