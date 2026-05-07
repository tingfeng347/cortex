"use client"

import { useTranslations } from "next-intl"
import { type DimensionScores } from "@/lib/scoring"

interface RadarChartProps {
  userScores: DimensionScores
  /** Optional average scores for comparison overlay */
  avgScores?: DimensionScores
  size?: number
}

const COLORS = {
  user: "#2563eb",
  userFill: "rgba(37, 99, 235, 0.15)",
  avg: "#888",
  avgFill: "rgba(136, 136, 136, 0.1)",
}

export default function RadarChart({
  userScores,
  avgScores,
  size = 220,
}: RadarChartProps) {
  const t = useTranslations("radar")
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38

  const AXIS_LABELS = [
    { key: "logic" as const, label: t("logic") },
    { key: "math" as const, label: t("math") },
    { key: "vocab" as const, label: t("vocab") },
  ]

  // Three axes at 120° intervals, starting at top-center (-90°)
  function point(index: number, value: number): { x: number; y: number } {
    const angle = (-90 + index * 120) * (Math.PI / 180)
    const r = (value / 100) * radius
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  // Background grid levels (20%, 40%, 60%, 80%, 100%)
  const levels = [20, 40, 60, 80, 100]

  // Draw a polygon for a set of scores
  function polygon(
    scores: DimensionScores,
    stroke: string,
    fill: string,
  ): string {
    const pts = AXIS_LABELS.map((a) => {
      const v = scores[a.key] ?? 0
      return point(AXIS_LABELS.indexOf(a), v)
    })
    return pts.map((p) => `${p.x},${p.y}`).join(" ")
  }

  // Extract values for grid checking
  function userPolygonValues(): number[] {
    return AXIS_LABELS.map((a) => userScores[a.key] ?? 0)
  }

  const userVals = userPolygonValues()

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-auto w-full"
      role="img"
      aria-label={t("ariaLabel")}
    >
      {/* Grid levels */}
      {levels.map((level) => {
        const pts = AXIS_LABELS.map((a, i) => point(i, level))
        return (
          <polygon
            key={level}
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            className="stroke-border/30"
            strokeWidth="1"
          />
        )
      })}

      {/* Axis lines */}
      {AXIS_LABELS.map((a, i) => {
        const p100 = point(i, 100)
        return (
          <line
            key={a.key}
            x1={cx}
            y1={cy}
            x2={p100.x}
            y2={p100.y}
            stroke="currentColor"
            className="stroke-border/40"
            strokeWidth="1"
          />
        )
      })}

      {/* Average overlay */}
      {avgScores && (
        <polygon
          points={polygon(avgScores, COLORS.avg, COLORS.avgFill)}
          fill={COLORS.avgFill}
          stroke={COLORS.avg}
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
      )}

      {/* User polygon */}
      <polygon
        points={polygon(userScores, COLORS.user, COLORS.userFill)}
        fill={COLORS.userFill}
        stroke={COLORS.user}
        strokeWidth="2.5"
        className="transition-all duration-500"
      />

      {/* User data points */}
      {AXIS_LABELS.map((a, i) => {
        const v = userScores[a.key]
        if (v === null) return null
        const p = point(i, v)
        return (
          <circle
            key={a.key}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={COLORS.user}
            stroke="white"
            strokeWidth="2"
          />
        )
      })}

      {/* Axis labels */}
      {AXIS_LABELS.map((a, i) => {
        const p = point(i, 115)
        return (
          <text
            key={a.key}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fontWeight="500"
            className="fill-foreground"
          >
            {a.label}
          </text>
        )
      })}

      {/* Value labels near user dots */}
      {AXIS_LABELS.map((a, i) => {
        const v = userScores[a.key]
        if (v === null) return null
        const p = point(i, v)
        // Offset text toward the outer direction
        const offset = v > 80 ? -12 : 10
        const angle = (-90 + i * 120) * (Math.PI / 180)
        const tx = p.x + offset * Math.cos(angle)
        const ty = p.y + offset * Math.sin(angle)
        return (
          <text
            key={`val-${a.key}`}
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="700"
            className="fill-blue-600"
          >
            {v}%
          </text>
        )
      })}
    </svg>
  )
}
