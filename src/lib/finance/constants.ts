// Single shared household for Luis & Delia. Seeded in Supabase.
export const HOUSEHOLD_ID = "11111111-1111-4111-8111-111111111111";

export const PEOPLE = {
  luis: { id: "22222222-2222-4222-8222-222222222222", name: "Luis", color: "#7C5CFF" },
  delia: { id: "33333333-3333-4333-8333-333333333333", name: "Delia", color: "#22D3EE" },
  daughter: { id: "44444444-4444-4444-8444-444444444444", name: "Daughter", color: "#F472B6" },
} as const;

export const PERSON_TAGS = ["shared", "luis", "delia"] as const;

export const EXPENSE_CATEGORIES = [
  "housing", "utilities", "groceries", "transport", "gas", "childcare",
  "babysitter", "insurance", "phone", "subscriptions", "dining", "medical",
  "debt", "child_support", "infrastructure", "general",
] as const;

export const ACCOUNT_TYPES = [
  "checking", "savings", "credit_card", "cash", "investment", "other",
] as const;

export const DEBT_STATUSES = [
  "active", "past_due", "charged_off", "plan", "settle", "paid",
] as const;

export const INVESTMENT_BUCKETS = ["luis", "delia", "daughter"] as const;

export const RECURRENCES = ["none", "weekly", "biweekly", "monthly", "yearly"] as const;

// Accent palette (Linear-inspired dark base + aurora highlights)
export const ACCENT = {
  violet: "#7C5CFF",
  cyan: "#22D3EE",
  pink: "#F472B6",
  green: "#34D399",
  amber: "#FBBF24",
  blue: "#60A5FA",
} as const;

export function fmtMoney(n: number, opts?: { cents?: boolean }): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  }).format(isFinite(n) ? n : 0);
}

// Display label for a person_tag. Known seed tags keep their names; any other
// tag is title-cased (so custom household members read correctly) and only an
// empty/"shared" tag falls back to "Shared".
export function personLabel(tag: string): string {
  if (!tag || tag === "shared") return "Shared";
  if (tag === "luis") return "Luis";
  if (tag === "delia") return "Delia";
  if (tag === "daughter") return "Daughter";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}
