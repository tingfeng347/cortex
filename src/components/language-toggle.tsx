"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useTransition } from "react"

const LOCALES = [
  { code: "zh-CN", label: "中" },
  { code: "en", label: "EN" },
  { code: "ja", label: "日" },
] as const

export function LanguageToggle() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchLocale(next: string) {
    if (next === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-background/80 p-0.5 text-xs font-medium backdrop-blur-sm">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          disabled={isPending}
          className={`rounded-md px-2 py-1 transition-colors ${
            locale === l.code
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
