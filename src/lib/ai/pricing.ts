import type { ProviderName } from "./provider";

// Per-million-token prices (USD). Source: Anthropic public pricing.
const TABLE: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};

export function estimateCostCents(
  _provider: ProviderName,
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const row = TABLE[model] ?? { input: 3, output: 15 };
  const dollars =
    (inputTokens / 1_000_000) * row.input +
    (outputTokens / 1_000_000) * row.output;
  return Math.round(dollars * 100);
}
