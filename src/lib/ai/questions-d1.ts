import { d1First, d1Run, d1Query } from "@/lib/db";

export interface AiQuestionRow {
  id: number;
  locale: string;
  type: string;
  question: string;
  options: string;
  answer: number;
  explanation: string;
  difficulty: number;
  discrimination: number;
  guessing: number;
  input_tokens: number;
  output_tokens: number;
  neuron_cost: number;
  created_for_license: string | null;
  created_at: string;
  times_used: number;
  last_used_at: string;
}

export interface AiQuestionInput {
  locale: string;
  type: "logic" | "math" | "vocab" | "event";
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: number;
  discrimination: number;
  guessing: number;
  inputTokens: number;
  outputTokens: number;
  neuronCost: number;
  createdForLicense?: string;
}

/** Find an existing AI pool question matching locale, type, and difficulty range */
export async function findAiQuestionInPool(
  locale: string,
  type: string,
  targetDifficulty: number,
  tolerance: number = 0.5,
): Promise<AiQuestionRow | null> {
  return d1First<AiQuestionRow>(
    `SELECT * FROM ai_generated_questions
     WHERE locale = ? AND type = ?
     AND ABS(difficulty - ?) <= ?
     ORDER BY times_used ASC, RANDOM()
     LIMIT 1`,
    [locale, type, targetDifficulty, tolerance],
  );
}

/** Save a newly generated AI question to the pool */
export async function saveAiQuestion(input: AiQuestionInput): Promise<void> {
  await d1Run(
    `INSERT INTO ai_generated_questions
     (locale, type, question, options, answer, explanation,
      difficulty, discrimination, guessing,
      input_tokens, output_tokens, neuron_cost,
      created_for_license)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.locale,
      input.type,
      input.question,
      JSON.stringify(input.options),
      input.answer,
      input.explanation,
      input.difficulty,
      input.discrimination,
      input.guessing,
      input.inputTokens,
      input.outputTokens,
      input.neuronCost,
      input.createdForLicense ?? null,
    ],
  );
}

/** Increment the usage counter for a pooled question */
export async function incrementAiQuestionUsage(id: number): Promise<void> {
  await d1Run(
    `UPDATE ai_generated_questions
     SET times_used = times_used + 1, last_used_at = datetime('now')
     WHERE id = ?`,
    [id],
  );
}

/** Load all AI pool questions for a locale (for adaptive selection) */
export async function loadAiPoolQuestions(locale: string): Promise<AiQuestionRow[]> {
  return d1Query<AiQuestionRow>(
    "SELECT * FROM ai_generated_questions WHERE locale = ? ORDER BY times_used DESC",
    [locale],
  );
}
