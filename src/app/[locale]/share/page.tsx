import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { AutoRedirect } from "@/components/share-redirect"
import { getTierByIndex } from "@/lib/scoring"

export async function generateMetadata({
  searchParams,
  params,
}: {
  searchParams: Promise<{ ref?: string }>
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const sp = await searchParams
  const ref = sp.ref
  const index = ref ? Math.min(100, Math.max(0, Number(ref) || 50)) : 50
  const tier = getTierByIndex(index)
  const t = await getTranslations({ locale, namespace: "site" })

  const ogUrl = `/api/og?i=${index}&t=${encodeURIComponent(tier.tierKey)}&c=?&n=5`

  return {
    openGraph: {
      title: t("title") + " — " + tier.label,
      description: `${index}/100 · ${t("title")}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title") + " — " + tier.label,
      description: `${index}/100 · ${t("title")}`,
      images: [ogUrl],
    },
  }
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const t = await getTranslations("share")
  const params = await searchParams
  const ref = params.ref ?? ""

  return (
    <>
      <AutoRedirect ref={ref} />
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-primary/5">
          <span className="text-2xl font-bold text-primary">?</span>
        </div>
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
        <Link
          href={"/?ref=" + ref}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("clickHere")}
        </Link>
      </div>
    </>
  )
}
