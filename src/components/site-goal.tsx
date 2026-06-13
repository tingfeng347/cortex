"use client"

import { useEffect, useState } from "react"
import { Target } from "lucide-react"
import { useTranslations } from "next-intl"

interface GoalData {
  avgDegradation: number | null
  totalTests: number
}

const GOAL = 50

export function SiteGoal() {
  const [data, setData] = useState<GoalData | null>(null)
  const t = useTranslations("siteGoal")

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setData({ avgDegradation: d.avgDegradation, totalTests: d.totalTests }))
      .catch(() => {})
  }, [])

  if (!data || data.avgDegradation === null) return null

  const current = data.avgDegradation
  const achieved = current < GOAL
  const progress = Math.min(100, Math.max(0, Math.round(((100 - current) / (100 - GOAL)) * 100)))

  return (
    <div className={`rounded-2xl border px-4 py-3 ${
      achieved
        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
        : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <Target className={`h-4 w-4 ${achieved ? "text-green-600" : "text-amber-600"}`} />
        <span className="text-sm font-semibold">
          {achieved ? t("achieved") : t("title")}
        </span>
        <span className="text-xs text-muted-foreground">
          {achieved
            ? t("progressAchieved", { current: current.toFixed(1), goal: GOAL })
            : t("progressBelow", { current: current.toFixed(1), goal: GOAL })}
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            achieved ? "bg-green-500" : progress > 60 ? "bg-amber-500" : "bg-red-400"
          }`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {t("participants", { count: data.totalTests.toLocaleString() })}
      </p>
    </div>
  )
}
