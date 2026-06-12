/**
 * LLM prompt templates for dynamic question generation.
 *
 * Three languages × three question types = 9 templates, each with difficulty guidance.
 */

/* ─── Difficulty Descriptors ─── */

const DIFFICULTY_MAP = {
  zh: [
    { range: [-1.5, -0.7], label: "简单" },
    { range: [-0.7, -0.2], label: "中等偏易" },
    { range: [-0.2, 0.4], label: "中等" },
    { range: [0.4, 1.0], label: "中等偏难" },
    { range: [1.0, 2.0], label: "困难" },
  ],
  en: [
    { range: [-1.5, -0.7], label: "easy" },
    { range: [-0.7, -0.2], label: "moderately easy" },
    { range: [-0.2, 0.4], label: "moderate" },
    { range: [0.4, 1.0], label: "moderately hard" },
    { range: [1.0, 2.0], label: "hard" },
  ],
  ja: [
    { range: [-1.5, -0.7], label: "簡単" },
    { range: [-0.7, -0.2], label: "やや簡単" },
    { range: [-0.2, 0.4], label: "普通" },
    { range: [0.4, 1.0], label: "やや難しい" },
    { range: [1.0, 2.0], label: "難しい" },
  ],
} as const;

export function difficultyLabel(locale: string, diff: number): string {
  const map =
    locale === "ja" ? DIFFICULTY_MAP.ja : locale === "en" ? DIFFICULTY_MAP.en : DIFFICULTY_MAP.zh;
  for (const { range, label } of map) {
    if (diff >= range[0] && diff < range[1]) return label;
  }
  return map[map.length - 1].label;
}

/* ─── Base System Prompt ─── */

function baseSystem(locale: string): string {
  return locale === "zh-CN"
    ? `你是一个专业的认知测试出题专家。你需要生成高质量的单选题，用于测量用户的认知能力。

要求：
1. 题目必须有唯一确定的正确答案
2. 干扰项要有迷惑性，但明显错误的不行
3. 题目描述清晰无歧义
4. 四个选项（A/B/C/D），只有一个正确
5. 必须包含详细的答案解析
6. 难易度通过 IRT 模型参数 difficulty 标定

输出格式为 JSON，包含字段：question, options (长度为4的数组), answer (0-3数字索引), explanation, type, difficulty.`
    : locale === "ja"
      ? `あなたは認知テストの問題作成専門家です。ユーザーの認知能力を測定するための高品質な選択問題を生成してください。

要件：
1. 唯一の正解が確定できる問題
2. 選択肢は魅力的だが、明らかに間違っているものは避ける
3. 問題文は明確で曖昧さがない
4. 4つの選択肢（A/B/C/D）、1つだけが正解
5. 詳細な解説を含める
6. 難易度はIRTモデルパラメータ difficulty で指定

出力はJSON形式：question, options (長さ4の配列), answer (0-3の数値インデックス), explanation, type, difficulty.`
      : `You are a professional cognitive test designer. Create high-quality multiple-choice questions to measure cognitive ability.

Requirements:
1. Questions must have a single unambiguous correct answer
2. Distractors should be plausible but clearly wrong answers must be avoided
3. Question text must be clear with no ambiguity
4. Four options (A/B/C/D), only one correct
5. Include a detailed explanation
6. Difficulty calibrated via IRT difficulty parameter

Output format: JSON with fields: question, options (array of 4), answer (0-3 index), explanation, type, difficulty.`;
}

/* ─── Type-Specific Content Prompts ─── */

const TYPE_PROMPTS: Record<
  string,
  { zh: string; en: string; ja: string; examples: string }
