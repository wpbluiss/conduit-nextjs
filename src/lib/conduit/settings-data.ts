import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getOrCreateAccount } from "@/lib/conduit/account";

interface UsageRow {
  employee: string;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_cents: number | null;
  created_at: string;
}

export async function loadSettingsData(
  supabase: SupabaseClient,
  user: User,
) {
  const account = await getOrCreateAccount(supabase, user);
  const cycleStart = new Date(account.billing_cycle_start);

  const [{ data: usage }, { count: buildsThisCycle }] = await Promise.all([
    supabase
      .from("conduit_usage_events")
      .select(
        "employee, input_tokens, output_tokens, estimated_cost_cents, created_at",
      )
      .eq("account_id", account.id)
      .gte("created_at", cycleStart.toISOString())
      .order("created_at", { ascending: true })
      .limit(5000),
    supabase
      .from("conduit_builds")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account.id)
      .gte("created_at", cycleStart.toISOString()),
  ]);

  const rows: UsageRow[] = (usage ?? []) as UsageRow[];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const accumulate = (filter: (r: UsageRow) => boolean) =>
    rows.filter(filter).reduce(
      (acc, r) => {
        acc.input += r.input_tokens ?? 0;
        acc.output += r.output_tokens ?? 0;
        acc.cost += r.estimated_cost_cents ?? 0;
        return acc;
      },
      { input: 0, output: 0, cost: 0 },
    );

  const totals = accumulate(() => true);
  const today = accumulate((r) => new Date(r.created_at) >= startOfToday);
  const thisWeek = accumulate((r) => new Date(r.created_at) >= startOfWeek);

  const byEmployee = rows.reduce(
    (acc, r) => {
      const k = r.employee;
      if (!acc[k]) acc[k] = { input: 0, output: 0, cost: 0 };
      acc[k].input += r.input_tokens ?? 0;
      acc[k].output += r.output_tokens ?? 0;
      acc[k].cost += r.estimated_cost_cents ?? 0;
      return acc;
    },
    {} as Record<string, { input: number; output: number; cost: number }>,
  );

  const byDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of rows) {
    const d = new Date(r.created_at).toISOString().slice(0, 10);
    if (d in byDay)
      byDay[d] = byDay[d] + (r.input_tokens ?? 0) + (r.output_tokens ?? 0);
  }

  const cycleResetDate = account.billing_cycle_start
    ? new Date(
        new Date(account.billing_cycle_start).getTime() +
          30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return {
    account: {
      id: account.id,
      name: account.name,
      business_type: account.business_type ?? "",
      business_description: account.business_description ?? "",
      creator_mode: account.creator_mode,
      creator_mode_version: account.creator_mode_version,
      tier_id: account.tier_id,
      subscription_status: account.subscription_status,
      bonus_tokens: account.bonus_tokens,
      internal_account: account.internal_account,
      has_stripe_customer: Boolean(account.stripe_customer_id),
      billing_cycle_start: account.billing_cycle_start,
      account_created_at: account.created_at,
      timezone: account.timezone,
      theme_preference: account.theme_preference ?? "system",
      display_name: account.display_name ?? null,
      avatar_url: account.avatar_url ?? null,
      accent_preference: account.accent_preference ?? null,
      company_brief: account.company_brief ?? null,
    },
    usage: {
      totals,
      today,
      thisWeek,
      byEmployee,
      byDay,
      cap: {
        used: account.monthly_tokens_used,
        limit: account.monthly_token_cap,
      },
      buildsThisCycle: buildsThisCycle ?? 0,
      cycleResetDate,
    },
    fullName: (user.user_metadata?.full_name as string) ?? "",
    email: user.email ?? "",
  };
}
