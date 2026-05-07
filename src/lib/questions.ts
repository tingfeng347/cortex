export type { Question } from "./question-bank/types"

export { selectQuestions, ensureBank, getAllQuestions } from "./question-bank/index"
export const QUESTION_TIME = 40 // seconds per question
export const QUESTIONS_PER_TEST = 20

// Feature flag: set NEXT_PUBLIC_ADAPTIVE_MODE=true to enable Phase 1 adaptive testing
export const ADAPTIVE_MODE =
  process.env.NEXT_PUBLIC_ADAPTIVE_MODE === "true"
