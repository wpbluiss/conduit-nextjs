// USD spend formatting for the cinema stage band + shipped summary.
// Reuses the per-token cost constants in lib/engineering/limits.ts so the
// cinema's running tally matches what gets enforced by daily caps.
//
// Pre-commit estimate (estimateSpend) is Phase C territory — only the
// signature is exported here; the heuristic implementation lands with US7.

import {
  COST_PER_M_INPUT_CENTS,
  COST_PER_M_OUTPUT_CENTS,
  computeCostCents,
} from "@/lib/engineering/limits";

/**
 * Actual spend in cents, given running input + output token counts.
 * Mirrors limits.ts computeCostCents — re-exported here so the cinema
 * has one symbol to import for "the spend tally".
 */
export function actualSpendCents(
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined,
): number {
  return computeCostCents(inputTokens ?? 0, outputTokens ?? 0);
}

/** USD-formatted string for cinema display. Always 2 decimal places. */
export function formatSpendUsd(cents: number): string {
  if (cents < 1) return "$0.00";
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/** Pre-commit estimate range — Phase C. Returns null in Phase A. */
export function estimateSpendCents(_args: {
  promptLength: number;
  buildType: string | null;
}): { minCents: number; maxCents: number } | null {
  // Implementation deferred to Phase C (US7).
  return null;
}

// Re-export the constants so consumers don't need to reach into limits.ts.
export { COST_PER_M_INPUT_CENTS, COST_PER_M_OUTPUT_CENTS };
