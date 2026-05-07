#!/usr/bin/env npx tsx

/**
 * Batch question generator for Cognitive Anti-Rust.
 *
 * Generates high-quality culturally-specific MCQ questions across
 * 3 languages (zh-CN, en, ja) × 3 types (logic, math, vocab)
 * with difficulty ranging from -3.0 to +3.0.
 *
 * Usage:
 *   # Export your API key first, or use --env-file with Node 20.6+:
 *   export OPENAI_API_KEY="sk-..."   # or DEEPSEEK_API_KEY
 *   npx tsx scripts/batch-generate.ts
 *
 *   # Resume from crash (progress is saved automatically):
 *   npx tsx scripts/batch-generate.ts --resume
 *
 * What it does:
 *   1. Generates questions via DeepSeek/OpenAI API with culture-specific prompts
 *   2. Validates each question (schema + answer consistency)
 *   3. Saves progress after each question (resumable)
 *   4. Outputs JSON files + optionally merges into TS bank files
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
/* ═══════════════════════════════════════════════════════════════
   Configuration
   ═══════════════════════════════════════════════════════════════ */

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const OUTPUT_DIR = path.resolve(SCRIPT_DIR, "output");
const PROGRESS_FILE = path.join(OUTPUT_DIR, "progress.json");
const API_KEY = process.env.OPENAI_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? "";
const BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.deepseek.com";
const MODEL = process.env.OPENAI_MODEL ?? "deepseek-chat";
const CONCURRENCY = 3;
const MAX_RETRIES = 2;
const BATCH_SIZE_PER_WRITE = 5; // flush output every N questions

/**
 * Generation plan: how many questions to generate per (locale, type) pair.
 *
 * Targets: zh-CN 150+, en 150+, ja 150+
 * Existing: zh-CN=44, en=54, ja=54
 * So we need: zh-CN +106, en +96, ja +96
 */
const GENERATION_PLAN: { locale: string; type: "logic" | "math" | "vocab"; count: number }[] = [
  // zh-CN
  { locale: "zh-CN", type: "logic", count: 36 },
  { locale: "zh-CN", type: "math", count: 35 },
  { locale: "zh-CN", type: "vocab", count: 36 },
  // en
  { locale: "en", type: "logic", count: 32 },
  { locale: "en", type: "math", count: 32 },
  { locale: "en", type: "vocab", count: 33 },
  // ja
  { locale: "ja", type: "logic", count: 32 },
  { locale: "ja", type: "math", count: 32 },
  { locale: "ja", type: "vocab", count: 33 },
];

/** Difficulty distribution: normal-ish across -3 to +3 */
const DIFFICULTY_BUCKETS = [
  { min: -3.0, max: -1.5, weight: 0.12 },
  { min: -1.5, max: -0.5, weight: 0.20 },
  { min: -0.5, max: 0.5, weight: 0.32 },
  { min: 0.5, max: 1.5, weight: 0.24 },
  { min: 1.5, max: 3.0, weight: 0.12 },
];

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

interface GeneratedQuestion {
  id: number;
  type: "logic" | "math" | "vocab";
  category: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: number;
  discrimination: number;
  guessing: number;
  source: "llm" | "static";
}

interface GenerationProgress {
  completed: string[]; // "locale:type:difficulty:hash" identifiers
  output: Record<string, GeneratedQuestion[]>; // locale → questions
  startedAt: string;
}

