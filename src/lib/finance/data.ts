import { cache } from "react";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import type { Snapshot } from "./types";
import { fetchLivePrices } from "./prices";

// The household id owned by the signed-in user (null if they haven't created
// or joined one yet — which sends them to onboarding). Cached per request.
export const getUserHouseholdId = cache(async function (): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("fin_household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.household_id ?? null;
});

function genJoinCode(): string {
  return Array.from({ length: 6 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");
}

// Creates a brand-new household for the current user (onboarding). Generates
// the id client-side so we never need a RLS-blocked returning-select.
export async function createHousehold(opts: {
  name: string;
  savingsGoal: number;
  monthlyTarget: number;
  targetDate: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const supabase = await createSupabaseServerClient();

  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const { error: hErr } = await supabase.from("fin_household").insert({
    id,
    name: opts.name || "My Household",
    savings_goal: opts.savingsGoal || 10000,
    monthly_savings_target: opts.monthlyTarget || 1000,
    goal_start_date: new Date().toISOString().slice(0, 10),
    goal_target_date: opts.targetDate || null,
    join_code: genJoinCode(),
  });
  if (hErr) return { ok: false, error: hErr.message };

  const { error: mErr } = await supabase
    .from("fin_household_members")
    .insert({ user_id: user.id, household_id: id });
  if (mErr) return { ok: false, error: mErr.message };

  return { ok: true, id };
}

// Join an existing household via its share code (couples).
export async function joinHouseholdByCode(
  code: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("fin_join_household", {
    p_code: code.trim().toUpperCase(),
  });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No household found for that code." };
  return { ok: true, id: data as string };
}

export async function getSnapshot(): Promise<Snapshot | null> {
  const hh = await getUserHouseholdId();
  if (!hh) return null;
  const supabase = await createSupabaseServerClient();

  const [
    household, people, accounts, paychecks, inflows, expenses,
    debts, childSupport, payments, savingsLog, investments, creditScores, vaults,
  ] = await Promise.all([
    supabase.from("fin_household").select("*").eq("id", hh).single(),
    supabase.from("fin_people").select("*").order("role"),
    supabase.from("fin_accounts").select("*").order("created_at"),
    supabase.from("fin_paychecks").select("*").order("pay_date", { ascending: false }),
    supabase.from("fin_inflows").select("*").order("date", { ascending: false }),
    supabase.from("fin_expenses").select("*").order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("fin_debts").select("*").order("balance", { ascending: true }),
    supabase.from("fin_child_support").select("*").limit(1).maybeSingle(),
    supabase.from("fin_payments").select("*").order("date", { ascending: false }).limit(200),
    supabase.from("fin_savings_log").select("*").order("date", { ascending: true }),
    supabase.from("fin_investments").select("*").order("bucket"),
    supabase.from("fin_credit_scores").select("*").order("date", { ascending: true }),
    supabase.from("fin_vaults").select("*").order("sort", { ascending: true }),
  ]);

  if (!household.data) return null;

  return {
    household: household.data,
    people: people.data ?? [],
    accounts: accounts.data ?? [],
    paychecks: paychecks.data ?? [],
    inflows: inflows.data ?? [],
    expenses: expenses.data ?? [],
    debts: debts.data ?? [],
    childSupport: childSupport.data ?? null,
    payments: payments.data ?? [],
    savingsLog: savingsLog.data ?? [],
    investments: investments.data ?? [],
    creditScores: creditScores.data ?? [],
    vaults: vaults.data ?? [],
  };
}

// Pulls live market prices for every holding and writes them back, so the
// Investments page (and net-worth) always reflect real-time value. Best-effort:
// a failed fetch leaves the prior price in place. Call before getSnapshot().
export async function refreshInvestmentPrices(): Promise<void> {
  const hh = await getUserHouseholdId();
  if (!hh) return;
  const supabase = await createSupabaseServerClient();
  const { data: holdings } = await supabase
    .from("fin_investments")
    .select("id, ticker, current_price");
  if (!holdings || holdings.length === 0) return;

  const prices = await fetchLivePrices(holdings.map((h) => h.ticker));
  if (Object.keys(prices).length === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  await Promise.all(
    holdings.map((h) => {
      const p = prices[h.ticker.toUpperCase()];
      if (!p || p <= 0) return Promise.resolve(undefined);
      return supabase
        .from("fin_investments")
        .update({ current_price: p, last_price_update: today })
        .eq("id", h.id)
        .then(() => undefined);
    }),
  );
}

export async function getAiMessages(limit = 40) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("fin_ai_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);
  return data ?? [];
}

// Records today's net worth (once/day) and returns the recent history for charting.
export async function recordAndGetNetWorth(snapshot: {
  net_worth: number; cash: number; debt: number; investments: number;
}): Promise<{ date: string; value: number }[]> {
  const hh = await getUserHouseholdId();
  if (!hh) return [];
  const supabase = await createSupabaseServerClient();
  await supabase.from("fin_networth_snapshots").upsert(
    {
      household_id: hh,
      date: new Date().toISOString().slice(0, 10),
      net_worth: Math.round(snapshot.net_worth),
      cash: Math.round(snapshot.cash),
      debt: Math.round(snapshot.debt),
      investments: Math.round(snapshot.investments),
    },
    { onConflict: "household_id,date" },
  );
  const { data } = await supabase
    .from("fin_networth_snapshots")
    .select("date, net_worth")
    .order("date", { ascending: true })
    .limit(60);
  return (data ?? []).map((r) => ({
    date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: Number(r.net_worth),
  }));
}
