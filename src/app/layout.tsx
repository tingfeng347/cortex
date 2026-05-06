import type { Metadata } from "next"
import "./globals.css"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "认知防锈 | 你的认知状态怎么样？",
  description: "5 道题给你的认知能力拍一张快照。定期测量，看清趋势——认知能力就像肌肉，用进废退。",
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('cortex-theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  )
}
