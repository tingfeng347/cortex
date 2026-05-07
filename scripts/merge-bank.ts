#!/usr/bin/env npx tsx

/**
 * Merge generated questions (JSON) into existing bank TS files.
 *
 * Reads scripts/output/{locale}.json and appends to
 * src/lib/question-bank/{locale}.ts with proper IDs and formatting.
 *
 * Usage:
 *   npx tsx scripts/merge-bank.ts
 *   npx tsx scripts/merge-bank.ts --dry-run   # preview without writing
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const OUTPUT_DIR = path.resolve(SCRIPT_DIR, "output");
const BANK_DIR = path.resolve(SCRIPT_DIR, "..", "src", "lib", "question-bank");

const LOCALES = ["zh-CN", "en", "ja"] as const;
const TYPE_LABELS: Record<string, { zh: string; en: string; ja: string }> = {
  logic: { zh: "逻辑推理", en: "Logic", ja: "論理推論" },
  math: { zh: "速算", en: "Math", ja: "暗算" },
  vocab: { zh: "词汇语义", en: "Vocabulary", ja: "語彙" },
};

interface Question {
  id: number;
  type: "logic" | "math" | "vocab";
  category: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: number;
  discrimination?: number;
  guessing?: number;
  source?: "static" | "llm";
}

function loadGenerated(locale: string): Question[] {
  const p = path.join(OUTPUT_DIR, `${locale}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function loadExistingBank(locale: string): Question[] {
  const p = path.join(BANK_DIR, `${locale}.ts`);
  const content = fs.readFileSync(p, "utf-8");

  // Extract all question objects by matching `{` ... `},` patterns
  // Simpler approach: find all question IDs
  const idMatches = content.matchAll(/id:\s*(\d+)/g);
  const ids = [...idMatches].map((m) => parseInt(m[1], 10));
  const maxId = ids.length > 0 ? Math.max(...ids) : 0;

  // Count questions by type
  const typeMatches = content.matchAll(/type:\s*"(logic|math|vocab)"/g);
  const types = [...typeMatches].map((m) => m[1]);
  const typeCount: Record<string, number> = { logic: 0, math: 0, vocab: 0 };
  for (const t of types) typeCount[t]++;

  return { maxId, typeCount } as any;
}

/**
 * Check if a generated question is too similar to existing bank questions.
 * Simple heuristic: check if the question text shares significant overlap.
 */
function isDuplicate(newQ: Question, existingQuestions: string): boolean {
  // Normalize: remove punctuation, lowercase, take first 30 chars as signature
  const sig = (s: string) => s.replace(/[^\w\u4e00-\u9fff]/g, "").slice(0, 40).toLowerCase();
  const newSig = sig(newQ.question);
  return existingQuestions.includes(newSig);
}

/**
 * Format a single question as TypeScript, matching the existing code style.
 */
function formatQuestion(q: Question, idx: number): string {
  const lines: string[] = [];
  lines.push("  {");
  lines.push(`    id: ${idx},`);
  lines.push(`    type: "${q.type}",`);
  lines.push(`    category: "${q.type}",`);
  lines.push(`    question:\n      ${JSON.stringify(q.question)},`);

  // Options array
  lines.push(`    options: ${JSON.stringify(q.options, null, 2).replace(/\n/g, "\n    ")},`);

  lines.push(`    answer: ${q.answer},`);
  lines.push(`    explanation:\n      ${JSON.stringify(q.explanation)},`);
  lines.push(`    difficulty: ${q.difficulty},`);
  lines.push(`    discrimination: ${q.discrimination ?? 1.0},`);
  lines.push(`    guessing: ${q.guessing ?? 0.25},`);
  lines.push("  },");
  return lines.join("\n");
}

function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  Merge Generated Questions into Bank Files  ║");
  console.log("╚═══════════════════════════════════════════════╝");
  if (isDryRun) console.log("\n🏃 DRY RUN — no files will be written\n");

  for (const locale of LOCALES) {
    const generated = loadGenerated(locale);
    if (generated.length === 0) {
      console.log(`\n⚠  ${locale}: no generated questions found`);
      continue;
    }

    const bankPath = path.join(BANK_DIR, `${locale}.ts`);
    const bankContent = fs.readFileSync(bankPath, "utf-8");

    // Determine next ID
    const existingIds = [...bankContent.matchAll(/id:\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
    const maxExistingId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    let nextId = maxExistingId + 1;

    // Detect duplicates
    const allExistingText = [...bankContent.matchAll(/question:\s*[\s\S]*?(?=\n\s*\})/g)].join(" ");
    const unique: Question[] = [];
    let skipped = 0;
    for (const q of generated) {
      if (isDuplicate(q, allExistingText)) {
        skipped++;
        continue;
      }
      unique.push(q);
    }

    // Build the new section comment
    const date = new Date().toISOString().slice(0, 10);
    const typeBreakdown: Record<string, number> = {};
    for (const q of unique) {
      typeBreakdown[q.type] = (typeBreakdown[q.type] || 0) + 1;
    }
    const breakdownStr = Object.entries(typeBreakdown)
      .map(([t, c]) => `${TYPE_LABELS[t]?.[locale as keyof (typeof TYPE_LABELS)[typeof t]] ?? t} ${c} 题`)
      .join("、");

    const comment = `\n  // ════════════════════════════════════════════\n  //  LLM 批量生成 · ${date}\n  //  ${breakdownStr}\n  // ════════════════════════════════════════════\n`;

    // Format the questions
    const formatted = unique.map((q) => formatQuestion(q, nextId++)).join("\n");

    // Insert before the closing `];`
    const insertPoint = bankContent.lastIndexOf("];");
    if (insertPoint === -1) {
      console.error(`❌ ${locale}: cannot find '];' in bank file — skipping`);
      continue;
    }

    const newContent =
      bankContent.slice(0, insertPoint) +
      comment +
      formatted +
      "\n" +
      bankContent.slice(insertPoint);

    if (isDryRun) {
      console.log(`\n📄 ${locale}: would insert ${unique.length} questions (skipped ${skipped} dupes)`);
      console.log(`   Insertion point: bank line ${bankContent.slice(0, insertPoint).split("\n").length}`);
      console.log(`   New IDs: ${maxExistingId + 1}–${nextId - 1}`);
      console.log(`   Breakdown: ${breakdownStr}`);
      console.log(`   Preview (first 2):`);
      console.log(formatted.split("\n").slice(0, 10).join("\n") + "\n   ...");
    } else {
      fs.writeFileSync(bankPath, newContent, "utf-8");
      console.log(`\n✓ ${locale}: merged ${unique.length} questions (skipped ${skipped} dupes)`);
      console.log(`  IDs ${maxExistingId + 1}–${nextId - 1}, breakdown: ${breakdownStr}`);
    }
  }

  if (isDryRun) {
    console.log("\n🏁 Dry run complete. Run without --dry-run to apply.\n");
  } else {
    console.log("\n✅ Merge complete! Run `pnpm build` to verify.");
  }
}

main();
