"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { selectQuestions, QUESTIONS_PER_TEST, QUESTION_TIME } from "@/lib/questions";
import { calculateResult, generateShareText, type TestResult } from "@/lib/scoring";
import type { Question } from "@/lib/questions";

type Phase = "landing" | "declaration" | "testing" | "result";

const LOCKED_SELECTION_MESSAGE = "不允许更改，毕竟真正的笨蛋就是没有后悔机会的";

/* ─── SVG Circular Timer ─── */

function QuestionTimer({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / total;
  const offset = circumference * (1 - progress);

  const color =
    progress > 0.5 ? "#16a34a" : progress > 0.25 ? "#d97706" : "#dc2626";
  const textColor =
    progress > 0.5
      ? "text-green-600"
      : progress > 0.25
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="5"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-base font-bold tabular-nums sm:text-xl ${textColor}`}>
          {remaining}
        </span>
      </div>
    </div>
  );
}

/* ─── SVG Degradation Gauge ─── */

function DegradationGauge({
  index,
  ringColor,
}: {
  index: number;
  ringColor: string;
}) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - index / 100);

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tracking-tight">{index}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

/* ─── Main TestFlow Component ─── */

export default function TestFlow() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [declared, setDeclared] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeouts, setTimeouts] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [result, setResult] = useState<TestResult | null>(null);
  const [savedResult, setSavedResult] = useState<{
    degradationIndex: number;
    tierLabel: string;
    tierColor: string;
    correctCount: number;
    totalQuestions: number;
    timestamp: number;
  } | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [questions] = useState(() => selectQuestions(QUESTIONS_PER_TEST));

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLastQuestion = currentQ === questions.length - 1;

  /* ─── Timer Management ─── */

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout — treat as skip
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Auto-submit null (timeout) when timer reaches 0 with no selection
  useEffect(() => {
    if (phase !== "testing") return;
    if (timeLeft > 0) return;
    if (selected !== null) return;
    if (answers.length > currentQ) return; // already submitted for this question
    submitAnswer(null);
  }, [timeLeft, phase, selected, answers.length, currentQ]);

  // Calculate result when all questions answered
  useEffect(() => {
    if (answers.length !== questions.length) return;
    const r = calculateResult(answers, timeouts, questions);
    setResult(r);
    try {
      localStorage.setItem(
        "cognitive-rust-result",
        JSON.stringify({
          degradationIndex: r.degradationIndex,
          tierLabel: r.tier.label,
          tierColor: r.tier.ringColor,
          correctCount: r.correctCount,
          totalQuestions: r.totalQuestions,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // ignore — storage full or unavailable
    }
    // Submit result & events to API (fire-and-forget, no await)
    const payload = {
      degradationIndex: r.degradationIndex,
      tierLabel: r.tier.label,
      correctCount: r.correctCount,
      totalQuestions: r.totalQuestions,
    };
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
    setPhase("result");
  }, [answers, timeouts]);

  // Auto-advance to next question after answer is recorded
  useEffect(() => {
    if (phase !== "testing") return;
    if (answers.length <= currentQ) return; // no new answer yet
    if (answers.length >= questions.length) return; // last — result effect handles
    setCurrentQ((prev) => prev + 1);
    startTimer();
  }, [answers, phase]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Load previous result from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cognitive-rust-result");
      if (saved) {
        setSavedResult(JSON.parse(saved));
      }
    } catch {
      // ignore — no previous result
    }
  }, []);

  /* ─── Event Handlers ─── */

  function handleStart() {
    setPhase("declaration");
  }

  function handleBeginTest() {
    setPhase("testing");
    setCurrentQ(0);
    setAnswers([]);
    setTimeouts([]);
    setSelected(null);
    startTimer();
  }

  function handleSelectOption(index: number) {
    if (selected !== null) {
      if (selected !== index) {
        window.alert(LOCKED_SELECTION_MESSAGE);
      }
      return;
    }
    setSelected(index);
  }

  function submitAnswer(answer: number | null) {
    const timedOut = answer === null && timeLeft === 0;
    stopTimer();
    setAnswers((prev) => [...prev, answer]);
    setTimeouts((prev) => [...prev, timedOut]);
    setSelected(null);
    // Auto-advance is handled by the answers.length effect above
  }

  function handleNext() {
    if (selected === null) return;
    submitAnswer(selected);
  }

  function handleRestart() {
    stopTimer();
    setPhase("landing");
    setDeclared(false);
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setTimeouts([]);
    setTimeLeft(QUESTION_TIME);
    setResult(null);
    setShowExplanations(false);
  }

  async function handleShare() {
    if (!result) return;
    const text = generateShareText(result);
    const pageUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "认知防锈 · 基线测试",
          text,
          url: pageUrl,
        });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }

    // Clipboard fallback: text + URL
    try {
      await navigator.clipboard.writeText(text + "\n" + pageUrl);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch {
      // silently fail — not critical
    }
  }

  /* ─── Phase: Landing ─── */

  function renderLanding() {
    return (
      <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
            <span className="text-2xl font-bold text-primary">?</span>
          </div>
          <CardTitle className="text-2xl tracking-tight">
            认知防锈 · 基线测试
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-relaxed">
            当我们越来越依赖 AI 完成思考工作，一个关键问题出现了——
            <br />
            那些我们不再经常使用的心智能力，正在发生什么？
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">5</span> 道混合题型
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">~3</span> 分钟完成
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-destructive">
                禁止使用 AI
              </span>{" "}
              辅助答题
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
                <span className="font-medium text-foreground">上次测试</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(savedResult.timestamp).toLocaleDateString("zh-CN")}
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
                  退化指数 ·{" "}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: savedResult.tierColor }}
                >
                  {savedResult.tierLabel}
                </span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button size="lg" className="w-full text-base" onClick={handleStart}>
            开始测试
          </Button>
          <a href="/stats" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            查看全平台统计
          </a>
        </CardFooter>
      </Card>
    );
  }

  /* ─── Phase: Declaration ─── */

  function renderDeclaration() {
    return (
      <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">做好准备</CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed">
            为确保测试结果准确，请确认以下几点：
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              你在一个安静、不受打扰的环境中
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              你有连续 3-5 分钟的完整时间
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              每道题限时{" "}
              <span className="font-medium text-foreground">
                {QUESTION_TIME} 秒
              </span>
              ，超时将自动跳过
            </li>
          </ul>

          <Separator />

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="declaration"
              checked={declared}
              onCheckedChange={(checked) => setDeclared(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="declaration"
              className="text-sm leading-relaxed cursor-pointer"
            >
              我承诺在本次测试中不使用任何 AI 辅助工具
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            size="lg"
            className="w-full text-base"
            disabled={!declared}
            onClick={handleBeginTest}
          >
            开始答题
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleRestart}
          >
            返回
          </Button>
        </CardFooter>
      </Card>
    );
  }

  /* ─── Phase: Testing ─── */

  function renderQuestion() {
    const question = questions[currentQ];
    if (!question) return null;

    return (
      <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentQ + 1}/{questions.length}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.category}
              </Badge>
            </div>
            <QuestionTimer remaining={timeLeft} total={QUESTION_TIME} />
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex gap-1">
            {questions.map((_, i) => {
              const isAnswered = answers[i] !== undefined;
              const isCurrent = i === currentQ;
              return (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${isAnswered
                      ? "bg-primary"
                      : isCurrent
                        ? "bg-primary/40"
                        : "bg-muted"
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
            const isSelected = selected === i;
            const isCorrect =
              answers[currentQ] !== undefined && question.answer === i;
            const isWrong = answers[currentQ] === i && !isCorrect;

            // Show feedback after answering
            const showFeedback = answers[currentQ] !== undefined;

            return (
              <button
                key={i}
                disabled={answers[currentQ] !== undefined}
                onClick={() => handleSelectOption(i)}
                className={`w-full rounded-lg border-2 p-4 text-left text-sm transition-all active:scale-[0.98] ${showFeedback
                    ? isCorrect
                      ? "border-green-500 bg-green-50 text-green-800"
                      : isWrong
                        ? "border-red-500 bg-red-50 text-red-800"
                        : "border-muted opacity-60"
                    : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50 hover:bg-accent"
                  }`}
              >
                <span className="font-medium">
                  {String.fromCharCode(65 + i)}.
                </span>{" "}
                {option}
              </button>
            );
          })}
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button
            size="lg"
            className="w-full text-base"
            disabled={selected === null}
            onClick={handleNext}
          >
            {isLastQuestion ? "完成测试" : "下一题"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  /* ─── Phase: Result ─── */

  function renderResult() {
    if (!result) return null;

    return (
      <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-2xl tracking-tight">测试完成</CardTitle>
          <CardDescription>你的基线认知状态</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Gauge + Tier */}
          <div className="text-center">
            <DegradationGauge
              index={result.degradationIndex}
              ringColor={result.tier.ringColor}
            />
            <div className="mt-3">
              <Badge
                className="px-3 py-1 text-sm"
                style={{
                  backgroundColor: result.tier.ringColor,
                  color: "#fff",
                }}
              >
                {result.tier.label}
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {result.tier.description}
            </p>
          </div>

          <Separator />

          {/* Advice */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium">建议</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {result.tier.advice}
            </p>
          </div>

          {/* Score breakdown */}
          <div>
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              className="flex w-full items-center justify-between text-sm font-medium"
            >
              逐题回顾
              <span className="text-muted-foreground">
                {showExplanations ? "收起" : "展开"}
              </span>
            </button>

            {showExplanations && (
              <div className="mt-3 space-y-3">
                {questions.map((q, i) => {
                  const userAnswer = result.answers[i];
                  const isCorrect = userAnswer === q.answer;
                  const timedOut = result.timeouts[i];

                  return (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          第 {i + 1} 题 · {q.category}
                        </span>
                        <span
                          className={`text-xs font-medium ${timedOut
                              ? "text-muted-foreground"
                              : isCorrect
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                        >
                          {timedOut ? "超时" : isCorrect ? "正确" : "错误"}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {q.question.split("\n")[0]}
                        {q.question.includes("\n") ? "…" : ""}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        你的答案：
                        {userAnswer !== null ? q.options[userAnswer] : "未作答"}
                        {!isCorrect && !timedOut && (
                          <>
                            {" · "}
                            <span className="text-green-600">
                              正确答案：{q.options[q.answer]}
                            </span>
                          </>
                        )}
                      </div>
                      {timedOut && (
                        <div className="mt-1 text-xs text-green-600">
                          正确答案：{q.options[q.answer]}
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
              分享结果
            </Button>
            <Button className="flex-1" onClick={handleRestart}>
              重新测试
            </Button>
          </div>
          <a href="/stats" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            查看全平台统计
          </a>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            认知能力就像肌肉——用进废退。定期测量，才能知道 AI
            在你身上留下了什么。
          </p>
        </CardFooter>
      </Card>
    );
  }

  /* ─── Render ─── */

  return (
    <div className="flex min-h-dvh flex-col px-4 py-4 md:px-8 md:py-8">
      <main className="flex flex-1 items-center justify-center">
        {phase === "landing" && renderLanding()}
        {phase === "declaration" && renderDeclaration()}
        {phase === "testing" && renderQuestion()}
        {phase === "result" && renderResult()}
      </main>

      {/* Copied toast */}
      <div
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg transition-all duration-300 ${
          showCopiedToast
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        结果已复制 ✓
      </div>

      <footer className="pt-4 text-center text-xs text-muted-foreground">
        <span>cortex &copy; </span>
        <a
          href="https://github.com/HsiangNianian"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          简律纯
        </a>
      </footer>
    </div>
  );
}
