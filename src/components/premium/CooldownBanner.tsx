"use client"

import { X, Bug, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

interface CooldownBannerProps {
  cooldownEndsAt: number
  onClose: () => void
}

function formatRemaining(ms: number, t: ReturnType<typeof useTranslations>): string {
  const totalHours = Math.ceil(ms / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0 && hours > 0) return t("remainingDaysHours", { days, hours })
  if (days > 0) return t("remainingDays", { days })
  return t("remainingHours", { totalHours })
}

export function CooldownBanner({ cooldownEndsAt, onClose }: CooldownBannerProps) {
  const remainingMs = cooldownEndsAt - Date.now()
  const t = useTranslations("cooldown")
  const remaining = formatRemaining(remainingMs, t)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-2xl text-center dark:border-amber-800 dark:bg-amber-950">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-2 top-2 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
          aria-label={t("closeAria")}
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <p className="text-4xl font-bold text-amber-800 dark:text-amber-200 mt-2 tabular-nums">
          {remaining}
        </p>
        <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
          {t("cooldownLabel")}
        </p>
        <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
          {t("upgradePrompt")}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/unlock"
            className="rounded-full bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            {t("unlockCta")}
          </Link>
          <a
            href="https://ifdian.net/a/HsiangNianian"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-amber-300 px-6 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
          >
            {t("afdianLink")}
          </a>
        </div>

        <div className="mt-4 space-y-2 border-t border-amber-200 pt-4 dark:border-amber-800">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {t("freeKeyTitle")}
          </p>
          <div className="space-y-1.5">
            <a
              href="https://qm.qq.com/q/q0isaJjLjO"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-amber-100/80 px-3 py-2 text-xs text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-800/50"
            >
              <Bug className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{t("freeKeyBugDesc")}</span>
              <span className="font-medium underline-offset-2 hover:underline">{t("freeKeyCta")}</span>
            </a>
            <a
              href="https://qm.qq.com/q/q0isaJjLjO"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-amber-100/50 px-3 py-2 text-xs text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-800/30"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{t("freeKeyLiveDesc")}</span>
            </a>
          </div>
        </div>

        <p className="mt-3 text-xs text-amber-500/70 dark:text-amber-500/50">
          {t("warningText")}
        </p>
      </div>
    </div>
  )
}
