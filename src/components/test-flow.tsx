"use client";

import { SiteFooter } from "@/components/site-footer";
import { useTestState } from "./test-flow/useTestState";
import { LandingPhase } from "./test-flow/LandingPhase";
import { DeclarationPhase } from "./test-flow/DeclarationPhase";
import { QuestionCard } from "./test-flow/QuestionCard";
import { ProcessingPhase } from "./test-flow/ProcessingPhase";
import { ResultPhase } from "./test-flow/ResultPhase";

export default function TestFlow() {
  const s = useTestState();

  return (
    <div className="flex min-h-dvh flex-col px-4 py-4 md:px-8 md:py-8">
      <main className="flex flex-1 items-center justify-center">
        {s.phase === "landing" && (
          <LandingPhase
            savedResult={s.savedResult}
            savedProgress={s.savedProgress}
            challengeRef={s.challengeRef}
            questionMarkRef={s.questionMarkRef}
            handleStart={s.handleStart}
            handleResume={s.handleResume}
            handleViewLastResult={s.handleViewLastResult}
            cooldownEndsAt={s.cooldownEndsAt}
            cooldownVersion={s.cooldownVersion}
          />
        )}
        {s.phase === "declaration" && (
          <DeclarationPhase
            declared={s.declared}
            setDeclared={s.setDeclared}
            aiUsage={s.aiUsage}
            setAiUsage={s.setAiUsage}
            handleBeginTest={s.handleBeginTest}
            handleRestart={s.handleRestart}
          />
        )}
        {s.phase === "testing" && (
          <QuestionCard
            questions={s.questions}
            currentQ={s.currentQ}
            answers={s.answers}
            timeLeft={s.timeLeft}
            selected={s.selected}
            isLastQuestion={s.isLastQuestion}
            totalQuestions={s.totalQuestions}
            handleSelectOption={s.handleSelectOption}
            handleNext={s.handleNext}
          />
        )}
        {s.phase === "processing" && <ProcessingPhase />}
        {s.phase === "result" && s.result && (
          <ResultPhase
            result={s.result}
            prevResult={s.prevResult}
            aiUsage={s.aiUsage}
            showExplanations={s.showExplanations}
            setShowExplanations={s.setShowExplanations}
            isDownloading={s.isDownloading}
            handleShare={s.handleShare}
            handleSetReminder={s.handleSetReminder}
            handleRestart={s.handleRestart}
            handleDownloadImage={s.handleDownloadImage}
          />
        )}
      </main>

      {/* Toast */}
      <div
        className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm rounded-xl bg-foreground px-4 py-3 text-center text-sm font-medium text-background shadow-lg transition-all duration-300 ${
          s.toast
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        {typeof s.toast === "string"
          ? s.toast
          : s.toast?.message}
        {s.toast && typeof s.toast === "object" && s.toast.action && (
          <button
            className="ml-2 rounded-full bg-background/20 px-3 py-0.5 text-xs font-semibold text-background hover:bg-background/30"
            onClick={s.toast.action.onPress}
          >
            {s.toast.action.label}
          </button>
        )}
      </div>

      <SiteFooter namespace="result" />
    </div>
  );
}
