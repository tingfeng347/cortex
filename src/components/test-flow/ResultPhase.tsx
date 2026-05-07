"use client";

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
import type { TestResult, DimensionScores } from "@/lib/scoring";
import RadarChart from "@/components/radar-chart";
import { DegradationGauge } from "./DegradationGauge";

interface ResultPhaseProps {
  result: TestResult;
  prevResult: {
    degradationIndex: number;
    tierLabel: string;
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

  return (
    <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-2xl tracking-tight">
          {n("result.title")}
        </CardTitle>
        <CardDescription>{n("result.subtitle")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gauge + Tier */}
        <div className="text-center">
          <DegradationGauge
            index={result.degradationIndex}
            ringColor={result.tier.ringColor}
          />
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
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                IRT
              </span>
            )}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {n("tier." + result.tier.tierKey + "Desc")}
          </p>
        </div>

        {/* AI Usage context */}
        {aiUsage !== null && (
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {n("result.aiUsageLabel")}
              </span>
              <span className="font-medium text-foreground">
                {(n.raw("declaration.aiLevels") as string[])[aiUsage]}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {n("result.description")}
            </p>
          </div>
        )}

        <Separator />

        {/* Dimension scores - Radar chart */}
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            {n("result.radarLabel")}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="w-48 shrink-0">
              <RadarChart userScores={result.dimensionScores} size={200} />
            </div>
            <div className="flex-1 space-y-2 self-center sm:self-auto">
              {(["logic", "math", "vocab"] as const).map((key) => {
                const score = result.dimensionScores[key];
                if (score === null) return null;
                const isWeak = score < 50;
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="w-16 shrink-0 text-muted-foreground">
                      {n("radar." + key)}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isWeak
                            ? "bg-red-400"
                            : score >= 80
                              ? "bg-green-400"
                              : "bg-amber-400"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span
                      className={`w-10 text-right font-medium tabular-nums ${
                        isWeak
                          ? "text-red-600"
                          : score >= 80
                            ? "text-green-600"
                            : "text-amber-600"
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

        {/* Personalized advice */}
        {(() => {
          const allDims: { key: string; label: string; score: number | null }[] = [
            { key: "logic", label: n("radar.logic"), score: result.dimensionScores.logic },
            { key: "math", label: n("radar.math"), score: result.dimensionScores.math },
            { key: "vocab", label: n("radar.vocab"), score: result.dimensionScores.vocab },
          ];
          const dims = allDims.filter(
            (d): d is { key: string; label: string; score: number } =>
              d.score !== null,
          );
          dims.sort((a, b) => a.score - b.score);

          if (dims.length > 0 && dims[0].score < 60) {
            const weakest = dims[0];
            return (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium">
                  {n("result.adviceTitle")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {n("result.adviceWeakest", { dimension: weakest.label })}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {n.raw("result.adviceTips")[weakest.key] ??
                    n("result.adviceDefault")}
                </p>
              </div>
            );
          }
          return null;
        })()}

        {/* 7-day retest reminder */}
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-sm font-medium text-foreground">
            {n("result.retestPrompt")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {n("result.retestDesc")}
          </p>
        </div>

        {/* Previous vs current comparison */}
        {prevResult && (
          <div className="rounded-lg border bg-card p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {n("result.comparisonTitle")}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground">
                  {n("result.lastLabel")}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: prevResult.tierColor }}
                >
                  {prevResult.degradationIndex}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(prevResult as any).tierLabelKey
                    ? n("tier." + (prevResult as any).tierLabelKey)
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
                <p className="text-xs text-muted-foreground">
                  {n("result.currentLabel")}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: result.tier.ringColor }}
                >
                  {result.degradationIndex}
                </p>
                <p className="text-xs text-muted-foreground">
                  {n("tier." + result.tier.tierKey)}
                </p>
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
                {(["logic", "math", "vocab"] as const).map((key) => {
                  const prev = prevResult.dimensionScores?.[key];
                  const cur = result.dimensionScores[key];
                  if (prev === null || prev === undefined || cur === null)
                    return null;
                  const diff = cur - prev;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {n("radar." + key)}
                      </span>
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
                          <span
                            className={`ml-1 ${
                              diff > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
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

        {/* Score breakdown */}
        <div>
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="flex w-full items-center justify-between text-sm font-medium"
          >
            {n("result.reviewTitle")}
            <span className="text-muted-foreground">
              {showExplanations
                ? n("result.reviewToggleClose")
                : n("result.reviewToggle")}
            </span>
          </button>

          {showExplanations && (
            <div className="mt-3 space-y-3">
              {result.questions.map((q, i) => {
                const userAnswer = result.answers[i];
                const isCorrect = userAnswer === q.answer;
                const timedOut = result.timeouts[i];

                return (
                  <div key={i} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {n("result.reviewQuestion", {
                          i: i + 1,
                          category: n("question.category." + q.category),
                        })}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          timedOut
                            ? "text-muted-foreground"
                            : isCorrect
                              ? "text-green-600"
                              : "text-red-600"
                        }`}
                      >
                        {timedOut
                          ? n("result.reviewTimeout")
                          : isCorrect
                            ? n("result.reviewCorrect")
                            : n("result.reviewWrong")}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {q.question.split("\n")[0]}
                      {q.question.includes("\n") ? "…" : ""}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {n("result.reviewYourAnswer")}
                      {userAnswer !== null
                        ? q.options[userAnswer]
                        : n("result.reviewUnanswered")}
                      {!isCorrect && !timedOut && (
                        <>
                          {" · "}
                          <span className="text-green-600">
                            {n("result.reviewCorrectAnswer", {
                              answer: q.options[q.answer],
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    {timedOut && (
                      <div className="mt-1 text-xs text-green-600">
                        {n("result.reviewCorrectAnswer", {
                          answer: q.options[q.answer],
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
            variant="outline"
            className="flex-1"
            onClick={handleSetReminder}
          >
            {n("result.remindButton")}
          </Button>
          <Button className="flex-1" onClick={handleRestart}>
            {n("result.retestButton")}
          </Button>
        </div>
        <div className="flex w-full items-center justify-center gap-3">
          <a
            href={"/stats?latest=" + result.degradationIndex}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {n("result.viewStatsButton")}
          </a>
          <span className="text-muted-foreground/40">|</span>
          <button
            onClick={handleDownloadImage}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {n("result.downloadButton")}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {n("landing.footerTagline")}
        </p>
      </CardFooter>
    </Card>
  );
}
