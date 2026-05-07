import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://cortex.hydroroll.team"),
  icons: {
    icon: "/favicon.svg",
  },
  other: {
    "theme-color": "#1a1a1a",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
