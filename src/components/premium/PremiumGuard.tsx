"use client"

import { type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { usePremium } from "./usePremium"

interface PremiumGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function PremiumGuard({ children, fallback }: PremiumGuardProps) {
  const { isPremium, isLoading } = usePremium()

  if (isLoading) return null
  if (isPremium) return <>{children}</>

  return (
    <>{fallback ?? <DefaultLocked />}</>
  )
}

function DefaultLocked() {
  const t = useTranslations("premiumPage")
  return (
    <div className="rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center">
      <p className="text-sm text-muted-foreground">{t("requiresPremium")}</p>
      <Link
        href="/unlock"
        className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
      >
        {t("unlockCta")}
      </Link>
    </div>
  )
}
