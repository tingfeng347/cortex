/**
 * Upstash Redis 数据迁移脚本
 *
 * 把旧帐号的 cortex stats 数据复制到新帐号。
 * 只迁持久数据（stats hash、countries set、legacy keys），不迁限流键。
 *
 * 用法:
 *   export OLD_UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
 *   export OLD_UPSTASH_REDIS_REST_TOKEN="xxx"
 *   export NEW_UPSTASH_REDIS_REST_URL="https://yyy.upstash.io"
 *   export NEW_UPSTASH_REDIS_REST_TOKEN="yyy"
 *   npx tsx scripts/migrate-redis.ts
 *
 * 可重复运行，HSET 是幂等的，只会覆盖为最新值。
 */

import { Redis } from "@upstash/redis"

const OLD_URL = process.env.OLD_UPSTASH_REDIS_REST_URL
const OLD_TOKEN = process.env.OLD_UPSTASH_REDIS_REST_TOKEN
const NEW_URL = process.env.NEW_UPSTASH_REDIS_REST_URL
const NEW_TOKEN = process.env.NEW_UPSTASH_REDIS_REST_TOKEN

if (!OLD_URL || !OLD_TOKEN || !NEW_URL || !NEW_TOKEN) {
  console.error("Usage:")
  console.error("  export OLD_UPSTASH_REDIS_REST_URL=https://xxx.upstash.io")
  console.error("  export OLD_UPSTASH_REDIS_REST_TOKEN=xxx")
  console.error("  export NEW_UPSTASH_REDIS_REST_URL=https://yyy.upstash.io")
  console.error("  export NEW_UPSTASH_REDIS_REST_TOKEN=yyy")
  console.error("  npx tsx scripts/migrate-redis.ts")
  process.exit(1)
}

const PREFIX = "cortex:"

const legacyKeys = [
  PREFIX + "total",
  PREFIX + "sum_degradation",
  ...Array.from({ length: 10 }, (_, i) => PREFIX + `dist:${i}`),
  PREFIX + "tier:cognitivePeak",
  PREFIX + "tier:mildDecline",
  PREFIX + "tier:moderateDecline",
  PREFIX + "tier:significantDecline",
  PREFIX + "tier:severeDecline",
  PREFIX + "tier:undefined",
  PREFIX + "tier:認知巔峰",
  PREFIX + "tier:輕度下降",
  PREFIX + "tier:中度下降",
  PREFIX + "tier:顯著下降",
  PREFIX + "tier:嚴重下降",
  PREFIX + "tier:認知のピーク",
  PREFIX + "tier:軽度の低下",
  PREFIX + "tier:中等度の低下",
  PREFIX + "tier:顕著な低下",
  PREFIX + "tier:重度の低下",
  ...[
    "< 30 分钟", "30 分钟 - 2 小时", "2 - 5 小时", "> 5 小时",
    "30分未満", "30分〜2時間", "2〜5時間", "5時間超",
    "< 30 min", "30 min - 2 hr", "2 - 5 hr", "> 5 hr",
  ].map((l) => PREFIX + `ai:${l}`),
  PREFIX + "irt_count",
  PREFIX + "pct_count",
  PREFIX + "sum_elapsed",
  PREFIX + "elapsed_count",
]

async function main() {
  const oldR = new Redis({ url: OLD_URL, token: OLD_TOKEN })
  const newR = new Redis({ url: NEW_URL, token: NEW_TOKEN })

  // ---- Read ----
  console.log("Reading old Redis...")

  // Main hash
  const hashKv = await oldR.hgetall(PREFIX + "stats")
  const hashFields = hashKv ? Object.keys(hashKv).length : 0
  console.log(`  ${PREFIX}stats: ${hashFields} hash fields`)

  // Countries set
  const countries = await oldR.smembers(PREFIX + "countries")
  console.log(`  ${PREFIX}countries: ${countries.length} members`)

  // Legacy string keys (only those that exist)
  const legacyData: Record<string, string> = {}
  for (const key of legacyKeys) {
    const val = await oldR.get(key)
    if (val !== null && val !== undefined) {
      legacyData[key] = String(val)
    }
  }
  console.log(`  legacy keys: ${Object.keys(legacyData).length} with values`)

  // Legacy country keys
  const countryData: Record<string, string> = {}
  for (const code of countries) {
    const key = PREFIX + `country:${code}`
    const val = await oldR.get(key)
    if (val !== null && val !== undefined) {
      countryData[key] = String(val)
    }
  }
  console.log(`  country keys: ${Object.keys(countryData).length}`)

  // ---- Write (pipeline for efficiency) ----
  console.log("\nWriting to new Redis...")

  // Hash: write all fields at once
  if (hashKv) {
    await newR.hset(PREFIX + "stats", hashKv)
    console.log(`  hash: ${Object.keys(hashKv).length} fields written`)
  }

  // Set
  if (countries.length > 0) {
    await newR.sadd(PREFIX + "countries", ...countries)
    console.log(`  set: ${countries.length} members written`)
  }

  // Legacy keys
  if (Object.keys(legacyData).length > 0) {
    const pipe = newR.pipeline()
    for (const [key, val] of Object.entries(legacyData)) {
      pipe.set(key, val)
    }
    await pipe.exec()
    console.log(`  legacy: ${Object.keys(legacyData).length} keys written`)
  }

  // Country keys
  if (Object.keys(countryData).length > 0) {
    const pipe = newR.pipeline()
    for (const [key, val] of Object.entries(countryData)) {
      pipe.set(key, val)
    }
    await pipe.exec()
    console.log(`  countries: ${Object.keys(countryData).length} keys written`)
  }

  // ---- Verify ----
  console.log("\n=== Verification ===")
  const newHashKv = await newR.hgetall(PREFIX + "stats")
  const newTotal = newHashKv?.total ?? "N/A"
  const oldTotal = hashKv?.total ?? "N/A"
  console.log(`  Old total: ${oldTotal}`)
  console.log(`  New total: ${newTotal}`)
  console.log(oldTotal === newTotal ? "  MATCH" : "  MISMATCH - re-run to catch delta")

  console.log("\nDone!")
  console.log("Next: update .env and redeploy with new Upstash credentials")
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
