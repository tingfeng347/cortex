import { getCloudflareContext } from "@opennextjs/cloudflare"

async function getDB() {
  const { env } = await getCloudflareContext()
  if (!env.CORTEX_DB) {
    throw new Error("CORTEX_DB binding not available — is the D1 database configured?")
  }
  return env.CORTEX_DB
}

export async function d1Query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const db = await getDB()
  const stmt = db.prepare(sql)
  const bound = params ? stmt.bind(...params) : stmt
  const r = await bound.all<T>()
  return r.results ?? []
}

export async function d1First<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await d1Query<T>(sql, params)
  return rows.length > 0 ? rows[0] : null
}

export async function d1Run(sql: string, params?: unknown[]): Promise<void> {
  await d1Query(sql, params)
}
