import type { Metadata } from "next"
import Script from "next/script"
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { PremiumWrapper } from "@/components/premium/PremiumWrapper"
import { IntlErrorBoundary } from "@/components/IntlErrorBoundary"
import { Link } from "@/i18n/navigation"
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
  const navT = await getTranslations({ locale, namespace: "nav" })

  return (
    <IntlErrorBoundary locale={locale} messages={messages}>
      <Script
        id="css-cache-buster"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){var d=document,t=setTimeout(function(){var s=d.querySelectorAll('link[rel=stylesheet]');for(var i=0;i<s.length;i++){var h=s[i].href;s[i].href=h+(h.includes('?')?'&':'?')+'_t='+Date.now()}},5000);d.addEventListener('load',function(){clearTimeout(t)})})()`,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdWebApplication(locale)),
        }}
      />
      <div id="top-nav-bar" className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-background/80 backdrop-blur-sm px-4 py-2">
        <Link href="/status" className="text-muted-foreground hover:text-foreground transition-colors" title={navT("status")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/search" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-0.5 inline h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            {navT("search")}
          </Link>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <ServiceWorkerRegister />
      <PremiumWrapper>{children}</PremiumWrapper>
    </IntlErrorBoundary>
  )
}
