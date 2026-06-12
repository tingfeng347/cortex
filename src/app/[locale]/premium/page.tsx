"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { usePremium } from "@/components/premium/usePremium"
import { UnlockButton } from "@/components/premium/UnlockButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy, Check, ShieldCheck } from "lucide-react"
import { Link } from "@/i18n/navigation"

export default function PremiumPage() {
  const t = useTranslations()
  const { isPremium, licenseKey, isLoading, error, clearLicense } = usePremium()
  const [copied, setCopied] = useState(false)
  const [cleared, setCleared] = useState(false)

  async function copyKey() {
    if (!licenseKey) return
    await navigator.clipboard.writeText(licenseKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  function handleClear() {
    clearLicense()
    setCleared(true)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    )
  }

  if (cleared) {
    return (
      <div className="flex min-h-dvh flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-lg space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-lg font-semibold">已清除 License Key</p>
              <p className="mt-2 text-sm text-muted-foreground">
                此设备已恢复免费版状态。你的 License Key 仍然有效，可以在其他设备上使用。
              </p>
              <Link
                href="/unlock"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                重新激活 →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="flex min-h-dvh flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-lg space-y-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            回到测试
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">高级版</h1>

          <Card className="border-dashed">
            <CardContent className="pt-6 text-center space-y-4">
              <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">你还没有解锁高级版</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  一次性赞助 ¥29.90，永久解锁全部功能
                </p>
              </div>
              <UnlockButton className="w-full text-center" />
              <p className="text-xs text-muted-foreground">
                已付款？<Link href="/unlock" className="text-primary hover:underline">输入订单号激活</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          回到测试
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">高级版管理</h1>

        {/* Status Card */}
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">已激活</p>
                <p className="text-sm text-green-600 dark:text-green-400">永久有效</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Key Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">License Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {licenseKey && (
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono select-all">
                  {licenseKey}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={copyKey}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              在其他设备上输入此 Key 即可同步数据和 Premium 身份。最多绑定 3 台设备。
            </p>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">已解锁的功能</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                无限次测试
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                云端同步（跨设备）
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                逐维度深度分析
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                数据导出 CSV
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                无水印分享图
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {licenseKey && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-base text-red-600 dark:text-red-400">清除此设备上的 License</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                清除后此设备恢复免费版，但 License Key 仍然有效。可用于释放设备名额。
              </p>
              <Button variant="outline" size="sm" className="text-red-600" onClick={handleClear}>
                清除 License
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
