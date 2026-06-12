import type { Question } from "../question-bank/types";
import { fisherInfo } from "./engine";

/**
 * Select the next question that maximises Fisher information at the
 * current ability estimate, filtered to a specific dimension/type.
 *
 * To avoid presenting the same question sequence on consecutive tests
 * (especially at theta=0 where many items tie), candidates within 2% of
 * the best Fisher information are treated as equally good and one is
 * picked at random.
 *
 * @param theta  - current ability estimate (logits)
 * @param candidates  - pool of available questions (pre-filtered by type/category)
 * @param usedIds  - set of question IDs already presented this test
 * @returns the most informative unused question, or null if pool exhausted
 */
export function selectNextQuestion(
  theta: number,
  candidates: Question[],
  usedIds: Set<number>,
): Question | null {
  const available: { q: Question; info: number }[] = [];

  for (const q of candidates) {
    if (usedIds.has(q.id)) continue;
    available.push({
      q,
      info: fisherInfo(
        theta,
        q.difficulty,
        q.discrimination ?? 1.0,
        q.guessing ?? 0.25,
      ),
    });
  }

  if (available.length === 0) return null;

  // Find the best Fisher information
  let bestInfo = -Infinity;
  for (const a of available) {
    if (a.info > bestInfo) bestInfo = a.info;
  }

  // Keep candidates within 2% of the best (or at least the top 5)
  const threshold = bestInfo > 0 ? bestInfo * 0.98 : bestInfo;
  const contenders = available.filter((a) => a.info >= threshold);

  // Pick randomly from the top contenders
  const picked = contenders[Math.floor(Math.random() * contenders.length)];

  return picked.q;
}

/**
 * Convenience wrapper that also excludes questions that have been used
 * and groups candidates by type so callers don't need to pre-filter.
 *
 * @returns the best question matching `type`, or null if none remain
 */
export function selectNextQuestionByType(
  theta: number,
  pool: Question[],
  usedIds: Set<number>,
  type: "logic" | "math" | "vocab" | "event",
): Question | null {
  const candidates = pool.filter((q) => q.type === type);
  return selectNextQuestion(theta, candidates, usedIds);
}
