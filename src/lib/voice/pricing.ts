// ElevenLabs Turbo v2.5 — ~$0.33 per 10k characters → 0.0033 cents/char
// (USD per char in cents).
const TURBO_V25_CENTS_PER_CHAR = 0.0033;

export function voiceCostCentsForChars(chars: number): number {
  return Math.round(chars * TURBO_V25_CENTS_PER_CHAR);
}
