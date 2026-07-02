import { useState } from "react";
import { useTranslations } from "next-intl";
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
import {
  PremiumBadge,
  TrendSection,
  AIInterpretSection,
  CrossPromoSuggestions,
  ExportCsvLink,
} from "../premium-seam";

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

}: ResultPhaseProps) {
  const n = useTranslations();
  const [showScoringInfo, setShowScoringInfo] = useState(false);

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
              <PremiumBadge />
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

            <CrossPromoSuggestions result={result} isFirstTest={isFirstTest} />
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

        <TrendSection result={result} isFirstTest={isFirstTest} />

        <AIInterpretSection result={result} prevResult={prevResult} isFirstTest={isFirstTest} />
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
          <ExportCsvLink />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">{n("result.disclaimer")}</p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {n("landing.footerTagline")}
        </p>
      </CardFooter>
    </Card>
  );
}
