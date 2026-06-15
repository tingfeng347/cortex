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
  scoreAnswer,
  type TestResult,
  type DimensionScores,
  normalizeDimensionScores,
  normalizeThetaByType,
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
import { estimateAbility } from "@/lib/irt/engine";
import {
  loadProgress,
  clearProgress,
  saveProgress,
  type SavedProgress,
} from "./helpers"
import { usePremium } from "../premium/usePremium"

const FREE_LIMIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const MAX_FREE_TESTS = 7
const FREE_TEST_TIMESTAMPS_KEY = "cortex:free-test-timestamps";
const OLD_FREE_TEST_KEY = "cortex:last-free-test";

function readTimestamps(): number[] {
  const raw = localStorage.getItem(FREE_TEST_TIMESTAMPS_KEY)
  const timestamps: number[] = raw ? JSON.parse(raw) : []
  return Array.isArray(timestamps) ? timestamps : []
}

function saveTimestamps(timestamps: number[]): void {
  const now = Date.now()
  const windowStart = now - FREE_LIMIT_WINDOW_MS
  const valid = timestamps.filter(ts => typeof ts === "number" && ts > windowStart)
  localStorage.setItem(FREE_TEST_TIMESTAMPS_KEY, JSON.stringify(valid))
}

/** Migrate old single-timestamp key into the new array, then remove it. */
function migrateOldCooldown(): void {
  try {
    const oldRaw = localStorage.getItem(OLD_FREE_TEST_KEY)
    if (!oldRaw) return
    const oldTs = parseInt(oldRaw, 10)
    if (isNaN(oldTs)) {
      localStorage.removeItem(OLD_FREE_TEST_KEY)
      return
    }
    // Only migrate if still within the window
    if (Date.now() - oldTs < FREE_LIMIT_WINDOW_MS) {
      const timestamps = readTimestamps()
      if (!timestamps.includes(oldTs)) {
        timestamps.push(oldTs)
        saveTimestamps(timestamps)
      }
    }
    localStorage.removeItem(OLD_FREE_TEST_KEY)
  } catch { /* ignore */ }
}

function getFreeTestCooldownEndsAt(): number | null {
  try {
    migrateOldCooldown()
    const timestamps = readTimestamps()
    const now = Date.now()
    const windowStart = now - FREE_LIMIT_WINDOW_MS
    const valid = timestamps.filter(ts => ts > windowStart)
    if (valid.length >= MAX_FREE_TESTS) {
      const oldest = Math.min(...valid)
      return oldest + FREE_LIMIT_WINDOW_MS
    }
    return null
  } catch {
    return null
  }
}

function recordFreeTest(): void {
  try {
    migrateOldCooldown()
    const timestamps = readTimestamps()
    timestamps.push(Date.now())
    saveTimestamps(timestamps)
  } catch { /* ignore */ }
}

function getFreeTestUsedCount(): number {
  try {
    migrateOldCooldown()
    const timestamps = readTimestamps()
    const now = Date.now()
    const windowStart = now - FREE_LIMIT_WINDOW_MS
    return timestamps.filter(ts => ts > windowStart).length
  } catch {
    return 0
  }
}

type Phase = "landing" | "declaration" | "testing" | "processing" | "result";

type ToastState = string | { message: string; action: { label: string; onPress: () => void } } | null;

interface StoredResultSummary {
  degradationIndex: number;
  tierLabel: string;
  tierLabelKey?: string;
  tierColor: string;
  correctCount: number;
  totalQuestions: number;
  dimensionScores?: DimensionScores;
  timestamp: number;
  aiUsage?: number | null;
  estimationMethod?: "percentage" | "irt";
  theta?: number;
  thetaSE?: number;
  thetaByType?: TestResult["thetaByType"];
  flaggedIds?: number[];
}

/** Patch old-format stored data that may lack newer dimension keys. */
function normalizeStoredEntry<T extends { dimensionScores?: unknown; thetaByType?: unknown }>(entry: T): T {
  if (entry.dimensionScores) {
    entry.dimensionScores = normalizeDimensionScores(entry.dimensionScores)
  }
  if (entry.thetaByType) {
    entry.thetaByType = normalizeThetaByType(entry.thetaByType)
  }
  return entry
}

