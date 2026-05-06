"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import DistributionChart from "@/components/distribution-chart"
import Link from "next/link"
import { ArrowLeft, Users, Brain, BarChart3 } from "lucide-react"

interface StatsData {
  totalTests: number
  avgDegradation: number | null
  distribution: number[]
  tierCounts: Record<string, number>
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

    // Track page view
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "stats_view" }),
    }).catch(() => {})
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
            <div className="grid grid-cols-2 gap-3">
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

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          所有数据匿名收集，仅用于生成统计分布
        </p>
      </div>
    </div>
  )
}
