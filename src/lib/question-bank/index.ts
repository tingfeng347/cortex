import type { Question } from "./types";
import { bank as zhCN } from "./zh-CN";

const BANKS: Record<string, Question[]> = {
  "zh-CN": zhCN,
};

/**
 * Ensure the question bank for a given locale is loaded.
 * Other locales are code-split and only loaded on demand.
 */
export async function ensureBank(locale: string): Promise<void> {
  if (BANKS[locale]) return;
  switch (locale) {
    case "en":
      BANKS[locale] = (await import("./en")).bank;
      break;
    case "ja":
      BANKS[locale] = (await import("./ja")).bank;
      break;
    default:
      BANKS[locale] = zhCN;
  }
}

/**
 * From the question bank for the given locale, randomly select n questions,
 * ensuring at least 1 from each category (logic / math / vocab).
 *
 * The bank for the requested locale must have been loaded first
 * via {@link ensureBank}. Falls back to zh-CN for unrecognised locales.
 */
export function selectQuestions(n: number, locale = "zh-CN"): Question[] {
  const BANK = BANKS[locale] ?? zhCN;
  const logic = BANK.filter((q) => q.type === "logic");
  const math = BANK.filter((q) => q.type === "math");
  const vocab = BANK.filter((q) => q.type === "vocab");

  // Pick at least 1 from each
  const picked = new Set<number>();
  const pools = [logic, math, vocab];
  const guaranteed = pools.map((pool) => {
    const idx = Math.floor(Math.random() * pool.length);
    picked.add(pool[idx].id);
    return pool[idx];
  });

  // Fill the rest randomly
  const remaining = BANK.filter((q) => !picked.has(q.id));
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }

  const extras = remaining.slice(0, n - guaranteed.length);
  const selected = [...guaranteed, ...extras];

  // Shuffle the final selection
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected.map((q, i) => ({ ...q, id: i + 1 }));
}

/**
 * Return all questions from the bank for the given locale.
 * Used by the adaptive test coordinator to select from the full pool.
 * The bank must have been loaded first via ensureBank().
 */
export function getAllQuestions(locale = "zh-CN"): Question[] {
  const BANK = BANKS[locale] ?? zhCN;
  return BANK.map((q, i) => ({ ...q, id: i + 1 }));
}
