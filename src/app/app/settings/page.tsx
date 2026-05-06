import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { SettingsTabs } from "@/components/conduit/SettingsTabs";

export const dynamic = "force-dynamic";

interface UsageRow {
  employee: string;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_cents: number | null;
  created_at: string;
}

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const account = await getOrCreateAccount(supabase, user);

  // Window starts at billing_cycle_start (rolls every 30d) — this is
  // what counts toward the cap. UI shows monthly aggregate from same window.
  const cycleStart = new Date(account.billing_cycle_start);

  const { data: usage } = await supabase
    .from("conduit_usage_events")
    .select(
      "employee, input_tokens, output_tokens, estimated_cost_cents, created_at",
    )
    .eq("account_id", account.id)
    .gte("created_at", cycleStart.toISOString())
    .order("created_at", { ascending: true })
    .limit(5000);

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

  // Fill last 14 days (zeroes for empty days)
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

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="serif text-3xl mb-8">Settings</h1>
        <SettingsTabs
          email={user.email ?? ""}
          fullName={(user.user_metadata?.full_name as string) ?? ""}
          account={{
            id: account.id,
            name: account.name,
            business_type: account.business_type ?? "",
            business_description: account.business_description ?? "",
            creator_mode: account.creator_mode,
            creator_mode_version: account.creator_mode_version,
          }}
          usage={{
            totals,
            today,
            thisWeek,
            byEmployee,
            byDay,
            cap: {
              used: account.monthly_tokens_used,
              limit: account.monthly_token_cap,
            },
          }}
        />
      </div>
    </div>
  );
}
