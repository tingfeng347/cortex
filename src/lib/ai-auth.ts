/**
 * AI access gate — seam for the AI generation/interpretation routes.
 *
 *   main branch: env-key based (AI_ACCESS_KEY); no license system.
 *   dev branch:  re-exports license-based validation from ./auth/license.
 *
 * Set AI_ACCESS_KEY to require a shared bearer token on AI endpoints.
 * Leave it unset for open access (rate-limited by the daily neuron quota).
 */

const AI_ACCESS_KEY = process.env.AI_ACCESS_KEY ?? "";

/**
 * Validate an AI call. Returns `{ valid }`.
 * - If AI_ACCESS_KEY is unset: open mode, all calls allowed.
 * - If set: the bearer token must match.
 */
export async function validateAICall(
  key: string | null,
): Promise<{ valid: boolean; reason?: string }> {
  if (!AI_ACCESS_KEY) return { valid: true };
  if (!key) return { valid: false, reason: "missing_key" };
  if (key === AI_ACCESS_KEY) return { valid: true };
  return { valid: false, reason: "invalid_key" };
}

/** Count premium users for quota reservation. OSS has no premium → 0. */
export async function countPremiumForQuota(): Promise<number> {
  return 0;
}
