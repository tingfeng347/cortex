import { NextResponse } from "next/server";
import { queryOrder, detectTier } from "@/lib/payment/afdian";
import { createLicenseFromOrder, validateLicense } from "@/lib/auth/license";
import { d1First } from "@/lib/auth/d1-client";

export async function POST(request: Request) {
  try {
    const { orderId } = (await request.json()) as { orderId?: string };

    if (!orderId || typeof orderId !== "string" || orderId.length < 8) {
      return NextResponse.json(
        { success: false, error: "请提供有效的爱发电订单号" },
        { status: 400 },
      );
    }

    // Step 1: Check if webhook already generated a license key for this order
    const existing = await d1First<{ license_key: string }>(
      "SELECT license_key FROM licenses WHERE afdian_order_id = ? AND status = 'active'",
      [orderId],
    );

    if (existing) {
      // Already processed by webhook — just validate and return
      const license = await validateLicense(existing.license_key);
      if (license.valid && license.license) {
        return NextResponse.json({
          success: true,
          tier: "unlock" as const,
          licenseKey: existing.license_key,
          planName: "已激活",
          cached: true,
        });
      }
      // If license is invalid for some reason, fall through to re-create
    }

    // Step 2: Fallback — query 爱发电 API directly
    const order = await queryOrder(orderId);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "未找到该订单。请确认订单号正确，且已在爱发电完成付款。",
        },
        { status: 404 },
      );
    }

    if (order.status !== undefined && order.status !== 2) {
      return NextResponse.json(
        {
          success: false,
          error: "该订单尚未支付成功，请先完成付款。",
        },
        { status: 400 },
      );
    }

    const tier = detectTier(order.total_amount);

    if (!tier.shouldUnlockPremium) {
      return NextResponse.json({
        success: true,
        tier: tier.type,
        planName: tier.label,
        message: "谢谢你的支持！你的名字会出现在网站感谢名单中。",
        thankYou: true,
      });
    }

    // Generate license key (idempotent)
    const result = await createLicenseFromOrder(
      order.out_trade_no,
      order.plan_id,
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.reason ?? "创建 License 失败，请联系作者。",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      tier: tier.type,
      licenseKey: result.licenseKey,
      planName: tier.label,
    });
  } catch (error) {
    console.error("[verify-order] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误，请稍后重试。" },
      { status: 500 },
    );
  }
}
