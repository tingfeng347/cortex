import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createRequire } from "node:module";

// Minimal types for D1 (no @cloudflare/workers-types dependency)
interface D1PreparedStatement {
  all<T = unknown>(): Promise<{ results: T[] }>;
  bind(...params: unknown[]): D1PreparedStatement;
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(stmts: D1PreparedStatement[]): Promise<unknown[]>;
}

const CLOUDFLARE_CTX = Symbol.for("__cloudflare-context__");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CloudflareEnv = Record<string, any>;

/**
 * Turbopack bundles wrangler despite the obfuscated `webpackIgnore` dynamic import
 * in OpenNext's cloudflare-context. We use createRequire here so the require call
 * resolves relative to the project root, not the bundled chunk location inside .next/.
 */
async function getCloudflareEnv(): Promise<CloudflareEnv> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = (globalThis as any)[CLOUDFLARE_CTX];
  if (existing) return existing.env;

  // 1st attempt — OpenNext's built-in async mode (may fail under Turbopack)
  try {
    const ctx = await getCloudflareContext({ async: true });
    return ctx.env;
  } catch {
    // 2nd attempt — createRequire from project root (avoids Turbopack bundling and module resolution from bundled chunks)
    const req = createRequire(process.cwd() + "/package.json");
    const { getPlatformProxy } = req("wrangler") as {
      getPlatformProxy: (options: { envFiles?: string[] }) => Promise<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        env: Record<string, any>;
        cf: unknown;
        ctx: unknown;
      }>;
    };
    const proxy = await getPlatformProxy({ envFiles: [] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)[CLOUDFLARE_CTX] = proxy;
    return proxy.env;
  }
}

// ---- In-memory fallback (local dev without D1 binding) ----
// Returns empty results for SELECTs and no-ops for writes, so the app
// runs locally without a D1 database (AI question pool is simply empty).

const memoryStmt: D1PreparedStatement = {
  all<T = unknown>(): Promise<{ results: T[] }> {
    return Promise.resolve({ results: [] });
  },
  bind(): D1PreparedStatement {
    return memoryStmt;
  },
};
const memoryDb: D1Database = {
  prepare(): D1PreparedStatement {
    return memoryStmt;
  },
  batch(): Promise<unknown[]> {
    return Promise.resolve([]);
  },
};

export async function getDB(): Promise<D1Database> {
  const env = await getCloudflareEnv();
  if (!env.CORTEX_DB) {
    // Local dev without D1 binding — degrade to in-memory no-op store.
    return memoryDb;
  }
  return env.CORTEX_DB as D1Database;
}

export async function d1Query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const db = await getDB();
  const stmt = db.prepare(sql);
  const bound = params ? stmt.bind(...params) : stmt;
  const r = await bound.all<T>();
  return r.results ?? [];
}

export async function d1First<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await d1Query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function d1Run(sql: string, params?: unknown[]): Promise<void> {
  await d1Query(sql, params);
}
