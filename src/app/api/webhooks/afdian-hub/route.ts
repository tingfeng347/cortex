import { NextResponse } from "next/server";
import { detectTier, sendMsg } from "@/lib/payment/afdian";
import {
  createLicenseFromOrder,
  findExistingLicenseByUser,
} from "@/lib/auth/license";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Hub 转发的 Webhook 接收端点
// Hub 已完成签名验证和 plan_id 路由，此处只处理订单逻辑

async function getHubSecret(): Promise<string | undefined> {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx.env as Record<string, string | undefined>;
    if (env.WEBHOOK_HUB_SECRET) return env.WEBHOOK_HUB_SECRET;
  } catch { /* fallback */ }
  return process.env.WEBHOOK_HUB_SECRET;
}

interface AfdianWebhookBody {
  ec: number;
  em: string;
  data: {
    type: string;
    order: {
      out_trade_no: string;
      user_id: string;
      plan_id: string;
      month: number;
      total_amount: string;
      show_amount: string;
      status: number;
      remark: string;
      redeem_id: string;
      product_type: number;
      discount: string;
      sku_detail: unknown[];
      address_person: string;
      address_phone: string;
      address_address: string;
    };
  };
}

export async function POST(request: Request) {
  // Verify request came from Hub (if secret is configured)
  const hubSecret = await getHubSecret();
  if (hubSecret) {
    const receivedSecret = request.headers.get("X-Hub-Secret");
    if (receivedSecret !== hubSecret) {
      console.warn("[afdian-hub] Invalid X-Hub-Secret");
      return NextResponse.json({ ec: 403, em: "forbidden" }, { status: 403 });
    }
  }

  try {
    const body = (await request.json()) as AfdianWebhookBody;

    if (body.ec !== 200 || !body.data?.order?.out_trade_no) {
      console.warn("[afdian-hub] Invalid webhook payload shape");
      return NextResponse.json({ ec: 200, em: "ignored" });
    }

    const order = body.data.order;

    if (order.status !== 2) {
      console.log(
        `[afdian-hub] Order ${order.out_trade_no} status=${order.status}, skipping`,
      );
      return NextResponse.json({ ec: 200, em: "skipped" });
    }

    const tier = detectTier(order.total_amount);

    if (!tier.shouldUnlockPremium) {
      console.log(
        `[afdian-hub] Order ${order.out_trade_no} is support tier (${order.total_amount})`,
      );

      try {
        await sendMsg(
          order.user_id,
          "谢谢你的支持！你的名字已经出现在认知防锈的赞助墙上。\n\n" +
          "如果没有看到自己，可以访问 https://cortex.hydroroll.team/sponsors\n\n" +
          "这个项目的出圈，全靠大家自发传播。每一份支持都是让我觉得这事儿值得继续做的理由。\n\n" +
          "真的谢谢。",
        );
      } catch {
        /* DM is best-effort */
      }

      return NextResponse.json({ ec: 200, em: "support_tier" });
    }

    // Check if user already has an active license
    const existingKey = await findExistingLicenseByUser(order.user_id);

    const result = existingKey
      ? { success: true, licenseKey: existingKey }
      : await createLicenseFromOrder(
        order.out_trade_no,
        order.plan_id,
        order.user_id,
      );

    if (result.success) {
      const isRenewal = !!existingKey;
      console.log(
        `[afdian-hub] ${isRenewal ? "Existing" : "New"} license ${result.licenseKey} for order ${order.out_trade_no} (${tier.label})`,
      );

      try {
        const msg = isRenewal
          ? "感谢继续支持认知防锈高级版！\n\n" +
          `你的 License Key 仍然是: ${result.licenseKey}\n\n` +
          "Key 保持不变，无需重新激活。\n" +
          "当前绑定设备数不变，换设备时输入此 Key 即可同步。\n\n" +
          "如有问题，在爱发电私信联系我即可。"
          : "感谢解锁认知防锈高级版！\n\n" +
          `你的 License Key: ${result.licenseKey}\n\n` +
          "使用方法：\n" +
          "1. 访问 https://cortex.hydroroll.team/unlock\n" +
          "2. 在底部「已有 License Key？」处输入上方 Key\n" +
          "3. 点击激活即可\n\n" +
          "一个 Key 最多绑定 3 台设备。换设备时输入同一个 Key 即可同步数据。\n\n" +
          "如有问题，在爱发电私信联系我即可。";

        await sendMsg(order.user_id, msg);
      } catch {
        console.error(
          `[afdian-hub] Failed to send DM for order ${order.out_trade_no}`,
        );
      }
    } else {
      console.error(
        `[afdian-hub] Failed to create license for order ${order.out_trade_no}: ${result.reason}`,
      );
    }

    return NextResponse.json({ ec: 200, em: "ok" });
  } catch (error) {
    console.error("[afdian-hub] Unexpected error:", error);
    return NextResponse.json({ ec: 200, em: "error" });
  }
}
