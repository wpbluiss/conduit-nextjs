import type { ProviderName } from "./provider";

// Per-million-token prices (USD). Source: Anthropic public pricing.
// Cached read = 10% of base input. Cache write = 125% of base input.
const TABLE: Record<
  string,
  { input: number; output: number }
> = {
  "claude-opus-4-7": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};

export function estimateCostCents(
  _provider: ProviderName,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens = 0,
  cacheCreationTokens = 0,
): number {
  const row = TABLE[model] ?? { input: 3, output: 15 };
  // input_tokens from the SDK already excludes cached reads/writes.
  const dollars =
    (inputTokens / 1_000_000) * row.input +
    (outputTokens / 1_000_000) * row.output +
    (cacheReadTokens / 1_000_000) * row.input * 0.1 +
    (cacheCreationTokens / 1_000_000) * row.input * 1.25;
  return Math.round(dollars * 100);
}
