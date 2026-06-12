import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { PremiumWrapper } from "@/components/premium/PremiumWrapper"
import { QUESTIONS_PER_TEST } from "@/lib/questions"
import { RESULT_TIERS } from "@/lib/scoring"

const OG_DEFAULT_TIER_LABEL = RESULT_TIERS[Math.floor(RESULT_TIERS.length / 2)].label

const BASE_URL = "https://cortex.hydroroll.team"

function jsonLdWebApplication(locale: string) {
  const inLanguage = locale === "zh-CN" ? "zh-Hans" : locale === "ja" ? "ja" : "en"
  const name: Record<string, string> = {
    "zh-CN": "认知防锈 · 基线测试",
    en: "Cognitive Rustproof · Baseline Test",
    ja: "認知防錆 · ベースラインテスト",
  }
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: name[locale] ?? name["zh-CN"],
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: BASE_URL,
    inLanguage,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "site" })
  const ogImgUrl = `/api/og?i=50&t=${encodeURIComponent(OG_DEFAULT_TIER_LABEL)}&c=0&n=${QUESTIONS_PER_TEST}`

  return {
    title: t("title") + " | " + t("tagline"),
    description: t("description", { count: QUESTIONS_PER_TEST }),
    manifest: `/${locale}/manifest.json`,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: locale === "zh-CN" ? BASE_URL : `${BASE_URL}/${locale}`,
      languages: {
        "zh-Hans": `${BASE_URL}/`,
        en: `${BASE_URL}/en`,
        ja: `${BASE_URL}/ja`,
      },
    },
    openGraph: {
      title: t("title") + " · " + t("subtitle"),
      description: t("description", { count: QUESTIONS_PER_TEST }),
      type: "website",
      siteName: "Cognitive Rustproof",
      locale: locale === "zh-CN" ? "zh_CN" : locale === "ja" ? "ja_JP" : "en_US",
      images: [
        {
          url: ogImgUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title") + " · " + t("subtitle"),
      description: t("description", { count: QUESTIONS_PER_TEST }),
      images: [ogImgUrl],
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdWebApplication(locale)),
        }}
      />
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <ServiceWorkerRegister />
      <PremiumWrapper>{children}</PremiumWrapper>
    </NextIntlClientProvider>
  )
}
