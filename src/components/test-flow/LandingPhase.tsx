"use client";

import { useState, type ReactNode, type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ExternalLink, Gamepad2, MessageCircle, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QUESTIONS_PER_TEST, QUESTION_TIME } from "@/lib/questions";
import type { DimensionScores } from "@/lib/scoring";
import type { SavedProgress } from "./helpers";

interface LandingPhaseProps {
  savedResult: {
    degradationIndex: number;
    tierLabel: string;
    tierColor: string;
    correctCount: number;
    totalQuestions: number;
    dimensionScores?: DimensionScores;
    timestamp: number;
  } | null;
  savedProgress: SavedProgress | null;
  challengeRef: number | null;
  questionMarkRef: RefObject<HTMLDivElement | null>;
  handleStart: () => void;
  handleResume: () => void;
  handleViewLastResult: () => void;
  children?: ReactNode;
}

export function LandingPhase({
  savedResult,
  savedProgress,
  challengeRef,
  questionMarkRef,
  handleStart,
  handleResume,
  handleViewLastResult,
}: LandingPhaseProps) {
  const n = useTranslations();
  const locale = useLocale();
  const isChallenge = challengeRef !== null;
  const isChinese = locale === "zh-CN";
  const [showCommunityBanner, setShowCommunityBanner] = useState(true);

  return (
    <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
      <CardHeader className="text-center">
        <div
          ref={questionMarkRef}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5"
        >
          <span className="question-mark text-2xl font-bold text-primary">
            ?
          </span>
        </div>
        <CardTitle className="text-2xl tracking-tight">
          {n("landing.title")}
        </CardTitle>
        <CardDescription className="mt-3 text-base leading-relaxed">
          {isChallenge ? (
            <>
              {n("landing.challengePrefix")}{" "}
              <span className="font-bold text-foreground">{challengeRef}</span>{" "}
              {n("landing.challengeSuffix")}
            </>
          ) : (
            <>{n("landing.defaultSubtitle", { count: QUESTIONS_PER_TEST })}</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCommunityBanner && (
          <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-left">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {n("landing.communityTitle")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {n("landing.communityDesc")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="-mr-1 -mt-1 text-muted-foreground hover:text-foreground"
                    aria-label={n("landing.communityDismiss")}
                    onClick={() => setShowCommunityBanner(false)}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={
                      isChinese
                        ? "https://qm.qq.com/q/URG4U6D0As"
                        : "https://discord.gg/pt4f7sVFsH"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {n("landing.communityJoinCta")}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  {isChinese && (
                    <a
                      href="https://deadpan.hydroroll.team"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {n("landing.communityGameCta")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {QUESTIONS_PER_TEST}
            </span>{" "}
            {n("landing.questionsCount", { count: QUESTIONS_PER_TEST })}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              ~{Math.ceil((QUESTIONS_PER_TEST * QUESTION_TIME) / 60)}
            </span>{" "}
            {n("landing.timeEstimate", {
              minutes: Math.ceil((QUESTIONS_PER_TEST * QUESTION_TIME) / 60),
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {n("landing.noAiLabel")}
            </span>{" "}
            {n("landing.noAiSubtext")}
          </div>
        </div>

        {savedResult && (
          <div
            className="cursor-default rounded-lg p-3 text-sm"
            style={{
              backgroundColor: savedResult.tierColor + "15",
              borderLeft: `3px solid ${savedResult.tierColor}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {n("landing.lastTestLabel")}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(savedResult.timestamp).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="text-lg font-bold"
                style={{ color: savedResult.tierColor }}
              >
                {savedResult.degradationIndex}
              </span>
              <span className="text-xs text-muted-foreground">
                {n("landing.lastTestDegradation")}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: savedResult.tierColor }}
              >
                {(savedResult as any).tierLabelKey
                  ? n("tier." + (savedResult as any).tierLabelKey)
                  : savedResult.tierLabel}
              </span>
            </div>
            <button
              onClick={handleViewLastResult}
              className="mt-2 text-xs underline underline-offset-4 transition-colors hover:text-foreground"
              style={{ color: savedResult.tierColor }}
            >
              {n("landing.viewLastResult")}
            </button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {savedProgress && !isChallenge ? (
          <>
            <Button
              size="lg"
              className="w-full text-base"
              onClick={handleResume}
            >
              {n("landing.resumeButton")}
              <span className="ml-2 text-sm opacity-70">
                {n("landing.resumeProgress", {
                  done: savedProgress.answers.length,
                  total: QUESTIONS_PER_TEST,
                })}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-muted-foreground"
              onClick={handleStart}
            >
              {n("landing.restartButton")}
            </Button>
          </>
        ) : (
          <Button size="lg" className="w-full text-base" onClick={handleStart}>
            {savedResult ? n("landing.retakeButton") : n("landing.ctaButton")}
          </Button>
        )}
        <a
          href="/stats"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {n("landing.viewStats")}
        </a>
      </CardFooter>
    </Card>
  );
}
