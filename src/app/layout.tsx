import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { cookies } from "next/headers"

export const metadata: Metadata = {
  metadataBase: new URL("https://cortex.hydroroll.team"),
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "zh-CN"

  return (
    <html lang={locale} className="antialiased" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('cortex-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
        {children}
      </body>
    </html>
  )
}
