import type { Question } from "./types";
import { bank as zhCN } from "./zh-CN";
import { bank as en } from "./en";
import { bank as ja } from "./ja";

const BANKS: Record<string, Question[]> = {
  "zh-CN": zhCN,
  en,
  ja,
};

/**
 * Rewrite explanation text to replace position-based option references
 * (选项A, 答案为B, Option C, etc.) with the actual option content.
 * Uses the ORIGINAL (pre-shuffle) option positions as the reference.
 */
function rewriteExplanation(explanation: string | undefined, originalOptions: string[]): string | undefined {
  if (!explanation) return explanation;
  const n = originalOptions.length;
  if (n === 0) return explanation;

  const letters = "ABCDEFGH".slice(0, n);
  let result = explanation;

  // Helper: wrap option text in guillemets for clarity
  const opt = (idx: number) => `「${originalOptions[idx]}」`;
  const optIdx: Record<string, string> = {};
  for (let i = 0; i < n; i++) {
    optIdx[letters[i]] = opt(i);
    optIdx[letters[i].toLowerCase()] = opt(i);
  }

  // Pattern replacement map: [regex, replacement function]
  // Each pattern matches "X" as the option letter; replacement uses optIdx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patterns: Array<[RegExp, (...args: any[]) => string]> = [
    // "选项X" / "选项 X" — most generic, handles any context
    [/选项\s*([A-Da-d])/g, (m: string, l: string) => optIdx[l] ?? m],
    // "答案[为是：]X" (答案为B, 答案是C, 答案：D)
    [/答案([为是：:])\s*([A-Da-d])\b/g, (m: string, s: string, l: string) => optIdx[l] ? `答案${s}${optIdx[l]}` : m],
    // "正确答案X" / "正确答案为X" / "正确答案是X"
    [/正确(?:的)?答案(?:[为是：:])?\s*([A-Da-d])\b/g, (m: string, l: string) => optIdx[l] ? `正确答案${optIdx[l]}` : m],
    // "故答案为X" / "故应选X" / "故正确选项为X"
    [/(故|因此)(?:应)?(?:答案[为是]?|选|正确选项[为是]?)\s*([A-Da-d])\b/g, (m: string, pre: string, l: string) => optIdx[l] ? pre + optIdx[l] : m],
    // "对应选项X"
    [/对应\s*选项\s*([A-Da-d])/g, (m: string, l: string) => optIdx[l] ? `对应${optIdx[l]}` : m],
    // "干扰项X"
    [/干扰项\s*([A-Da-d])\b/g, (m: string, l: string) => optIdx[l] ? `干扰项${optIdx[l]}` : m],
    // English: "Option X"
    [/\b[Oo]ption\s+([A-D])\b/g, (m: string, l: string) => optIdx[l] ?? m],
    // "而非X" / "不如X"
    [/而非\s*([A-Da-d])\b/g, (m: string, l: string) => optIdx[l] ? `而非${optIdx[l]}` : m],
    [/不如\s*([A-Da-d])\b/g, (m: string, l: string) => optIdx[l] ? `不如${optIdx[l]}` : m],
    // "X选项" (as in "X选项：...")
    [/([A-Da-d])\s*选项/g, (m: string, l: string) => optIdx[l] ? `${optIdx[l]} 选项` : m],
    // "和X" / "或X" / "与X" followed by any common suffix
    [/(和|或|与)\s*([A-Da-d])\s*(正确|错误|是|为|符合|均|都|也|则|与|或|和|不|完|无|但|虽|却|即|就|可|应|已|曾|将|会|能|很|更|最|比|只|才|就|便|而|并|且|或|非|仍|还|又|再|一直|总是|从|对|被|让|把|向|给|替|跟|同|像|往|到|在|使|令|叫|请|让|这|那|其|各|某|另|本|该|同|此|彼|之)/g, (m: string, conj: string, l: string, suf: string) => {
      if (!optIdx[l]) return m;
      return `${conj}${optIdx[l]}${suf}`;
    }],
    // "[，,。\s]X正确 / X错误 / X是 / X符合 / X为 / X将 / X则 / X最"
    [/([，,。\s]|^)\s*([A-Da-d])\s*(正确|错误|是|为|符合|完全|则是|最|将|则|会|能|很|但|却|仍|均|都|也|即|只|就|便|而|并|且|或|非|还|又|再|一直|总是|不|可|应|已|曾|完|无|跟|同|像|与|和)/g, (m: string, pre: string, l: string, suf: string) => {
      if (!optIdx[l]) return m;
      return `${pre}${optIdx[l]}${suf}`;
    }],
    // "[仅只唯]有X正确" / "X项正确"
    [/([仅只唯]?)有\s*(?:选项)?\s*([A-Da-d])\s*(项)?\s*(正确|是正确答案|为正确答案)/g, (m: string, only: string, l: string, xi: string, ok: string) => {
      if (!optIdx[l]) return m;
      return `${only ? only + '有' : ''}${optIdx[l]}${xi || ''}${ok}`;
    }],
    // "正确选项X"
    [/正确\s*选项\s*([A-Da-d])/g, (m: string, l: string) => optIdx[l] ? `正确${optIdx[l]}` : m],
    // "而X是" / "即X是"
    [/(而|即|且|但|却)\s*([A-Da-d])\s*(是|为)\b/g, (m: string, w: string, l: string, s: string) => {
      if (!optIdx[l]) return m;
      return `${w}${optIdx[l]}${s}`;
    }],
    // "故选X"
    [/(故选)\s*([A-Da-d])\b/g, (m: string, pre: string, l: string) => optIdx[l] ? pre + optIdx[l] : m],
    // ", X和Y" / ", X与Y" — two consecutive letter references
    [/([，,。\s])([A-Da-d])\s*(和|与|或|、)\s*([A-Da-d])\b/g, (m: string, pre: string, l1: string, conj: string, l2: string) => {
      const a = optIdx[l1];
      const b = optIdx[l2];
      if (!a && !b) return m;
      return `${pre}${a || l1}${conj}${b || l2}`;
    }],
    // Closing ",X也" / "。X也" — single letter at end of patterns already caught
    // Just in case: any remaining standalone [A-D] after 选项 replacement
    [/([，,。\s])([A-Da-d])\s*$/gm, (m: string, pre: string, l: string) => {
      if (!optIdx[l]) return m;
      return `${pre}${optIdx[l]}`;
    }],
    // "，仅X正确" / "，只有X正确"
    [/([，,。\s])(仅|只|唯)\s*有?\s*([A-Da-d])\s*(正确|是|为)/g, (m: string, pre: string, adv: string, l: string, suf: string) => {
      if (!optIdx[l]) return m;
      return `${pre}${adv}有${optIdx[l]}${suf}`;
    }],
    // "(X)" / "（X）" at end of explanation — safe to rewrite
    [/[\(（]([A-Da-d])[\)）]\s*$/gm, (m: string, l: string) => optIdx[l] ?? m],
    // "的(A)" / "的（A）" — very likely an option reference (not a person name)
    [/的[\(（]([A-Da-d])[\)）]/g, (m: string, l: string) => optIdx[l] ? `的${optIdx[l]}` : m],
  ];

  for (const [re, fn] of patterns) {
    result = result.replace(re, (...args: string[]) => fn(...args));
  }

  return result;
}

