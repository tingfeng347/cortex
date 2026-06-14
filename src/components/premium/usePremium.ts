"use client"

import { useContext } from "react"
import { PremiumContext, type PremiumState } from "./PremiumProvider"

export function usePremium(): PremiumState {
  const ctx = useContext(PremiumContext)

  // Feature flag: if premium mode is disabled, everyone is premium
  if (process.env.NEXT_PUBLIC_PREMIUM_MODE !== "true") {
    return {
      isPremium: true,
      licenseKey: null,
      isLoading: false,
      error: null,
      activateLicense: async () => true,
      clearLicense: () => {},
      syncNow: async () => {},
      lastSyncAt: null,
      expiresAt: null,
      deviceCount: 0,
      maxDevices: 3,
    }
  }

  return ctx
}