interface CellConfig {
  locale: string;
  type: "logic" | "math" | "vocab";
  difficulty: number;
}

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function cellId(c: CellConfig): string {
  return `${c.locale}:${c.type}:${c.difficulty.toFixed(1)}:${hashStr(c.locale + c.type + c.difficulty.toFixed(1)).slice(0, 8)}`;
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function countdown(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getExistingQuestions(locale: string): GeneratedQuestion[] {
  const filePath = path.join(OUTPUT_DIR, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch { /* ignore */ }
  }
  return [];
}

function saveQuestions(locale: string, questions: GeneratedQuestion[]) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${locale}.json`),
    JSON.stringify(questions, null, 2),
    "utf-8",
  );
}

function saveProgress(progress: GenerationProgress) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
}

function loadProgress(): GenerationProgress | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    }
  } catch { /* ignore */ }
  return null;
}

function buildUsedQuestionsList(existing: GeneratedQuestion[], newBatch: GeneratedQuestion[]): string[] {
  const all = [...existing, ...newBatch];
  // Return brief summaries (first 80 chars of question text)
  return all.map((q) => q.question.slice(0, 80).replace(/\n/g, " "));
}

/* ═══════════════════════════════════════════════════════════════
   Culture-Specific Prompt Builders
   ═══════════════════════════════════════════════════════════════ */

function buildSystemPrompt(locale: string, type: string, difficulty: number): string {
  const cultureGuidance = getCultureGuidance(locale, type, difficulty);
  const formatInstruction = getFormatInstruction(locale);
  return `${formatInstruction}\n\n${cultureGuidance}`;
}

function getFormatInstruction(locale: string): string {
  if (locale === "zh-CN") {
    return `你是一个专业的认知测试出题专家。你需要生成高质量的单选题。

要求：
1. 题目必须有唯一确定的正确答案
2. 四个选项（A/B/C/D），只有一个正确
3. 干扰项要有迷惑性
4. 必须包含详细的答案解析
5. 题目和选项使用中文
6. **选项内容必须是纯文本，不要加 A. B. C. D. 前缀**

输出格式为 JSON，包含字段：question, options (长度为4的字符串数组，每个元素就是选项文本本身，不含前缀), answer (0-3的数字索引), explanation`;
  } else if (locale === "ja") {
    return `あなたは認知テストの問題作成専門家です。高品質な選択問題を生成してください。

要件：
1. 唯一の正解が確定できる問題
2. 4つの選択肢（A/B/C/D）、1つだけが正解
3. 選択肢は魅力的であること
4. 詳細な解説を含めること
5. 問題文と選択肢は日本語
6. **選択肢のテキストには A. B. C. D. などの接頭辞をつけないでください**

出力はJSON形式：question, options (長さ4の文字列配列、各要素は選択肢テキストのみ), answer (0-3の数値インデックス), explanation`;
  } else {
    return `You are a professional cognitive test designer. Create high-quality multiple-choice questions.

Requirements:
1. Single unambiguous correct answer
2. Four options (A/B/C/D), only one correct
3. Distractors should be plausible
4. Include a detailed explanation
5. Question and options in English
6. **Option text must be raw text only — do NOT prefix with A. B. C. D.**

Output format: JSON with fields: question, options (array of 4 strings, each is just the option text), answer (0-3 index), explanation`;
  }
}

function getCultureGuidance(locale: string, type: string, difficulty: number): string {
  const diffLabel = difficultyLabel(difficulty);

  if (locale === "zh-CN") {
    switch (type) {
      case "logic":
        return `题型：逻辑推理（难度：${diffLabel}）

要求场景必须符合中国文化背景，不要使用西方人名/地名/场景。可以包括：
• 公务员考试/行测常见的逻辑判断题
• 中国古典逻辑（如《墨子》《庄子》中的推理）
• 日常生活中的推理场景（如办公室、学校、家庭）

难度 ${diffLabel}（IRT difficulty ≈ ${difficulty}）：
- 简单题（-3 ~ -1）：一步推理即可得出答案
- 中等题（-0.5 ~ 0.5）：需要 2-3 步推理
- 困难题（1.5 ~ 3）：需要多步骤推理、排除法、或反证法

确保使用中国姓名（张伟、王芳、李强等）和中国特色场景。`;
      case "math":
        return `题型：速算/数学计算（难度：${diffLabel}）

要求涉及中国语境，不要使用美元/英里等外国单位。可以包括：
• 人民币（元）相关计算
• 中国传统数学问题（鸡兔同笼、盈亏问题、工程问题、行程问题）
• 百分数、折扣、利率等日常计算
• 涉及中国地理/人口数据的问题

难度 ${diffLabel}（IRT difficulty ≈ ${difficulty}）：
- 简单题（-3 ~ -1）：一步计算即可
- 中等题（-0.5 ~ 0.5）：需要 2-3 步计算
- 困难题（1.5 ~ 3）：需要多步复杂计算或巧算

确保使用中国单位（元、公里、千克等）和中国语境。`;
      case "vocab":
        return `题型：词汇语义（难度：${diffLabel}）

要求基于中国文化内容。可以包括：
• 成语典故（如"胸有成竹""画龙点睛"等）
• 古诗词理解（唐诗宋词名句的理解）
• 文言文实词/虚词含义
• 语病辨析
• 词语感情色彩/近义词辨析
• 文化常识（如传统节日、历史人物相关）

难度 ${diffLabel}（IRT difficulty ≈ ${difficulty}）：
- 简单题（-3 ~ -1）：常见成语/词语
- 中等题（-0.5 ~ 0.5）：稍有难度的成语或诗词
- 困难题（1.5 ~ 3）：生僻成语、复杂的语病辨析

确保基于中国文化传统内容。`;
    }
  } else if (locale === "ja") {
    switch (type) {
      case "logic":
        return `题型：論理推論（難易度：${diffLabel}）

日本の文脈に沿った問題にしてください。以下のような内容を含めることができます：
• SPI試験や就職試験で出題される論理問題
• 日本の古典的な論理パズル
• 職場や学校などの日常生活における推理問題
• 数列パターン認識

難易度 ${diffLabel}（IRT difficulty ≈ ${difficulty}）：
- 簡単（-3 ~ -1）：1ステップで解答可能
- 普通（-0.5 ~ 0.5）：2〜3ステップの推論が必要
- 難しい（1.5 ~ 3）：複数ステップの複雑な推論が必要

日本人の名前（田中、鈴木、佐藤など）と日本的なシチュエーションを使用してください。`;
      case "math":
        return `题型：暗算・数学計算（難易度：${diffLabel}）

日本の文脈に沿った問題にしてください。以下のような内容を含めることができます：
• 日本円での計算（消費税10%を含む）
• 和算（鶴亀算、旅人算、流水算、年齢算など）
• 割引・割増の計算
• 速さ・距離・時間の問題

難易度 ${diffLabel}（IRT difficulty ≈ ${difficulty}）：
- 簡単（-3 ~ -1）：1ステップの計算
- 普通（-0.5 ~ 0.5）：2〜3ステップの計算
- 難しい（1.5 ~ 3）：複数ステップの複雑な計算

日本円（円）と日本の単位（km、g、Lなど）を使用してください。`;
      case "vocab":
        return `题型：語彙意味（難易度：${diffLabel}）

日本の文化・言語に基づいた問題にしてください。以下のような内容を含めることができます：
• 四字熟語の意味と用法
• 百人一首の歌と解釈
• 敬語（尊敬語・謙譲語・丁寧語）の使い分け
• 古典文法（古文単語、助動詞）
• 文学史（作家と作品の組み合わせ）
• ことわざの意味
• 同音異義語の区別

難易度 ${diffLabel}（IRT difficulty ≈ ${difficulty}）：
- 簡単（-3 ~ -1）：一般的な語彙・慣用句
- 普通（-0.5 ~ 0.5）：やや高度な語彙・文法
- 難しい（1.5 ~ 3）：専門的な古典・文学知識

日本の文化・文学・言語に基づいた内容にしてください。`;
    }
  } else {
    // English
    switch (type) {
      case "logic":
        return `Type: Logic Reasoning (Difficulty: ${diffLabel})

Please use Western cultural contexts. Include topics like:
• LSAT-style analytical reasoning puzzles
• Classic Western logic puzzles (knights and knaves, truth-tellers, etc.)
• Western philosophical paradoxes
• Sequence and pattern recognition
• Workplace/school scenarios in Western contexts

Difficulty ${diffLabel} (IRT difficulty ≈ ${difficulty})：
- Easy (-3 ~ -1): Single-step reasoning
- Medium (-0.5 ~ 0.5): 2-3 step reasoning
- Hard (1.5 ~ 3): Multi-step complex reasoning requiring deduction

Use Western names (John, Mary, Smith, etc.) and Western cultural contexts.`;
      case "math":
        return `Type: Mental Math (Difficulty: ${diffLabel})

Please use Western cultural contexts and units. Include topics like:
• USD ($) or GBP (£) currency calculations
• Imperial units (miles, gallons, pounds, inches, Fahrenheit)
• Percentage calculations, discounts, tips, tax
• Distance/speed/time problems
• Financial math (interest rates, mortgages, investments)

Difficulty ${diffLabel} (IRT difficulty ≈ ${difficulty})：
- Easy (-3 ~ -1): Single-step calculation
- Medium (-0.5 ~ 0.5): 2-3 step calculation
- Hard (1.5 ~ 3): Multi-step complex calculation

Use Western units (dollars, miles, gallons, Fahrenheit) and contexts.`;
      case "vocab":
        return `Type: Vocabulary & Semantics (Difficulty: ${diffLabel})

Please use English language and Western literary/cultural content. Include topics like:
• Shakespeare quotes, characters, and plays
• Etymology (Latin/Greek/French origins of English words)
• Commonly confused words (affect/effect, imply/infer, etc.)
• English idiom origins and meanings
• Western literary canon (authors, works, characters)
• Grammar and word usage

Difficulty ${diffLabel} (IRT difficulty ≈ ${difficulty})：
- Easy (-3 ~ -1): Common vocabulary and idioms
- Medium (-0.5 ~ 0.5): Moderately advanced vocabulary and literary knowledge
- Hard (1.5 ~ 3): Advanced etymology, obscure literary references, complex grammar

Base questions on English language and Western cultural/literary heritage.`;
    }
  }

  // Fallback (shouldn't reach here given all cases covered)
  return `Generate a ${type} question at difficulty approximately ${difficulty}.`;
}

function difficultyLabel(d: number): string {
  if (d < -1.5) return "简单/簡単/easy";
  if (d < -0.5) return "中等偏易/やや簡単/moderately easy";
  if (d < 0.5) return "中等/普通/moderate";
  if (d < 1.5) return "中等偏难/やや難しい/moderately hard";
  return "困难/難しい/hard";
}

function buildUserPrompt(locale: string, type: string, difficulty: number, usedQuestions: string[]): string {
  const base = locale === "zh-CN"
    ? `请生成一道难度约为 ${difficulty} 的${type === "logic" ? "逻辑推理" : type === "math" ? "速算" : "词汇语义"}题。`
    : locale === "ja"
      ? `難易度 ${difficulty} の${type === "logic" ? "論理推論" : type === "math" ? "暗算" : "語彙意味"}問題を1問生成してください。`
      : `Generate one ${type} question with difficulty approximately ${difficulty}.`;

  const avoidText = usedQuestions.length > 0
    ? `\n\n避免与以下题目重复（Avoid duplicating these topics）：\n${usedQuestions.map((q, i) => `${i + 1}. ${q}`).slice(-20).join("\n")}`
    : "";

  const formatHint = locale === "zh-CN"
    ? `\n\n确保：\n- 题目和选项用中文\n- 选项是纯文本，不要加 A. B. C. D. 前缀\n- 答案唯一且正确\n- 解析详细\n- 区分度好（不要有选项明显错误）\n- 每道题的场景或主题应尽量不同，不要和已有的题目重复`
    : locale === "ja"
      ? `\n\n確認：\n- 問題文と選択肢は日本語\n- 選択肢に A. B. C. D. などの接頭辞を付けない\n- 答えは一意で正しい\n- 解説は詳細\n- 選択肢に明らかに間違ったものがないこと\n- 問題のシチュエーションやテーマは毎回変えてください`
      : `\n\nEnsure:\n- Question and options in English\n- Options are raw text only, no A. B. C. D. prefixes\n- Answer is unique and correct\n- Explanation is detailed\n- No obviously wrong distractors\n- Vary the scenario/topic with each question — no two questions should use the same scenario`;

  return base + avoidText + formatHint;
}

/* ═══════════════════════════════════════════════════════════════
   Validator
   ═══════════════════════════════════════════════════════════════ */

function validateQuestion(
  raw: Record<string, unknown>,
  locale: string,
  expectedType: string,
): GeneratedQuestion {
  const errors: string[] = [];

  const question = raw.question;
  if (!question || typeof question !== "string" || question.trim().length < 10) {
    errors.push("question must be a string ≥10 chars");
  }

  const options = raw.options;
  if (!Array.isArray(options) || options.length !== 4) {
    errors.push("options must be an array of exactly 4 strings");
  } else {
    for (let i = 0; i < options.length; i++) {
      if (typeof options[i] !== "string" || options[i].trim().length === 0) {
        errors.push(`options[${i}] must be a non-empty string`);
      }
    }
  }

  const answer = raw.answer;
  if (typeof answer !== "number" || !Number.isInteger(answer) || answer < 0 || answer > 3) {
    errors.push("answer must be an integer 0-3");
  }

  const explanation = raw.explanation;
  if (!explanation || typeof explanation !== "string" || explanation.trim().length < 10) {
    errors.push("explanation must be a string ≥10 chars");
  }

  const type = raw.type;
  if (type && type !== expectedType) {
    errors.push(`expected type "${expectedType}", got "${type}"`);
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join("; ")}\nRaw: ${JSON.stringify(raw).slice(0, 200)}`);
  }

  return {
    id: -1, // assigned later
    type: expectedType as "logic" | "math" | "vocab",
    category: expectedType,
    question: String(question),
    options: (options as string[]).map((o) => String(o).trim()),
    answer: answer as number,
    explanation: String(explanation),
    difficulty: 0, // assigned from input, not LLM output
    discrimination: 1.0,
    guessing: 0.25,
    source: "llm",
  };
}

