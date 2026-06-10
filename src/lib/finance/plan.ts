import type { Household } from "./types";

// Free tier limits — generous enough to be useful, capped enough to convert.
export const FREE_AI_MONTHLY_LIMIT = 15;

export const PLANS = {
  free: {
    name: "Free",
    price: "$0",
    blurb: "Everything to get organized.",
    features: [
      "Manual accounts, paychecks & expenses",
      "Debt-killer & savings goal",
      "Credit & investment tracking",
      `${FREE_AI_MONTHLY_LIMIT} AI advisor messages / month`,
    ],
  },
  plus: {
    name: "Cadence Plus",
    price: "$7.99",
    blurb: "The full private-bank experience.",
    features: [
      "Unlimited AI advisor",
      "Automatic bank sync (Plaid)",
      "Subscription & recurring-bill detection",
      "Priority projections & insights",
      "Everything in Free",
    ],
  },
} as const;

export function isPlus(household: Pick<Household, "plan" | "plan_status">): boolean {
  return (
    household.plan === "plus" &&
    (household.plan_status === "active" || household.plan_status === "trialing" || household.plan_status == null)
  );
}
