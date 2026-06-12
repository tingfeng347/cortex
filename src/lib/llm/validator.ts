/**
 * Validates LLM-generated questions for schema compliance and answer consistency.
 */
import type { Question } from "@/lib/question-bank/types";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Parse and validate a raw LLM output into a Question object.
 * Throws on validation failure.
 */
export function validateGeneratedQuestion(
  raw: Record<string, unknown>,
  locale: string,
  expectedType: "logic" | "math" | "vocab" | "event",
): Question {
  const errors: ValidationError[] = [];

  // --- question ---
  const question = raw.question;
  if (!question || typeof question !== "string" || question.trim().length < 10) {
    errors.push({ field: "question", message: "Question must be a non-empty string (≥10 chars)" });
  }

  // --- options ---
  const options = raw.options;
  if (!Array.isArray(options) || options.length !== 4) {
    errors.push({ field: "options", message: "Options must be an array of exactly 4 strings" });
  } else {
    for (let i = 0; i < options.length; i++) {
      if (typeof options[i] !== "string" || options[i].trim().length === 0) {
        errors.push({ field: `options[${i}]`, message: `Option ${i} must be a non-empty string` });
      }
    }
  }

  // --- answer ---
  const answer = raw.answer;
  if (typeof answer !== "number" || !Number.isInteger(answer) || answer < 0 || answer > 3) {
    errors.push({ field: "answer", message: "Answer must be an integer 0-3" });
  } else if (Array.isArray(options) && answer >= options.length) {
    errors.push({ field: "answer", message: `Answer index ${answer} out of range for ${options.length} options` });
  }

  // --- explanation ---
  const explanation = raw.explanation;
  if (!explanation || typeof explanation !== "string" || explanation.trim().length < 10) {
    errors.push({ field: "explanation", message: "Explanation must be a non-empty string (≥10 chars)" });
  }

  // --- type ---
  const type = raw.type;
  if (type !== expectedType) {
    errors.push({ field: "type", message: `Expected type "${expectedType}", got "${String(type)}"` });
  }

  // --- difficulty ---
  let difficulty = raw.difficulty;
  if (difficulty === undefined || difficulty === null) {
    // might be embedded in the input; accept if missing (caller fills it in)
    difficulty = 0;
  } else if (typeof difficulty !== "number" || isNaN(difficulty)) {
    errors.push({ field: "difficulty", message: "Difficulty must be a number" });
  }

  if (errors.length > 0) {
    const detail = errors.map((e) => `  - ${e.field}: ${e.message}`).join("\n");
    throw new Error(`Question validation failed:\n${detail}\n\nRaw input: ${JSON.stringify(raw)}`);
  }

  return {
    id: -1, // placeholder; caller assigns or uses cache key
    type: type as Question["type"],
    category: type as string,
    question: String(question),
    options: (options as string[]).map((o) => String(o).trim()),
    answer: answer as number,
    explanation: String(explanation),
    difficulty: Number(difficulty),
    discrimination: 1.0,
    guessing: 0.25,
    source: "llm",
  };
}

/**
 * Quick consistency check: ensure the explanation references the correct answer.
 * This is a heuristic — not exhaustive.
 */
export function answerConsistentWithExplanation(
  question: string,
  options: string[],
  answer: number,
  explanation: string,
): boolean {
  const correctText = options[answer]?.toLowerCase() ?? "";
  const expLower = explanation.toLowerCase();

  // The correct answer text should appear somewhere in the explanation
  if (correctText.length > 1 && !expLower.includes(correctText)) {
    return false;
  }

  // If explanation explicitly says "answer is X", verify X matches
  const answerPatterns = [
    /answer[:\s]+([a-d])/i,
    /正确[答案]*(?:是|为)[：:]\s*([abcd])/i,
    /正解[：:]\s*([abcd])/i,
    /[选选择]+\s*([abcd])/i,
  ];

  for (const pattern of answerPatterns) {
    const match = expLower.match(pattern);
    if (match) {
      const letterIndex = match[1].toLowerCase().charCodeAt(0) - 97; // a=0, b=1, etc.
      if (letterIndex >= 0 && letterIndex < options.length && letterIndex !== answer) {
        return false;
      }
    }
  }

  return true;
}
