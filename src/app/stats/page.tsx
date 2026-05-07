"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import DistributionChart from "@/components/distribution-chart"
import Link from "next/link"
import { ArrowLeft, Users, Brain, BarChart3 } from "lucide-react"
import { QUESTIONS_PER_TEST } from "@/lib/questions"

interface StatsData {
  totalTests: number
  avgDegradation: number | null
  distribution: number[]
  tierCounts: Record<string, number>
  aiUsageCounts: Record<string, number>
}

interface HistoryEntry {
  degradationIndex: number
  tierLabel: string
  tierColor: string
  correctCount: number
  totalQuestions: number
  dimensionScores?: Record<string, number | null>
  timestamp: number
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [trendDimension, setTrendDimension] = useState<string>("overall")
  const [userScore, setUserScore] = useState<number | null>(null)
  const [userTier, setUserTier] = useState<{ label: string; color: string } | null>(null)

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error("failed")
        return res.json()
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })

    // Load personal history & latest result
    try {
      const raw = localStorage.getItem("cognitive-rust-history")
      if (raw) setHistory(JSON.parse(raw))
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem("cognitive-rust-result")
      if (raw) {
        const r = JSON.parse(raw)
        if (typeof r.degradationIndex === "number") {
          setUserScore(r.degradationIndex)
          if (r.tierLabel) setUserTier({ label: r.tierLabel, color: r.tierColor })
        }
      }
    } catch { /* ignore */ }

    // Read ?latest= from URL and persist to localStorage for chart marker
    const params = new URLSearchParams(window.location.search)
    const latest = params.get("latest")
    if (latest !== null) {
      const n = parseInt(latest, 10)
      if (!isNaN(n)) {
        // Save as pseudo-result for the chart marker
        localStorage.setItem(
          "cognitive-rust-result",
          JSON.stringify({
            degradationIndex: n,
            tierLabel: "",
            tierColor: "#dc2626",
            correctCount: 0,
            totalQuestions: QUESTIONS_PER_TEST,
            timestamp: Date.now(),
          }),
        )
      }
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">全平台统计</h1>
            <p className="text-xs text-muted-foreground">认知防锈 · 基线测试</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            加载中...
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">暂时无法获取统计数据</p>
              <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline mt-4 inline-block">
                返回测试
              </Link>
            </CardContent>
          </Card>
        )}

        {data && !loading && data.totalTests === 0 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>还没有数据</CardTitle>
              <CardDescription className="mt-2">
                成为第一个完成测试的人吧！
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5">
                开始测试
              </Link>
            </CardContent>
          </Card>
        )}

        {data && !loading && data.totalTests > 0 && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">总测试数</div>
                    <div className="text-xl font-bold tracking-tight">
                      {data.totalTests.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">平均退化指数</div>
                    <div className="text-xl font-bold tracking-tight">
                      {data.avgDegradation !== null ? data.avgDegradation : "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* User's percentile */}
              {userScore !== null && (() => {
                const total = data.distribution.reduce((a, b) => a + b, 0)
                const below = data.distribution
                  .slice(0, Math.ceil(userScore / 10))
                  .reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((below / total) * 100) : 0
                const tierColorMap: Record<string, string> = {
                  "认知巅峰": "#16a34a", "轻度退化": "#65a30d",
                  "中度退化": "#d97706", "明显退化": "#ea580c", "严重退化": "#dc2626",
                }
                const c = userTier?.color ?? tierColorMap[userTier?.label ?? ""] ?? "#888"
                return (
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: c + "15" }}
                      >
                        <span className="text-sm font-bold" style={{ color: c }}>#</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground">你的排名</div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold tracking-tight">{pct}%</span>
                          <span className="text-xs text-muted-foreground truncate">
                            超过 {below} 人
                          </span>
                        </div>
                        {userTier && (
                          <span
                            className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: c }}
                          >
                            {userTier.label}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
            </div>

            {/* Distribution chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">退化指数分布</CardTitle>
                <CardDescription>
                  大部分人的得分集中在哪个区间
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DistributionChart
                  distribution={data.distribution}
                  avgDegradation={data.avgDegradation}
                />
              </CardContent>
            </Card>

            {/* AI Usage breakdown */}
            {data.aiUsageCounts && Object.keys(data.aiUsageCounts).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">按 AI 使用量分组</CardTitle>
                  <CardDescription>
                    各 AI 使用量区间的人数分布
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(data.aiUsageCounts).map(([label, count]) => {
                      return (
                        <div key={label} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium text-foreground tabular-nums">{count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/60 transition-all"
                              style={{
                                width: `${(count / data.totalTests) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tier breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">等级分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(data.tierCounts).map(([label, count]) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(count / data.totalTests) * 100}%`,
                            backgroundColor: (() => {
                              const map: Record<string, string> = {
                                "认知巅峰": "#16a34a",
                                "轻度退化": "#65a30d",
                                "中度退化": "#d97706",
                                "明显退化": "#ea580c",
                                "严重退化": "#dc2626",
                              }
                              return map[label] ?? "#888"
                            })(),
                          }}
                        />
                      </div>
                      <span className="w-10 text-right font-medium tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Personal trend */}
        {history.length >= 2 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">个人趋势</CardTitle>
              <CardDescription>
                你的 {history.length} 次测试记录
              </CardDescription>
              {/* Dimension toggle */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["overall", "logic", "math", "vocab"].map((dim) => {
                  const label =
                    dim === "overall"
                      ? "综合"
                      : dim === "logic"
                        ? "逻辑"
                        : dim === "math"
                          ? "速算"
                          : "词汇";
                  // Only show dimension toggle if there's data for it
                  if (dim !== "overall") {
                    const hasData = history.some(
                      (h) => h.dimensionScores?.[dim] !== undefined && h.dimensionScores?.[dim] !== null,
                    );
                    if (!hasData) return null;
                  }
                  return (
                    <button
                      key={dim}
                      onClick={() => setTrendDimension(dim)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        trendDimension === dim
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              <svg
                viewBox="0 0 600 220"
                className="h-auto w-full"
                role="img"
                aria-label="个人退化指数趋势"
              >
                {/* Tier zone backgrounds */}
                {[
                  { y: 0, h: 44, fill: "#16a34a15" },
                  { y: 44, h: 44, fill: "#65a30d15" },
                  { y: 88, h: 44, fill: "#d9770615" },
                  { y: 132, h: 44, fill: "#ea580c15" },
                  { y: 176, h: 44, fill: "#dc262615" },
                ].map((zone, zi) => (
                  <rect key={zi} x="40" y={zone.y} width="520" height={zone.h} fill={zone.fill} />
                ))}

                {/* Tier zone labels */}
                {["认知巅峰", "轻度退化", "中度退化", "明显退化", "严重退化"].map((label, i) => (
                  <text
                    key={label}
                    x="38"
                    y={22 + i * 44 + 22}
                    textAnchor="end"
                    fontSize="8"
                    className="fill-muted-foreground/40"
                  >
                    {label}
                  </text>
                ))}

                {/* Y axis */}
                {[0, 25, 50, 75, 100].map((v) => {
                  const y = 20 + ((100 - v) / 100) * 160;
                  return (
                    <g key={v}>
                      <text x="35" y={y + 4} textAnchor="end" fontSize="11" className="fill-muted-foreground">
                        {v}
                      </text>
                      <line x1="40" y1={y} x2="560" y2={y} strokeWidth="0.5" className="stroke-border/50" />
                    </g>
                  );
                })}

                {/* Line + dots — overall */}
                {trendDimension === "overall" && history.map((h, i) => {
                  const x = 45 + (i / Math.max(history.length - 1, 1)) * 515;
                  const y = 20 + ((100 - h.degradationIndex) / 100) * 160;
                  return (
                    <g key={i}>
                      {i > 0 && (() => {
                        const px = 45 + ((i - 1) / Math.max(history.length - 1, 1)) * 515;
                        const py = 20 + ((100 - history[i - 1].degradationIndex) / 100) * 160;
                        return (
                          <line x1={px} y1={py} x2={x} y2={y} stroke="#888" strokeWidth="2" />
                        );
                      })()}
                      <circle cx={x} cy={y} r="5" fill={h.tierColor || "#888"} stroke="white" strokeWidth="2" />
                      <text x={x} y={y - 10} textAnchor="middle" fontSize="10" className="fill-muted-foreground">
                        {h.degradationIndex}
                      </text>
                      {/* Date label — first, last, and every third */}
                      {(i === 0 || i === history.length - 1 || i % 3 === 0) && (
                        <text
                          x={x}
                          y={205}
                          textAnchor={i === 0 ? "start" : i === history.length - 1 ? "end" : "middle"}
                          fontSize="8"
                          className="fill-muted-foreground/60"
                        >
                          {new Date(h.timestamp).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Line + dots — per dimension */}
                {trendDimension !== "overall" && history.map((h, i) => {
                  const val = h.dimensionScores?.[trendDimension];
                  if (val === undefined || val === null) return null;
                  const dimIndex = 100 - val;
                  const x = 45 + (i / Math.max(history.length - 1, 1)) * 515;
                  const y = 20 + ((100 - dimIndex) / 100) * 160;
                  const dimColor = trendDimension === "logic" ? "#2563eb" : trendDimension === "math" ? "#d97706" : "#16a34a";
                  return (
                    <g key={i}>
                      {i > 0 && (() => {
                        const prevVal = history[i - 1].dimensionScores?.[trendDimension];
                        if (prevVal === undefined || prevVal === null) return null;
                        const prevDimIndex = 100 - prevVal;
                        const px = 45 + ((i - 1) / Math.max(history.length - 1, 1)) * 515;
                        const py = 20 + ((100 - prevDimIndex) / 100) * 160;
                        return (
                          <line x1={px} y1={py} x2={x} y2={y} stroke={dimColor} strokeWidth="2" />
                        );
                      })()}
                      <circle cx={x} cy={y} r="5" fill={dimColor} stroke="white" strokeWidth="2" />
                      <text x={x} y={y - 10} textAnchor="middle" fontSize="10" className="fill-muted-foreground">
                        {val}%
                      </text>
                    </g>
                  );
                })}

                <text x="310" y="215" textAnchor="middle" fontSize="11" className="fill-muted-foreground">
                  测试次数
                </text>
              </svg>

              {/* Trend summary */}
              {history.length >= 2 && trendDimension === "overall" && (() => {
                const first = history[0].degradationIndex
                const last = history[history.length - 1].degradationIndex
                const diff = last - first
                const improved = diff < 0
                return (
                  <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span>
                      首次 <span className="font-medium text-foreground">{first}</span>
                    </span>
                    <span className="text-muted-foreground/40">→</span>
                    <span>
                      最新 <span className="font-medium text-foreground">{last}</span>
                    </span>
                    <span className={`${improved ? "text-green-600" : diff > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                      {diff === 0 ? "→ 持平" : `${improved ? "↓" : "↑"} ${Math.abs(diff)}`}
                    </span>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>所有数据匿名收集，仅用于生成统计分布</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link href="/about" className="transition-colors hover:text-foreground hover:underline underline-offset-4">
              关于
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <a
              href="https://deadpan.hydroroll.team"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground hover:underline underline-offset-4"
            >
              另一个游戏
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
