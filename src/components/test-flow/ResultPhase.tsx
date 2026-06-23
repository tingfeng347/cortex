import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Minus, Flag } from "lucide-react";
import {
  normalCDF,
  abilityToDegradationIndex,
  scoreAnswer,
  isCorrect,
  type TestResult,
  type DimensionScores,
} from "@/lib/scoring";
import RadarChart from "@/components/radar-chart";
import { DegradationGauge } from "./DegradationGauge";
import { usePremium } from "../premium/usePremium";
import { analyzeHistory, type TrendAnalysis } from "@/lib/premium/analysis";

interface ResultPhaseProps {
  result: TestResult;
  prevResult: {
    degradationIndex: number;
    tierLabel: string;
    tierLabelKey?: string;
    tierColor: string;
    correctCount: number;
    totalQuestions: number;
    dimensionScores?: DimensionScores;
    timestamp: number;
  } | null;
  aiUsage: number | null;
  showExplanations: boolean;
  setShowExplanations: (v: boolean) => void;
  isDownloading: boolean;
  handleShare: () => void;
  handleSetReminder: () => void;
  handleRestart: () => void;
  handleDownloadImage: () => void;
  flaggedIds: Set<number>;
  hasFlaggedBefore: boolean;
  onToggleFlag: (qId: number) => void;
}

