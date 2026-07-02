import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SharePageClient } from "./SharePageClient"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "site" })

  return {
    title: t("title") + " · " + t("subtitle"),
    description: t("description", { count: 20 }),
    openGraph: {
      title: t("title") + " · " + t("subtitle"),
      description: t("description", { count: 20 }),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title") + " · " + t("subtitle"),
      description: t("description", { count: 20 }),
    },
  }
}

export default function SharePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  return <SharePageClient params={params} />
}
