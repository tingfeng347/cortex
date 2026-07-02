"use client";

/**
 * Premium integration seam — client UI layer.
 *
 * ── main branch (this file): no-op stubs. ──
 * Every premium/monetization UI renders nothing. `usePremium` reports
 * everyone as a (free) premium user so the cooldown / upsell branches in the
 * core files are never taken. This keeps core files identical to the dev
 * branch while the public repository contains zero monetization code.
 *
 * ── dev branch: real components re-exported from ./premium/*. ──
 * (This file is replaced in dev.)
 */

import type { ReactNode } from "react";

interface FreePremiumState {
  isPremium: boolean;
  licenseKey: string | null;
  isLoading: boolean;
  error: string | null;
  activateLicense: (key: string) => Promise<boolean>;
  clearLicense: () => void;
  syncNow: () => Promise<void>;
  lastSyncAt: number | null;
  expiresAt: string | null;
  deviceCount: number;
  maxDevices: number;
}

/** OSS: everyone is a free premium user — no cooldown, no cloud, no license. */
export function usePremium(): FreePremiumState {
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
    maxDevices: Infinity,
  };
}

/** Passthrough — no provider needed in OSS. */
export function PremiumWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// ─── Premium UI — renders nothing in OSS ───

export function PremiumBadge(): null {
  return null;
}
export function CooldownBanner(_props: { cooldownEndsAt: number; onClose: () => void }): null {
  return null;
}
export function TrendSection(_props: { result: unknown; isFirstTest: boolean }): null {
  return null;
}
export function AIInterpretSection(_props: {
  result: unknown;
  prevResult: unknown;
  isFirstTest: boolean;
}): null {
  return null;
}
export function CrossPromoSuggestions(_props: { result: unknown; isFirstTest: boolean }): null {
  return null;
}
export function CommunityBanner(): null {
  return null;
}
export function AnnouncementDialog(): null {
  return null;
}
export function ManagePremiumLink(): null {
  return null;
}
export function ExportCsvLink(): null {
  return null;
}
