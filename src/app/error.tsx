"use client"

import { useEffect } from "react"

const MSG: Record<string, { heading: string; message: string; retry: string }> = {
  "zh-CN": {
    heading: "出了点问题",
    message: "页面加载出错，请尝试刷新。如果问题持续，数据不会丢失——你的历史记录已保存在本地。",
    retry: "重试",
  },
  en: {
    heading: "Something went wrong",
    message: "The page failed to load. Please try refreshing. If the problem persists, your data is safe—your history is saved locally.",
    retry: "Retry",
  },
  ja: {
    heading: "問題が発生しました",
    message: "ページの読み込みに失敗しました。更新してください。問題が続く場合でも、データは失われません——履歴はローカルに保存されています。",
    retry: "再試行",
  },
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error boundary caught:", error)
  }, [error])

  const locale = typeof window !== "undefined"
    ? document.documentElement.lang || "en"
    : "en"
  const msg = MSG[locale] ?? MSG.en

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-2xl font-bold text-destructive">!</span>
      </div>
      <h1 className="text-lg font-semibold tracking-tight">{msg.heading}</h1>
      <p className="max-w-xs text-sm text-muted-foreground">{msg.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {msg.retry}
      </button>
    </div>
  )
}