export function useTestState() {
  const n = useTranslations();
  const locale = useLocale();
  const { isPremium, syncNow } = usePremium();
  const testStartTime = useRef<number>(0);
  const [phase, setPhase] = useState<Phase>("landing");
  const [declared, setDeclared] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null | number[]>(null);
  const [answers, setAnswers] = useState<(number | null | number[])[]>([]);
  const [timeouts, setTimeouts] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [result, setResult] = useState<TestResult | null>(null);
  const [savedResult, setSavedResult] = useState<StoredResultSummary | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const handSlipsRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: ToastState, duration = 2000) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    if (duration > 0) toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }
  const [challengeRef, setChallengeRef] = useState<number | null>(null);
  const [prevResult, setPrevResult] = useState<StoredResultSummary | null>(null);
  const [aiUsage, setAiUsage] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const adaptiveSessionRef = useRef<AdaptiveTestSession | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number>(0);
  const [cooldownVersion, setCooldownVersion] = useState(0);
  const [freeTestUsedCount, setFreeTestUsedCount] = useState(0);
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set());
  const [hasFlaggedBefore, setHasFlaggedBefore] = useState(false);

  function toggleFlag(questionId: number) {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      const adding = !next.has(questionId);
      if (adding) next.add(questionId);
      else next.delete(questionId);

      // Fire-and-forget persist on result page (catch browser close/refresh)
      if (phase === "result") {
        const ids = [...next];
        try {
          const saved = localStorage.getItem("cognitive-rust-result");
          if (saved) { const e = JSON.parse(saved); e.flaggedIds = ids; localStorage.setItem("cognitive-rust-result", JSON.stringify(e)); }
          const fullRaw = localStorage.getItem("cognitive-rust-full-result");
          if (fullRaw) { const f = JSON.parse(fullRaw); if (f.result) f.result.flaggedIds = ids; localStorage.setItem("cognitive-rust-full-result", JSON.stringify(f)); }
        } catch { /* ignore */ }
        // Toast feedback
        showToast(adding ? n("testing.flagAdded") : n("testing.flagRemoved"), 2000);
      }

      // Report to KV (aggregate by question, not by user)
      if (adding) {
        fetch("/api/flags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: `${locale}:${questionId}` }),
        }).catch(() => {});
      }
      return next;
    });
  }

  // Initialise questions on mount + regenerate when locale changes
  // (except mid-test — questions are frozen once the test starts)
  useEffect(() => {
    if (phase === "testing" || phase === "processing") return;
    ensureBank(locale).then(async () => {
      // Fetch calibrated IRT params (best-effort)
      let calibratedParams: Record<string, { a: number; b: number; c?: number }> = {};
      try {
        const res = await fetch("/api/question-params");
        if (res.ok) calibratedParams = await res.json();
      } catch {}

      const hasParams = Object.keys(calibratedParams).length > 0;

      if (ADAPTIVE_MODE) {
        const all = getAllQuestions(locale);
        if (hasParams) {
          setAllQuestions(
            all.map((q) => ({
              ...q,
              difficulty: calibratedParams[q.id]?.b ?? q.difficulty,
              discrimination: calibratedParams[q.id]?.a ?? q.discrimination,
              guessing: calibratedParams[q.id]?.c ?? q.guessing,
            })),
          );
        } else {
          setAllQuestions(all);
        }
      } else {
        let qs = selectQuestions(QUESTIONS_PER_TEST, locale);
        if (hasParams) {
          setQuestions(
            qs.map((q) => ({
              ...q,
              difficulty: calibratedParams[q.id]?.b ?? q.difficulty,
              discrimination: calibratedParams[q.id]?.a ?? q.discrimination,
              guessing: calibratedParams[q.id]?.c ?? q.guessing,
            })),
          );
        } else {
          setQuestions(qs);
        }
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
    // submitAnswer intentionally uses the current question snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, selected, answers.length, currentQ]);

  // Calculate result when all questions answered
  useEffect(() => {
    const total = ADAPTIVE_MODE ? QUESTIONS_PER_TEST : questions.length;
    if (answers.length === 0 || answers.length !== total) return;

    let resultTimer: ReturnType<typeof setTimeout> | null = null;
    const settleTimer = setTimeout(() => {
      setPhase("processing");

      let r: TestResult;
      if (ADAPTIVE_MODE && adaptiveSessionRef.current?.thetaEstimate) {
        const theta = adaptiveSessionRef.current.thetaEstimate.theta;
        const se = adaptiveSessionRef.current.thetaEstimate.standardError;
        const di = abilityToDegradationIndex(theta);
        const base = calculateResult(answers, timeouts, questions);

        // Per-dimension theta estimates
        const responses = adaptiveSessionRef.current.responses;
        const thetaByType: TestResult["thetaByType"] = {
          logic: null,
          math: null,
          vocab: null,
          event: null,
        };
        for (const dim of ["logic", "math", "vocab", "event"] as const) {
          const dimResponses = responses.filter((r) =>
            dim === "event"
              ? r.type === "event" || r.type === "event-cause" || r.type === "event-argument"
              : r.type === dim
          );
          if (dimResponses.length >= 3) {
            const est = estimateAbility(dimResponses);
            thetaByType[dim] = { theta: est.theta, se: est.standardError };
          }
        }

        r = {
          ...base,
          degradationIndex: di,
          tier: getTierByIndex(di),
          estimationMethod: "irt",
          theta,
          thetaSE: se,
          thetaByType,
        };
      } else {
        r = calculateResult(answers, timeouts, questions);
      }
      r.flaggedIds = [...flaggedIds];
      setResult(r);

      try {
        const prevRaw = localStorage.getItem("cognitive-rust-result");
        if (prevRaw) {
          setPrevResult(normalizeStoredEntry(JSON.parse(prevRaw)));
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
          theta: r.theta,
          thetaSE: r.thetaSE,
          thetaByType: r.thetaByType,
          flaggedIds: [...flaggedIds],
        };
        localStorage.setItem("cognitive-rust-result", JSON.stringify(entry));
        setSavedResult(entry)
        localStorage.setItem("cognitive-rust-full-result", JSON.stringify({ result: r, aiUsage }));
        const raw = localStorage.getItem("cognitive-rust-history");
        const history = raw ? JSON.parse(raw) : [];
        history.push(entry);
        if (history.length > 20) history.shift();
        localStorage.setItem("cognitive-rust-history", JSON.stringify(history));

        // Track free test count within rolling 7-day window
        if (!isPremium) {
          recordFreeTest()
          setFreeTestUsedCount(getFreeTestUsedCount())
        }
        // Sync to cloud for premium users
        if (isPremium) {
          syncNow().catch(() => {})
        }
      } catch {
        // ignore
      }
      const elapsedMs = testStartTime.current ? Date.now() - testStartTime.current : null;

      // Build per-question response records for IRT calibration
      const responseRecords: Array<{questionId: number; correct: number; theta: number | null}> = []
      if (ADAPTIVE_MODE && adaptiveSessionRef.current?.responses) {
        const finalTheta = r.theta ?? null
        for (const rr of adaptiveSessionRef.current.responses) {
          responseRecords.push({
            questionId: rr.questionId,
            correct: rr.score >= 0.5 ? 1 : 0,
            theta: finalTheta,
          })
        }
      } else if (!ADAPTIVE_MODE && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const qScore = scoreAnswer(answers[i], questions[i].answer)
          responseRecords.push({
            questionId: questions[i].id,
            correct: qScore >= 0.5 ? 1 : 0,
            theta: null,
          })
        }
      }

      const deviceId = (() => { try { return localStorage.getItem("cortex:device-id") ?? "anon" } catch { return "anon" } })()

      const payload = {
        degradationIndex: r.degradationIndex,
        tierLabel: r.tier.tierKey,
        correctCount: r.correctCount,
        totalQuestions: r.totalQuestions,
        aiUsageLevel: aiUsage !== null ? AI_CANONICAL_LEVELS[aiUsage] : null,
        estimationMethod: r.estimationMethod,
        elapsedMs,
        theta: r.theta ?? null,
        deviceId,
        responses: responseRecords.length > 0 ? responseRecords : undefined,
      }
      fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      clearProgress();
      setSavedProgress(null);

      resultTimer = setTimeout(() => setPhase("result"), 600);
    }, 0);

    return () => {
      clearTimeout(settleTimer);
      if (resultTimer) clearTimeout(resultTimer);
    };
  }, [answers, timeouts, questions, aiUsage]);

  // Hide top nav during testing
  useEffect(() => {
    if (phase === "testing") {
      document.body.classList.add("hide-top-nav");
    } else {
      document.body.classList.remove("hide-top-nav");
    }
    return () => document.body.classList.remove("hide-top-nav");
  }, [phase]);

  // Auto-advance to next question after answer is recorded
  useEffect(() => {
    if (phase !== "testing") return;
    if (answers.length <= currentQ) return;
    if (answers.length >= (ADAPTIVE_MODE ? QUESTIONS_PER_TEST : questions.length)) return;
    const timer = setTimeout(() => {
      setCurrentQ((prev) => prev + 1);
      startTimer();
    }, 0);
    return () => clearTimeout(timer);
  }, [answers.length, currentQ, phase, questions.length, startTimer]);

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
  }, [answers, phase, questions, currentQ, timeouts, declared, aiUsage]);

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

  // Clear free test timestamps when premium
  useEffect(() => {
    if (isPremium) {
      setCooldownEndsAt(0)
      setFreeTestUsedCount(0)
      localStorage.removeItem(FREE_TEST_TIMESTAMPS_KEY)
      localStorage.removeItem(OLD_FREE_TEST_KEY)
    }
  }, [isPremium])

  // Load saved progress + previous result from localStorage (after hydration)
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const p = loadProgress();
      if (p) setSavedProgress(p);

      try {
        const saved = localStorage.getItem("cognitive-rust-result");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.flaggedIds?.length > 0) setHasFlaggedBefore(true);
          setSavedResult(normalizeStoredEntry(parsed));
        }
        // Also check history for any past flags
        if (!hasFlaggedBefore) {
          const histRaw = localStorage.getItem("cognitive-rust-history");
          if (histRaw) {
            const hist = JSON.parse(histRaw);
            if (hist.some((h: any) => h.flaggedIds?.length > 0)) setHasFlaggedBefore(true);
          }
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

      // Check 7-day / 7-test limit for free users
      if (!isPremium) {
        const cooldownEnd = getFreeTestCooldownEndsAt()
        if (cooldownEnd !== null && Date.now() < cooldownEnd) {
          setCooldownEndsAt(cooldownEnd)
        }
        setFreeTestUsedCount(getFreeTestUsedCount())
      }
    });
    return () => {
      cancelled = true;
    };
  }, [n, isPremium]);

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
    // Check 7-day / 7-test limit for free users
    if (!isPremium) {
      const cooldownEnd = getFreeTestCooldownEndsAt()
      if (cooldownEnd !== null && Date.now() < cooldownEnd) {
        setCooldownEndsAt(cooldownEnd)
        setCooldownVersion((v) => v + 1)
        return // blocked by limit
      }
      setFreeTestUsedCount(getFreeTestUsedCount())
    }
    clearProgress();
    setSavedProgress(null);
    setPhase("declaration");
  }

  function handleResume() {
    if (!savedProgress) return;
    testStartTime.current = Date.now();
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
    showToast(n("toast.resumeRestored"), 2000);
  }

  function handleBeginTest() {
    if (aiUsage === null) return;
    testStartTime.current = Date.now();
    clearProgress();
    setSavedProgress(null);
    setPhase("testing");
    setCurrentQ(0);
    setAnswers([]);
    setTimeouts([]);
    setSelected(null);
    handSlipsRef.current = 0;

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
    // Multi-select mode: toggle option in/out
    if (questions[currentQ] && Array.isArray(questions[currentQ].answer)) {
      setSelected((prev) => {
        const arr: number[] = Array.isArray(prev) ? [...prev] : prev !== null ? [prev] : [];
        const idx = arr.indexOf(index);
        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(index);
        return arr;
      });
      return;
    }

    // Single-select mode (original behavior)
    if (selected !== null) {
      if (selected !== index) {
        if (handSlipsRef.current < 2) {
          setToast({
            message: n("lockedSelection"),
            action: {
              label: n(handSlipsRef.current === 0 ? "handSlipButton" : "handSlipButton2"),
              onPress: () => {
                handSlipsRef.current += 1;
                setSelected(index);
                if (handSlipsRef.current === 1) {
                  setToast(n("handSlipFirst"));
                } else {
                  setToast(n("handSlipSecond"));
                }
                setTimeout(() => setToast(null), 2000);
              },
            },
          });
          setTimeout(() => setToast(null), 4000);
        } else {
          showToast(n("lockedSelection"), 2000);
        }
      }
      return;
    }
    setSelected(index);
  }

  function submitAnswer(answer: number | null | number[]) {
    const timedOut = answer === null && timeLeft === 0;
    stopTimer();
    setAnswers((prev) => [...prev, answer]);
    setTimeouts((prev) => [...prev, timedOut]);
    setSelected(null);

    // Adaptive mode: record response to session and select next question
    if (ADAPTIVE_MODE && adaptiveSessionRef.current) {
      const answeredQ = questions[currentQ];
      if (answeredQ) {
        const score = scoreAnswer(answer, answeredQ.answer);
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
    if (Array.isArray(selected) && selected.length === 0) return;
    setToast(null);
    if (toastTimerRef.current) { clearTimeout(toastTimerRef.current); toastTimerRef.current = null; }
    submitAnswer(selected);
  }

  // Persist flags to localStorage + KV before leaving result page
  function persistFlagsAndSync() {
    try {
      // Update localStorage entries with latest flags
      const saved = localStorage.getItem("cognitive-rust-result");
      if (saved) {
        const entry = JSON.parse(saved);
        entry.flaggedIds = [...flaggedIds];
        localStorage.setItem("cognitive-rust-result", JSON.stringify(entry));
      }
      const fullRaw = localStorage.getItem("cognitive-rust-full-result");
      if (fullRaw) {
        const full = JSON.parse(fullRaw);
        if (full.result) full.result.flaggedIds = [...flaggedIds];
        localStorage.setItem("cognitive-rust-full-result", JSON.stringify(full));
      }
      // Also update the last history entry
      const histRaw = localStorage.getItem("cognitive-rust-history");
      if (histRaw) {
        const hist = JSON.parse(histRaw);
        if (hist.length > 0) {
          hist[hist.length - 1].flaggedIds = [...flaggedIds];
          localStorage.setItem("cognitive-rust-history", JSON.stringify(hist));
        }
      }
      // Sync to cloud for premium users
      if (isPremium) syncNow().catch(() => {});
    } catch { /* ignore */ }
  }

  async function handleRestart() {
    persistFlagsAndSync();
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
    handSlipsRef.current = 0;
  }

  function handleViewLastResult() {
    try {
      const raw = localStorage.getItem("cognitive-rust-full-result");
      if (!raw) return;
      const { result: fullResult, aiUsage: savedAiUsage } = JSON.parse(raw) as {
        result: TestResult;
        aiUsage: number | null;
      };
      if (fullResult) {
        fullResult.dimensionScores = normalizeDimensionScores(fullResult.dimensionScores);
        if (fullResult.thetaByType) {
          fullResult.thetaByType = normalizeThetaByType(fullResult.thetaByType);
        }
      }

      // Load prevResult from history for comparison
      const historyRaw = localStorage.getItem("cognitive-rust-history");
      const historyParsed: StoredResultSummary[] = historyRaw ? JSON.parse(historyRaw).map(normalizeStoredEntry) : [];
      if (historyParsed.length >= 2) {
        setPrevResult(historyParsed[historyParsed.length - 2]);
      }

      setResult(fullResult);
      setAiUsage(savedAiUsage ?? null);
      setPhase("result");
    } catch {
      // ignore
    }
  }

  async function handleShare() {
    if (!result) return;
    const tierKey = result.tier.tierKey;
    const text = generateShareText(result, {
      site: n("share.titleLine"),
      degradation: n("stats.avgDegradation"),
      correct: n("result.reviewCorrect"),
      tier: n("tier." + tierKey),
      description: n("tier." + tierKey + "Desc"),
      advice: n("tier." + tierKey + "Advice"),
      logic: n("radar.logic"),
      math: n("radar.math"),
      vocab: n("radar.vocab"),
      event: n("radar.event"),
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
      const shareText = isPremium ? text : text + "\n\n测试来自 认知防锈 cortex.hydroroll.team"
      await navigator.clipboard.writeText(shareText + "\n" + pageUrl);
      showToast(n("toast.resultCopied"), 2000);
    } catch {
      // silently fail
    }
  }

  function handleSetReminder() {
    if (!("Notification" in window)) {
      showToast(n("toast.notificationUnsupported"), 2000);
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
        showToast(n("toast.notificationSet"), 2000);
      } else {
        showToast(n("toast.notificationDenied"), 2000);
      }
    });
  }

  function handleDownloadImage() {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    showToast(n("toast.downloadStarted"), 1500);

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
      result.dimensionScores.event !== null
        ? `${n("radar.event")} ${result.dimensionScores.event}%`
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
      ${!isPremium ? `<text x="600" y="610" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="#d97706" font-weight="500">认知防锈 · 免费版</text>` : ""}
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
          showToast(n("toast.downloadFailed"), 2000);
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
        showToast(n("toast.downloadSuccess"), 2000);
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setIsDownloading(false);
      showToast(n("toast.downloadFailed"), 2000);
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
    cooldownEndsAt,
    cooldownVersion,
    freeTestUsedCount,
    flaggedIds,
    hasFlaggedBefore,
    toggleFlag,

    // Refs
    questionMarkRef,

    // Handlers
    handleStart,
    handleResume,
    handleBeginTest,
    handleSelectOption,
    handleNext,
    handleRestart,
    handleViewLastResult,
    handleShare,
    handleSetReminder,
    handleDownloadImage,
  };
}
