export interface Question {
  id: number;
  type: "logic" | "math" | "vocab";
  category: string;
  question: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
}

export { selectQuestions } from "./question-bank";
export const QUESTION_TIME = 40; // seconds per question
export const QUESTIONS_PER_TEST = 20;
