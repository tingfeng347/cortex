import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "认知防锈 | 你的大脑正在被 AI 重塑吗？",
  description: "测测你是不是被AI变成了笨蛋。5 道题快速评估你的核心认知状态，看看全平台有多少人比你强。",
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
