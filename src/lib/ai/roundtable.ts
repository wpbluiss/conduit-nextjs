// R9 round-table mode — multiple employees respond in parallel, Jarvis
// synthesizes at the end. Heuristic + explicit Team pin both route here.

import type { EmployeeKey } from "./provider";

const TEAM_PHRASES = [
  /\beveryone\b/,
  /\bthe team\b/,
  /\bevery department\b/,
  /\bround.?table\b/,
  /\bweigh in\b/,
  /\bteam standup\b/,
  /\bteam meeting\b/,
  /\beach of you\b/,
  /\beach department\b/,
  /\beach employee\b/,
  /\bintro yourselves\b/,
  /\bwhat does each (team|department|employee) think\b/,
];

export function isTeamQuery(message: string): boolean {
  const m = message.toLowerCase();
  return TEAM_PHRASES.some((re) => re.test(m));
}

/**
 * Cap on parallel employees per round-table call.
 *  - Free / Pro tiers max out at 4 (the launch four minus Jarvis = 3, fine)
 *  - Enterprise / internal: 8 (all 9 minus Jarvis)
 */
export function maxParallel(tierId: string, internalAccount: boolean): number {
  if (internalAccount || tierId === "enterprise") return 8;
  return 4;
}

/**
 * Per-account rate limit. 1 round-table per minute. In-memory Map — fine for
 * single-region prod; tighten to Redis if we go multi-region.
 */
const lastFire = new Map<string, number>();
const COOLDOWN_MS = 60_000;

export function checkRateLimit(accountId: string): {
  ok: boolean;
  retryInSeconds: number;
} {
  const last = lastFire.get(accountId);
  const now = Date.now();
  if (last && now - last < COOLDOWN_MS) {
    return {
      ok: false,
      retryInSeconds: Math.ceil((COOLDOWN_MS - (now - last)) / 1000),
    };
  }
  lastFire.set(accountId, now);
  // Best-effort cleanup so the Map doesn't grow unbounded.
  if (lastFire.size > 500) {
    const cutoff = now - COOLDOWN_MS * 5;
    for (const [k, v] of lastFire.entries()) {
      if (v < cutoff) lastFire.delete(k);
    }
  }
  return { ok: true, retryInSeconds: 0 };
}

export function selectParticipants(
  allowed: EmployeeKey[],
  internalAccount: boolean,
  tierId: string,
): EmployeeKey[] {
  const cap = maxParallel(tierId, internalAccount);
  return allowed
    .filter((e) => e !== "jarvis")
    .slice(0, cap);
}

export function roundTableBrief(userMessage: string, userName: string): string {
  return `Brief team-wide question from ${userName}: "${userMessage}"

Respond in 2-3 sentences MAX from your department's lens. Be specific. No preamble. No greeting. Lead with the take.`;
}

export function synthesisBrief(
  userMessage: string,
  responses: { employee: EmployeeKey; content: string }[],
): string {
  const block = responses
    .map((r) => `[${r.employee.toUpperCase()}]: ${r.content}`)
    .join("\n\n");
  return `The team weighed in on the user's question.

User: "${userMessage}"

Team responses:
${block}

Synthesize the team's input into a clear next-step recommendation in 3-5 sentences. Don't repeat what each said — pull the through-line and tell the user what to do next. Lead with action.`;
}
