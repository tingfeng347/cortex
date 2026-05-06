import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "认知防锈 · 基线测试",
  description: "你的大脑，正在被 AI 悄然重塑。5 道题快速评估你的核心认知状态。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="antialiased">
      <body className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
        {children}
      </body>
    </html>
  )
}
