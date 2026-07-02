import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./festival/dragonboat.css";
import { SITE_URL, BASE_PATH } from "@/lib/site-config";
import { routing } from "@/i18n/routing";

const LOCALES_JSON = JSON.stringify(routing.locales);
const BASE_PATH_JS = JSON.stringify(BASE_PATH);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/favicon.svg",
  },
  other: {
    "theme-color": "#1a1a1a",
  },
  openGraph: {
    locale: "zh_CN",
    alternateLocale: ["en_US", "ja_JP"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={routing.defaultLocale} className="antialiased" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('cortex-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
        <Script
          id="lang-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=window.location.pathname;var bp=${BASE_PATH_JS};if(bp&&p.startsWith(bp))p=p.substring(bp.length);var s=p.split('/')[1];var L=${LOCALES_JSON};if(L.indexOf(s)>=0){document.documentElement.lang=s}})()`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-gradient-to-b from-background to-muted/30">{children}</body>
    </html>
  );
}
