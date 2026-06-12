// CSV export for premium users

interface ExportEntry {
  degradationIndex: number
  tierKey: string
  correctCount: number
  totalQuestions: number
  dimensionScores: Record<string, number | null> | null
  aiUsageLevel: string | null
  estimationMethod: string
  elapsedMs: number
  createdAt: string
}

const CSV_HEADERS = [
  "日期",
  "退化指数",
  "等级",
  "正确数",
  "总题数",
  "逻辑(%)",
  "速算(%)",
  "词汇(%)",
  "AI使用量",
  "评估方式",
  "用时(秒)",
]

function escapeCsv(val: string | number | null): string {
  if (val === null || val === undefined) return ""
  const s = String(val)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function generateCSV(results: ExportEntry[]): string {
  const rows: string[] = [CSV_HEADERS.join(",")]

  for (const r of results) {
    const date = r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ""
    const logic = r.dimensionScores?.logic ?? ""
    const math = r.dimensionScores?.math ?? ""
    const vocab = r.dimensionScores?.vocab ?? ""
    const elapsed = r.elapsedMs > 0 ? Math.round(r.elapsedMs / 1000) : ""

    rows.push([
      escapeCsv(date),
      r.degradationIndex,
      escapeCsv(r.tierKey),
      r.correctCount,
      r.totalQuestions,
      logic,
      math,
      vocab,
      escapeCsv(r.aiUsageLevel),
      escapeCsv(r.estimationMethod === "irt" ? "IRT自适应" : "固定百分比"),
      elapsed,
    ].join(","))
  }

  return rows.join("\n")
}
