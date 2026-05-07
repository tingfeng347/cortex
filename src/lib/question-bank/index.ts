import type { Question } from "./types"
import { bank as zhCN } from "./zh-CN"
import { bank as en } from "./en"
import { bank as ja } from "./ja"

const BANKS: Record<string, Question[]> = {
  "zh-CN": zhCN,
  en,
  ja,
}

/**
 * From the question bank for the given locale, randomly select n questions,
 * ensuring at least 1 from each category (logic / math / vocab).
 */
export function selectQuestions(n: number, locale = "zh-CN"): Question[] {
  const BANK = BANKS[locale] ?? BANKS["zh-CN"]
  const logic = BANK.filter((q) => q.type === "logic")
  const math = BANK.filter((q) => q.type === "math")
  const vocab = BANK.filter((q) => q.type === "vocab")

  // Pick at least 1 from each
  const picked = new Set<number>()
  const pools = [logic, math, vocab]
  const guaranteed = pools.map((pool) => {
    const idx = Math.floor(Math.random() * pool.length)
    picked.add(pool[idx].id)
    return pool[idx]
  })

  // Fill the rest randomly
  const remaining = BANK.filter((q) => !picked.has(q.id))
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[remaining[i], remaining[j]] = [remaining[j], remaining[i]]
  }

  const extras = remaining.slice(0, n - guaranteed.length)
  const selected = [...guaranteed, ...extras]

  // Shuffle the final selection
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[selected[i], selected[j]] = [selected[j], selected[i]]
  }

  return selected.map((q, i) => ({ ...q, id: i + 1 }))
}
