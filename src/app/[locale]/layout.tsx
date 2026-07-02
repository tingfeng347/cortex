import type { Metadata } from "next";
import Script from "next/script";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
  return [{ locale: "zh-CN" }, { locale: "en" }, { locale: "ja" }];
}
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { FestivalWrapper } from "@/components/festival/FestivalWrapper";

import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { PremiumWrapper } from "@/components/premium-seam";
import { IntlErrorBoundary } from "@/components/IntlErrorBoundary";
import { Link } from "@/i18n/navigation";
import { QUESTIONS_PER_TEST } from "@/lib/questions";
import { RESULT_TIERS } from "@/lib/scoring";
import { SITE_URL, BASE_PATH } from "@/lib/site-config";

const OG_DEFAULT_TIER_LABEL = RESULT_TIERS[Math.floor(RESULT_TIERS.length / 2)].label;

const BASE_URL = `${SITE_URL}${BASE_PATH}`;

function jsonLdWebApplication(locale: string) {
  const inLanguage = locale === "zh-CN" ? "zh-Hans" : locale === "ja" ? "ja" : "en";
  const name: Record<string, string> = {
    "zh-CN": "认知防锈 · 基线测试",
    en: "Cognitive Rustproof · Baseline Test",
    ja: "認知防錆 · ベースラインテスト",
  };
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: name[locale] ?? name["zh-CN"],
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: BASE_URL,
    inLanguage,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const ogImgUrl = `/api/og?i=50&t=${encodeURIComponent(OG_DEFAULT_TIER_LABEL)}&c=0&n=${QUESTIONS_PER_TEST}`;

  return {
    title: t("title") + " | " + t("tagline"),
    description: t("description", { count: QUESTIONS_PER_TEST }),
    manifest: `/${locale}/manifest.json`,
    icons: [
      { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", url: "/favicon-180.png" },
    ],
    metadataBase: new URL(SITE_URL),
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
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const navT = await getTranslations({ locale, namespace: "nav" });

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
      <div
        id="top-nav-bar"
        className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-background/80 backdrop-blur-sm px-4 py-2"
      >
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline h-3.5 w-3.5 sm:mr-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span className="hidden sm:inline">{navT("search")}</span>
          </Link>

          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <ServiceWorkerRegister />
      <FestivalWrapper>
        <PremiumWrapper>{children}</PremiumWrapper>
      </FestivalWrapper>
    </IntlErrorBoundary>
  );
}
