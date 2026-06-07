"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DistributionChart from "@/components/distribution-chart";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Users, Brain, BarChart3, Clock, Globe } from "lucide-react";
import { TIER_COLOR_MAP, TIER_KEYS } from "@/lib/scoring";
import { AI_CANONICAL_LEVELS } from "@/lib/constants";

interface StatsPageData {
  totalTests: number;
  avgDegradation: number | null;
  distribution: number[];
  tierCounts: Record<string, number>;
  aiUsageCounts: Record<string, number>;
  irtCount: number;
  pctCount: number;
  countryCounts: Record<string, number>;
  avgElapsedMs: number | null;
  avgLogic: number | null;
  avgMath: number | null;
  avgVocab: number | null;
}

interface HistoryEntry {
  degradationIndex: number;
  timestamp: number;
  dimensionScores?: {
    logic: number | null;
    math: number | null;
    vocab: number | null;
  };
  tierColor?: string;
}

interface UserResult {
  degradationIndex: number;
  tierLabel: string;
  tier: { label: string; color?: string };
}

export default function StatsPage() {
  const t = useTranslations("stats");
  const tierLabel = useTranslations("tier");
  const decl = useTranslations("declaration");
  const radar = useTranslations("radar");
  const locale = useLocale();

  const getCountryName = (code: string) => {
    try {
      const names = new Intl.DisplayNames([locale], { type: "region" });
      return names.of(code) ?? code;
    } catch {
      return code;
    }
  };

  const [data, setData] = useState<StatsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<UserResult["tier"] | null>(null);
  const [trendDimension, setTrendDimension] = useState<
    "overall" | "logic" | "math" | "vocab"
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

    // Load user history from localStorage
    try {
      const raw = localStorage.getItem("cognitive-rust-history");
      if (raw) {
        const parsed: HistoryEntry[] = JSON.parse(raw);
        setHistory(parsed);
      }
      const resultRaw = localStorage.getItem("cognitive-rust-result");
      if (resultRaw) {
        const parsed: UserResult = JSON.parse(resultRaw);
        setUserScore(parsed.degradationIndex);
        setUserTier(parsed.tier);
      }
    } catch {
      // ignore
    }
  }, []);

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
            <h1 className="text-lg font-semibold tracking-tight">
              {t("pageTitle")}
            </h1>
            <p className="text-xs text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
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
              <CardDescription className="mt-2">
                {t("emptyDesc")}
              </CardDescription>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("totalTests")}
                    </div>
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
                    <div className="text-xs text-muted-foreground">
                      {t("avgDegradation")}
                    </div>
                    <div className="text-xl font-bold tracking-tight">
                      {data.avgDegradation !== null ? data.avgDegradation : "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* User's percentile */}
              {userScore !== null &&
                (() => {
                  const total = data.distribution.reduce((a, b) => a + b, 0);
                  const below = data.distribution
                    .slice(0, Math.ceil(userScore / 10))
                    .reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((below / total) * 100) : 0;
                  const tierColorMap = TIER_COLOR_MAP;
                  const c =
                    userTier?.color ??
                    tierColorMap[userTier?.label ?? ""] ??
                    "#888";
                  return (
                    <Card>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: c + "15" }}
                        >
                          <span
                            className="text-sm font-bold"
                            style={{ color: c }}
                          >
                            #
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground">
                            {t("yourRank")}
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold tracking-tight">
                              {pct}%
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {t("ranking", { count: below })}
                            </span>
                          </div>
                          {userTier && (
                            <span
                              className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                              style={{ backgroundColor: c }}
                            >
                              {TIER_KEYS.includes(
                                userTier.label as (typeof TIER_KEYS)[number],
                              )
                                ? tierLabel(userTier.label)
                                : userTier.label}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              {/* Avg elapsed */}
              {data.avgElapsedMs !== null && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {t("avgElapsed")}
                      </div>
                      <div className="text-xl font-bold tracking-tight">
                        {Math.round(data.avgElapsedMs / 60000)}min
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Distribution chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("distributionTitle")}
                </CardTitle>
                <CardDescription>{t("distributionDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <DistributionChart
                  distribution={data.distribution}
                  avgDegradation={data.avgDegradation}
                />
              </CardContent>
            </Card>

            {/* AI Usage Breakdown */}
            {Object.keys(data.aiUsageCounts).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t("aiGroupTitle")}
                  </CardTitle>
                  <CardDescription>{t("aiGroupDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(data.aiUsageCounts).map(
                      ([level, count]) => {
                        const idx = AI_CANONICAL_LEVELS.indexOf(
                          level as (typeof AI_CANONICAL_LEVELS)[number],
                        );
                        const label =
                          idx >= 0
                            ? (decl.raw("aiLevels") as string[])[idx]
                            : level;
                        return (
                          <div
                            key={level}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {label}
                            </span>
                            <span className="font-medium tabular-nums">
                              {count} {t("aiLevelSuffix")}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Country distribution */}
            {Object.keys(data.countryCounts).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t("countryTitle")}
                  </CardTitle>
                  <CardDescription>{t("countryDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(data.countryCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([code, count]) => (
                        <div
                          key={code}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {getCountryName(code)}
                          </span>
                          <span className="font-medium tabular-nums">
                            {count}
                          </span>
                        </div>
                      ))}
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
                    <div
                      key={label}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-20 shrink-0 text-muted-foreground">
                        {tierLabel(label)}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(count / data.totalTests) * 100}%`,
                              backgroundColor: TIER_COLOR_MAP[label] ?? "#888",
                            }}
                          />
                        </div>
                        <span className="w-10 text-right font-medium tabular-nums">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Dimension averages */}
            {(data.avgLogic !== null ||
              data.avgMath !== null ||
              data.avgVocab !== null) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t("dimAvgTitle")}
                  </CardTitle>
                  <CardDescription>{t("dimAvgDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.avgLogic !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {radar("logic")}
                        </span>
                        <span className="font-medium tabular-nums">
                          {data.avgLogic}%
                        </span>
                      </div>
                    )}
                    {data.avgMath !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {radar("math")}
                        </span>
                        <span className="font-medium tabular-nums">
                          {data.avgMath}%
                        </span>
                      </div>
                    )}
                    {data.avgVocab !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {radar("vocab")}
                        </span>
                        <span className="font-medium tabular-nums">
                          {data.avgVocab}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
          )}

          {/* Personal trend */}
          {history.length >= 2 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("trendTitle")}</CardTitle>
              <CardDescription>
                {t("trendDesc", { count: history.length })}
              </CardDescription>
              {/* Dimension toggle */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(["overall", "logic", "math", "vocab"] as const).map((dim) => {
                  const label =
                    dim === "overall"
                      ? t("trendOverall")
                      : dim === "logic"
                        ? t("trendLogic")
                        : dim === "math"
                          ? t("trendMath")
                          : t("trendVocab");
                  // Only show dimension toggle if there's data for it
                  if (dim !== "overall") {
                    const hasData = history.some(
                      (h) =>
                        h.dimensionScores?.[dim] !== undefined &&
                        h.dimensionScores?.[dim] !== null,
                    );
                    if (!hasData) return null;
                  }
                  return (
                    <button
                      key={dim}
                      onClick={() => setTrendDimension(dim)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${trendDimension === dim
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
                {/* Tier zone backgrounds */}
                {[
                  { y: 0, h: 44, fill: "#16a34a15" },
                  { y: 44, h: 44, fill: "#65a30d15" },
                  { y: 88, h: 44, fill: "#d9770615" },
                  { y: 132, h: 44, fill: "#ea580c15" },
                  { y: 176, h: 44, fill: "#dc262615" },
                ].map((zone, zi) => (
                  <rect
                    key={zi}
                    x="40"
                    y={zone.y}
                    width="520"
                    height={zone.h}
                    fill={zone.fill}
                  />
                ))}

                {/* Tier zone labels */}
                {TIER_KEYS.map((key, i) => (
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
                            const px =
                              45 +
                              ((i - 1) / Math.max(history.length - 1, 1)) * 515;
                            const py =
                              20 +
                              ((100 - history[i - 1].degradationIndex) / 100) *
                              160;
                            return (
                              <line
                                x1={px}
                                y1={py}
                                x2={x}
                                y2={y}
                                stroke="#888"
                                strokeWidth="2"
                              />
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
                        {(i === 0 ||
                          i === history.length - 1 ||
                          i % 3 === 0) && (
                            <text
                              x={x}
                              y={205}
                              textAnchor={
                                i === 0
                                  ? "start"
                                  : i === history.length - 1
                                    ? "end"
                                    : "middle"
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
                          : "#16a34a";
                    return (
                      <g key={i}>
                        {i > 0 &&
                          (() => {
                            const prevVal =
                              history[i - 1].dimensionScores?.[trendDimension];
                            if (prevVal === undefined || prevVal === null)
                              return null;
                            const prevDimIndex = 100 - prevVal;
                            const px =
                              45 +
                              ((i - 1) / Math.max(history.length - 1, 1)) * 515;
                            const py = 20 + ((100 - prevDimIndex) / 100) * 160;
                            return (
                              <line
                                x1={px}
                                y1={py}
                                x2={x}
                                y2={y}
                                stroke={dimColor}
                                strokeWidth="2"
                              />
                            );
                          })()}
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill={dimColor}
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
                        {t("trendFirst")}{" "}
                        <span className="font-medium text-foreground">
                          {first}
                        </span>
                      </span>
                      <span className="text-muted-foreground/40">→</span>
                      <span>
                        {t("trendLatest")}{" "}
                        <span className="font-medium text-foreground">
                          {last}
                        </span>
                      </span>
                      <span
                        className={`${improved ? "text-green-600" : diff > 0 ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        {diff === 0
                          ? t("trendFlat")
                          : `${improved ? "↓" : "↑"} ${Math.abs(diff)}`}
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
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link
              href="/about"
              className="transition-colors hover:text-foreground hover:underline underline-offset-4"
            >
              {t("aboutLink")}
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <a
              href="https://deadpan.hydroroll.team"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground hover:underline underline-offset-4"
            >
              {t("otherGame")}
            </a>
            <span className="text-muted-foreground/40">|</span>
            <a
              href="https://ddlroast.hydroroll.team"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground hover:underline underline-offset-4"
            >
              {t("ddlRoast")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
