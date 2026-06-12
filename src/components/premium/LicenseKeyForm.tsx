"use client"

import { useState, useEffect } from "react"
import { usePremium } from "./usePremium"
import { Button } from "@/components/ui/button"
import { Check, Copy, Loader2, XCircle, Coffee } from "lucide-react"

interface LicenseKeyFormProps {
  onSuccess?: (key: string) => void
}

export function LicenseKeyForm({ onSuccess }: LicenseKeyFormProps) {
  const { isPremium, isLoading: premiumLoading, activateLicense, error: premiumError } = usePremium()

  const [orderId, setOrderId] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    licenseKey?: string
    planName?: string
    userName?: string
    error?: string
    thankYou?: boolean
    message?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // If user is already premium, don't show the form
  if (isPremium) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
        <Check className="mx-auto h-8 w-8 text-green-600" />
        <p className="mt-2 text-sm font-medium text-green-800 dark:text-green-200">你已经解锁了高级版</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderId.trim() || verifying) return

    setVerifying(true)
    setResult(null)

    try {
      const res = await fetch("/api/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim() }),
      })
      const data = await res.json()
      setResult(data)

      if (data.success && data.licenseKey) {
        // Auto-activate the license
        const ok = await activateLicense(data.licenseKey)
        if (ok && onSuccess) onSuccess(data.licenseKey)
      }
    } catch {
      setResult({ success: false, error: "网络错误，请稍后重试。" })
    } finally {
      setVerifying(false)
    }
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="space-y-4">
      {premiumError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {premiumError}
        </div>
      )}

      {/* Success with license key */}
      {result?.success && result.licenseKey && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-4 dark:border-green-800 dark:bg-green-950">
          <div className="text-center">
            <Check className="mx-auto h-10 w-10 text-green-600" />
            <p className="mt-2 text-lg font-semibold text-green-800 dark:text-green-200">
              {result.planName ?? "解锁成功！"}
            </p>
            {result.userName && (
              <p className="text-sm text-green-600 dark:text-green-400">爱发电用户：{result.userName}</p>
            )}
          </div>

          <div className="rounded-lg bg-white/50 p-4 dark:bg-black/20">
            <p className="text-xs text-muted-foreground mb-2">你的 License Key（请保存好）：</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono select-all">
                {result.licenseKey}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyKey(result.licenseKey!)}
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <p className="text-xs text-green-600 dark:text-green-400 text-center">
            已自动激活。Key 已保存在此设备。换设备时输入此 Key 即可同步。
          </p>
        </div>
      )}

      {/* Thank you (support tier) */}
      {result?.success && result.thankYou && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-center justify-center gap-2">
            <Coffee className="h-5 w-5 text-blue-600" />
            <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">{result.planName}</p>
          </div>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">{result.message}</p>
        </div>
      )}

      {/* Error */}
      {result && !result.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 flex items-start gap-3">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">验证失败</p>
            <p className="mt-1">{result.error}</p>
          </div>
        </div>
      )}

      {/* Order ID input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="order-id" className="block text-sm font-medium mb-1">
            爱发电订单号
          </label>
          <input
            id="order-id"
            type="text"
            placeholder="在爱发电完成付款后，输入订单号"
            value={orderId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrderId(e.target.value)}
            disabled={verifying}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Button type="submit" className="w-full" disabled={!orderId.trim() || verifying}>
          {verifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              验证中...
            </>
          ) : (
            "验证并激活"
          )}
        </Button>
      </form>
    </div>
  )
}
