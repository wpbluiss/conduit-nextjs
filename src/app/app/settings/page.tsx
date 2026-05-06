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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usage } = await supabase
    .from("conduit_usage_events")
    .select("employee, input_tokens, output_tokens, estimated_cost_cents, created_at")
    .eq("account_id", account.id)
    .gte("created_at", startOfMonth.toISOString())
    .order("created_at", { ascending: true })
    .limit(2000);

  const rows: UsageRow[] = (usage ?? []) as UsageRow[];

  const totals = rows.reduce(
    (acc, r) => {
      acc.input += r.input_tokens ?? 0;
      acc.output += r.output_tokens ?? 0;
      acc.cost += r.estimated_cost_cents ?? 0;
      return acc;
    },
    { input: 0, output: 0, cost: 0 },
  );

  // By employee
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

  // By day
  const byDay = rows.reduce(
    (acc, r) => {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      acc[d] = (acc[d] ?? 0) + (r.input_tokens ?? 0) + (r.output_tokens ?? 0);
      return acc;
    },
    {} as Record<string, number>,
  );

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
          }}
          usage={{ totals, byEmployee, byDay }}
        />
      </div>
    </div>
  );
}
