import { NextResponse } from "next/server";
import { search } from "@/lib/search";
import { d1Query } from "@/lib/db";
import type { Question } from "@/lib/question-bank/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const locale = searchParams.get("locale") ?? "zh-CN";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

  if (!q.trim()) {
    return NextResponse.json({ results: [], query: q });
  }

  try {
    // Fetch calibrated IRT params (best-effort)
    let calibratedParams: Record<string, { a: number; b: number }> = {};
    try {
      const { env } = await import("@opennextjs/cloudflare").then((m) => m.getCloudflareContext());
      if (env.CORTEX_KV) {
        const raw = await env.CORTEX_KV.get("calibrated_params:all");
        if (raw) calibratedParams = JSON.parse(raw);
      }
    } catch {}

    const results = search(q, locale, limit);

    // Also search D1: AI-generated questions + approved community questions
    const likePattern = `%${q}%`;
    const d1Results: typeof results = [];
    try {
      const [aiRows, communityRows] = await Promise.all([
        d1Query<{
          id: number;
          type: string;
          question: string;
          options: string;
          answer: number;
          explanation: string;
          difficulty: number;
        }>(
          "SELECT id, type, question, options, answer, explanation, difficulty FROM ai_generated_questions WHERE locale = ? AND question LIKE ? ORDER BY times_used DESC LIMIT ?",
          [locale === "zh-CN" ? "zh-CN" : locale, likePattern, limit],
        ),
        d1Query<{
          id: number;
          type: string;
          question: string;
          options: string;
          correct_answer: number;
          explanation: string;
          submitter_name: string;
        }>(
          "SELECT id, type, question, options, correct_answer, explanation, submitter_name FROM community_questions WHERE status = 'approved' AND question LIKE ? ORDER BY id DESC LIMIT ?",
          [likePattern, limit],
        ),
      ]);

      for (const row of aiRows) {
        d1Results.push({
          question: {
            id: 100000 + row.id,
            type: row.type as Question["type"],
            category: row.type,
            question: row.question,
            options: parseJSON<string[]>(row.options, []),
            answer: row.answer,
            explanation: row.explanation,
            difficulty: row.difficulty,
            source: "llm",
          },
          score: 1,
        });
      }
      for (const row of communityRows) {
        d1Results.push({
          question: {
            id: 200000 + row.id,
            type: row.type as Question["type"],
            category: row.type,
            question: row.question,
            options: parseJSON<string[]>(row.options, []),
            answer: row.correct_answer,
            explanation: row.explanation,
            difficulty: 0,
            source: "community",
            submitterName: row.submitter_name || "匿名",
          } as Question & { submitterName: string },
          score: 1,
        });
      }
    } catch {
      // D1 search is best-effort
    }

    // Merge static + D1 results, deduplicate by question text, limit
    const seen = new Set<string>();
    const merged = [...results, ...d1Results]
      .filter((r) => {
        const key = r.question.question.slice(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);

    return NextResponse.json({
      results: merged.map((r) => {
        const src = r.question.source ?? "static";
        return {
          id: r.question.id,
          type: r.question.type,
          category: r.question.category,
          question: r.question.question,
          options: r.question.options,
          answer: r.question.answer,
          explanation: r.question.explanation,
          difficulty: r.question.difficulty,
          calibratedDifficulty: calibratedParams[r.question.id]?.b ?? null,
          score: r.score,
          source: src,
          submitterName:
            src === "community"
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (r.question as any).submitterName
              : undefined,
        };
      }),
      query: q,
      total: merged.length,
    });
  } catch (err) {
    console.error("[search] Error:", err);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}

function parseJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
