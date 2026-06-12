"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

interface CooldownBannerProps {
  cooldownEndsAt: number
  onClose: () => void
}

function formatRemaining(ms: number): string {
  const totalHours = Math.ceil(ms / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0 && hours > 0) return `${days} 天 ${hours} 小时`
  if (days > 0) return `${days} 天`
  return `${totalHours} 小时`
}

export function CooldownBanner({ cooldownEndsAt, onClose }: CooldownBannerProps) {
  const remainingMs = cooldownEndsAt - Date.now()
  const remaining = formatRemaining(remainingMs)

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

        <p className="text-4xl font-bold text-amber-800 dark:text-amber-200 mt-2 tabular-nums">
          {remaining}
        </p>
        <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
          冷却剩余 · 免费版每 7 天可测一次
        </p>
        <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
          升级后随时可测，不限次数
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/unlock"
            className="rounded-full bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            解锁高级版 ¥29.90 →
          </Link>
          <a
            href="https://ifdian.net/a/HsiangNianian"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-amber-300 px-6 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
          >
            前往爱发电
          </a>
        </div>

        <p className="mt-3 text-xs text-amber-500/70 dark:text-amber-500/50">
          请不要清除浏览器数据来绕过冷却，这会丢失你的所有历史记录。
        </p>
      </div>
    </div>
  )
}
