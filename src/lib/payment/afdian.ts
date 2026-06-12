// 爱发电 API 封装
// 文档: https://afdian.net/dashboard/dev

import { createHash } from "node:crypto"

const AFDIAN_USER_ID = process.env.AFDIAN_USER_ID ?? ""
const AFDIAN_TOKEN = process.env.AFDIAN_TOKEN ?? ""

function sign(ts: number): string {
  return createHash("md5")
    .update(AFDIAN_USER_ID + AFDIAN_TOKEN + String(ts))
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
  plan_id: string
  plan_title?: string
  total_amount: string
  user_id: string
  user_name?: string
  create_time: number
  status?: number
}

interface OrderListData {
  list: OrderItem[]
  total_count: number
}

export async function queryOrder(outTradeNo: string): Promise<OrderItem | null> {
  const ts = Math.floor(Date.now() / 1000)
  const body = JSON.stringify({
    user_id: AFDIAN_USER_ID,
    ts,
    sign: sign(ts),
    params: JSON.stringify({ out_trade_no: outTradeNo }),
  })

  const res = await fetch("https://afdian.com/api/open/query-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })

  if (!res.ok) {
    console.error("[afdian] query-order HTTP error:", res.status)
    return null
  }

  const json = (await res.json()) as AfdianResponse<OrderListData>

  if (json.ec !== 200) {
    console.error("[afdian] query-order API error:", json.ec, json.em)
    return null
  }

  return json.data.list.find((o) => o.out_trade_no === outTradeNo) ?? null
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
  return { type: "support", label: "¥9.90 纯支持", shouldUnlockPremium: false }
}
