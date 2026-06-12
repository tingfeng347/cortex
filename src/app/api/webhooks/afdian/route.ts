import { NextResponse } from "next/server"
import { detectTier } from "@/lib/payment/afdian"
import { createLicenseFromOrder } from "@/lib/auth/license"

// 爱发电 Webhook 接收端点
// 每当有新订单时爱发电会 POST 到这里
// 文档: https://ifdian.net/p/9c65d9cc617011ed81c352540025c377
//
// 注意: 爱发电 Webhook 没有签名验证机制
// 安全措施: 仅处理已知金额档次的订单，且 createLicenseFromOrder 有去重

interface AfdianWebhookBody {
  ec: number
  em: string
  data: {
    type: string
    order: {
      out_trade_no: string
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
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AfdianWebhookBody

    // Validate it looks like a real 爱发电 webhook
    if (body.ec !== 200 || !body.data?.order?.out_trade_no) {
      console.warn("[afdian-webhook] Invalid webhook payload shape")
      return NextResponse.json({ ec: 200, em: "ignored" })
    }

    const order = body.data.order

    // Only process paid orders
    if (order.status !== 2) {
      console.log(`[afdian-webhook] Order ${order.out_trade_no} status=${order.status}, skipping`)
      return NextResponse.json({ ec: 200, em: "skipped" })
    }

    // Detect tier by amount
    const tier = detectTier(order.total_amount)

    // Don't generate license for support tier (¥9.90)
    if (!tier.shouldUnlockPremium) {
      console.log(`[afdian-webhook] Order ${order.out_trade_no} is support tier (${order.total_amount}), skipping`)
      return NextResponse.json({ ec: 200, em: "support_tier" })
    }

    // Generate license key (idempotent — won't duplicate if order already processed)
    const result = await createLicenseFromOrder(order.out_trade_no, order.plan_id)

    if (result.success) {
      console.log(`[afdian-webhook] License ${result.licenseKey} created for order ${order.out_trade_no} (${tier.label})`)
    } else {
      console.error(`[afdian-webhook] Failed to create license for order ${order.out_trade_no}: ${result.reason}`)
    }

    return NextResponse.json({ ec: 200, em: "ok" })
  } catch (error) {
    console.error("[afdian-webhook] Unexpected error:", error)
    return NextResponse.json({ ec: 200, em: "error" })
  }
}
