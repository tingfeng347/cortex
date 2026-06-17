"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, RefreshCw, BarChart3, Database, Brain, Users, Zap, HardDrive, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SiteFooter } from "@/components/site-footer"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface StatusData {
  cached: boolean
  cachedAt: string
  traffic: {
    requestsToday: number
    requestsTotal: number
    requestsPerHour: [number, number][]
    cpuP50: number
    cpuP99: number
    errors: number
  }
  d1: {
    readQueries: number
    writeQueries: number
    rowsRead: number
    rowsWritten: number
  }
  kv: {
    reads: number
    writes: number
    lists: number
    deletes: number
  }
  ai: {
    neuronsUsed: number
    neuronsLimit: number
    neuronsRemaining: number
    questionsInPool: number
    questionsGeneratedToday: number
    avgNeuronCost: number
    totalInputTokens: number
    totalOutputTokens: number
  }
  app: {
    totalTests: number
    activeLicenses: number
    itemResponses: number
    degradationAvg: number | null
    degradationTrend: [string, number][]
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

function HourlyChart({ data }: { data: [number, number][] }) {
  if (data.length === 0) return null
  const chartData = data.map(([hour, requests]) => ({
    hour: String(hour).padStart(2, "0") + ":00",
    requests,
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          interval={5}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v >= 1000 ? (v / 1000).toFixed(0) + "K" : String(v)}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
            padding: "6px 10px",
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
          formatter={(value) => [Number(value).toLocaleString() + " requests", ""]}
        />
        <Bar
          dataKey="requests"
          fill="var(--primary)"
          radius={[3, 3, 0, 0]}
          maxBarSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  return `${min}m ago`
}

export default function StatusClient() {
  const t = useTranslations("status")
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/status")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as StatusData
      setData(json)
      setLastFetch(Date.now())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
            <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}><CardContent className="p-4"><div className="h-4 bg-muted rounded animate-pulse mb-2" /><div className="h-8 bg-muted rounded animate-pulse" /></CardContent></Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-3xl p-4 md:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
            <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {data && (
              <span title={data.cachedAt}>
                <Clock className="size-3 inline mr-1" />
                {data.cached ? t("cached") + " " + timeAgo(data.cachedAt) : t("live")}
              </span>
            )}
            <Button variant="ghost" size="icon-xs" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">
              {t("error")}: {error}
              <Button variant="outline" size="xs" className="ml-2" onClick={fetchData}>{t("retry")}</Button>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {/* Top stat cards — Traffic */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><BarChart3 className="size-3" />{t("requestsMonth")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.traffic.requestsTotal)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><BarChart3 className="size-3" />{t("requestsToday")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.traffic.requestsToday)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Zap className="size-3" />{t("cpuP50")}</div>
                  <div className="text-2xl font-bold tabular-nums">{data.traffic.cpuP50}<span className="text-sm font-normal text-muted-foreground">ms</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Zap className="size-3" />{t("cpuP99")}</div>
                  <div className="text-2xl font-bold tabular-nums">{data.traffic.cpuP99}<span className="text-sm font-normal text-muted-foreground">ms</span></div>
                </CardContent>
              </Card>
            </div>

            {/* Hourly chart */}
            {data.traffic.requestsPerHour.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1"><Clock className="size-4" />{t("hourlyTraffic")} (UTC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <HourlyChart data={data.traffic.requestsPerHour} />
                </CardContent>
              </Card>
            )}

            {/* D1 section */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Database className="size-3" />{t("d1Reads")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.d1.readQueries)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Database className="size-3" />{t("d1Writes")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.d1.writeQueries)}</div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-6" />

            {/* AI section */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Brain className="size-3" />{t("neuronsRemaining")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.ai.neuronsRemaining)}</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (data.ai.neuronsUsed / data.ai.neuronsLimit) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><HardDrive className="size-3" />{t("poolSize")}</div>
                  <div className="text-2xl font-bold tabular-nums">{data.ai.questionsInPool}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("generatedToday", { count: data.ai.questionsGeneratedToday })}</div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-6" />

            {/* App stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="size-3" />{t("totalTests")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.app.totalTests)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="size-3" />{t("activeLicenses")}</div>
                  <div className="text-2xl font-bold tabular-nums">{data.app.activeLicenses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Database className="size-3" />{t("itemResponses")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.app.itemResponses)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="size-3" />{t("avgDegradation")}</div>
                  <div className="text-2xl font-bold tabular-nums">{data.app.degradationAvg ?? "—"}</div>
                </CardContent>
              </Card>
            </div>

            {/* Degradation trend */}
            {data.app.degradationTrend.length > 1 && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1"><TrendingUp className="size-4" />{t("degradationTrend")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data.app.degradationTrend.map(([d, v]) => ({ date: d.slice(5), value: v }))} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={36} />
                      <Tooltip
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", padding: "6px 10px" }}
                        labelStyle={{ color: "var(--muted-foreground)" }}
                        formatter={(value) => [Number(value).toFixed(1), "Avg Degradation"]}
                      />
                      <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 2, fill: "var(--primary)" }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Footer */}
        <SiteFooter namespace="stats" />
      </div>
    </div>
  )
}