/* ═══════════════════════════════════════════════════════════════
   Question Generator
   ═══════════════════════════════════════════════════════════════ */

const client = new OpenAI({
  baseURL: BASE_URL,
  apiKey: API_KEY,
});

async function generateSingleQuestion(
  config: CellConfig,
  usedQuestions: string[],
  attempt: number = 0,
): Promise<GeneratedQuestion> {
  const system = buildSystemPrompt(config.locale, config.type, config.difficulty);
  const user = buildUserPrompt(config.locale, config.type, config.difficulty, usedQuestions);

  // Random temperature for diversity (0.6-1.0)
  const temperature = 0.6 + Math.random() * 0.4;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from API");
  }

  const parsed = JSON.parse(content);
  const question = validateQuestion(parsed, config.locale, config.type);
  question.difficulty = config.difficulty;

  return question;
}

async function generateWithRetry(
  config: CellConfig,
  usedQuestions: string[],
): Promise<GeneratedQuestion | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`  [retry ${attempt}/${MAX_RETRIES}] ${config.locale} ${config.type} diff=${config.difficulty}`);
        await countdown(2000 * attempt); // backoff
      }
      return await generateSingleQuestion(config, usedQuestions, attempt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ attempt ${attempt + 1} failed: ${msg.slice(0, 150)}`);
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   Build config cells from plan + difficulty distribution
   ═══════════════════════════════════════════════════════════════ */

function buildAllCells(): CellConfig[] {
  const cells: CellConfig[] = [];

  for (const { locale, type, count } of GENERATION_PLAN) {
    // Allocate difficulty buckets
    const assigned = new Array(count).fill(0);
    let idx = 0;
    for (const bucket of DIFFICULTY_BUCKETS) {
      const n = Math.round(count * bucket.weight);
      for (let i = 0; i < n && idx < count; i++) {
        // Pick a random difficulty within the bucket
        const diff = bucket.min + Math.random() * (bucket.max - bucket.min);
        assigned[idx++] = Math.round(diff * 10) / 10; // 1 decimal
      }
    }
    // Fill remaining with medium difficulty
    while (idx < count) {
      assigned[idx++] = Math.round((-0.5 + Math.random()) * 10) / 10;
    }

    // Shuffle for variety (don't generate all easy first)
    const shuffled = shuffle(assigned);
    for (const diff of shuffled) {
      cells.push({ locale, type, difficulty: diff });
    }
  }

  return shuffle(cells);
}

/* ═══════════════════════════════════════════════════════════════
   Main
   ═══════════════════════════════════════════════════════════════ */

async function main() {
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║  Cognitive Anti-Rust — Batch Question Generator  ║");
  console.log("╚════════════════════════════════════════════════════╝");

  if (!API_KEY) {
    console.error("\n❌ No API key found. Set OPENAI_API_KEY or DEEPSEEK_API_KEY.");
    console.error("   Usage: OPENAI_API_KEY=sk-xxx npx tsx scripts/batch-generate.ts");
    console.error("   Or:    npx tsx --env-file=.env.local scripts/batch-generate.ts\n");
    process.exit(1);
  }

  // Verify API connection
  try {
    console.log(`\n🔌 Connecting to ${BASE_URL} with model ${MODEL}...`);
    const models = await client.models.list();
    console.log(`   ✓ Connected (${models.data.length} models available)`);
  } catch (err) {
    console.error(`\n⚠  Warning: Could not verify API connection: ${err instanceof Error ? err.message : String(err)}`);
    console.error("   Continuing anyway (the model may still work)...\n");
  }

  // Parse args
  const resume = process.argv.includes("--resume");
  const limitIdx = process.argv.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;
  const isTest = process.argv.includes("--test");

  let progress: GenerationProgress;
  if (resume) {
    const loaded = loadProgress();
    if (loaded) {
      progress = loaded;
      console.log(`\n📂 Resuming from previous run (${progress.completed.length} questions already generated)`);
    } else {
      console.log("\n📂 No progress file found, starting fresh.");
      progress = { completed: [], output: {}, startedAt: new Date().toISOString() };
    }
  } else {
    progress = { completed: [], output: {}, startedAt: new Date().toISOString() };
  }

  // Init output records
  for (const { locale } of GENERATION_PLAN) {
    if (!progress.output[locale]) {
      progress.output[locale] = getExistingQuestions(locale);
    }
  }

  let allCells = buildAllCells();

  // Apply limit/test mode
  if (isTest) {
    // Test mode: generate 2 per (locale, type)
    const testCells: CellConfig[] = [];
    for (const { locale, type } of GENERATION_PLAN) {
      testCells.push({ locale, type, difficulty: 0 });
      testCells.push({ locale, type, difficulty: 0.5 });
    }
    allCells = shuffle(testCells);
    console.log("\n🧪 TEST MODE: generating 2 per locale/type (18 total)");
  } else if (isFinite(limit) && limit < allCells.length) {
    allCells = allCells.slice(0, limit);
    console.log(`\n🔢 Limit: ${limit} questions`);
  }

  const totalCells = allCells.length;
  const remaining = allCells.filter((c) => !progress.completed.includes(cellId(c)));

  console.log(`\n📊 Generation plan:`);
  for (const { locale, type, count } of GENERATION_PLAN) {
    const existing = progress.output[locale]?.length ?? 0;
    console.log(`   ${locale.padEnd(6)} ${type.padEnd(6)} ${count} new (→ total ${existing + count})`);
  }
  console.log(`\n   Total: ${totalCells} questions to generate (${remaining.length} remaining)\n`);

  if (remaining.length === 0) {
    console.log("✅ All questions already generated. Nothing to do.");
    console.log(`   Output: ${OUTPUT_DIR}/{zh-CN,en,ja}.json`);
    return;
  }

  // Worker pool
  let completedCount = progress.completed.length;
  let failedCount = 0;
  let lastFlushIdx = 0;

  async function worker(workerId: number) {
    while (remaining.length > 0) {
      const config = remaining.shift()!;
      const id = cellId(config);
      const existingForLocale = progress.output[config.locale] ?? [];
      const used = buildUsedQuestionsList(existingForLocale, []);

      console.log(`  [W${workerId}] ${config.locale} ${config.type} diff=${config.difficulty.toFixed(1)} (${completedCount + 1}/${totalCells})`);

      const question = await generateWithRetry(config, used);
      if (question) {
        progress.output[config.locale] = [...(progress.output[config.locale] ?? []), question];
        progress.completed.push(id);
        completedCount++;
        console.log(`  ✓ ${config.locale} ${config.type} diff=${config.difficulty.toFixed(1)}`);
      } else {
        failedCount++;
        console.error(`  ✗ ${config.locale} ${config.type} diff=${config.difficulty.toFixed(1)} — FAILED after ${MAX_RETRIES + 1} attempts`);
      }

      // Periodic flush
      if ((completedCount - lastFlushIdx) >= BATCH_SIZE_PER_WRITE || remaining.length === 0) {
        // Save per-locale JSON
        for (const locale of [...new Set(GENERATION_PLAN.map((p) => p.locale))]) {
          const qs = progress.output[locale] ?? [];
          if (qs.length > 0) {
            saveQuestions(locale, qs);
          }
        }
        saveProgress(progress);
        lastFlushIdx = completedCount;
        console.log(`  💾 Saved progress (${completedCount} completed, ${failedCount} failed)`);
      }
    }
  }

  // Launch workers
  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i));
  await Promise.all(workers);

  // Final save
  for (const locale of [...new Set(GENERATION_PLAN.map((p) => p.locale))]) {
    const qs = progress.output[locale] ?? [];
    if (qs.length > 0) {
      // Assign IDs
      const withIds = qs.map((q, i) => ({ ...q, id: i + 1 }));
      saveQuestions(locale, withIds);
    }
  }
  saveProgress(progress);

  // Summary
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║  Generation Complete                              ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log(`   Total generated: ${completedCount}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`   Time: ${new Date().toISOString()}`);

  for (const locale of [...new Set(GENERATION_PLAN.map((p) => p.locale))]) {
    const count = progress.output[locale]?.length ?? 0;
    console.log(`   ${locale}: ${count} questions total`);
  }

  console.log(`\n   Output files:`);
  for (const locale of [...new Set(GENERATION_PLAN.map((p) => p.locale))]) {
    console.log(`     ${path.join(OUTPUT_DIR, `${locale}.json`)}`);
  }
  console.log(`     ${PROGRESS_FILE} (progress)`);
  console.log("\n   Next: review the JSON files, then merge into src/lib/question-bank/\n");
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
