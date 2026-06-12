import type { Question } from "./question-bank/types";
import type { ResponseRecord } from "./irt/types";
import { estimateAbility } from "./irt/engine";
import { selectNextQuestionByType } from "./irt/selector";

export interface AdaptiveTestSession {
  /** Pre-shuffled dimension order for all questions in this test */
  dimensionOrder: ("logic" | "math" | "vocab" | "event")[];
  /** How many questions have been answered (0 … targetCount) */
  currentStep: number;
  /** Response records for every answered question */
  responses: ResponseRecord[];
  /** Current theta estimate (null until ≥1 response recorded) */
  thetaEstimate: { theta: number; standardError: number } | null;
  /** Total number of questions in this test */
  targetCount: number;
}

/**
 * Fisher–Yates shuffle (mutable).
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Create a new adaptive test session with a pre-allocated, shuffled
 * dimension order (logic×5, math×5, vocab×5, event×5 = 20 total).
 */
export function createTestSession(
  targetCount: number = 20,
): AdaptiveTestSession {
  // Pre-allocate dimension order (7 logic, 7 math, 6 vocab)
  const dimensionOrder: ("logic" | "math" | "vocab" | "event")[] = shuffle([
    ...Array(5).fill("logic"),
    ...Array(5).fill("math"),
    ...Array(5).fill("vocab"),
    ...Array(5).fill("event"),
  ]);

  return {
    dimensionOrder,
    currentStep: 0,
    responses: [],
    thetaEstimate: null,
    targetCount,
  };
}

/**
 * Whether the test session is complete.
 */
export function isTestComplete(session: AdaptiveTestSession): boolean {
  return session.currentStep >= session.targetCount;
}

/**
 * Get the dimension (question type) for the next unanswered position.
 */
export function getCurrentDimension(
  session: AdaptiveTestSession,
): "logic" | "math" | "vocab" | "event" {
  return session.dimensionOrder[session.currentStep];
}

/**
 * Select the next question from the pool using maximum Fisher information
 * at the current theta estimate, filtered to the current dimension.
 *
 * @returns the best question, or null if no unused questions remain for
 *          the current dimension
 */
export function selectNextQuestion(
  session: AdaptiveTestSession,
  pool: Question[],
): Question | null {
  const usedIds = new Set(session.responses.map((r) => r.questionId));
  const theta = session.thetaEstimate?.theta ?? 0;
  const type = getCurrentDimension(session);

  return selectNextQuestionByType(theta, pool, usedIds, type);
}

/**
 * Record a response and re-estimate ability via EAP.
 *
 * Mutates the session in-place (simpler than immutable return for
 * interactive test flow).
 */
export function recordResponse(
  session: AdaptiveTestSession,
  questionId: number,
  type: "logic" | "math" | "vocab" | "event",
  difficulty: number,
  score: number, // 0–1, fractional for partial credit
  responseTime?: number,
): void {
  session.responses.push({
    questionId,
    type,
    difficulty,
    score,
    responseTime,
  });

  session.currentStep++;

  // Re-estimate ability after at least 1 response
  if (session.responses.length >= 1) {
    const est = estimateAbility(session.responses);
    session.thetaEstimate = {
      theta: est.theta,
      standardError: est.standardError,
    };
  }
}
