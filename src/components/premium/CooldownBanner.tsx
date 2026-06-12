"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CooldownBannerProps {
  cooldownEndsAt: number
  onClose: () => void
}

export function CooldownBanner({ cooldownEndsAt, onClose }: CooldownBannerProps) {
  const remainingMs = cooldownEndsAt - Date.now()
  const days = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)))
  const hours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)))

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
          aria-label="关闭"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <p className="text-base font-semibold text-amber-800 dark:text-amber-200 mt-2">
          {days > 0
            ? `你还需要等待 ${days} 天`
            : `你还需要等待 ${hours} 小时`}
        </p>
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
          免费版每 7 天可测一次。升级后随时可测，不限次数。
        </p>
        <a
          href="/unlock"
          className="mt-4 inline-block rounded-full bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          解锁高级版 ¥29.99 →
        </a>
        <p className="mt-3 text-xs text-amber-500/70 dark:text-amber-500/50">
          请不要清除浏览器数据来绕过冷却，这会丢失你的所有历史记录。
        </p>
      </div>
    </div>
  )
}