> = {
  logic: {
    zh: "题型：逻辑推理。包括：真假话推理、数列规律、排列组合、逻辑谜题等。需要多步推理才能得出答案。",
    en: "Type: Logic Reasoning. Includes: truth-teller puzzles, sequence patterns, permutations & combinations, logic puzzles. Requires multi-step reasoning.",
    ja: "题型：論理推論。真偽判断、数列パターン、順列組合せ、論理パズルなど。複数ステップの推論が必要。",
    examples: `良好示例：
  {
    "question": "某仓库失窃，四人接受调查...",
    "options": ["甲", "乙", "丙", "丁"],
    "answer": 0,
    "explanation": "逐一假设：如果甲是作案者...",
    "difficulty": 0.0
  }`,
  },
  math: {
    zh: "题型：速算。包括：百分比计算、速度时间距离、工作效率、利润率等实际应用题。需要在限定时间内完成心算或简单笔算。",
    en: "Type: Mental Math. Includes: percentage calculations, speed/distance/time, work efficiency, profit margin, and other applied arithmetic. Solvable without a calculator.",
    ja: "题型：暗算。パーセント計算、速度・距離・時間、仕事効率、利益率などの応用問題。制限時間内に暗算または簡単な筆算で解く。",
    examples: `良好示例：
  {
    "question": "一件商品打八折后的价格是160元，这件商品的原价是多少？",
    "options": ["180元", "200元", "220元", "250元"],
    "answer": 1,
    "explanation": "打八折 = 原价 × 0.8 = 160，所以原价 = 160 ÷ 0.8 = 200元",
    "difficulty": -0.5
  }`,
  },
  vocab: {
    zh: "题型：词汇语义。包括：词语含义、近义词辨析、成语理解、古诗词含义、语境中的词义选择等。",
    en: "Type: Vocabulary & Semantics. Includes: word meanings, synonym discrimination, idiom comprehension, contextual word usage.",
    ja: "题型：語彙意味。単語の意味、類義語の区別、慣用句の理解、文脈に応じた語義選択など。",
    examples: `良好示例：
  {
    "question": "下列哪个成语用来形容「完全不一样，无法相提并论」最恰当？",
    "options": ["天壤之别", "大同小异", "一模一样", "举一反三"],
    "answer": 0,
    "explanation": ""天壤之别"形容差别极大，符合题意。",
    "difficulty": -0.3
  }`,
  },
  event: {
    zh: "题型：事件事理分析。包括：事件排序（给4-5个事件，选正确的因果关系/时间顺序）、因果推断（根据场景判断最可能的原因或结果）、论证分析（找前提假设、逻辑漏洞、加强/削弱选项）。以事件排序为主，因为答案唯一确定。",
    en: "Type: Event & Causal Reasoning. Includes: event sequencing (order 4-5 events by cause/effect or timeline), causal inference (identify the most likely cause or outcome from a scenario), argument analysis (find assumptions, logical flaws, strengthen/weaken options). Prefer event sequencing for unambiguous answers.",
    ja: "题型：事象因果分析。内容：出来事の並べ替え（4-5の事象を因果関係/時系列順に並べる）、因果推論（シナリオから最も可能性の高い原因や結果を選ぶ）、論証分析（前提仮定、論理的欠陥、強化/弱化する選択肢を見つける）。解答が一意に定まる出来事の並べ替え問題を優先してください。",
    examples: `良好示例（事件排序）：
  {
    "question": "将以下事件按因果逻辑排序：\\n① 公司股价大跌\\n② 财报显示季度亏损\\n③ CEO宣布辞职\\n④ 投资者抛售股票\\n\\n正确的因果顺序是什么？",
    "options": ["②→③→①→④", "③→②→④→①", "①→④→②→③", "④→①→③→②"],
    "answer": 0,
    "explanation": "财报亏损是根本原因(②)，导致CEO辞职(③)，引发股价大跌(①)，最终投资者抛售(④)。因果链条为 ②→③→①→④。",
    "difficulty": -0.2
  }`,
  },
};

/* ─── Assemble Prompt ─── */

export interface GeneratePromptInput {
  locale: string;
  type: "logic" | "math" | "vocab" | "event";
  difficulty: number;
  usedQuestions: string[]; // short summaries or IDs to avoid duplicates
}

export function buildGeneratePrompt(input: GeneratePromptInput): {
  system: string;
  user: string;
} {
  const { locale, type, difficulty, usedQuestions } = input;
  const lang = locale.startsWith("zh") ? "zh" : locale === "ja" ? "ja" : "en";
  const t = TYPE_PROMPTS[type];
  const diffLabel = difficultyLabel(locale, difficulty);

  const avoidText =
    usedQuestions.length > 0
      ? `\n\n避免与以下已存在的题目重复：\n${usedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

  const userPrompt =
    locale === "zh-CN"
      ? `请生成一道${diffLabel}难度的${type === "logic" ? "逻辑推理" : type === "math" ? "速算" : type === "vocab" ? "词汇语义" : "事件事理分析"}题，IRT difficulty 参数约为 ${difficulty}。${avoidText}

确保：
- 题目和选项使用中文
- 答案唯一且正确
- 解析详细、易懂
- difficulty 保留一位小数`
      : locale === "ja"
        ? `難易度「${diffLabel}」の${type === "logic" ? "論理推論" : type === "math" ? "暗算" : type === "vocab" ? "語彙意味" : "事象因果分析"}問題を1問生成してください。IRT difficulty パラメータ: 約 ${difficulty}。${avoidText}

確認：
- 問題文と選択肢は日本語
- 答えは一意で正しい
- 解説は詳細で分かりやすい
- difficulty は小数点以下1桁`
        : `Generate one ${diffLabel} ${type === "event" ? "event/causal reasoning" : type} question. IRT difficulty parameter: approximately ${difficulty}.${avoidText}

Ensure:
- Question and options in English
- Answer is unique and correct
- Explanation is detailed and clear
- difficulty rounded to 1 decimal place`;

  return {
    system: `${baseSystem(locale)}\n\n${t[lang]}\n\n${t.examples}`,
    user: userPrompt,
  };
}

/* ─── System Prompt for Answer Consistency Check ─── */

export function buildVerifyPrompt(
  question: string,
  options: string[],
  answerIndex: number,
  explanation: string,
  locale: string,
): string {
  const label = locale === "zh-CN" ? "中文" : locale === "ja" ? "日本語" : "English";
  return `You are a QA validator for cognitive test questions. Verify that the following question has a correct answer consistent with its explanation.

Language: ${label}

Question: ${question}
Options: ${JSON.stringify(options)}
Answer Index: ${answerIndex} (i.e., "${options[answerIndex] ?? "N/A"}")
Explanation: ${explanation}

Check:
1. Is the answer index within range [0, ${options.length - 1}]?
2. Does the explanation logically lead to the chosen answer?
3. Is there any ambiguity that could make another option also correct?
4. Is the question self-contained (no missing context)?

Respond with JSON: { "valid": boolean, "issues": string[] }`;
}
