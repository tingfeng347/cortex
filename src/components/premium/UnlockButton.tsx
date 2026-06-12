"use client"

import { useTranslations } from "next-intl"

const AFDIAN_URL = process.env.NEXT_PUBLIC_AFDIAN_SPONSOR_URL ?? "https://ifdian.net/a/HsiangNianian"

interface UnlockButtonProps {
  variant?: "primary" | "outline" | "inline"
  className?: string
}

export function UnlockButton({ variant = "primary", className = "" }: UnlockButtonProps) {
  const t = useTranslations()

  if (variant === "inline") {
    return (
      <a
        href={AFDIAN_URL}
        target="_blank"
        rel="noreferrer"
        className={`text-sm font-medium text-primary hover:underline ${className}`}
      >
        解锁高级版 ¥29.90 →
      </a>
    )
  }

  if (variant === "outline") {
    return (
      <a
        href={AFDIAN_URL}
        target="_blank"
        rel="noreferrer"
        className={`inline-block rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors ${className}`}
      >
        解锁高级版 ¥29.90 →
      </a>
    )
  }

  return (
    <a
      href={AFDIAN_URL}
      target="_blank"
      rel="noreferrer"
      className={`inline-block rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors ${className}`}
    >
      解锁高级版 ¥29.90 →
    </a>
  )
}
