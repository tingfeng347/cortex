"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  selectQuestions,
  ensureBank,
  getAllQuestions,
  ADAPTIVE_MODE,
  QUESTIONS_PER_TEST,
  QUESTION_TIME,
} from "@/lib/questions";
import {
  calculateResult,
  abilityToDegradationIndex,
  generateShareText,
  getTierByIndex,
  type TestResult,
  type DimensionScores,
} from "@/lib/scoring";
import { AI_CANONICAL_LEVELS } from "@/lib/constants";
import type { Question } from "@/lib/questions";
import {
  createTestSession,
  selectNextQuestion,
  recordResponse,
  isTestComplete,
} from "@/lib/adaptive-test";
import type { AdaptiveTestSession } from "@/lib/adaptive-test";
import {
  loadProgress,
  clearProgress,
  saveProgress,
  type SavedProgress,
} from "./helpers";

type Phase = "landing" | "declaration" | "testing" | "processing" | "result";

export function useTestState() {
  const n = useTranslations();
  const locale = useLocale();
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const adaptiveSessionRef = useRef<AdaptiveTestSession | null>(null);

  // Initialise questions on mount + regenerate when locale changes
  // (except mid-test — questions are frozen once the test starts)
  useEffect(() => {
    if (phase === "testing" || phase === "processing") return;
    ensureBank(locale).then(() => {
      if (ADAPTIVE_MODE) {
        setAllQuestions(getAllQuestions(locale));
      } else {
        setQuestions(selectQuestions(QUESTIONS_PER_TEST, locale));
      }
    });
  }, [locale, phase]);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<SavedProgress | null>(null);
  const questionMarkRef = useRef<HTMLDivElement | null>(null);
  const isLastQuestion = ADAPTIVE_MODE
    ? answers.length >= QUESTIONS_PER_TEST - 1
    : currentQ === questions.length - 1;

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
          if (prev <= 1) return 0;
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
    const total = ADAPTIVE_MODE ? QUESTIONS_PER_TEST : questions.length;
    if (answers.length === 0 || answers.length !== total) return;

    setPhase("processing");

    let r: TestResult;
    if (ADAPTIVE_MODE && adaptiveSessionRef.current?.thetaEstimate) {
      const theta = adaptiveSessionRef.current.thetaEstimate.theta;
      const di = abilityToDegradationIndex(theta);
      const base = calculateResult(answers, timeouts, questions);
      r = {
        ...base,
        degradationIndex: di,
        tier: getTierByIndex(di),
        estimationMethod: "irt",
      };
    } else {
      r = calculateResult(answers, timeouts, questions);
    }
    setResult(r);

    try {
      const prevRaw = localStorage.getItem("cognitive-rust-result");
      if (prevRaw) {
        setPrevResult(JSON.parse(prevRaw));
      }

      const entry = {
        degradationIndex: r.degradationIndex,
        tierLabel: r.tier.tierKey,
        tierLabelKey: r.tier.tierKey,
        tierColor: r.tier.ringColor,
        correctCount: r.correctCount,
        totalQuestions: r.totalQuestions,
        dimensionScores: r.dimensionScores,
        aiUsage: aiUsage,
        timestamp: Date.now(),
        estimationMethod: r.estimationMethod,
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
      tierLabel: r.tier.tierKey,
      correctCount: r.correctCount,
      totalQuestions: r.totalQuestions,
      aiUsageLevel: aiUsage !== null ? AI_CANONICAL_LEVELS[aiUsage] : null,
      estimationMethod: r.estimationMethod,
    };
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});

    clearProgress();
    setSavedProgress(null);

    const timer = setTimeout(() => setPhase("result"), 600);
    return () => clearTimeout(timer);
  }, [answers, timeouts]);

  // Auto-advance to next question after answer is recorded
  useEffect(() => {
    if (phase !== "testing") return;
    if (answers.length <= currentQ) return;
    if (answers.length >= (ADAPTIVE_MODE ? QUESTIONS_PER_TEST : questions.length)) return;
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

  // Save progress on visibility change / beforeunload
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
  }, [phase, questions, currentQ, answers, timeouts, declared, aiUsage, timeLeft]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Load saved progress + previous result from localStorage (after hydration)
  useEffect(() => {
    const p = loadProgress();
    if (p) setSavedProgress(p);

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

  // Question mark follows cursor/touch
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
    // In adaptive mode, saved progress is incompatible — restart instead
    if (ADAPTIVE_MODE) {
      const resumedAiUsage =
        typeof savedProgress.aiUsage === "number" ? savedProgress.aiUsage : 0;
      setAiUsage(resumedAiUsage);
      clearProgress();
      setSavedProgress(null);
      setPhase("testing");
      setCurrentQ(0);
      setAnswers([]);
      setTimeouts([]);
      setSelected(null);
      const session = createTestSession(QUESTIONS_PER_TEST);
      adaptiveSessionRef.current = session;
      const firstQ = selectNextQuestion(session, allQuestions);
      setQuestions(firstQ ? [firstQ] : selectQuestions(1, locale));
      startTimer();
      return;
    }
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

    if (ADAPTIVE_MODE) {
      const session = createTestSession(QUESTIONS_PER_TEST);
      adaptiveSessionRef.current = session;
      const firstQ = selectNextQuestion(session, allQuestions);
      setQuestions(firstQ ? [firstQ] : selectQuestions(1, locale));
    } else {
      // Phase 0: questions already pre-selected on mount
    }
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

    // Adaptive mode: record response to session and select next question
    if (ADAPTIVE_MODE && adaptiveSessionRef.current) {
      const answeredQ = questions[currentQ];
      if (answeredQ) {
        const score = answer === answeredQ.answer ? 1 : 0;
        recordResponse(
          adaptiveSessionRef.current,
          answeredQ.id,
          answeredQ.type,
          answeredQ.difficulty,
          score,
        );
      }
      if (!isTestComplete(adaptiveSessionRef.current)) {
        const nextQ = selectNextQuestion(
          adaptiveSessionRef.current,
          allQuestions.length > 0 ? allQuestions : questions,
        );
        if (nextQ) {
          setQuestions((prev) => [...prev, nextQ]);
        }
      }
    }
  }

  function handleNext() {
    if (selected === null) return;
    submitAnswer(selected);
  }

  async function handleRestart() {
    stopTimer();
    clearProgress();
    setSavedProgress(null);
    adaptiveSessionRef.current = null;
    await ensureBank(locale);
    if (ADAPTIVE_MODE) {
      setAllQuestions(getAllQuestions(locale));
    } else {
      setQuestions(selectQuestions(QUESTIONS_PER_TEST, locale));
    }
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

  return {
    // State
    phase,
    declared, setDeclared,
    currentQ,
    selected,
    answers,
    timeouts,
    timeLeft,
    result,
    savedResult,
    savedProgress,
    showExplanations, setShowExplanations,
    isDownloading,
    toast, setToast,
    challengeRef,
    prevResult,
    aiUsage, setAiUsage,
    questions,
    isLastQuestion,
    totalQuestions: QUESTIONS_PER_TEST,

    // Refs
    questionMarkRef,

    // Handlers
    handleStart,
    handleResume,
    handleBeginTest,
    handleSelectOption,
    handleNext,
    handleRestart,
    handleShare,
    handleSetReminder,
    handleDownloadImage,
  };
}
