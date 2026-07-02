"use client"

import { useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { parseRefParam } from "@/lib/url-utils"

export function SharePageClient({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const ref = parseRefParam(searchParams.get("ref") ?? undefined)
  const refStr = ref !== null ? String(ref) : ""

  useEffect(() => {
    const dest = "/" + (refStr ? "?ref=" + refStr : "")
    router.replace(dest)
  }, [router, refStr])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-primary/5">
        <span className="text-2xl font-bold text-primary">?</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {locale === "ja" ? "読み込み中..." : locale === "en" ? "Loading..." : "加载中..."}
      </p>
      {ref !== null && (
        <Link
          href={"/?ref=" + ref}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {locale === "ja" ? "ここをクリック" : locale === "en" ? "Click here" : "点击这里"}
        </Link>
      )}
    </div>
  )
}
