"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TIER_COLORS, TIER_KEYS } from "@/lib/scoring";

interface ChartProps {
  distribution: number[];
}

export default function DistributionChart({ distribution }: ChartProps) {
  const t = useTranslations("distribution");
  const tierT = useTranslations("tier");
  const [userScore, setUserScore] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [userTierKey, setUserTierKey] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem("cognitive-rust-result");
        if (saved) {
          const data = JSON.parse(saved);
          setUserScore(data.degradationIndex);
          setUserTier(data.tierLabel);
          setUserTierKey(data.tierLabelKey ?? null);
        }
      } catch {
        // ignore
      }
    });
  }, []);

  const maxCount = Math.max(...distribution, 1);
  const total = distribution.reduce((a, b) => a + b, 0);
  return (
    <div className="w-full">
      {/* Chart area */}
      <div className="relative">
        <svg
          viewBox="0 0 600 280"
          className="w-full h-auto"
          role="img"
          aria-label={t("ariaLabel")}
        >
          {/* Y axis labels */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 240 - (i / 4) * 200;
            const label = Math.round((maxCount / 4) * i);
            return (
              <g key={i}>
                <text
                  x="35"
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize="11"
                >
                  {label}
                </text>
                <line
                  x1="40"
                  y1={y}
                  x2="580"
                  y2={y}
                  stroke="currentColor"
                  className="stroke-border/50"
                  strokeWidth="0.5"
                />
              </g>
            );
          })}

          {/* Bars */}
          {distribution.map((count, i) => {
            const barWidth = 46;
            const gap = 8;
            const x = 45 + i * (barWidth + gap);
            const barHeight = maxCount > 0 ? (count / maxCount) * 200 : 0;

            // Determine tier: 0-10 → 0, 11-20 → 0, 21-30 → 1, etc.
            const tierIndex = Math.min(Math.floor((i * 10 + 5) / 20), 4);
            const color = TIER_COLORS[tierIndex];

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={240 - barHeight}
                  width={barWidth}
                  height={Math.max(barHeight, 0.5)}
                  fill={color}
                  rx="3"
                  opacity="0.8"
                  className="transition-opacity hover:opacity-100"
                />
                {/* Count label on top of bar */}
                {count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={240 - barHeight - 6}
                    textAnchor="middle"
                    fontSize="10"
                    className="fill-muted-foreground"
                  >
                    {count}
                  </text>
                )}
                {/* X axis label */}
                <text
                  x={x + barWidth / 2}
                  y="262"
                  textAnchor="middle"
                  fontSize="10"
                  className="fill-muted-foreground"
                >
                  {i * 10}-{(i + 1) * 10}
                </text>
              </g>
            );
          })}

          {/* X axis full range */}
          <text
            x="310"
            y="278"
            textAnchor="middle"
            fontSize="11"
            className="fill-muted-foreground"
          >
            {t("xAxis")}
          </text>

          {/* User marker */}
          {userScore !== null && (
            <g>
              <line
                x1={45 + (userScore / 100) * (540 - 45)}
                y1="20"
                x2={45 + (userScore / 100) * (540 - 45)}
                y2="240"
                stroke="#dc2626"
                strokeWidth="2"
                strokeDasharray="4,3"
              />
              <circle
                cx={45 + (userScore / 100) * (540 - 45)}
                cy="20"
                r="5"
                fill="#dc2626"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={45 + (userScore / 100) * (540 - 45)}
                y="12"
                textAnchor="middle"
                fontSize="11"
                fill="#dc2626"
                fontWeight="bold"
              >
                {t("userMarker")}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Tier legend */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {TIER_KEYS.map((key, i) => (
          <div
            key={key}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TIER_COLORS[i] }}
            />
            {tierT(key)}
          </div>
        ))}
      </div>

      {/* User result summary */}
      {userScore !== null && total > 0 && (
        <div className="mt-4 rounded-lg border bg-card p-3 text-sm">
          <div className="font-medium text-foreground">{t("yourResult")}</div>
          <div className="mt-1 text-muted-foreground">
            {t("degradationLabel")}{" "}
            <span className="font-semibold text-foreground">{userScore}</span>
            {userTier && (
              <>
                {" · "}
                <span>{userTierKey ? tierT(userTierKey) : userTier}</span>
              </>
            )}
            {" · "}
            {t("exceeds", {
              pct:
                total > 0
                  ? Math.round(
                    (distribution
                      .slice(0, Math.ceil(userScore / 10))
                      .reduce((a, b) => a + b, 0) /
                      total) *
                    100,
                  )
                  : 0,
            })}
          </div>
        </div>
      )}
    </div>
  );
}
