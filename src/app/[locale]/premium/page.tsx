"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { usePremium } from "@/components/premium/usePremium"
import { UnlockButton } from "@/components/premium/UnlockButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy, Check, ShieldCheck } from "lucide-react"
import { Link } from "@/i18n/navigation"

export default function PremiumPage() {
  useEffect(() => {
    document.body.classList.add("hide-top-nav")
    return () => document.body.classList.remove("hide-top-nav")
  }, [])
  const t = useTranslations("premiumPage")
  const { isPremium, licenseKey, isLoading, error, expiresAt, deviceCount, maxDevices, clearLicense } = usePremium()
  const [copied, setCopied] = useState(false)
  const [cleared, setCleared] = useState(false)

  const expiresDate = expiresAt ? new Date(expiresAt) : null
  const isExpiringSoon = expiresDate && expiresDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000

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
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  if (cleared) {
    return (
      <div className="flex min-h-dvh flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-lg space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-lg font-semibold">{t("cleared")}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("clearedDesc")}
              </p>
              <Link
                href="/unlock"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                {t("reactivate")}
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
            {t("backToTest")}
          </Link>

          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

          <Card className="border-dashed">
            <CardContent className="pt-6 text-center space-y-4">
              <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">{t("notPremium")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("notPremiumDesc")}
                </p>
              </div>
              <UnlockButton className="w-full text-center" />
              <p className="text-xs text-muted-foreground">
                {t("paidPrompt")}<Link href="/unlock" className="text-primary hover:underline">{t("activateOrder")}</Link>
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
          {t("backToTest")}
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">{t("titleManage")}</h1>

        {/* Status Card */}
        <Card className={`${expiresDate && isExpiringSoon ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950" : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"}`}>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${expiresDate && isExpiringSoon ? "bg-yellow-600" : "bg-green-600"}`}>
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={`font-semibold ${expiresDate && isExpiringSoon ? "text-yellow-800 dark:text-yellow-200" : "text-green-800 dark:text-green-200"}`}>{t("statusActivated")}</p>
                {expiresDate ? (
                  <p className={`text-sm ${isExpiringSoon ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                    {t("expiresAt", { date: expiresDate.toLocaleDateString() })}
                  </p>
                ) : (
                  <p className="text-sm text-green-600 dark:text-green-400">{t("permanent")}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Key Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("licenseKeyTitle")}</CardTitle>
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{t("deviceCount", { count: deviceCount, max: maxDevices })}</span>
              {deviceCount >= maxDevices && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  {t("deviceFull")}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("licenseKeyDesc")}
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
            <CardTitle className="text-lg">{t("featuresTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {t("featureUnlimitedTests")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {t("featureCloudSync")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {t("featureAnalysis")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {t("featureExport")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {t("featureWatermark")}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {licenseKey && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-base text-red-600 dark:text-red-400">{t("dangerTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                {t("dangerDesc")}
              </p>
              <Button variant="outline" size="sm" className="text-red-600" onClick={handleClear}>
                {t("dangerButton")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
