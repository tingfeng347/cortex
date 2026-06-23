"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"

const BULLETIN_KEY = "cortex:bulletin:v1"

export function Bulletin({ locale }: { locale: string }) {
  const t = useTranslations("bulletin")
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(BULLETIN_KEY)) return
    // Small delay so it doesn't pop up immediately on navigation
    const timer = setTimeout(() => setShow(true), 600)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    localStorage.setItem(BULLETIN_KEY, "true")
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="pr-6 text-lg font-semibold">{t("title")}</h2>

        <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
        </div>

        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800/30 dark:bg-blue-950/30 dark:text-blue-300">
          <p className="font-medium">{t("reviewerTitle")}</p>
          <p className="mt-1">
            {t.rich("reviewerDesc", {
              strong: (chunks) => <strong>{chunks}</strong>,
              email: (chunks) => (
                <a href="mailto:i@jyunko.cn" className="underline">
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            {t("gotIt")}
          </button>
        </div>
      </div>
    </div>
  )
}
