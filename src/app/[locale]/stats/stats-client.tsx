"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { normalizeDimensionScores, normalizeThetaByType } from "@/lib/scoring";
import { SiteGoal } from "@/components/site-goal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DistributionChart from "@/components/distribution-chart";
import { Link } from "@/i18n/navigation";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, Users, Brain, BarChart3 } from "lucide-react";
import { TIER_COLOR_MAP, TIER_KEYS } from "@/lib/scoring";
import { AI_CANONICAL_LEVELS } from "@/lib/constants";
import { usePremium } from "@/components/premium/usePremium";

interface StatsPageData {
  totalTests: number;
  avgDegradation: number | null;
  distribution: number[];
  tierCounts: Record<string, number>;
  aiUsageCounts: Record<string, number>;
  irtCount: number;
  pctCount: number;
  countryCounts: Record<string, number>;
}

interface HistoryEntry {
  degradationIndex: number;
  timestamp: number;
  dimensionScores?: {
    logic: number | null;
    math: number | null;
    vocab: number | null;
    event: number | null;
  };
  tierColor?: string;
}

interface UserResult {
  degradationIndex: number;
  tierLabel: string;
  tier: { label: string; color?: string };
}

export default function StatsClient() {
  const t = useTranslations("stats");
  const tierLabel = useTranslations("tier");
  const decl = useTranslations("declaration");

  const { isPremium } = usePremium();
  const [data, setData] = useState<StatsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<UserResult["tier"] | null>(null);
  const [trendDimension, setTrendDimension] = useState<
    "overall" | "logic" | "math" | "vocab" | "event"
  >("overall");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((json) => {
        setData(json as StatsPageData);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });

    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem("cognitive-rust-history");
        if (raw) {
          const parsed: HistoryEntry[] = JSON.parse(raw);
          parsed.forEach((h) => {
            if (h.dimensionScores) h.dimensionScores = normalizeDimensionScores(h.dimensionScores);
          });
          setHistory(parsed);
        }
        const resultRaw = localStorage.getItem("cognitive-rust-result");
        if (resultRaw) {
          const parsed = JSON.parse(resultRaw) as UserResult & {
            dimensionScores?: unknown;
            thetaByType?: unknown;
          };
          setUserScore(parsed.degradationIndex);
          setUserTier(parsed.tier);
        }
      } catch {
        // ignore
      }
    });
  }, []);

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{t("pageTitle")}</h1>
          <p className="text-xs text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
      </div>

      <div className="mb-6">
        <SiteGoal />
      </div>

      {/* Abuse warning banner */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/30 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="font-medium">{t("abuseWarningTitle")}</p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t("abuseWarningDesc")}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          {t("loading")}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("errorTitle")}</p>
            <Link
              href="/"
              className="text-sm text-primary underline-offset-4 hover:underline mt-4 inline-block"
            >
              {t("emptyCta")}
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
            <CardTitle>{t("emptyTitle")}</CardTitle>
            <CardDescription className="mt-2">{t("emptyDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5"
            >
              {t("emptyCta")}
            </Link>
          </CardContent>
        </Card>
      )}

      {data && !loading && data.totalTests > 0 && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground truncate">{t("totalTests")}</div>
                  <div className="text-xl font-bold tracking-tight truncate">
                    {data.totalTests.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground truncate">
                    {t("avgDegradation")}
                  </div>
                  <div className="text-xl font-bold tracking-tight truncate">
                    {data.avgDegradation !== null ? data.avgDegradation : "—"}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* User's rank */}
            {userScore !== null &&
              (() => {
                const total = data.distribution.reduce((a, b) => a + b, 0);
                const bucketIdx = Math.min(Math.floor(userScore / 10), 9);
                const below = data.distribution.slice(0, bucketIdx).reduce((a, b) => a + b, 0);
                const same = data.distribution[bucketIdx] ?? 0;
                const above = total - below - same;
                const pct = total > 0 ? Math.round((above / total) * 100) : 0;
                const tierColorMap = TIER_COLOR_MAP;
                const c = userTier?.color ?? tierColorMap[userTier?.label ?? ""] ?? "#888";
                return (
                  <Card className="col-span-2">
                    <CardContent className="flex items-center gap-3 p-4 min-w-0">
                      <div className="shrink-0 flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight tabular-nums">
                          {userScore}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                        <span className="text-muted-foreground/20">|</span>
                        <span className="text-3xl font-bold tracking-tight tabular-nums">
                          {pct}
                        </span>
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      <span className="text-muted-foreground/20 text-lg">|</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground">
                          {t("yourRank")}
                          {same > 0 ? `（${t("tied", { count: same })}）` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("ranking", { count: above })} · {t("rankedBehind", { count: below })}
                        </div>
                        {isPremium && (
                          <span className="mt-0.5 inline-block rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            ✦ Premium
                          </span>
                        )}
                        {userTier && (
                          <span
                            className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: c }}
                          >
                            {TIER_KEYS.includes(userTier.label as (typeof TIER_KEYS)[number])
                              ? tierLabel(userTier.label)
                              : userTier.label}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
          </div>

          {/* Distribution chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("distributionTitle")}</CardTitle>
              <CardDescription>{t("distributionDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionChart distribution={data.distribution} />
            </CardContent>
          </Card>

          {/* AI Usage Breakdown */}
          {Object.keys(data.aiUsageCounts).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("aiGroupTitle")}</CardTitle>
                <CardDescription>{t("aiGroupDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(data.aiUsageCounts).map(([level, count]) => {
                    const idx = AI_CANONICAL_LEVELS.indexOf(
                      level as (typeof AI_CANONICAL_LEVELS)[number],
                    );
                    const label = idx >= 0 ? (decl.raw("aiLevels") as string[])[idx] : level;
                    return (
                      <div key={level} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium tabular-nums">
                          {count} {t("aiLevelSuffix")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tier breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("tierTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.tierCounts).map(([label, count]) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-muted-foreground">{tierLabel(label)}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(count / data.totalTests) * 100}%`,
                          backgroundColor: TIER_COLOR_MAP[label] ?? "#888",
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
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("trendTitle")}</CardTitle>
              {isPremium && (
                <Badge variant="default" className="bg-amber-500 text-white text-xs">
                  ✦ Premium
                </Badge>
              )}
            </div>
            <CardDescription>{t("trendDesc", { count: history.length })}</CardDescription>
            {/* Dimension toggle */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["overall", "logic", "math", "vocab", "event"] as const).map((dim) => {
                const label =
                  dim === "overall"
                    ? t("trendOverall")
                    : dim === "logic"
                      ? t("trendLogic")
                      : dim === "math"
                        ? t("trendMath")
                        : dim === "vocab"
                          ? t("trendVocab")
                          : t("trendEvent");
                // Only show dimension toggle if there's data for it
                if (dim !== "overall") {
                  const hasData = history.some(
                    (h) =>
                      h.dimensionScores?.[dim] !== undefined && h.dimensionScores?.[dim] !== null,
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
              aria-label={t("trendAria")}
            >
              {/* Tier zone backgrounds: top=y=0 (high degradation), bottom=y=176 (low degradation) */}
              {[
                { y: 0, h: 44, fill: "#dc262615" },
                { y: 44, h: 44, fill: "#ea580c15" },
                { y: 88, h: 44, fill: "#d9770615" },
                { y: 132, h: 44, fill: "#65a30d15" },
                { y: 176, h: 44, fill: "#16a34a15" },
              ].map((zone, zi) => (
                <rect key={zi} x="40" y={zone.y} width="520" height={zone.h} fill={zone.fill} />
              ))}

              {/* Tier zone labels: reversed so top=severeDecline, bottom=cognitivePeak */}
              {[...TIER_KEYS].reverse().map((key, i) => (
                <text
                  key={key}
                  x="38"
                  y={22 + i * 44 + 22}
                  textAnchor="end"
                  fontSize="8"
                  className="fill-muted-foreground/40"
                >
                  {tierLabel(key)}
                </text>
              ))}

              {/* Y axis */}
              {[0, 25, 50, 75, 100].map((v) => {
                const y = 20 + ((100 - v) / 100) * 160;
                return (
                  <g key={v}>
                    <text
                      x="35"
                      y={y + 4}
                      textAnchor="end"
                      fontSize="11"
                      className="fill-muted-foreground"
                    >
                      {v}
                    </text>
                    <line
                      x1="40"
                      y1={y}
                      x2="560"
                      y2={y}
                      strokeWidth="0.5"
                      className="stroke-border/50"
                    />
                  </g>
                );
              })}

              {/* Line + dots — overall */}
              {trendDimension === "overall" &&
                history.map((h, i) => {
                  const x = 45 + (i / Math.max(history.length - 1, 1)) * 515;
                  const y = 20 + ((100 - h.degradationIndex) / 100) * 160;
                  return (
                    <g key={i}>
                      {i > 0 &&
                        (() => {
                          const px = 45 + ((i - 1) / Math.max(history.length - 1, 1)) * 515;
                          const py = 20 + ((100 - history[i - 1].degradationIndex) / 100) * 160;
                          return (
                            <line x1={px} y1={py} x2={x} y2={y} stroke="#888" strokeWidth="2" />
                          );
                        })()}
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill={h.tierColor || "#888"}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize="10"
                        className="fill-muted-foreground"
                      >
                        {h.degradationIndex}
                      </text>
                      {/* Date label — first, last, and every third */}
                      {(i === 0 || i === history.length - 1 || i % 3 === 0) && (
                        <text
                          x={x}
                          y={205}
                          textAnchor={
                            i === 0 ? "start" : i === history.length - 1 ? "end" : "middle"
                          }
                          fontSize="8"
                          className="fill-muted-foreground/60"
                        >
                          {new Date(h.timestamp).toLocaleDateString("zh-CN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Line + dots — per dimension */}
              {trendDimension !== "overall" &&
                history.map((h, i) => {
                  const val = h.dimensionScores?.[trendDimension];
                  if (val === undefined || val === null) return null;
                  const dimIndex = 100 - val;
                  const x = 45 + (i / Math.max(history.length - 1, 1)) * 515;
                  const y = 20 + ((100 - dimIndex) / 100) * 160;
                  const dimColor =
                    trendDimension === "logic"
                      ? "#2563eb"
                      : trendDimension === "math"
                        ? "#d97706"
                        : trendDimension === "vocab"
                          ? "#16a34a"
                          : "#8b5cf6";
                  return (
                    <g key={i}>
                      {i > 0 &&
                        (() => {
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
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize="10"
                        className="fill-muted-foreground"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

              <text
                x="310"
                y="215"
                textAnchor="middle"
                fontSize="11"
                className="fill-muted-foreground"
              >
                {t("trendAxis")}
              </text>
            </svg>

            {/* Trend summary */}
            {history.length >= 2 &&
              trendDimension === "overall" &&
              (() => {
                const first = history[0].degradationIndex;
                const last = history[history.length - 1].degradationIndex;
                const diff = last - first;
                const improved = diff < 0;
                return (
                  <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {t("trendFirst")} <span className="font-medium text-foreground">{first}</span>
                    </span>
                    <span className="text-muted-foreground/40">→</span>
                    <span>
                      {t("trendLatest")} <span className="font-medium text-foreground">{last}</span>
                    </span>
                    <span
                      className={`${improved ? "text-green-600" : diff > 0 ? "text-red-600" : "text-muted-foreground"}`}
                    >
                      {diff === 0 ? t("trendFlat") : `${improved ? "↓" : "↑"} ${Math.abs(diff)}`}
                    </span>
                  </div>
                );
              })()}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>{t("privacyNote")}</p>
        <div className="mt-3">
          <SiteFooter namespace="stats" />
        </div>
      </div>
    </>
  );
}
