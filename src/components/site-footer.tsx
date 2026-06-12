"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

type FooterNamespace = "result" | "stats"

export function SiteFooter({ namespace }: { namespace: FooterNamespace }) {
  const t = useTranslations(namespace)
  const [toast, setToast] = useState(false)

  function handleDdlRoastClick() {
    if (toast) return
    setToast(true)
    setTimeout(() => setToast(false), 6000)
  }

  return (
    <>
      <div
        className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm rounded-xl bg-foreground px-4 py-3 text-center text-sm font-medium text-background shadow-lg transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        由于站点访问人数过多，相关站点已被 Vercel 因超限问题 Block。正在加班自掏腰包迁移中，稍后恢复访问。
      </div>

      <footer className="flex flex-col items-center gap-2 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-3">
        <span>Cortex &copy; </span>
        <a
          href="https://academic.jyunko.cn"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          {t("author")}
        </a>
        <span className="text-muted-foreground/40">|</span>
        <Link
          href="/about"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          {t("aboutLink")}
        </Link>
      </div>
      <div className="flex items-center justify-center gap-3">
        <a
          href="https://deadpan.hydroroll.team"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          {t("otherGame")}
        </a>
        <span className="text-muted-foreground/40">|</span>
        <a
          href="https://lcti.hydroroll.team"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          {t("otherXingce")}
        </a>
        <span className="text-muted-foreground/40">|</span>
        <button
          type="button"
          onClick={handleDdlRoastClick}
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          {t("ddlRoast")}
        </button>
      </div>

      </footer>
    </>
  )
}
