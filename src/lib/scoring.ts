import type { Question } from "./questions"

/**
 * Score a user's answer against the correct answer(s).
 *
 * Single-select: 0 (wrong) or 1 (correct).
 * Multi-select:  0 (picked any wrong option),
 *                 otherwise fraction of correct options selected (partial credit).
 */
export function scoreAnswer(
  userAnswer: number | null | number[],
  correctAnswer: number | number[],
): number {
  if (userAnswer === null) return 0
  // Multi-select with multi-answer
  if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
    const correctSet = new Set(correctAnswer)
    // Any wrong option → 0
    if (userAnswer.some((a) => !correctSet.has(a))) return 0
    // Fraction of correct options selected
    return userAnswer.length / correctAnswer.length
  }
  // Multi-select answer but single-select user input
  if (Array.isArray(correctAnswer)) return correctAnswer.includes(userAnswer as number) ? 1 : 0
  // Single-select both sides
  return userAnswer === correctAnswer ? 1 : 0
}

/** Convenience: did the user get full credit? */
export function isCorrect(
  userAnswer: number | null | number[],
  correctAnswer: number | number[],
): boolean {
  return scoreAnswer(userAnswer, correctAnswer) === 1
}

export interface DimensionScores {
  logic: number | null // percentage correct (0-100), null if no questions of this type
  math: number | null
  vocab: number | null
  event: number | null
}

// Dimension labels — kept for backward compat, use `n("radar." + type)` for display
export const DIMENSION_LABELS: Record<string, string> = {
  logic: "逻辑推理",
  math: "速算",
  vocab: "词汇语义",
  event: "事件事理",
}

const ALL_DIMS = ["logic", "math", "vocab", "event"] as const

/** Normalize dimension scores from old-format data that may lack newer dimensions. */
export function normalizeDimensionScores(raw: unknown): DimensionScores {
  const obj = (raw ?? {}) as Record<string, unknown>
  return {
    logic: typeof obj.logic === "number" ? obj.logic : null,
    math: typeof obj.math === "number" ? obj.math : null,
    vocab: typeof obj.vocab === "number" ? obj.vocab : null,
    event: typeof obj.event === "number" ? obj.event : null,
  }
}

/** Normalize thetaByType from old-format data that may lack newer dimensions. */
export function normalizeThetaByType(raw: unknown): TestResult["thetaByType"] {
  const obj = (raw ?? {}) as Record<string, unknown>
  const dim = (key: string) => {
    const v = obj[key] as { theta: number; se: number } | null | undefined
    return v && typeof v.theta === "number" && typeof v.se === "number" ? v : null
  }
  return {
    logic: dim("logic"),
    math: dim("math"),
    vocab: dim("vocab"),
    event: dim("event"),
  }
}

export interface ResultTier {
  min: number
  max: number
  label: string
  description: string
  advice: string
  tierKey: string
  color: string
  ringColor: string
}

export const TIER_LABELS = ["cognitivePeak", "mildDecline", "moderateDecline", "significantDecline", "severeDecline"] as const

export const TIER_KEYS = ["cognitivePeak", "mildDecline", "moderateDecline", "significantDecline", "severeDecline"] as const

export const TIER_COLORS = ["#16a34a", "#65a30d", "#d97706", "#ea580c", "#dc2626"] as const

// Map from legacy Chinese tier label → color (for localStorage backward compat)
export const TIER_COLOR_MAP: Record<string, string> = {
  认知巅峰: "#16a34a",
  轻度退化: "#65a30d",
  中度退化: "#d97706",
  明显退化: "#ea580c",
  严重退化: "#dc2626",
  cognitivePeak: "#16a34a",
  mildDecline: "#65a30d",
  moderateDecline: "#d97706",
  significantDecline: "#ea580c",
  severeDecline: "#dc2626",
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
    tierKey: "cognitivePeak",
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
    tierKey: "mildDecline",
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
    tierKey: "moderateDecline",
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
    tierKey: "significantDecline",
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
    tierKey: "severeDecline",
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
  answers: (number | null | number[])[]
  timeouts: boolean[]
  questions: Question[]
  /** Phase 1: how the degradation index was computed */
  estimationMethod?: "percentage" | "irt"
  /** IRT: ability estimate in logits (range ~ -3 to +3) */
  theta?: number
  /** IRT: standard error of the theta estimate */
  thetaSE?: number
  /** IRT: per-dimension theta estimates */
  thetaByType?: {
    logic: { theta: number; se: number } | null
    math: { theta: number; se: number } | null
    vocab: { theta: number; se: number } | null
    event: { theta: number; se: number } | null
  }
}

