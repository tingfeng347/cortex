import { test, expect } from "@playwright/test"

const BASE = "http://localhost:8788"
const TEST_ORDER_ID = "E2E_" + Date.now()

test.describe("Premium Flow", () => {
  test("landing page loads with premium mode", async ({ page }) => {
    await page.goto(BASE + "/zh-CN")
    await expect(page.locator("text=认知防锈")).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=开始测试")).toBeVisible()
  })

  test("unlock page shows payment steps", async ({ page }) => {
    await page.goto(BASE + "/zh-CN/unlock")
    await expect(page.locator("text=解锁认知防锈高级版")).toBeVisible()
    await expect(page.locator("text=第一步")).toBeVisible()
    await expect(page.locator("text=第二步")).toBeVisible()
  })

  test("webhook generates license key for new order", async ({ request }) => {
    const res = await request.post(BASE + "/api/webhooks/afdian", {
      data: {
        ec: 200, em: "ok",
        data: {
          type: "order",
          order: {
            out_trade_no: TEST_ORDER_ID,
            user_id: "e2e_test_user",
            plan_id: "e2e_plan_2990",
            month: 1,
            total_amount: "29.90",
            show_amount: "29.90",
            status: 2,
            remark: "",
            redeem_id: "",
            product_type: 0,
            discount: "0.00",
            sku_detail: [],
            address_person: "",
            address_phone: "",
            address_address: "",
          },
        },
      },
    })
    const body = await res.json()
    expect(body.ec).toBe(200)
    expect(body.em).toBe("ok")
  })

  test("verify-order retrieves key from D1 cache", async ({ request }) => {
    const res = await request.post(BASE + "/api/verify-order", {
      data: { orderId: TEST_ORDER_ID },
    })
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.licenseKey).toBeTruthy()
    expect(body.licenseKey).toMatch(/^cx_/)
    expect(body.cached).toBe(true)
  })

  test("license validate activates device", async ({ request }) => {
    // First get the license key
    const verifyRes = await request.post(BASE + "/api/verify-order", {
      data: { orderId: TEST_ORDER_ID },
    })
    const { licenseKey } = await verifyRes.json()

    // Validate
    const res = await request.post(BASE + "/api/license/validate", {
      data: { licenseKey, deviceId: "e2e_device_" + Date.now() },
    })
    const body = await res.json()
    expect(body.valid).toBe(true)
    expect(body.license.status).toBe("active")
    expect(body.device.success).toBe(true)
  })

  test("sync uploads and downloads results", async ({ request }) => {
    const verifyRes = await request.post(BASE + "/api/verify-order", {
      data: { orderId: TEST_ORDER_ID },
    })
    const { licenseKey } = await verifyRes.json()

    // Upload
    const postRes = await request.post(BASE + "/api/results/sync", {
      headers: { Authorization: `Bearer ${licenseKey}` },
      data: {
        results: [{
          degradationIndex: 38,
          tierKey: "mildDecline",
          correctCount: 14,
          totalQuestions: 20,
          dimensionScores: { logic: 70, math: 65, vocab: 75 },
          aiUsageLevel: null,
          estimationMethod: "irt",
          theta: 0.2,
          thetaSE: 0.35,
          thetaByType: { logic: 0.1, math: 0.2, vocab: 0.3 },
          elapsedMs: 280000,
        }],
      },
    })
    expect(await postRes.json()).toEqual({ ok: true, count: 1 })

    // Download
    const getRes = await request.get(BASE + "/api/results/sync", {
      headers: { Authorization: `Bearer ${licenseKey}` },
    })
    const body = await getRes.json()
    expect(body.results.length).toBeGreaterThanOrEqual(1)
    expect(body.results[0].degradationIndex).toBe(38)
  })

  test("CSV export returns valid CSV", async ({ request }) => {
    const verifyRes = await request.post(BASE + "/api/verify-order", {
      data: { orderId: TEST_ORDER_ID },
    })
    const { licenseKey } = await verifyRes.json()

    const res = await request.get(BASE + "/api/premium/export", {
      headers: { Authorization: `Bearer ${licenseKey}` },
    })
    expect(res.status()).toBe(200)
    const csv = await res.text()
    expect(csv).toContain("日期,退化指数")
    expect(csv).toContain("38")
  })

  test("support tier does not generate license key", async ({ request }) => {
    const supportOrderId = "E2E_SUPPORT_" + Date.now()

    // Webhook for support tier
    const webhookRes = await request.post(BASE + "/api/webhooks/afdian", {
      data: {
        ec: 200, em: "ok",
        data: {
          type: "order",
          order: {
            out_trade_no: supportOrderId,
            user_id: "e2e_support_user",
            plan_id: "e2e_plan_990",
            month: 1,
            total_amount: "9.90",
            show_amount: "9.90",
            status: 2,
            remark: "",
            redeem_id: "",
            product_type: 0,
            discount: "0.00",
            sku_detail: [],
            address_person: "",
            address_phone: "",
            address_address: "",
          },
        },
      },
    })
    const webhookBody = await webhookRes.json()
    expect(webhookBody.em).toBe("support_tier")
  })
})
