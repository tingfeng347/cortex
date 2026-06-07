"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useTestState } from "./test-flow/useTestState";
import { LandingPhase } from "./test-flow/LandingPhase";
import { DeclarationPhase } from "./test-flow/DeclarationPhase";
import { QuestionCard } from "./test-flow/QuestionCard";
import { ProcessingPhase } from "./test-flow/ProcessingPhase";
import { ResultPhase } from "./test-flow/ResultPhase";

export default function TestFlow() {
  const s = useTestState();
  const n = useTranslations();

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
        className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg transition-all duration-300 ${
          s.toast
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        {s.toast}
      </div>

      <footer className="flex items-center justify-center gap-3 pt-4 text-xs text-muted-foreground">
        <span>Cortex &copy; </span>
        <a
          href="https://github.com/HsiangNianian"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          {n("result.author")}
        </a>
        <span className="text-muted-foreground/40">|</span>
        <Link
          href="/about"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          {n("result.aboutLink")}
        </Link>
        <span className="text-muted-foreground/40">|</span>
        <a
          href="https://deadpan.hydroroll.team"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          {n("result.otherGame")}
        </a>
        <span className="text-muted-foreground/40">|</span>
        <a
          href="https://ddlroast.hydroroll.team"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          {n("result.ddlRoast")}
        </a>
      </footer>
    </div>
  );
}
