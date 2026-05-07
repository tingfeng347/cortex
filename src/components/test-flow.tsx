"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import Link from "next/link";
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
import {
  selectQuestions,
  QUESTIONS_PER_TEST,
  QUESTION_TIME,
} from "@/lib/questions";
import {
  calculateResult,
  generateShareText,
  DIMENSION_LABELS,
  type TestResult,
  type DimensionScores,
} from "@/lib/scoring";
import type { Question } from "@/lib/questions";
import RadarChart from "@/components/radar-chart";

type Phase = "landing" | "declaration" | "testing" | "processing" | "result";

const LOCKED_SELECTION_MESSAGE = "不允许更改，毕竟真正的笨蛋就是没有后悔机会的";

/* ─── Progress persistence (mid‑test save/resume) ─── */

const PROGRESS_KEY = "cognitive-rust-progress";
const PROGRESS_TTL = 24 * 60 * 60 * 1000; // 24h

interface SavedProgress {
  questions: Question[];
  currentQ: number;
  answers: (number | null)[];
  timeouts: boolean[];
  declared: boolean;
  aiUsage: string | null;
  timeLeft: number;
  timestamp: number;
}

function saveProgress(data: SavedProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch { /* storage full – non‑critical */ }
}

function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedProgress;
    if (Date.now() - data.timestamp > PROGRESS_TTL) {
      localStorage.removeItem(PROGRESS_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function clearProgress() {
  try { localStorage.removeItem(PROGRESS_KEY); } catch { /* ignore */ }
}

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
  const isUrgent = remaining <= 10 && remaining > 0;

  const color =
    isUrgent ? "#ef4444"
      : progress > 0.5 ? "#16a34a"
        : progress > 0.25 ? "#d97706"
          : "#dc2626";
  const textColor =
    isUrgent ? "text-red-500"
      : progress > 0.5 ? "text-green-600"
        : progress > 0.25 ? "text-amber-600"
          : "text-red-600";

  return (
    <div
      className={`relative h-16 w-16 shrink-0 sm:h-20 sm:w-20 ${isUrgent ? "animate-pulse" : ""}`}
    >
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
        <span
          className={`text-base font-bold tabular-nums sm:text-xl transition-all ${textColor} ${
            isUrgent ? "scale-125" : ""
          }`}
        >
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

/* ─── Render text with **emphasis** markers ─── */

function renderEmphasized(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const ch = part.slice(2, -2);
      return (
        <span
          key={i}
          className="[text-emphasis:dot] [text-emphasis-position:over]"
        >
          {ch}
        </span>
      );
    }
    return part;
  });
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
    dimensionScores?: DimensionScores;
    timestamp: number;
  } | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [challengeRef, setChallengeRef] = useState<number | null>(null);
  const [prevResult, setPrevResult] = useState<{
    degradationIndex: number;
    tierLabel: string;
    tierColor: string;
    correctCount: number;
    totalQuestions: number;
    dimensionScores?: DimensionScores;
    timestamp: number;
  } | null>(null);
  const [aiUsage, setAiUsage] = useState<string | null>(null);
  const [questions, setQuestions] = useState(() =>
    selectQuestions(QUESTIONS_PER_TEST),
  );
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(
    () => loadProgress(),
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<SavedProgress | null>(null);
  const isLastQuestion = currentQ === questions.length - 1;

  /* ─── Timer Management ─── */

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((initialTime?: number) => {
    stopTimer();
    setTimeLeft(initialTime ?? QUESTION_TIME);
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

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (phase !== "testing") return;
    if (timeLeft > 0) return;
    if (answers.length > currentQ) return; // already submitted for this question
    submitAnswer(selected); // submits selected answer or null (timeout)
  }, [timeLeft, phase, selected, answers.length, currentQ]);

  // Calculate result when all questions answered
  useEffect(() => {
    if (answers.length !== questions.length) return;

    // Immediately show the processing screen
    setPhase("processing");

    const r = calculateResult(answers, timeouts, questions);
    setResult(r);

    try {
      // Save previous result before overwriting
      const prevRaw = localStorage.getItem("cognitive-rust-result");
      if (prevRaw) {
        setPrevResult(JSON.parse(prevRaw));
      }

      const entry = {
        degradationIndex: r.degradationIndex,
        tierLabel: r.tier.label,
        tierColor: r.tier.ringColor,
        correctCount: r.correctCount,
        totalQuestions: r.totalQuestions,
        dimensionScores: r.dimensionScores,
        aiUsage: aiUsage,
        timestamp: Date.now(),
      };
      localStorage.setItem("cognitive-rust-result", JSON.stringify(entry));
      // Append to history array (cap at 20)
      const raw = localStorage.getItem("cognitive-rust-history");
      const history = raw ? JSON.parse(raw) : [];
      history.push(entry);
      if (history.length > 20) history.shift();
      localStorage.setItem("cognitive-rust-history", JSON.stringify(history));
    } catch {
      // ignore — storage full or unavailable
    }
    // Submit result & events to API (fire-and-forget, no await)
    const payload = {
      degradationIndex: r.degradationIndex,
      tierLabel: r.tier.label,
      correctCount: r.correctCount,
      totalQuestions: r.totalQuestions,
      aiUsageLevel: aiUsage,
    };
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => { });

    clearProgress();
    setSavedProgress(null);

    // Brief delay so user sees the processing state before results appear
    const timer = setTimeout(() => setPhase("result"), 600);
    return () => clearTimeout(timer);
  }, [answers, timeouts]);

  // Auto-advance to next question after answer is recorded
  useEffect(() => {
    if (phase !== "testing") return;
    if (answers.length <= currentQ) return; // no new answer yet
    if (answers.length >= questions.length) return; // last — result effect handles
    setCurrentQ((prev) => prev + 1);
    startTimer();
  }, [answers, phase]);

  // Save progress after each answer (checkpoint) + on tab hide
  useEffect(() => {
    if (phase !== "testing") return;
    if (answers.length === 0) return;

    const snapshot: SavedProgress = {
      questions,
      currentQ,
      answers,
      timeouts,
      declared,
      aiUsage: aiUsage,
      timeLeft: QUESTION_TIME, // fresh timer for the current question on resume
      timestamp: Date.now(),
    };
    progressRef.current = snapshot;
    saveProgress(snapshot);
  }, [answers, phase]); // fires after auto‑advance, captures stable state

  useEffect(() => {
    if (phase !== "testing") return;

    // Keep ref up‑to‑date for the visibility handler
    const snapshot: SavedProgress = {
      questions,
      currentQ,
      answers,
      timeouts,
      declared,
      aiUsage: aiUsage,
      timeLeft,
      timestamp: Date.now(),
    };
    progressRef.current = snapshot;

    const onHide = () => {
      if (document.visibilityState === "hidden" && progressRef.current) {
        saveProgress(progressRef.current);
      }
    };
    const onBeforeUnload = () => {
      if (progressRef.current) saveProgress(progressRef.current);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [phase, questions, currentQ, answers, timeouts, declared, aiUsage, timeLeft]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Load previous result + challenge ref from URL
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cognitive-rust-result");
      if (saved) {
        setSavedResult(JSON.parse(saved));
      }
    } catch {
      // ignore — no previous result
    }
    // Check pending reminder
    try {
      const reminderRaw = localStorage.getItem("cognitive-rust-reminder");
      if (reminderRaw) {
        const reminder = JSON.parse(reminderRaw);
        if (Date.now() >= reminder.targetDate) {
          localStorage.removeItem("cognitive-rust-reminder");
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("认知防锈 · 该复测了", {
              body: `上次测得 ${reminder.tierLabel}，7 天过去了，你的认知状态有变化吗？`,
              icon: "/favicon.ico",
            });
          }
        }
      }
    } catch {
      /* ignore */
    }

    // Read ?ref= from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref !== null) {
      const n = parseInt(ref, 10);
      if (!isNaN(n)) setChallengeRef(n);
      // Clean URL without ref
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  /* ─── Event Handlers ─── */

  function handleStart() {
    clearProgress();
    setSavedProgress(null);
    setPhase("declaration");
  }

  function handleResume() {
    if (!savedProgress) return;
    const s = savedProgress;
    setQuestions(s.questions);
    setCurrentQ(s.currentQ);
    setAnswers(s.answers);
    setTimeouts(s.timeouts);
    setDeclared(s.declared);
    setAiUsage(s.aiUsage);
    clearProgress();
    setSavedProgress(null);
    setPhase("testing");
    setSelected(null);
    startTimer(); // full timer for the question they're resuming on
    setToast("已恢复上次进度");
    setTimeout(() => setToast(null), 2000);
  }

  function handleBeginTest() {
    if (!aiUsage) return;
    clearProgress();
    setSavedProgress(null);
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
        setToast(LOCKED_SELECTION_MESSAGE);
        setTimeout(() => setToast(null), 2000);
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
    clearProgress();
    setSavedProgress(null);
    setQuestions(selectQuestions(QUESTIONS_PER_TEST));
    setPhase("landing");
    setDeclared(false);
    setAiUsage(null);
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
    const pageUrl = window.location.origin + "/share?ref=" + result.degradationIndex;

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
      setToast("结果已复制 ✓");
      setTimeout(() => setToast(null), 2000);
    } catch {
      // silently fail — not critical
    }
  }

  function handleSetReminder() {
    if (!("Notification" in window)) {
      setToast("您的浏览器不支持通知功能");
      setTimeout(() => setToast(null), 2000);
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        const targetDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem(
          "cognitive-rust-reminder",
          JSON.stringify({
            targetDate,
            tierLabel: result?.tier.label,
          }),
        );
        new Notification("通知已设定", {
          body: "7 天后我们会提醒你回来复测",
        });
        setToast("7 天后将提醒你 ✓");
        setTimeout(() => setToast(null), 2000);
      } else {
        setToast("需要允许通知权限才能提醒你");
        setTimeout(() => setToast(null), 2000);
      }
    });
  }

  function handleDownloadImage() {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    setToast("正在生成图片…");
    setTimeout(() => setToast(null), 1500);

    // Build SVG result card with dimensions
    const dimParts = [
      result.dimensionScores.logic !== null ? `逻辑 ${result.dimensionScores.logic}%` : "",
      result.dimensionScores.math !== null ? `速算 ${result.dimensionScores.math}%` : "",
      result.dimensionScores.vocab !== null ? `词汇 ${result.dimensionScores.vocab}%` : "",
    ].filter(Boolean).join("  ·  ");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fafafa"/>
          <stop offset="100%" stop-color="#f0f0f0"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" rx="0"/>
      <text x="600" y="70" text-anchor="middle" font-family="system-ui,sans-serif" font-size="26" fill="#aaa" font-weight="500">认知防锈 · 基线测试</text>
      <circle cx="600" cy="260" r="112" fill="white" stroke="${result.tier.ringColor}" stroke-width="14"/>
      <text x="600" y="278" text-anchor="middle" font-family="system-ui,sans-serif" font-size="72" font-weight="800" fill="#111">${result.degradationIndex}</text>
      <text x="600" y="318" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="#999">/ 100</text>
      <rect x="475" y="350" width="250" height="44" rx="22" fill="${result.tier.ringColor}"/>
      <text x="600" y="379" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="600" fill="white">${result.tier.label}</text>
      <text x="600" y="435" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="#666">${result.correctCount} / ${result.totalQuestions} 正确</text>
      ${dimParts ? `<text x="600" y="465" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" fill="#999">${dimParts}</text>` : ""}
      <text x="600" y="580" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="#bbb">cortex.hydroroll.team</text>
    </svg>`;

    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          setIsDownloading(false);
          setToast("生成图片失败");
          setTimeout(() => setToast(null), 2000);
          return;
        }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(pngBlob);
        a.download = "cognitive-rust-result.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        setIsDownloading(false);
        setToast("结果图已保存 ✓");
        setTimeout(() => setToast(null), 2000);
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setIsDownloading(false);
      setToast("生成图片失败");
      setTimeout(() => setToast(null), 2000);
    };

    img.src = url;
  }

  /* ─── Phase: Landing ─── */

  function renderLanding() {
    const isChallenge = challengeRef !== null;
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
            {isChallenge ? (
              <>
                你的朋友测得{" "}
                <span className="font-bold text-foreground">
                  {challengeRef}
                </span>{" "}
                的退化指数。
                <br />
                你觉得你能比 TA 强吗？
              </>
            ) : (
              <>
                你的认知状态怎么样？{QUESTIONS_PER_TEST} 道题拍一张快照。
                <br />
                定期测量，看看趋势怎么说。
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{QUESTIONS_PER_TEST}</span> 道混合题型
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">~{Math.ceil(QUESTIONS_PER_TEST * QUESTION_TIME / 60)}</span> 分钟完成
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                不使用 AI 辅助
              </span>{" "}
              ——测的是你，不是 AI
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
          {savedProgress && !isChallenge ? (
            <>
              <Button size="lg" className="w-full text-base" onClick={handleResume}>
                继续上次测试
                <span className="ml-2 text-sm opacity-70">
                  （已完成 {savedProgress.answers.length}/{QUESTIONS_PER_TEST} 题）
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm text-muted-foreground"
                onClick={handleStart}
              >
                重新开始
              </Button>
            </>
          ) : (
            <Button size="lg" className="w-full text-base" onClick={handleStart}>
              {savedResult ? "再测一次" : "开始测试"}
            </Button>
          )}
          <a
            href="/stats"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
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
              你有连续 {Math.ceil(QUESTIONS_PER_TEST * QUESTION_TIME / 60)} 分钟的完整时间
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

          {/* AI usage question */}
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-foreground">
              你每天花多少时间使用 AI 工具？
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ChatGPT、Claude、Copilot、Gemini 等都算
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["< 30 分钟", "30 分钟 - 2 小时", "2 - 5 小时", "> 5 小时"].map(
                (opt) => (
                  <button
                    key={opt}
                    onClick={() => setAiUsage(opt)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-all ${aiUsage === opt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/20 text-muted-foreground hover:border-primary/50"
                      }`}
                  >
                    {opt}
                  </button>
                ),
              )}
            </div>
          </div>

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
            disabled={!declared || !aiUsage}
            onClick={handleBeginTest}
          >
            {aiUsage ? "开始答题" : "请先选择 AI 使用量"}
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
                {renderEmphasized(option)}
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

  /* ─── Phase: Processing ─── */

  function renderProcessing() {
    return (
      <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-2xl tracking-tight">测试完成</CardTitle>
          <CardDescription>正在分析你的认知表现</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">
            正在计算你的认知画像…
          </p>
        </CardContent>
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

          {/* AI Usage context */}
          {aiUsage && (
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">每日 AI 使用量</span>
                <span className="font-medium text-foreground">{aiUsage}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                这是你当前的认知活跃度基线。定期复测才能看出趋势——
                趋势比单次分数更有意义。
              </p>
            </div>
          )}

          <Separator />

          {/* Dimension scores - Radar chart */}
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">认知画像</p>
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
                        {DIMENSION_LABELS[key]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isWeak ? "bg-red-400" : score >= 80 ? "bg-green-400" : "bg-amber-400"
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className={`w-10 text-right font-medium tabular-nums ${
                        isWeak ? "text-red-600" : score >= 80 ? "text-green-600" : "text-amber-600"
                      }`}>
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
              { key: "logic", label: "逻辑推理", score: result.dimensionScores.logic },
              { key: "math", label: "速算", score: result.dimensionScores.math },
              { key: "vocab", label: "词汇语义", score: result.dimensionScores.vocab },
            ];
            const dims = allDims.filter((d): d is { key: string; label: string; score: number } =>
              d.score !== null
            );
            dims.sort((a, b) => a.score - b.score);

            if (dims.length > 0 && dims[0].score < 60) {
              const weakest = dims[0];
              const tips: Record<string, string> = {
                logic: "每天做一道逻辑题（比如数独或推理题），逐步提升分析能力。",
                math: "在心算之前不要立刻掏出计算器——先自己算一遍，哪怕慢一点。",
                vocab: "每天读 10 分钟纸质书或长文章，留意用词和表达方式。",
              };
              return (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm font-medium">针对性训练建议</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    你的 <span className="font-medium text-foreground">{weakest.label}</span> 维度相对较弱。
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {tips[weakest.key] ?? "持续练习会带来改善。"}
                  </p>
                </div>
              );
            }
            return null;
          })()}

          {/* 7-day retest reminder */}
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              7 天后复测，追踪你的变化
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              认知能力就像肌肉——定期测量才能看到趋势。我们会在本地保存你的历史记录。
            </p>
          </div>

          {/* Previous vs current comparison */}
          {prevResult && (
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                与上次测试对比
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground">上次</p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: prevResult.tierColor }}
                  >
                    {prevResult.degradationIndex}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prevResult.tierLabel}
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
                  <p className="text-xs text-muted-foreground">本次</p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: result.tier.ringColor }}
                  >
                    {result.degradationIndex}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.tier.label}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {result.degradationIndex < prevResult.degradationIndex
                  ? "相比上次你的认知活跃度有所提升 ↑"
                  : result.degradationIndex > prevResult.degradationIndex
                    ? "相比上次退化指数有所上升，留意趋势"
                    : "与上次持平，保持关注"}
              </p>
              {/* Per-dimension comparison if available */}
              {prevResult.dimensionScores && (
                <div className="mt-3 space-y-1.5 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">各维度对比</p>
                  {(["logic", "math", "vocab"] as const).map((key) => {
                    const prev = prevResult.dimensionScores?.[key];
                    const cur = result.dimensionScores[key];
                    if (prev === null || prev === undefined || cur === null) return null;
                    const diff = cur - prev;
                    return (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{DIMENSION_LABELS[key]}</span>
                        <span className="tabular-nums">
                          <span className="text-muted-foreground">{prev}%</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className={`font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                            {cur}%
                          </span>
                          {diff !== 0 && (
                            <span className={`ml-1 ${diff > 0 ? "text-green-600" : "text-red-600"}`}>
                              ({diff > 0 ? "+" : ""}{diff})
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
            <Button variant="outline" className="flex-1" onClick={handleSetReminder}>
              7 天后提醒我
            </Button>
            <Button className="flex-1" onClick={handleRestart}>
              重新测试
            </Button>
          </div>
          <div className="flex w-full items-center justify-center gap-3">
            <a
              href={"/stats?latest=" + result.degradationIndex}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              查看全平台统计
            </a>
            <span className="text-muted-foreground/40">|</span>
            <button
              onClick={handleDownloadImage}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              保存结果图
            </button>
          </div>
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
        {phase === "processing" && renderProcessing()}
        {phase === "result" && renderResult()}
      </main>

      {/* Toast */}
      <div
        className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg transition-all duration-300 ${toast
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
          }`}
      >
        {toast}
      </div>

      <footer className="flex items-center justify-center gap-3 pt-4 text-xs text-muted-foreground">
        <span>Cortex &copy; </span>
        <a
          href="https://github.com/HsiangNianian"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          简律纯
        </a>
        <span className="text-muted-foreground/40">|</span>
        <Link
          href="/about"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          关于
        </Link>
        <span className="text-muted-foreground/40">|</span>
        <a
          href="https://deadpan.hydroroll.team"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          另一个游戏
        </a>
      </footer>
    </div>
  );
}
