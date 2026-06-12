export interface ResponseRecord {
  questionId: number;
  type: "logic" | "math" | "vocab" | "event";
  score: number; // 0–1, fractional for partial credit
  difficulty: number;
  discrimination?: number;
  guessing?: number;
  responseTime?: number; // milliseconds
}

export interface ThetaEstimate {
  theta: number; // EAP point estimate
  standardError: number; // posterior SD
  responses: ResponseRecord[];
  priorMean: number;
  priorSd: number;
}

export interface AbilityProfile {
  overall: ThetaEstimate;
  byType: {
    logic: ThetaEstimate | null;
    math: ThetaEstimate | null;
    vocab: ThetaEstimate | null;
    event: ThetaEstimate | null;
  };
  testDate: string; // ISO date
  questionsAnswered: number;
}