/**
 * Shuffle the options array of a question and remap the answer index accordingly.
 * Also rewrites the explanation to remove position-based option references.
 * Returns a shallow copy; does not mutate the original bank question.
 */
function shuffleOptions<T extends Question>(question: T): T {
  const options = [...question.options];
  const n = options.length;

  // Build a mapping: oldIndex → newIndex
  const oldToNew = new Array<number>(n);
  const indices = Array.from({ length: n }, (_, i) => i);

  // Fisher-Yates shuffle on the index array
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Build reverse mapping: newIndex → oldIndex
  const newToOld = new Array<number>(n);
  for (let old = 0; old < n; old++) {
    const newIdx = indices[old];
    oldToNew[old] = newIdx;
    newToOld[newIdx] = old;
  }

  // Remap options array
  const shuffledOptions = newToOld.map((oldIdx) => options[oldIdx]);

  // Remap answer
  let shuffledAnswer: number | number[];
  if (Array.isArray(question.answer)) {
    shuffledAnswer = question.answer.map((oldIdx) => oldToNew[oldIdx]).sort((a, b) => a - b);
  } else {
    shuffledAnswer = oldToNew[question.answer];
  }

  // Rewrite explanation to remove position references
  const rewrittenExplanation = rewriteExplanation(question.explanation, options);

  return {
    ...question,
    options: shuffledOptions,
    answer: shuffledAnswer,
    explanation: rewrittenExplanation,
  };
}

/**
 * Ensure the question bank for a given locale is loaded.
 * All banks are statically imported to avoid Turbopack compilation
 * delays in dev mode from dynamic import() of large TS files.
 */
export async function ensureBank(locale: string): Promise<void> {
  void locale;
  // All banks are already loaded at module level
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
  const event = BANK.filter((q) => q.type === "event" || q.type === "event-cause" || q.type === "event-argument");

  // Pick at least 1 from each
  const picked = new Set<number>();
  const pools = [logic, math, vocab, event];
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

  return selected.map((q, i) => shuffleOptions({ ...q, id: i + 1 }));
}

/**
 * Return all questions from the bank for the given locale.
 * Used by the adaptive test coordinator to select from the full pool.
 * The bank must have been loaded first via ensureBank().
 */
export function getAllQuestions(locale = "zh-CN"): Question[] {
  const BANK = BANKS[locale] ?? zhCN;
  return BANK.map((q, i) => shuffleOptions({ ...q, id: i + 1 }));
}
