"use client"

import { createContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { performSync } from "@/lib/sync/sync-engine"

export interface PremiumState {
  isPremium: boolean
  licenseKey: string | null
  isLoading: boolean
  error: string | null
  activateLicense: (key: string) => Promise<boolean>
  clearLicense: () => void
  syncNow: () => Promise<void>
  lastSyncAt: number | null
}

export const PremiumContext = createContext<PremiumState>({
  isPremium: false,
  licenseKey: null,
  isLoading: true,
  error: null,
  activateLicense: async () => false,
  clearLicense: () => {},
  syncNow: async () => {},
  lastSyncAt: null,
})

const STORAGE_KEY = "cortex:license-key"
const PREMIUM_KEY = "cortex:premium"
const REVALIDATE_MS = 24 * 60 * 60 * 1000 // re-validate every 24h
const DEVICE_ID_KEY = "cortex:device-id"

function generateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const id = "dev_" + crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false)
  const [licenseKey, setLicenseKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null)

  const syncNow = useCallback(async () => {
    if (!licenseKey) return
    try {
      await performSync(licenseKey)
      setLastSyncAt(Date.now())
    } catch { /* background sync, silent fail */ }
  }, [licenseKey])

  // Check cached premium status on mount
  useEffect(() => {
    const cached = localStorage.getItem(PREMIUM_KEY)
    const cachedKey = localStorage.getItem(STORAGE_KEY)

    if (cached && cachedKey) {
      try {
        const data = JSON.parse(cached)
        // If cache is still fresh, trust it
        if (Date.now() - data.timestamp < REVALIDATE_MS) {
          setIsPremium(true)
          setLicenseKey(cachedKey)
          setIsLoading(false)
          return
        }
      } catch { /* ignore */ }
    }

    // If we have a key but no fresh cache, validate with server
    if (cachedKey) {
      validateWithServer(cachedKey)
    } else {
      setIsLoading(false)
    }
  }, [])

  const validateWithServer = useCallback(async (key: string) => {
    try {
      const deviceId = generateDeviceId()
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key, deviceId }),
      })
      const data = await res.json()

      if (data.valid) {
        setIsPremium(true)
        setLicenseKey(key)
        setError(null)
        // Cache the premium status
        localStorage.setItem(PREMIUM_KEY, JSON.stringify({ timestamp: Date.now() }))
        localStorage.setItem(STORAGE_KEY, key)
      } else {
        setIsPremium(false)
        setLicenseKey(null)
        localStorage.removeItem(PREMIUM_KEY)
        localStorage.removeItem(STORAGE_KEY)
        if (data.device?.reason === "device_limit") {
          setError("已达到设备上限（3台）。请在其他设备上解除绑定后再试。")
        } else if (data.reason === "not_found") {
          setError("License Key 无效。")
        }
      }
    } catch {
      setError("无法验证 License，请稍后重试。")
    }
    setIsLoading(false)
  }, [])

  const activateLicense = useCallback(async (key: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const deviceId = generateDeviceId()
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key, deviceId }),
      })
      const data = await res.json()

      if (data.valid) {
        setIsPremium(true)
        setLicenseKey(key)
        localStorage.setItem(PREMIUM_KEY, JSON.stringify({ timestamp: Date.now() }))
        localStorage.setItem(STORAGE_KEY, key)

        // Trigger initial cloud sync in background
        performSync(key).then(() => setLastSyncAt(Date.now())).catch(() => {})

        setIsLoading(false)
        return true
      } else {
        if (data.device?.reason === "device_limit") {
          setError("已达到设备上限（3台）。请在其他设备上解除绑定后再试。")
        } else if (data.reason === "not_found") {
          setError("License Key 无效，请检查后重试。")
        } else {
          setError("激活失败，请稍后重试。")
        }
        setIsLoading(false)
        return false
      }
    } catch {
      setError("无法连接服务器，请稍后重试。")
      setIsLoading(false)
      return false
    }
  }, [])

  const clearLicense = useCallback(() => {
    setIsPremium(false)
    setLicenseKey(null)
    setError(null)
    localStorage.removeItem(PREMIUM_KEY)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <PremiumContext.Provider
      value={{ isPremium, licenseKey, isLoading, error, activateLicense, clearLicense, syncNow, lastSyncAt }}
    >
      {children}
    </PremiumContext.Provider>
  )
}
