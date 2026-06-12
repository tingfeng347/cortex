// 爱发电 API 封装
// 文档: https://ifdian.net/p/9c65d9cc617011ed81c352540025c377

import { createHash } from "node:crypto"
import { getCloudflareContext } from "@opennextjs/cloudflare"

async function getEnv(): Promise<{ userId: string; token: string }> {
  try {
    const ctx = await getCloudflareContext()
    const env = ctx.env as Record<string, string | undefined>
    if (env.AFDIAN_USER_ID && env.AFDIAN_TOKEN) {
      return { userId: env.AFDIAN_USER_ID, token: env.AFDIAN_TOKEN }
    }
  } catch { /* fallback */ }
  return {
    userId: process.env.AFDIAN_USER_ID ?? "",
    token: process.env.AFDIAN_TOKEN ?? "",
  }
}

let _cached: { userId: string; token: string } | null = null
let _cacheTs = 0

async function getCreds(): Promise<{ userId: string; token: string }> {
  if (_cached && Date.now() - _cacheTs < 60_000) return _cached
  _cached = await getEnv()
  _cacheTs = Date.now()
  return _cached
}

// sign = md5(token + "params" + params_value + "ts" + ts_value + "user_id" + user_id_value)
function sign(token: string, userId: string, ts: number, params: string): string {
  return createHash("md5")
    .update(token + "params" + params + "ts" + String(ts) + "user_id" + userId)
    .digest("hex")
    .toLowerCase()
}

interface AfdianResponse<T> {
  ec: number
  em: string
  data: T
}

interface OrderItem {
  out_trade_no: string
  custom_order_id?: string
  user_id: string
  plan_id: string
  month: number
  total_amount: string
  show_amount: string
  status: number
  remark: string
  redeem_id: string
  product_type: number
  discount: string
  sku_detail: unknown[]
  address_person: string
  address_phone: string
  address_address: string
}

interface OrderListData {
  list: OrderItem[]
  total_count: number
  total_page: number
}

async function afdianPost<T>(endpoint: string, params: Record<string, unknown>): Promise<T | null> {
  const { userId, token } = await getCreds()
  if (!userId || !token) {
    console.error("[afdian] Missing credentials")
    return null
  }

  const ts = Math.floor(Date.now() / 1000)
  const paramsStr = JSON.stringify(params)
  const body = JSON.stringify({
    user_id: userId,
    ts,
    sign: sign(token, userId, ts, paramsStr),
    params: paramsStr,
  })

  const res = await fetch(`https://afdian.com/api/open/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })

  if (!res.ok) {
    console.error(`[afdian] ${endpoint} HTTP error:`, res.status)
    return null
  }

  const json = (await res.json()) as AfdianResponse<T>
  if (json.ec !== 200) {
    console.error(`[afdian] ${endpoint} API error:`, json.ec, json.em)
    return null
  }
  return json.data
}

export async function queryOrder(outTradeNo: string): Promise<OrderItem | null> {
  const data = await afdianPost<OrderListData>("query-order", { out_trade_no: outTradeNo })
  return data?.list.find((o) => o.out_trade_no === outTradeNo) ?? null
}

// --- Sponsor wall data ---

export interface SponsorUser {
  userId: string
  name: string
  avatar: string
}

export interface SponsorEntry {
  user: SponsorUser
  allSumAmount: string
  planName: string
  planPrice: string
  lastPayTime: number
  planId: string
}

interface SponsorListData {
  list: SponsorItem[]
  total_count: number
  total_page: number
}

interface SponsorItem {
  sponsor_plans: SponsorPlan[]
  current_plan: SponsorPlan
  all_sum_amount: string
  create_time: number
  last_pay_time: number
  user: {
    user_id: string
    name: string
    avatar: string
  }
}

interface SponsorPlan {
  plan_id: string
  name: string
  price: string
  show_price: string
  desc: string
  status: number
}

export async function querySponsors(page = 1, perPage = 50): Promise<{ entries: SponsorEntry[]; total: number; totalPage: number }> {
  const data = await afdianPost<SponsorListData>("query-sponsor", { page, per_page: perPage })
  if (!data) return { entries: [], total: 0, totalPage: 0 }

  const entries: SponsorEntry[] = data.list.map((s) => ({
    user: {
      userId: s.user.user_id,
      name: s.user.name,
      avatar: s.user.avatar,
    },
    allSumAmount: s.all_sum_amount,
    planName: s.current_plan?.name ?? (s.sponsor_plans[0]?.name ?? ""),
    planPrice: s.current_plan?.price ?? (s.sponsor_plans[0]?.price ?? "0.00"),
    lastPayTime: s.last_pay_time,
    planId: s.current_plan?.plan_id ?? (s.sponsor_plans[0]?.plan_id ?? ""),
  }))

  return { entries, total: data.total_count, totalPage: data.total_page }
}

// --- Send private message ---

export async function sendMsg(recipient: string, content: string): Promise<boolean> {
  const data = await afdianPost<{ success?: boolean }>("send-msg", { recipient, content })
  return data !== null
}

// Tier detection by payment amount
export interface TierInfo {
  type: "support" | "unlock" | "sponsor"
  label: string
  shouldUnlockPremium: boolean
}

export function detectTier(totalAmount: string): TierInfo {
  const amount = parseFloat(totalAmount)
  if (isNaN(amount)) {
    return { type: "support", label: "赞助", shouldUnlockPremium: false }
  }
  if (amount >= 90) {
    return { type: "sponsor", label: "¥99 赞助者名单", shouldUnlockPremium: true }
  }
  if (amount >= 20) {
    return { type: "unlock", label: "¥29.90 解锁高级版", shouldUnlockPremium: true }
  }
  return { type: "support", label: "¥5.00 纯支持", shouldUnlockPremium: false }
}
