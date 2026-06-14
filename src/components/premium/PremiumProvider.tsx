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
  expiresAt: string | null
  deviceCount: number
  maxDevices: number
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
  expiresAt: null,
  deviceCount: 0,
  maxDevices: 3,
})

const STORAGE_KEY = "cortex:license-key"
const PREMIUM_KEY = "cortex:premium"
const REVALIDATE_MS = 5 * 60 * 1000 // re-validate at most every 5 min in background
const CACHE_VERSION = 2 // bump to invalidate all old caches
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
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [deviceCount, setDeviceCount] = useState(0)
  const [maxDevices, setMaxDevices] = useState(3)

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
        // Bump cache version → discard stale caches that lack fields
        if (data.version === CACHE_VERSION) {
          // Restore cached state immediately so UI is never blank
          setIsPremium(true)
          setLicenseKey(cachedKey)
          setExpiresAt(data.expiresAt ?? null)
          setDeviceCount(data.deviceCount ?? 0)
          setMaxDevices(data.maxDevices ?? 3)
        }
      } catch { /* ignore — will re-fetch from server */ }
    }

    // Always revalidate with server in background (stale-while-revalidate).
    // Skips server call if we just revalidated within REVALIDATE_MS.
    if (cachedKey) {
      try {
        const data = JSON.parse(localStorage.getItem(PREMIUM_KEY) ?? "null")
        if (data?.version === CACHE_VERSION && Date.now() - data.timestamp < REVALIDATE_MS) {
          setIsLoading(false)
          return // cache is still fresh enough
        }
      } catch { /* ignore */ }
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
        setExpiresAt(data.license?.expiresAt ?? null)
        setDeviceCount(data.device?.deviceCount ?? 0)
        setMaxDevices(data.device?.maxDevices ?? 3)
        // Cache the premium status with full metadata
        localStorage.setItem(PREMIUM_KEY, JSON.stringify({ version: CACHE_VERSION, timestamp: Date.now(), expiresAt: data.license?.expiresAt ?? null, deviceCount: data.device?.deviceCount ?? 0, maxDevices: data.device?.maxDevices ?? 3 }))
        localStorage.setItem(STORAGE_KEY, key)
        // Background revalidation: don't show device_limit as error — key is valid, premium works
        setError(null)
      } else {
        setIsPremium(false)
        setLicenseKey(null)
        setExpiresAt(null)
        setDeviceCount(0)
        localStorage.removeItem(PREMIUM_KEY)
        localStorage.removeItem(STORAGE_KEY)
        if (data.reason === "not_found") {
          setError("License Key 无效。")
        } else if (data.reason === "expired") {
          setError("License Key 已过期。")
        } else if (data.reason === "inactive") {
          setError("License Key 已失效。")
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
        setExpiresAt(data.license?.expiresAt ?? null)
        setDeviceCount(data.device?.deviceCount ?? 0)
        setMaxDevices(data.device?.maxDevices ?? 3)
        localStorage.setItem(PREMIUM_KEY, JSON.stringify({ version: CACHE_VERSION, timestamp: Date.now(), expiresAt: data.license?.expiresAt ?? null, deviceCount: data.device?.deviceCount ?? 0, maxDevices: data.device?.maxDevices ?? 3 }))
        localStorage.setItem(STORAGE_KEY, key)

        // Device limit hit: key is valid but this device wasn't registered
        if (data.device?.reason === "device_limit") {
          setError("此设备未绑定（已达设备上限）。请在其他设备上解除绑定后再试。")
          setIsLoading(false)
          return false
        }

        // Trigger initial cloud sync in background
        performSync(key).then(() => setLastSyncAt(Date.now())).catch(() => {})

        setIsLoading(false)
        return true
      } else {
        if (data.reason === "not_found") {
          setError("License Key 无效，请检查后重试。")
        } else if (data.reason === "expired") {
          setError("License Key 已过期。")
        } else if (data.reason === "inactive") {
          setError("License Key 已失效。")
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
    setExpiresAt(null)
    setDeviceCount(0)
    localStorage.removeItem(PREMIUM_KEY)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <PremiumContext.Provider
      value={{ isPremium, licenseKey, isLoading, error, activateLicense, clearLicense, syncNow, lastSyncAt, expiresAt, deviceCount, maxDevices }}
    >
      {children}
    </PremiumContext.Provider>
  )
}
