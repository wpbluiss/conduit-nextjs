// Daily caps for the Engineering build path. Enforced by the
// /api/engineering/session POST handler before it starts a worker.
//
// Two caps run side by side:
//   1. Builds per UTC day — a coarse rate limit.
//   2. Spend per UTC day — a $-denominated ceiling that catches a single
//      runaway long-running build before it eats a tier's monthly budget.
//
// internal_account=true bypasses both, regardless of tier.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TierId } from "@/lib/billing/tiers";

export const DAILY_BUILD_LIMIT_BY_TIER: Record<TierId, number> = {
  free: 1,
  pro: 10,
  enterprise: Number.MAX_SAFE_INTEGER,
};

export const DAILY_SPEND_CAP_CENTS_BY_TIER: Record<TierId, number> = {
  free: 50, //   $0.50
  pro: 500, //   $5.00
  enterprise: 5_000, // $50.00
};

// Pricing model assumes Claude Sonnet 4 (the default the engineering worker's
// claude CLI runs with). If the worker's model is changed, revisit these.
export const COST_PER_M_INPUT_CENTS = 300; //  $3 / 1M input tokens
export const COST_PER_M_OUTPUT_CENTS = 1_500; // $15 / 1M output tokens

export function computeCostCents(
  inputTokens: number,
  outputTokens: number,
): number {
  const cents =
    (inputTokens / 1_000_000) * COST_PER_M_INPUT_CENTS +
    (outputTokens / 1_000_000) * COST_PER_M_OUTPUT_CENTS;
  return Math.ceil(cents);
}

export interface DailyUsage {
  buildsToday: number;
  spendCentsToday: number;
  buildsLimit: number;
  spendCapCents: number;
  unlimited: boolean;
  tier: TierId;
}

interface AccountForLimits {
  tier_id?: string | null;
  internal_account?: boolean | null;
}

function utcStartOfToday(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function loadDailyEngineeringUsage(
  supabase: SupabaseClient,
  accountId: string,
  account: AccountForLimits,
): Promise<DailyUsage> {
  const tier: TierId =
    account.tier_id === "pro"
      ? "pro"
      : account.tier_id === "enterprise"
        ? "enterprise"
        : "free";
  const internal = Boolean(account.internal_account);

  if (internal) {
    return {
      buildsToday: 0,
      spendCentsToday: 0,
      buildsLimit: Number.MAX_SAFE_INTEGER,
      spendCapCents: Number.MAX_SAFE_INTEGER,
      unlimited: true,
      tier,
    };
  }

  const buildsLimit = DAILY_BUILD_LIMIT_BY_TIER[tier];
  const spendCapCents = DAILY_SPEND_CAP_CENTS_BY_TIER[tier];

  const { data, error } = await supabase
    .from("conduit_engineering_sessions")
    .select("total_input_tokens, total_output_tokens")
    .eq("account_id", accountId)
    .gte("created_at", utcStartOfToday());

  if (error || !data) {
    return {
      buildsToday: 0,
      spendCentsToday: 0,
      buildsLimit,
      spendCapCents,
      unlimited: false,
      tier,
    };
  }
  let spend = 0;
  for (const row of data) {
    spend += computeCostCents(
      row.total_input_tokens ?? 0,
      row.total_output_tokens ?? 0,
    );
  }
  return {
    buildsToday: data.length,
    spendCentsToday: spend,
    buildsLimit,
    spendCapCents,
    unlimited: false,
    tier,
  };
}

export interface LimitDecision {
  allowed: boolean;
  reason?: "daily_builds_exhausted" | "daily_spend_exhausted";
  message?: string;
}

export function decideLimit(usage: DailyUsage): LimitDecision {
  if (usage.unlimited) return { allowed: true };
  if (usage.buildsToday >= usage.buildsLimit) {
    return {
      allowed: false,
      reason: "daily_builds_exhausted",
      message:
        usage.tier === "free"
          ? "Free plans get 1 build per day. Upgrade for 10/day."
          : `You've hit ${usage.buildsLimit} builds for today. Resets at UTC midnight.`,
    };
  }
  if (usage.spendCentsToday >= usage.spendCapCents) {
    return {
      allowed: false,
      reason: "daily_spend_exhausted",
      message: `You've hit today's $${(usage.spendCapCents / 100).toFixed(2)} build cap. Resets at UTC midnight.`,
    };
  }
  return { allowed: true };
}