/**
 * Standard normal CDF (Φ(z)) using Abramowitz & Stegun approximation.
 *
 * Φ(x) = 0.5 × (1 + sign(x) × erf(|x| / √2))
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  // Scale by 1/√2 — the A&S formula approximates erf(z), and Φ(x) = 0.5·(1 + erf(x/√2))
  const z = Math.abs(x) / Math.SQRT2

  const t = 1 / (1 + p * z)
  const erf =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z))

  return 0.5 * (1 + sign * erf)
}

/**
 * Map an IRT ability estimate (theta, logits) to the 0-100 degradation index.
 *
 *   percentile = Φ(theta) × 100
 *   degradationIndex = 100 − percentile
 *
 * theta = 0 (average) → degradationIndex ≈ 50 (moderate decline).
 * theta = +1.5 → degradationIndex ≈ 7 (cognitive peak).
 */
export function abilityToDegradationIndex(theta: number): number {
  const percentile = normalCDF(theta) * 100
  return Math.round(Math.max(0, Math.min(100, 100 - percentile)))
}

/**
 * Calculate test result from user's answers.
 */
export function calculateResult(
  answers: (number | null | number[]) [],
  timeouts: boolean[],
  questions: Question[],
): TestResult {
  const correctCount = answers.reduce<number>((count, answer, i) => {
    if (answer === null) return count
    return count + scoreAnswer(answer, questions[i].answer)
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
    dimCorrect[type].correct += scoreAnswer(answers[i], questions[i].answer)
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
    event: dimCorrect.event
      ? Math.round((dimCorrect.event.correct / dimCorrect.event.total) * 100)
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
    estimationMethod: "percentage",
  }
}

export function getChallengeCopy(tierKey: string, index: number): string {
  const challenges: Record<string, string> = {
    cognitivePeak: `I scored ${index}/100 — cognitive peak. Think you can beat me?`,
    mildDecline: `I scored ${index}/100 on the cognitive rust test. Can you do better?`,
    moderateDecline: `AI might be making me rusty. I scored ${index}/100. What's your score?`,
    significantDecline: `OK this is concerning. I got ${index}/100. Time to see where you stand.`,
    severeDecline: `The AI brain rust is real. ${index}/100. Dare to test yourself?`,
  }
  return challenges[tierKey] ?? challenges.moderateDecline
}

export function generateShareText(result: TestResult, labels?: {
  site: string
  degradation: string
  correct: string
  tier: string
  description: string
  advice: string
  logic: string
  math: string
  vocab: string
  event: string
  cta: string
}): string {
  const l = labels ?? {
    site: "认知防锈 · 基线测试结果",
    degradation: "退化指数",
    correct: "正确",
    tier: result.tier.label,
    description: result.tier.description,
    advice: result.tier.advice,
    logic: "逻辑",
    math: "速算",
    vocab: "词汇",
    event: "事理",
    cta: "在 https://cortex.hydroroll.team 测试你的认知状态",
  }
  const lines = [
    l.site,
    "",
    `${l.degradation}：${result.degradationIndex}/100 — ${l.tier}`,
    `${l.correct}：${result.correctCount}/${result.totalQuestions}`,
  ]

  // Add dimension scores
  const dimParts: string[] = []
  if (result.dimensionScores.logic !== null)
    dimParts.push(`${l.logic} ${result.dimensionScores.logic}%`)
  if (result.dimensionScores.math !== null)
    dimParts.push(`${l.math} ${result.dimensionScores.math}%`)
  if (result.dimensionScores.vocab !== null)
    dimParts.push(`${l.vocab} ${result.dimensionScores.vocab}%`)
  if (result.dimensionScores.event !== null)
    dimParts.push(`${l.event} ${result.dimensionScores.event}%`)
  if (dimParts.length > 0) lines.push("", dimParts.join(" · "))

  lines.push("", l.description, "", l.advice, "")
  lines.push(l.cta)
  return lines.join("\n")
}
