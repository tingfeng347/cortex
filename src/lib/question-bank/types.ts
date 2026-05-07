export interface Question {
  id: number;
  type: "logic" | "math" | "vocab";
  category: string; // translation key, e.g. "logic", "sequence", "math", "vocab"
  question: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
}
