"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
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
  type TestResult,
  type DimensionScores,
} from "@/lib/scoring";
import { AI_CANONICAL_LEVELS } from "@/lib/storage";
import type { Question } from "@/lib/questions";
import RadarChart from "@/components/radar-chart";

type Phase = "landing" | "declaration" | "testing" | "processing" | "result";

/* ─── Progress persistence (mid‑test save/resume) ─── */

const PROGRESS_KEY = "cognitive-rust-progress";
const PROGRESS_TTL = 24 * 60 * 60 * 1000; // 24h

interface SavedProgress {
  questions: Question[];
  currentQ: number;
  answers: (number | null)[];
  timeouts: boolean[];
  declared: boolean;
  aiUsage: number | null;
  timeLeft: number;
  timestamp: number;
}

function saveProgress(data: SavedProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {
    /* storage full – non‑critical */
  }
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
  } catch {
    return null;
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* ignore */
  }
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

  const color = isUrgent
    ? "#ef4444"
    : progress > 0.5
      ? "#16a34a"
      : progress > 0.25
        ? "#d97706"
        : "#dc2626";
  const textColor = isUrgent
    ? "text-red-500"
    : progress > 0.5
      ? "text-green-600"
      : progress > 0.25
        ? "text-amber-600"
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
          className={`text-base font-bold tabular-nums sm:text-xl transition-all ${textColor} ${isUrgent ? "scale-125" : ""
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
  const n = useTranslations();
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
  const [aiUsage, setAiUsage] = useState<number | null>(null);
  const [questions, setQuestions] = useState(() =>
    selectQuestions(QUESTIONS_PER_TEST),
  );
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(() =>
    loadProgress(),
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<SavedProgress | null>(null);
  const questionMarkRef = useRef<HTMLDivElement | null>(null);
  const isLastQuestion = currentQ === questions.length - 1;

  /* ─── Timer Management ─── */

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (initialTime?: number) => {
      stopTimer();
      setTimeLeft(initialTime ?? QUESTION_TIME);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [stopTimer],
  );

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (phase !== "testing") return;
    if (timeLeft > 0) return;
    if (answers.length > currentQ) return;
    submitAnswer(selected);
  }, [timeLeft, phase, selected, answers.length, currentQ]);

  // Calculate result when all questions answered
  useEffect(() => {
    if (answers.length !== questions.length) return;

    setPhase("processing");

    const r = calculateResult(answers, timeouts, questions);
    setResult(r);

    try {
      const prevRaw = localStorage.getItem("cognitive-rust-result");
      if (prevRaw) {
        setPrevResult(JSON.parse(prevRaw));
      }

      const entry = {
        degradationIndex: r.degradationIndex,
        tierLabel: r.tier.label,
        tierLabelKey: r.tier.tierKey,
        tierColor: r.tier.ringColor,
        correctCount: r.correctCount,
        totalQuestions: r.totalQuestions,
        dimensionScores: r.dimensionScores,
        aiUsage: aiUsage,
        timestamp: Date.now(),
      };
      localStorage.setItem("cognitive-rust-result", JSON.stringify(entry));
      const raw = localStorage.getItem("cognitive-rust-history");
      const history = raw ? JSON.parse(raw) : [];
      history.push(entry);
      if (history.length > 20) history.shift();
      localStorage.setItem("cognitive-rust-history", JSON.stringify(history));
    } catch {
      // ignore
    }
    const payload = {
      degradationIndex: r.degradationIndex,
      tierLabel: r.tier.label,
      correctCount: r.correctCount,
      totalQuestions: r.totalQuestions,
      aiUsageLevel: aiUsage !== null ? AI_CANONICAL_LEVELS[aiUsage] : null,
    };
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => { });

    clearProgress();
    setSavedProgress(null);

    const timer = setTimeout(() => setPhase("result"), 600);
    return () => clearTimeout(timer);
  }, [answers, timeouts]);

  // Auto-advance to next question after answer is recorded
  useEffect(() => {
    if (phase !== "testing") return;
    if (answers.length <= currentQ) return;
    if (answers.length >= questions.length) return;
    setCurrentQ((prev) => prev + 1);
    startTimer();
  }, [answers, phase]);

  // Save progress after each answer
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
      timeLeft: QUESTION_TIME,
      timestamp: Date.now(),
    };
    progressRef.current = snapshot;
    saveProgress(snapshot);
  }, [answers, phase]);

  useEffect(() => {
    if (phase !== "testing") return;

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
  }, [
    phase,
    questions,
    currentQ,
    answers,
    timeouts,
    declared,
    aiUsage,
    timeLeft,
  ]);

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
      // ignore
    }
    // Check pending reminder
    try {
      const reminderRaw = localStorage.getItem("cognitive-rust-reminder");
      if (reminderRaw) {
        const reminder = JSON.parse(reminderRaw);
        if (Date.now() >= reminder.targetDate) {
          localStorage.removeItem("cognitive-rust-reminder");
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(n("toast.reminderTitle"), {
              body: n("toast.reminderBody", {
                tier: reminder.tierLabelKey
                  ? n("tier." + reminder.tierLabelKey)
                  : reminder.tierLabel,
              }),
              icon: "/favicon.ico",
            });
          }
        }
      }
    } catch {
      /* ignore */
    }

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref !== null) {
      const n_ = parseInt(ref, 10);
      if (!isNaN(n_)) setChallengeRef(n_);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  /* ─── Question mark follows cursor/touch ─── */

  useEffect(() => {
    if (phase !== "landing") return;

    const el = questionMarkRef.current;
    if (!el) return;

    const span = el.querySelector("span");
    if (!span) return;

    const handleMove = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
      (span as HTMLElement).style.transform = `rotate(${angle}deg)`;
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [phase]);

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
    setAiUsage(typeof s.aiUsage === "number" ? s.aiUsage : null);
    clearProgress();
    setSavedProgress(null);
    setPhase("testing");
    setSelected(null);
    startTimer();
    setToast(n("toast.resumeRestored"));
    setTimeout(() => setToast(null), 2000);
  }

  function handleBeginTest() {
    if (aiUsage === null) return;
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
        setToast(n("lockedSelection"));
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
    const tierKey = result.tier.tierKey;
    const text = generateShareText(result, {
      site: n("landing.title"),
      degradation: n("stats.avgDegradation"),
      correct: n("result.reviewCorrect"),
      tier: n("tier." + tierKey),
      description: n("tier." + tierKey + "Desc"),
      advice: n("tier." + tierKey + "Advice"),
      logic: n("radar.logic"),
      math: n("radar.math"),
      vocab: n("radar.vocab"),
      cta: n("landing.title") + " — cortex.hydroroll.team",
    });
    const pageUrl =
      window.location.origin + "/share?ref=" + result.degradationIndex;

    if (navigator.share) {
      try {
        await navigator.share({
          title: n("landing.title"),
          text,
          url: pageUrl,
        });
        return;
      } catch {
        // user cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(text + "\n" + pageUrl);
      setToast(n("toast.resultCopied"));
      setTimeout(() => setToast(null), 2000);
    } catch {
      // silently fail
    }
  }

  function handleSetReminder() {
    if (!("Notification" in window)) {
      setToast(n("toast.notificationUnsupported"));
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
            tierLabelKey: result?.tier.tierKey,
          }),
        );
        new Notification(n("toast.notifConfirmTitle"), {
          body: n("toast.notifConfirmBody"),
        });
        setToast(n("toast.notificationSet"));
        setTimeout(() => setToast(null), 2000);
      } else {
        setToast(n("toast.notificationDenied"));
        setTimeout(() => setToast(null), 2000);
      }
    });
  }

  function handleDownloadImage() {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    setToast(n("toast.downloadStarted"));
    setTimeout(() => setToast(null), 1500);

    const dimParts = [
      result.dimensionScores.logic !== null
        ? `${n("radar.logic")} ${result.dimensionScores.logic}%`
        : "",
      result.dimensionScores.math !== null
        ? `${n("radar.math")} ${result.dimensionScores.math}%`
        : "",
      result.dimensionScores.vocab !== null
        ? `${n("radar.vocab")} ${result.dimensionScores.vocab}%`
        : "",
    ]
      .filter(Boolean)
      .join("  ·  ");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fafafa"/>
          <stop offset="100%" stop-color="#f0f0f0"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" rx="0"/>
      <text x="600" y="70" text-anchor="middle" font-family="system-ui,sans-serif" font-size="26" fill="#aaa" font-weight="500">${n("landing.title")}</text>
      <circle cx="600" cy="260" r="112" fill="white" stroke="${result.tier.ringColor}" stroke-width="14"/>
      <text x="600" y="278" text-anchor="middle" font-family="system-ui,sans-serif" font-size="72" font-weight="800" fill="#111">${result.degradationIndex}</text>
      <text x="600" y="318" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="#999">/ 100</text>
      <rect x="475" y="350" width="250" height="44" rx="22" fill="${result.tier.ringColor}"/>
      <text x="600" y="379" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="600" fill="white">${n("tier." + result.tier.tierKey)}</text>
      <text x="600" y="435" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="#666">${result.correctCount} / ${result.totalQuestions}</text>
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
          setToast(n("toast.downloadFailed"));
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
        setToast(n("toast.downloadSuccess"));
        setTimeout(() => setToast(null), 2000);
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setIsDownloading(false);
      setToast(n("toast.downloadFailed"));
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
          <div ref={questionMarkRef} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
            <span className="question-mark text-2xl font-bold text-primary">?</span>
          </div>
          <CardTitle className="text-2xl tracking-tight">
            {n("landing.title")}
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-relaxed">
            {isChallenge ? (
              <>
                {n("landing.challengePrefix")}{" "}
                <span className="font-bold text-foreground">
                  {challengeRef}
                </span>{" "}
                {n("landing.challengeSuffix")}
              </>
            ) : (
              <>{n("landing.defaultSubtitle", { count: QUESTIONS_PER_TEST })}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Button
              size="lg"
              className="w-full text-base"
              onClick={handleStart}
            >
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

  /* ─── Phase: Declaration ─── */

  function renderDeclaration() {
    return (
      <Card className="mx-auto w-full max-w-lg border-0 shadow-lg sm:border md:max-w-xl lg:max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{n("declaration.title")}</CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed">
            {n("declaration.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              {n("declaration.quietEnv")}
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              {n("declaration.fullTime", {
                minutes: Math.ceil((QUESTIONS_PER_TEST * QUESTION_TIME) / 60),
              })}
            </li>
            <li className="flex gap-2">
              <span className="text-foreground">•</span>
              {n("declaration.timeLimit", { seconds: QUESTION_TIME })}
            </li>
          </ul>

          {/* AI usage question */}
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-foreground">
              {n("declaration.aiUsageLabel")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {n("declaration.aiUsageHint")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(n.raw("declaration.aiLevels") as string[]).map(
                (opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setAiUsage(i)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-all ${aiUsage === i
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
              {n("declaration.pledge")}
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            size="lg"
            className="w-full text-base"
            disabled={!declared || aiUsage === null}
            onClick={handleBeginTest}
          >
            {aiUsage !== null
              ? n("declaration.startButton")
              : n("declaration.selectAiFirst")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleRestart}
          >
            {n("declaration.backButton")}
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
                {n("question.category." + question.category)}
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
            {isLastQuestion
              ? n("testing.finishButton")
              : n("testing.nextButton")}
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
          <CardTitle className="text-2xl tracking-tight">
            {n("processing.title")}
          </CardTitle>
          <CardDescription>{n("processing.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">
            {n("processing.message")}
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
            <div className="mt-3">
              <Badge
                className="px-3 py-1 text-sm"
                style={{
                  backgroundColor: result.tier.ringColor,
                  color: "#fff",
                }}
              >
                {n("tier." + result.tier.tierKey)}
              </Badge>
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
                          className={`h-full rounded-full transition-all ${isWeak
                              ? "bg-red-400"
                              : score >= 80
                                ? "bg-green-400"
                                : "bg-amber-400"
                            }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span
                        className={`w-10 text-right font-medium tabular-nums ${isWeak
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
            const allDims: {
              key: string;
              label: string;
              score: number | null;
            }[] = [
                {
                  key: "logic",
                  label: n("radar.logic"),
                  score: result.dimensionScores.logic,
                },
                {
                  key: "math",
                  label: n("radar.math"),
                  score: result.dimensionScores.math,
                },
                {
                  key: "vocab",
                  label: n("radar.vocab"),
                  score: result.dimensionScores.vocab,
                },
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
                            className={`font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"}`}
                          >
                            {cur}%
                          </span>
                          {diff !== 0 && (
                            <span
                              className={`ml-1 ${diff > 0 ? "text-green-600" : "text-red-600"}`}
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
                {questions.map((q, i) => {
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
                          className={`text-xs font-medium ${timedOut
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
      </footer>
    </div>
  );
}
