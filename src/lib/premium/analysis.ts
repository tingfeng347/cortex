// Per-dimension trend analysis for premium users

export interface DimensionTrend {
  dimension: "logic" | "math" | "vocab"
  label: string
  firstScore: number | null
  latestScore: number | null
  delta: number | null  // positive = improvement
  trend: "improving" | "declining" | "stable"
  tip: string
}

export interface TrendAnalysis {
  dimensions: DimensionTrend[]
  weakestDimension: DimensionTrend | null
  strongestDimension: DimensionTrend | null
  overallTrend: "improving" | "declining" | "stable"
  testCount: number
  firstTestDate: number | null
  latestTestDate: number | null
}

interface HistoryEntry {
  degradationIndex: number
  correctCount: number
  totalQuestions: number
  dimensionScores?: Record<string, number | null>
  timestamp: number
}

const DIMENSION_META: Record<string, { label: string; tip: Record<string, string> }> = {
  logic: {
    label: "逻辑推理",
    tip: {
      improving: "逻辑能力呈上升趋势，继续保持推理训练。",
      declining: "逻辑推理能力有所下滑，建议每天做一道推理题热身。",
      stable: "逻辑推理能力保持稳定。",
    },
  },
  math: {
    label: "速算",
    tip: {
      improving: "计算能力在提升，说明大脑处理速度在恢复。",
      declining: "计算速度变慢，尝试减少计算器依赖，每天做心算练习。",
      stable: "计算速度保持稳定。",
    },
  },
  vocab: {
    label: "词汇语义",
    tip: {
      improving: "语义理解能力增强，阅读广度在扩大。",
      declining: "词汇/语义感知下降，这通常和深度阅读量减少有关。",
      stable: "语义理解能力保持稳定。",
    },
  },
}

export function analyzeHistory(history: HistoryEntry[]): TrendAnalysis {
  if (history.length < 2) {
    return {
      dimensions: [],
      weakestDimension: null,
      strongestDimension: null,
      overallTrend: "stable",
      testCount: history.length,
      firstTestDate: history[0]?.timestamp ?? null,
      latestTestDate: history[history.length - 1]?.timestamp ?? null,
    }
  }

  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  // Per-dimension analysis
  const dimensions: DimensionTrend[] = (["logic", "math", "vocab"] as const).map((dim) => {
    const firstScore = first.dimensionScores?.[dim] ?? null
    const latestScore = last.dimensionScores?.[dim] ?? null
    const delta = firstScore !== null && latestScore !== null
      ? Math.round((latestScore - firstScore) * 10) / 10
      : null

    let trend: "improving" | "declining" | "stable" = "stable"
    if (delta !== null) {
      if (delta < -10) trend = "declining"
      else if (delta > 2) trend = "improving"
    }

    return {
      dimension: dim,
      label: DIMENSION_META[dim].label,
      firstScore,
      latestScore,
      delta,
      trend,
      tip: DIMENSION_META[dim].tip[trend] ?? "",
    }
  })

  // Find weakest and strongest
  const withScores = dimensions.filter((d) => d.latestScore !== null)
  const weakest = withScores.length > 0
    ? withScores.reduce((a, b) => (a.latestScore! < b.latestScore! ? a : b))
    : null
  const strongest = withScores.length > 0
    ? withScores.reduce((a, b) => (a.latestScore! > b.latestScore! ? a : b))
    : null

  // Overall trend from degradation index (lower is better)
  const degDelta = last.degradationIndex - first.degradationIndex
  let overallTrend: TrendAnalysis["overallTrend"] = "stable"
  if (degDelta > 10) overallTrend = "declining"
  else if (degDelta < -5) overallTrend = "improving"

  return {
    dimensions,
    weakestDimension: weakest,
    strongestDimension: strongest,
    overallTrend,
    testCount: sorted.length,
    firstTestDate: first.timestamp,
    latestTestDate: last.timestamp,
  }
}
