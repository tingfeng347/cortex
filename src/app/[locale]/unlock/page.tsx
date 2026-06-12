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
  const t = useTranslations("unlock")
  const { isPremium, activateLicense } = usePremium()

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
      setDirectError(t("activateError"))
    }
    setActivating(false)
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t("backToTest")}
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

        {isPremium ? (
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardContent className="pt-6 text-center">
              <Check className="mx-auto h-10 w-10 text-green-600" />
              <p className="mt-3 text-lg font-semibold">{t("alreadyUnlocked")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("managePrompt")}</p>
              <Link
                href="/premium"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                {t("managePremium")}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("step1Title")}</CardTitle>
                <CardDescription>{t("step1Desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href="https://ifdian.net/order/create?plan_id=9acc10d6660d11f194fc52540025c377&product_type=0&remark=%E8%A7%A3%E9%94%81%E9%AB%98%E7%BA%A7%E7%89%88"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                >
                  <div>
                    <p className="text-sm font-semibold">{t("planUnlockTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("planUnlockDesc")}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
                    ¥29.90
                  </span>
                </a>

                <a
                  href="https://ifdian.net/order/create?plan_id=e5cdcffe661011f193645254001e7c00&product_type=0&remark=%E5%BD%93%E8%82%A1%E4%B8%9C"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border-2 border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900"
                >
                  <div>
                    <p className="text-sm font-semibold">{t("planSponsorTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("planSponsorDesc")}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white">
                    ¥99.00
                  </span>
                </a>

                <a
                  href="https://ifdian.net/order/create?plan_id=4b6426187b9f11eb85b052540025c377&product_type=0&remark=%E8%AF%B7%E5%A5%B6%E8%8C%B6"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border-2 border-muted-foreground/20 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-semibold">{t("planSupportTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("planSupportDesc")}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-muted-foreground/30 px-4 py-1.5 text-sm font-semibold text-muted-foreground">
                    ¥5.00
                  </span>
                </a>

                <p className="text-xs text-muted-foreground text-center pt-1">
                  {t("payNote")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("step2Title")}</CardTitle>
                <CardDescription>{t("step2Desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <LicenseKeyForm />
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <hr className="flex-1 border-muted-foreground/20" />
              <span className="text-xs text-muted-foreground">{t("orDivider")}</span>
              <hr className="flex-1 border-muted-foreground/20" />
            </div>

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">{t("hasKeyTitle")}</CardTitle>
                <CardDescription>{t("hasKeyDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDirectActivate} className="space-y-3">
                  <input
                    type="text"
                    placeholder={t("keyPlaceholder")}
                    value={directKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDirectKey(e.target.value)}
                    disabled={activating}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {directSuccess && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                      <Check className="h-4 w-4" />
                      {t("activateSuccess")}
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
                        {t("activating")}
                      </>
                    ) : (
                      t("activate")
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
