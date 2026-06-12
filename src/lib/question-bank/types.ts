export interface Question {
  id: number;
  type: "logic" | "math" | "vocab" | "event";
  category: string; // translation key, e.g. "logic", "sequence", "math", "vocab"
  question: string;
  options: string[];
  answer: number | number[]; // index into options, array for multi-answer
  explanation: string;
  // Phase 1: IRT parameters
  difficulty: number; // IRT b-parameter, logit scale -3 to +3
  discrimination?: number; // IRT a-parameter, default 1.0 for 1PL
  guessing?: number; // IRT c-parameter, default 0.25 for 4-option MCQ
  source?: "static" | "llm"; // provenance marker
}