export function ResultPhase({
  result,
  prevResult,
  aiUsage,
  showExplanations,
  setShowExplanations,
  isDownloading,
  handleShare,
  handleSetReminder,
  handleRestart,
  handleDownloadImage,
  flaggedIds,
  hasFlaggedBefore,
  onToggleFlag,
}: ResultPhaseProps) {
  const n = useTranslations();
  const locale = useLocale();
  const [showScoringInfo, setShowScoringInfo] = useState(false);
  const { isPremium, licenseKey } = usePremium();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cognitive-rust-result");
      if (!raw) return;
      const entry = JSON.parse(raw);
      if (!entry.timestamp) return;
      const cached = localStorage.getItem(`cortex:ai-interpret:${entry.timestamp}`);
      if (cached) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAiAnalysis(cached);
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleExportCSV() {
    if (!licenseKey) return;
    try {
      const res = await fetch("/api/premium/export", {
        headers: { Authorization: `Bearer ${licenseKey}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cognitive-rust-results.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      /* silent */
    }
  }

  const testCount: number = (() => {
    try {
      const raw = localStorage.getItem("cognitive-rust-history");
      if (!raw) return 1;
      const history = JSON.parse(raw);
      return Array.isArray(history) ? history.length : 1;
    } catch {
      return 1;
    }
  })();
  const isFirstTest = testCount === 1;

  async function handleAiInterpret() {
    if (!isPremium) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const body = {
        locale,
        degradationIndex: result.degradationIndex,
        tierLabelKey: result.tier.tierKey,
        dimensionScores: result.dimensionScores,
        thetaByType: result.thetaByType,
        prevResult: prevResult
          ? {
              degradationIndex: prevResult.degradationIndex,
              timestamp: prevResult.timestamp,
              dimensionScores: prevResult.dimensionScores,
            }
          : null,
        testCount,
      };
      const res = await fetch("/api/ai/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${licenseKey}`,
        },
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        setAiError(n("result.interpretLimitExhausted"));
        setAiLoading(false);
        return;
      }
      if (!res.ok) throw new Error("API error");

      const contentType = res.headers.get("Content-Type") || "";

      if (contentType.includes("text/event-stream")) {
        // Streaming response
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullAnalysis = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.response) {
                  fullAnalysis += parsed.response;
                  setAiAnalysis(fullAnalysis);
                }
              } catch {
                /* ignore */
              }
            }
          }
        }

        // Cache to localStorage
        try {
          const entryRaw = localStorage.getItem("cognitive-rust-result");
          if (entryRaw) {
            const entry = JSON.parse(entryRaw);
            if (entry.timestamp) {
              localStorage.setItem(`cortex:ai-interpret:${entry.timestamp}`, fullAnalysis);
            }
          }
        } catch {
          /* ignore */
        }
      } else {
        // Non-streaming fallback
        const data = await res.json();
        setAiAnalysis(data.analysis);
        try {
          const entryRaw = localStorage.getItem("cognitive-rust-result");
          if (entryRaw) {
            const entry = JSON.parse(entryRaw);
            if (entry.timestamp) {
              localStorage.setItem(`cortex:ai-interpret:${entry.timestamp}`, data.analysis);
            }
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      setAiError(n("result.aiInterpretError"));
    } finally {
      setAiLoading(false);
    }
  }

  const analysis: TrendAnalysis | null = useMemo(() => {
    if (!isPremium) return null;
    try {
      const raw = localStorage.getItem("cognitive-rust-history");
      if (!raw) return null;
      const history = JSON.parse(raw);
      if (!Array.isArray(history) || history.length < 2) return null;
      return analyzeHistory(history);
    } catch {
      return null;
    }
  }, [isPremium, result]);

  return (
    <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-2xl tracking-tight">
          {isFirstTest ? n("result.firstTestTitle") : n("result.title")}
        </CardTitle>
        <CardDescription className="text-balance">
          {isFirstTest ? (
            <>
              首次测试用于建立个人认知基线，
              <br />
              单次分数暂不具有独立参考意义。
              <br />
              完成第二次测试后，你将看到变化趋势与改善分析。
            </>
          ) : (
            n("result.subtitle")
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Flagged count */}
        {flaggedIds.size > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Flag className="mr-1 inline h-4 w-4" />
            {n("result.flaggedCount", { count: flaggedIds.size })}
          </div>
        )}

        {/* Gauge + Tier — hidden on first test */}
        {!isFirstTest && (
          <div className="text-center">
            <DegradationGauge index={result.degradationIndex} ringColor={result.tier.ringColor} />
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <Badge
                className="px-3 py-1 text-sm"
                style={{
                  backgroundColor: result.tier.ringColor,
                  color: "#fff",
                }}
              >
                {n("tier." + result.tier.tierKey)}
              </Badge>
              {result.estimationMethod === "irt" && (
                <Link
                  href="/about#irt-scoring"
                  className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground decoration-dotted underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  IRT
                </Link>
              )}
              {isPremium && (
                <Badge variant="default" className="bg-amber-500 text-white text-xs">
                  ✦ Premium
                </Badge>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {n("tier." + result.tier.tierKey + "Desc")}
            </p>
          </div>
        )}

        {/* AI Usage context */}
        {aiUsage !== null && (
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{n("result.aiUsageLabel")}</span>
              <span className="font-medium text-foreground">
                {(n.raw("declaration.aiLevels") as string[])[aiUsage]}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {n("result.description")}
            </p>
          </div>
        )}

        {/* Scoring method explanation — hidden on first test */}
        {!isFirstTest && (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
            <button
              onClick={() => setShowScoringInfo(!showScoringInfo)}
              className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{n("result.scoringCalcTitle")}</span>
              <span className="text-[10px]">{showScoringInfo ? "▲" : "▼"}</span>
            </button>
            <p className="mt-1.5 text-[10px] leading-tight text-muted-foreground/50">
              评分仅供参考，不代表任何认知能力评估结论
            </p>
            {showScoringInfo && (
              <div className="mt-3 space-y-2">
                {result.estimationMethod === "irt" ? (
                  <>
                    <p className="text-xs font-medium text-foreground">
                      {n.rich("result.scoringIrtSteps", {
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {result.theta !== undefined ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span>{n("result.scoringIrtTheta")}</span>
                            <span className="font-mono tabular-nums text-foreground">
                              {result.theta.toFixed(2)}
                              {result.thetaSE !== undefined && (
                                <span className="text-muted-foreground">
                                  {" ± "}
                                  {result.thetaSE.toFixed(2)}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{n("result.scoringIrtPercentile")}</span>
                            <span className="font-mono tabular-nums text-foreground">
                              {(normalCDF(result.theta) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="shrink-0">{n("result.scoringIrtFormula")}</span>
                            <span className="text-right font-mono tabular-nums text-foreground">
                              {"100 − "}
                              {(normalCDF(result.theta) * 100).toFixed(1)}
                              {" ≈ "}
                              <strong>{result.degradationIndex}</strong>
                            </span>
                          </div>

                          {/* Per-dimension theta */}
                          {result.thetaByType && (
                            <div className="mt-2 border-t border-dashed border-muted-foreground/20 pt-2">
                              <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                                {n("result.scoringByDimension")}
                              </p>
                              <div className="space-y-1">
                                {(["logic", "math", "vocab", "event"] as const).map((dim) => {
                                  const dimTheta = result.thetaByType?.[dim];
                                  if (!dimTheta) return null;
                                  const dimDI = abilityToDegradationIndex(dimTheta.theta);
                                  return (
                                    <div
                                      key={dim}
                                      className="flex items-center justify-between gap-2"
                                    >
                                      <span className="shrink-0 text-muted-foreground">
                                        {n("radar." + dim)}
                                      </span>
                                      <span className="text-right font-mono tabular-nums text-foreground">
                                        θ = {dimTheta.theta.toFixed(2)}
                                        <span className="text-muted-foreground">
                                          {" ± "}
                                          {dimTheta.se.toFixed(2)}
                                        </span>
                                        {" → DI "}
                                        <strong>{dimDI}</strong>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-baseline justify-between gap-2">
                          <span>{n("result.scoringIrtResult")}</span>
                          <span className="font-mono tabular-nums text-foreground">
                            <strong>{result.degradationIndex}</strong>
                            {" / 100"}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-foreground">
                      {n.rich("result.scoringPctSteps", {
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>{n("result.scoringPctRate")}</span>
                        <span className="font-mono tabular-nums text-foreground">
                          {result.correctCount} / {result.totalQuestions}
                          {" = "}
                          {Math.round((result.correctCount / result.totalQuestions) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="shrink-0">{n("result.scoringPctFormula")}</span>
                        <span className="text-right font-mono tabular-nums text-foreground">
                          {"100 − "}
                          {Math.round((result.correctCount / result.totalQuestions) * 100)}
                          {" = "}
                          <strong>{result.degradationIndex}</strong>
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Dimension scores - Radar chart */}
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">{n("result.radarLabel")}</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="w-48 shrink-0">
              <RadarChart userScores={result.dimensionScores} size={200} />
            </div>
            <div className="flex-1 space-y-2 self-center sm:self-auto">
              {(["logic", "math", "vocab", "event"] as const).map((key) => {
                const score = result.dimensionScores[key];
                if (score == null) return null;
                const isWeak = score < 50;
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="w-20 shrink-0 text-muted-foreground text-right">
                      {n("radar." + key)}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isWeak ? "bg-red-400" : score >= 80 ? "bg-green-400" : "bg-amber-400"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span
                      className={`w-10 text-right font-medium tabular-nums ${
                        isWeak ? "text-red-600" : score >= 80 ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      {score}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Separator />

        {!isFirstTest && (
          <>
            {/* Personalized advice */}
            {(() => {
              const allDims: { key: string; label: string; score: number | null }[] = [
                { key: "logic", label: n("radar.logic"), score: result.dimensionScores.logic },
                { key: "math", label: n("radar.math"), score: result.dimensionScores.math },
                { key: "vocab", label: n("radar.vocab"), score: result.dimensionScores.vocab },
                { key: "event", label: n("radar.event"), score: result.dimensionScores.event },
              ];
              const dims = allDims.filter(
                (d): d is { key: string; label: string; score: number } => d.score !== null,
              );
              dims.sort((a, b) => a.score - b.score);

              if (dims.length > 0 && dims[0].score < 60) {
                const weakest = dims[0];
                return (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm font-medium">{n("result.adviceTitle")}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {n("result.adviceWeakest", { dimension: weakest.label })}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {n.raw("result.adviceTips")[weakest.key] ?? n("result.adviceDefault")}
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Game suggestion for low logic / event scores */}
            {(() => {
              const logicLow =
                result.dimensionScores.logic !== null && result.dimensionScores.logic < 60;
              const eventLow =
                result.dimensionScores.event !== null && result.dimensionScores.event < 60;
              if (!logicLow && !eventLow) return null;

              const title =
                logicLow && eventLow
                  ? n("result.logicEventGameTitle")
                  : logicLow
                    ? n("result.logicGameTitle")
                    : n("result.eventGameTitle");

              return (
                <div className="rounded-lg border border-dashed border-blue-300/30 bg-blue-50/50 p-4 text-center dark:bg-blue-950/10">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.rich("result.logicGameDesc", {
                      game: (chunks) => (
                        <a
                          href="https://deadpan.hydroroll.team"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 underline-offset-2 hover:underline"
                        >
                          {chunks}
                        </a>
                      ),
                    })}
                  </p>
                </div>
              );
            })()}

            {/* LCTI suggestion for good logic scores */}
            {result.dimensionScores.logic !== null && result.dimensionScores.logic >= 60 && (
              <div className="rounded-lg border border-dashed border-green-300/30 bg-green-50/50 p-4 text-center dark:bg-green-950/10">
                <p className="text-sm font-medium text-foreground">{n("result.logicGoodTitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.rich("result.logicGoodDesc", {
                    lcti: (chunks) => (
                      <a
                        href="https://lcti.hydroroll.team"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-green-600 underline-offset-2 hover:underline"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
              </div>
            )}
          </>
        )}

        {/* 7-day retest reminder */}
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-sm font-medium text-foreground">{n("result.retestPrompt")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{n("result.retestDesc")}</p>
        </div>

        {/* Previous vs current comparison */}
        {prevResult && (
          <div className="rounded-lg border bg-card p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {n("result.comparisonTitle")}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground">{n("result.lastLabel")}</p>
                <p className="text-2xl font-bold" style={{ color: prevResult.tierColor }}>
                  {prevResult.degradationIndex}
                </p>
                <p className="text-xs text-muted-foreground">
                  {prevResult.tierLabelKey
                    ? n("tier." + prevResult.tierLabelKey)
                    : prevResult.tierLabel}
                </p>
              </div>
              <div className="text-2xl text-muted-foreground">
                {result.degradationIndex < prevResult.degradationIndex
                  ? "↓"
                  : result.degradationIndex > prevResult.degradationIndex
                    ? "↑"
                    : "—"}
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground">{n("result.currentLabel")}</p>
                <p className="text-2xl font-bold" style={{ color: result.tier.ringColor }}>
                  {result.degradationIndex}
                </p>
                <p className="text-xs text-muted-foreground">{n("tier." + result.tier.tierKey)}</p>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {result.degradationIndex < prevResult.degradationIndex
                ? n("result.improved")
                : result.degradationIndex > prevResult.degradationIndex
                  ? n("result.worsened")
                  : n("result.unchanged")}
            </p>

            {/* Per-dimension comparison if available */}
            {prevResult.dimensionScores && (
              <div className="mt-3 space-y-1.5 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {n("result.dimensionCompare")}
                </p>
                {(["logic", "math", "vocab", "event"] as const).map((key) => {
                  const prev = prevResult.dimensionScores?.[key];
                  const cur = result.dimensionScores[key];
                  if (prev === null || prev === undefined || cur === null) return null;
                  const diff = cur - prev;
                  return (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{n("radar." + key)}</span>
                      <span className="tabular-nums">
                        <span className="text-muted-foreground">{prev}%</span>
                        <span className="mx-1 text-muted-foreground">→</span>
                        <span
                          className={`font-medium ${
                            diff > 0
                              ? "text-green-600"
                              : diff < 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {cur}%
                        </span>
                        {diff !== 0 && (
                          <span className={`ml-1 ${diff > 0 ? "text-green-600" : "text-red-600"}`}>
                            ({diff > 0 ? "+" : ""}
                            {diff})
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Premium: Dimension Trend Analysis */}
        {analysis && analysis.dimensions.length >= 2 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              {analysis.overallTrend === "improving" ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" /> 整体呈改善趋势
                </>
              ) : analysis.overallTrend === "declining" ? (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" /> 整体呈下降趋势
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 text-muted-foreground" /> 整体保持稳定
                </>
              )}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                （{analysis.testCount} 次测试）
              </span>
            </p>
            <div className="space-y-2">
              {analysis.dimensions
                .filter((d) => d.delta !== null)
                .map((d) => (
                  <div key={d.dimension} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-muted-foreground">{d.label}</span>
                    <span
                      className={`font-mono font-medium ${d.trend === "declining" ? "text-red-600" : d.trend === "improving" ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {d.delta !== null && d.delta > 0 ? "+" : ""}
                      {d.delta}%
                    </span>
                    <span className="text-muted-foreground truncate">{d.tip}</span>
                  </div>
                ))}
            </div>
            {analysis.weakestDimension && (
              <p className="mt-2 text-xs text-muted-foreground">
                当前弱项：
                <span className="font-medium text-foreground">
                  {analysis.weakestDimension.label}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Premium placeholder — user has history but no premium */}
        {!analysis && !isFirstTest && !isPremium && (
          <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">逐维度趋势分析</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              升级 Premium 后查看各维度认知变化趋势与改善建议
            </p>
            <Link
              href="/unlock"
              className="mt-3 inline-block rounded-full bg-foreground px-5 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity"
            >
              解锁 Premium
            </Link>
          </div>
        )}

        {!isFirstTest && (
          /* AI Interpretation */
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800 dark:bg-violet-950/20">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {n("result.aiInterpretTitle")}
                <sup className="ml-0.5 text-sm text-amber-500">*</sup>
              </p>
              {isPremium ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleAiInterpret}
                  disabled={aiLoading}
                >
                  {aiAnalysis ? n("result.aiInterpretRegenerate") : n("result.aiInterpretButton")}
                </Button>
              ) : null}
            </div>

            {!isPremium && (
              <div className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 p-3 text-center dark:border-amber-800 dark:bg-amber-950/20">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Premium 专属 · 基于你的测试数据生成个性化认知分析报告
                </p>
                <Link
                  href="/unlock"
                  className="mt-1.5 inline-block text-xs font-medium text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
                >
                  升级查看 →
                </Link>
              </div>
            )}

            {isPremium && !aiAnalysis && !aiLoading && !aiError && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {n("result.aiInterpretDesc")}
              </p>
            )}

            {aiLoading && (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {n("result.aiInterpretLoading")}
              </p>
            )}

            {aiError && <p className="mt-2 text-sm text-red-600">{aiError}</p>}

            {aiAnalysis && (
              <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {aiAnalysis}
              </div>
            )}
          </div>
        )}
        {/* Score breakdown */}
        <div>
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="flex w-full items-center justify-between text-sm font-medium"
          >
            {n("result.reviewTitle")}
            <span className="text-muted-foreground">
              {showExplanations ? n("result.reviewToggleClose") : n("result.reviewToggle")}
            </span>
          </button>

          {showExplanations && (
            <div className="mt-3 space-y-3">
              {result.questions.map((q, i) => {
                const userAnswer = result.answers[i];
                const answerScore = scoreAnswer(userAnswer, q.answer);
                const isFullCorrect = answerScore === 1;
                const isPartialCorrect = answerScore > 0 && answerScore < 1;
                const timedOut = result.timeouts[i];
                const correctLabel = Array.isArray(q.answer)
                  ? q.answer.map((a) => q.options[a]).join(", ")
                  : q.options[q.answer];

                return (
                  <div key={i} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {n("result.reviewQuestion", {
                          i: i + 1,
                          category: n("question.category." + q.category),
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title={n("testing.flagTip")}
                          onClick={() => onToggleFlag(q.id)}
                          className={`shrink-0 rounded px-1.5 py-0.5 text-xs transition-colors ${
                            flaggedIds.has(q.id)
                              ? "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400"
                              : "text-muted-foreground/30 hover:text-amber-500 hover:bg-muted"
                          }`}
                        >
                          <Flag
                            className={`h-3 w-3 ${flaggedIds.has(q.id) ? "fill-amber-400" : ""}`}
                          />
                        </button>
                        <span
                          className={`text-xs font-medium ${
                            timedOut
                              ? "text-muted-foreground"
                              : isFullCorrect
                                ? "text-green-600"
                                : isPartialCorrect
                                  ? "text-amber-600"
                                  : "text-red-600"
                          }`}
                        >
                          {timedOut
                            ? n("result.reviewTimeout")
                            : isFullCorrect
                              ? n("result.reviewCorrect")
                              : isPartialCorrect
                                ? n("result.reviewPartial", {
                                    score: Math.round(answerScore * 100),
                                  })
                                : n("result.reviewWrong")}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {q.question.split("\n")[0]}
                      {q.question.includes("\n") ? "…" : ""}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {n("result.reviewYourAnswer")}
                      {userAnswer !== null
                        ? Array.isArray(userAnswer)
                          ? userAnswer.length > 0
                            ? userAnswer.map((a) => q.options[a]).join(", ")
                            : n("result.reviewUnanswered")
                          : q.options[userAnswer]
                        : n("result.reviewUnanswered")}
                      {!isFullCorrect && !timedOut && (
                        <>
                          {" · "}
                          <span className="text-green-600">
                            {n("result.reviewCorrectAnswer", {
                              answer: correctLabel,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    {timedOut && (
                      <div className="mt-1 text-xs text-green-600">
                        {n("result.reviewCorrectAnswer", {
                          answer: correctLabel,
                        })}
                      </div>
                    )}
                    <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                      {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" onClick={handleShare}>
            {n("result.shareButton")}
          </Button>
          <Button
            variant={isFirstTest ? "default" : "outline"}
            className="flex-1"
            onClick={handleSetReminder}
          >
            {n("result.remindButton")}
          </Button>
          <Button
            variant={isFirstTest ? "outline" : "default"}
            className="flex-1"
            onClick={handleRestart}
          >
            {n("result.retestButton")}
          </Button>
        </div>
        <div className="flex w-full items-center justify-center gap-3">
          <Link
            href={`/stats?latest=${result.degradationIndex}`}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {n("result.viewStatsButton")}
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {n("result.downloadButton")}
          </button>
          {isPremium && (
            <>
              <span className="text-muted-foreground/40">|</span>
              <button
                onClick={handleExportCSV}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                导出 CSV
              </button>
            </>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">{n("result.disclaimer")}</p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {n("landing.footerTagline")}
        </p>
      </CardFooter>
    </Card>
  );
}
