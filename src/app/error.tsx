"use client"

import { useTranslations } from "next-intl"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("error")

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-2xl font-bold text-destructive">!</span>
      </div>
      <h1 className="text-lg font-semibold tracking-tight">{t("heading")}</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        {t("message")}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("retry")}
      </button>
    </div>
  )
}
