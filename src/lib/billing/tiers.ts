import type { EmployeeKey } from "@/lib/ai/provider";

export type TierId = "free" | "pro" | "enterprise";
export type ModelCeiling = "haiku" | "sonnet" | "opus";

export interface TierConfig {
  id: TierId;
  name: string;
  monthlyPriceCents: number;
  monthlyTokenAllowance: number;
  modelCeiling: ModelCeiling;
  allowedEmployees: EmployeeKey[];
  features: {
    creatorMode?: boolean;
    priorityRouting?: boolean;
    multiUser?: boolean;
    dedicatedPhone?: boolean;
  };
  // Stripe price ID — set via env var or system_config so live/test keys can swap.
  stripePriceIdEnv?: string;
}

// Source-of-truth tier definitions. The conduit_pricing_tiers table mirrors
// these for UI / RLS but the runtime checks read from this config.
export const TIERS: Record<TierId, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceCents: 0,
    monthlyTokenAllowance: 50_000,
    modelCeiling: "haiku",
    allowedEmployees: ["jarvis", "marketing"],
    features: { creatorMode: false },
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceCents: 2_900,
    monthlyTokenAllowance: 1_000_000,
    modelCeiling: "sonnet",
    allowedEmployees: ["jarvis", "marketing", "sales", "engineering"],
    features: { creatorMode: false, priorityRouting: true },
    stripePriceIdEnv: "STRIPE_PRICE_PRO_MONTHLY",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceCents: 19_900,
    monthlyTokenAllowance: 5_000_000,
    modelCeiling: "opus",
    allowedEmployees: ["jarvis", "marketing", "sales", "engineering"],
    features: {
      creatorMode: true,
      priorityRouting: true,
      multiUser: true,
      dedicatedPhone: true,
    },
    stripePriceIdEnv: "STRIPE_PRICE_ENTERPRISE_MONTHLY",
  },
};

export const ORDERED_TIERS: TierConfig[] = [
  TIERS.free,
  TIERS.pro,
  TIERS.enterprise,
];

export interface TopupOption {
  id: "topup_10" | "topup_25" | "topup_50";
  amountCents: number;
  tokensGranted: number;
  label: string;
  stripePriceIdEnv: string;
}

export const TOPUPS: TopupOption[] = [
  {
    id: "topup_10",
    amountCents: 1000,
    tokensGranted: 500_000,
    label: "$10 → 500k tokens",
    stripePriceIdEnv: "STRIPE_PRICE_TOPUP_10",
  },
  {
    id: "topup_25",
    amountCents: 2500,
    tokensGranted: 1_500_000,
    label: "$25 → 1.5M tokens",
    stripePriceIdEnv: "STRIPE_PRICE_TOPUP_25",
  },
  {
    id: "topup_50",
    amountCents: 5000,
    tokensGranted: 3_500_000,
    label: "$50 → 3.5M tokens",
    stripePriceIdEnv: "STRIPE_PRICE_TOPUP_50",
  },
];

export function tierById(id: string | null | undefined): TierConfig {
  if (!id) return TIERS.free;
  return (TIERS as Record<string, TierConfig | undefined>)[id] ?? TIERS.free;
}

export function topupById(id: string): TopupOption | undefined {
  return TOPUPS.find((t) => t.id === id);
}

export function modelExceedsCeiling(
  model: string,
  ceiling: ModelCeiling,
): boolean {
  const rank: Record<string, number> = {
    haiku: 1,
    sonnet: 2,
    opus: 3,
  };
  let modelRank = 0;
  if (model.includes("haiku")) modelRank = 1;
  else if (model.includes("sonnet")) modelRank = 2;
  else if (model.includes("opus")) modelRank = 3;
  return modelRank > rank[ceiling];
}

export function ceilingDowngrade(ceiling: ModelCeiling): string {
  if (ceiling === "haiku") return "claude-haiku-4-5-20251001";
  if (ceiling === "sonnet") return "claude-sonnet-4-20250514";
  return "claude-opus-4-7";
}
