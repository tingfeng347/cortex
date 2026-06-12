"use client"

import { type ReactNode } from "react"
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
  return (
    <div className="rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center">
      <p className="text-sm text-muted-foreground">此功能需要解锁高级版</p>
      <a
        href="/unlock"
        className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
      >
        解锁高级版 ¥29.90 →
      </a>
    </div>
  )
}
