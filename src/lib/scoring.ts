import type { Question } from "./questions"

export interface ResultTier {
  min: number
  max: number
  label: string
  description: string
  advice: string
  color: string
  ringColor: string
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

  return {
    score,
    degradationIndex,
    correctCount,
    totalQuestions: questions.length,
    tier,
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
    "",
    result.tier.description,
    "",
    result.tier.advice,
    "",
    "在 https://cortex.hydroroll.team 测试你的认知状态",
  ]
  return lines.join("\n")
}
