"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, RefreshCw, BarChart3, Database, FileJson, Brain, Users, Zap, HardDrive, TrendingUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SiteFooter } from "@/components/site-footer"

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
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

function HourlyChart({ data }: { data: [number, number][] }) {
  if (data.length === 0) return null
  const maxVal = Math.max(...data.map(([, v]) => v), 1)

  // Round up to a nice number
  const yMax = maxVal < 10 ? 10 : Math.ceil(maxVal / (10 ** Math.floor(Math.log10(maxVal)) / 2)) * (10 ** Math.floor(Math.log10(maxVal)) / 2)
  const steps = 4

  // Layout
  const padLeft = 40, padRight = 8, padTop = 8, padBottom = 22
  const w = 600, h = 160
  const chartW = w - padLeft - padRight
  const chartH = h - padTop - padBottom
  const barW = Math.max(2, chartW / data.length - 2)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Hourly traffic chart">
      {/* Grid lines + Y labels */}
      {Array.from({ length: steps + 1 }, (_, i) => {
        const y = padTop + (chartH * i / steps)
        const val = yMax * (1 - i / steps)
        const label = val >= 1000 ? (val / 1000).toFixed(0) + "K" : String(Math.round(val))
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={w - padRight} y2={y} stroke="var(--border)" strokeWidth="0.5" />
            <text x={padLeft - 4} y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{label}</text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map(([hour, val]) => {
        const x = padLeft + (hour / 23) * chartW
        const barH = Math.max(1, (val / yMax) * chartH)
        const y = padTop + chartH - barH
        const isPeak = val === maxVal && val > 0
        return (
          <g key={hour}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={barW / 2}
              fill={isPeak ? "var(--primary)" : "var(--primary)"}
              opacity={val > 0 ? (isPeak ? 1 : 0.55) : 0.12}
            >
              <title>{String(hour).padStart(2, "0")}:00 — {val.toLocaleString()} requests</title>
            </rect>
          </g>
        )
      })}

      {/* X axis labels */}
      {[0, 6, 12, 18, 23].map((hour) => {
        const x = padLeft + (hour / 23) * chartW
        return (
          <text key={hour} x={x} y={h - 4} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
            {String(hour).padStart(2, "0")}:00
          </text>
        )
      })}
    </svg>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="size-3" />{t("errors")}</div>
                  <div className={`text-2xl font-bold tabular-nums ${data.traffic.errors > 0 ? "text-destructive" : ""}`}>{data.traffic.errors}</div>
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

            {/* D1 + KV section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><FileJson className="size-3" />{t("kvReads")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.kv.reads)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><FileJson className="size-3" />{t("kvWrites")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.kv.writes)}</div>
                </CardContent>
              </Card>
            </div>

            {/* D1 detail rows */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1"><Database className="size-4" />{t("d1Detail")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t("rowsRead")}: </span><strong className="tabular-nums">{formatNumber(data.d1.rowsRead)}</strong></div>
                <div><span className="text-muted-foreground">{t("rowsWritten")}: </span><strong className="tabular-nums">{formatNumber(data.d1.rowsWritten)}</strong></div>
                <div><span className="text-muted-foreground">{t("kvLists")}: </span><strong className="tabular-nums">{formatNumber(data.kv.lists)}</strong></div>
                <div><span className="text-muted-foreground">{t("kvDeletes")}: </span><strong className="tabular-nums">{formatNumber(data.kv.deletes)}</strong></div>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            {/* AI section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Brain className="size-3" />{t("neuronsUsed")}</div>
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(data.ai.neuronsUsed)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("ofLimit", { limit: formatNumber(data.ai.neuronsLimit) })}</div>
                </CardContent>
              </Card>
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
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Brain className="size-3" />{t("avgNeuronCost")}</div>
                  <div className="text-2xl font-bold tabular-nums">{data.ai.avgNeuronCost}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("perQuestion")}</div>
                </CardContent>
              </Card>
            </div>

            {/* AI detail */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1"><Brain className="size-4" />{t("aiDetail")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t("inputTokens")}: </span><strong className="tabular-nums">{formatNumber(data.ai.totalInputTokens)}</strong></div>
                <div><span className="text-muted-foreground">{t("outputTokens")}: </span><strong className="tabular-nums">{formatNumber(data.ai.totalOutputTokens)}</strong></div>
              </CardContent>
            </Card>

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
          </>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-8 mb-4">
          {t("autoRefresh")}
        </p>
        <SiteFooter namespace="stats" />
      </div>
    </div>
  )
}
