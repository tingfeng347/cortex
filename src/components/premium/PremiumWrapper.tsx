"use client"

import { type ReactNode } from "react"
import { PremiumProvider } from "@/components/premium/PremiumProvider"

export function PremiumWrapper({ children }: { children: ReactNode }) {
  return <PremiumProvider>{children}</PremiumProvider>
}
