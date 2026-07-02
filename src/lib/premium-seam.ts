/**
 * Premium integration seam — server/logic layer.
 *
 * ── main branch (this file): no-op stubs. ──
 * The OSS app is free, local-only, with no cooldown, no cloud sync, no
 * license, and no payment. `usePremium` (client seam) returns isPremium=true
 * for everyone, so the free-test limit / cooldown branches in core files are
 * never taken and these functions are effectively unreachable — they exist
 * only to satisfy imports so core files stay identical to the dev branch.
 *
 * ── dev branch: real implementation. ──
 * Re-exports cloud sync / license from ./sync and ./auth, and implements the
 * free-test limit. (This file is replaced in dev.)
 */

// Local profile storage — shared (identical in both branches).
import type { StoredAbilityProfile } from "./profile-local";
export { loadProfile, saveProfile, clearProfile, type StoredAbilityProfile } from "./profile-local";

// ─── Cloud sync — no-op (OSS is local-only) ───
// Signatures mirror the dev branch so call sites are identical.

export async function uploadProfile(
  _licenseKey: string,
  _profile: StoredAbilityProfile,
): Promise<boolean> {
  return false;
}
export async function downloadProfile(_licenseKey: string): Promise<StoredAbilityProfile | null> {
  return null;
}
export async function performSync(
  _licenseKey: string,
): Promise<{ uploaded: number; downloaded: number; merged: never[] }> {
  return { uploaded: 0, downloaded: 0, merged: [] };
}

// ─── Free-test limit — no-op (OSS: no cooldown, unlimited tests) ───

export const FREE_LIMIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_FREE_TESTS = 3;

export function getFreeTestCooldownEndsAt(): number | null {
  return null;
}
export function recordFreeTest(): void {}
export function getFreeTestUsedCount(): number {
  return 0;
}
export function clearFreeTestTimestamps(): void {}

// ─── License validation — no-op (OSS has no license) ───

export async function validateLicenseBeforeStart(_licenseKey: string): Promise<boolean> {
  return true;
}
