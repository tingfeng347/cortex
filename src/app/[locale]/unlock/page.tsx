"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { usePremium } from "@/components/premium/usePremium"
import { LicenseKeyForm } from "@/components/premium/LicenseKeyForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { Link } from "@/i18n/navigation"

export default function UnlockPage() {
  const t = useTranslations()
  const { isPremium, isLoading: premiumLoading, activateLicense } = usePremium()

  // Direct license key entry (for returning users syncing to a new device)
  const [directKey, setDirectKey] = useState("")
  const [activating, setActivating] = useState(false)
  const [directError, setDirectError] = useState<string | null>(null)
  const [directSuccess, setDirectSuccess] = useState(false)

  async function handleDirectActivate(e: React.FormEvent) {
    e.preventDefault()
    if (!directKey.trim() || activating) return

    setActivating(true)
    setDirectError(null)
    setDirectSuccess(false)

    const ok = await activateLicense(directKey.trim())
    if (ok) {
      setDirectSuccess(true)
    } else {
      setDirectError("激活失败，请检查 License Key 是否正确。")
    }
    setActivating(false)
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          回到测试
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">解锁认知防锈高级版</h1>

        {isPremium ? (
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardContent className="pt-6 text-center">
              <Check className="mx-auto h-10 w-10 text-green-600" />
              <p className="mt-3 text-lg font-semibold">你已经解锁了高级版</p>
              <p className="mt-1 text-sm text-muted-foreground">去管理页面查看 License Key 和设备信息</p>
              <Link
                href="/premium"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                管理 Premium →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Step 1: Choose tier & pay on 爱发电 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">第一步：选择方案并付款</CardTitle>
                <CardDescription>
                  三个档位任选，微信/支付宝均可。付款后复制订单号。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* ¥29.90 Unlock */}
                <a
                  href="https://ifdian.net/order/create?custom_price=29.90&remark=%E8%A7%A3%E9%94%81%E9%AB%98%E7%BA%A7%E7%89%88"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                >
                  <div>
                    <p className="text-sm font-semibold">解锁高级版</p>
                    <p className="text-xs text-muted-foreground">无限测试 · 云端同步 · 逐维度分析 · CSV 导出</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
                    ¥29.90
                  </span>
                </a>

                {/* ¥99 Sponsor */}
                <a
                  href="https://ifdian.net/order/create?custom_price=99.00&remark=%E5%BD%93%E8%82%A1%E4%B8%9C"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border-2 border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900"
                >
                  <div>
                    <p className="text-sm font-semibold">赞助者名单</p>
                    <p className="text-xs text-muted-foreground">含高级版全部 + 赞助墙留名 + 新功能内测</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white">
                    ¥99.00
                  </span>
                </a>

                {/* ¥9.90 Support */}
                <a
                  href="https://ifdian.net/order/create?custom_price=9.90&remark=%E8%AF%B7%E5%A5%B6%E8%8C%B6"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border-2 border-muted-foreground/20 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-semibold">纯支持</p>
                    <p className="text-xs text-muted-foreground">请我喝杯奶茶，不图回报</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-muted-foreground/30 px-4 py-1.5 text-sm font-semibold text-muted-foreground">
                    ¥9.90
                  </span>
                </a>

                <p className="text-xs text-muted-foreground text-center pt-1">
                  付款后你会获得一个订单号，复制它，在下方输入激活
                </p>
              </CardContent>
            </Card>

            {/* Step 2: Enter order ID */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">第二步：输入订单号激活</CardTitle>
                <CardDescription>
                  在此输入爱发电订单号，自动验证并生成 License Key
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LicenseKeyForm />
              </CardContent>
            </Card>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-muted-foreground/20" />
              <span className="text-xs text-muted-foreground">或者</span>
              <hr className="flex-1 border-muted-foreground/20" />
            </div>

            {/* Direct License Key entry */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">已有 License Key？</CardTitle>
                <CardDescription>
                  换设备或重装后，直接输入 Key 恢复 Premium 身份
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDirectActivate} className="space-y-3">
                  <input
                    type="text"
                    placeholder="输入 License Key（如 cx_xxxxxxxxxxxxxxxx）"
                    value={directKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDirectKey(e.target.value)}
                    disabled={activating}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {directSuccess && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                      <Check className="h-4 w-4" />
                      激活成功！你现在拥有高级版权限。
                    </div>
                  )}
                  {directError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{directError}</p>
                  )}
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={!directKey.trim() || activating}
                  >
                    {activating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        激活中...
                      </>
                    ) : (
                      "激活"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
