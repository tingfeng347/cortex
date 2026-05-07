import type { Metadata } from "next"
import Script from "next/script"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { QUESTIONS_PER_TEST } from "@/lib/questions"
import { RESULT_TIERS } from "@/lib/scoring"

const OG_DEFAULT_TIER_LABEL = RESULT_TIERS[Math.floor(RESULT_TIERS.length / 2)].label

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
    openGraph: {
      title: t("title") + " · " + t("subtitle"),
      description: t("description", { count: QUESTIONS_PER_TEST }),
      type: "website",
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
  const messages = await getMessages()

  return (
    <html lang={locale} className="antialiased" suppressHydrationWarning>
      <head />
      <body className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              var theme = localStorage.getItem('cortex-theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            })();
          `}
        </Script>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <ServiceWorkerRegister />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
