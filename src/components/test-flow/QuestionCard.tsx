"use client";

import { useTranslations } from "next-intl";
import { scoreAnswer, isCorrect } from "@/lib/scoring";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Question } from "@/lib/questions";
import { QUESTION_TIME } from "@/lib/questions";
import { QuestionTimer } from "./QuestionTimer";
import { renderEmphasized } from "./helpers";

/** Selected options: null = nothing, number = single, number[] = multi */
type Selection = number | null | number[];

interface QuestionCardProps {
  questions: Question[];
  currentQ: number;
  answers: (number | null | number[])[];
  timeLeft: number;
  selected: Selection;
  isLastQuestion: boolean;
  totalQuestions: number;
  handleSelectOption: (i: number) => void;
  handleNext: () => void;
  onExitTest: () => void;
}

function isSelected(sel: Selection, i: number): boolean {
  if (sel === null) return false;
  if (Array.isArray(sel)) return sel.includes(i);
  return sel === i;
}

function isSelectionEmpty(sel: Selection): boolean {
  if (sel === null) return true;
  if (Array.isArray(sel)) return sel.length === 0;
  return false;
}

export function QuestionCard({
  questions,
  currentQ,
  answers,
  timeLeft,
  selected,
  isLastQuestion,
  totalQuestions,
  handleSelectOption,
  handleNext,
  onExitTest,
}: QuestionCardProps) {
  const n = useTranslations();
  const question = questions[currentQ];
  if (!question) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questionSource = (question as any).source;
  const isAiQuestion = questionSource === "llm" || questionSource === "llm-pool";
  const aiBadgeLabel =
    questionSource === "llm-pool" ? n("testing.aiPoolBadge") : n("testing.aiGeneratedBadge");
  const isMulti = Array.isArray(question.answer);
  const authorLabel = isAiQuestion
    ? "出题人: AI"
    : questionSource === "community"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "出题人: " + ((question as any).submitterName || "匿名")
      : null;

  return (
    <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
      {/* Exit test button */}
      <div className="flex justify-start px-4 pt-3">
        <button
          type="button"
          onClick={onExitTest}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          {n("testing.exitButton")}
        </button>
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {currentQ + 1}/{totalQuestions}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {n("question.category." + question.category)}
            </Badge>
            {isMulti && (
              <Badge className="bg-amber-100 text-amber-800 text-xs dark:bg-amber-900/30 dark:text-amber-400">
                {n("question.multiSelect")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <QuestionTimer remaining={timeLeft} total={QUESTION_TIME} />
          </div>
        </div>

        {/* Author & AI source badges (second row) */}
        {(authorLabel || isAiQuestion) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {authorLabel && (
              <Badge variant="secondary" className="text-xs text-muted-foreground">
                {authorLabel}
              </Badge>
            )}
            {isAiQuestion && (
              <Badge variant="default" className="bg-blue-600 text-white text-xs">
                {aiBadgeLabel}
              </Badge>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-3 flex gap-[3px]">
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const answered =
              answers[i] !== undefined &&
              answers[i] !== null &&
              (Array.isArray(answers[i]) ? answers[i].length > 0 : true);
            const isCurrent = i === currentQ;
            return (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-sm transition-colors ${
                  answered ? "bg-foreground" : isCurrent ? "bg-foreground/30" : "bg-muted"
                }`}
              />
            );
          })}
        </div>

        <CardTitle className="mt-4 whitespace-pre-line text-lg leading-relaxed">
          {question.question}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {question.options.map((option, i) => {
          const optSelected = isSelected(selected, i);
          const showFeedback = answers[currentQ] !== undefined && answers[currentQ] !== null;
          const answerCorrect = showFeedback && isCorrect(i, question.answer);
          const userPicked =
            showFeedback &&
            (Array.isArray(answers[currentQ])
              ? (answers[currentQ] as number[]).includes(i)
              : answers[currentQ] === i);
          const isWrong = userPicked && !answerCorrect;
          // Partial credit: some correct but not full
          const answerScore =
            showFeedback && isMulti ? scoreAnswer(answers[currentQ], question.answer) : -1;
          const isPartial = answerScore > 0 && answerScore < 1;

          return (
            <button
              key={i}
              disabled={showFeedback}
              onClick={() => handleSelectOption(i)}
              className={`w-full rounded-lg border-2 p-4 text-left text-sm transition-all active:scale-[0.98] ${
                showFeedback
                  ? answerCorrect
                    ? "border-green-500 bg-green-50 text-green-800"
                    : isPartial
                      ? "border-amber-500 bg-amber-50 text-amber-800"
                      : isWrong
                        ? "border-red-500 bg-red-50 text-red-800"
                        : "border-muted opacity-60"
                  : optSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <span className="font-medium">
                {isMulti ? (optSelected ? "☑" : "☐") : String.fromCharCode(65 + i)}.
              </span>{" "}
              {renderEmphasized(option)}
            </button>
          );
        })}
      </CardContent>

      <CardFooter className="flex-col gap-2">
        {isMulti && (
          <p className="w-full text-center text-xs text-muted-foreground">
            {n("question.multiSelectHint")}
          </p>
        )}
        <Button
          size="lg"
          className="w-full text-base"
          disabled={isSelectionEmpty(selected)}
          onClick={handleNext}
        >
          {isLastQuestion ? n("testing.finishButton") : n("testing.nextButton")}
        </Button>
      </CardFooter>
    </Card>
  );
}
