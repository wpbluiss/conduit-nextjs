import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { HOUSEHOLD_ID } from "./constants";
import type { Snapshot } from "./types";

// Ensures the signed-in user is linked to the shared household. The finance
// app is a single shared pool, so any authenticated household user maps to the
// one seeded household. Idempotent.
export async function ensureHouseholdLink(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("fin_household_members")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) {
    await supabase
      .from("fin_household_members")
      .insert({ user_id: user.id, household_id: HOUSEHOLD_ID });
  }
  return true;
}

export async function getSnapshot(): Promise<Snapshot | null> {
  const linked = await ensureHouseholdLink();
  if (!linked) return null;
  const supabase = await createSupabaseServerClient();

  const [
    household, people, accounts, paychecks, inflows, expenses,
    debts, childSupport, payments, savingsLog, investments, creditScores,
  ] = await Promise.all([
    supabase.from("fin_household").select("*").eq("id", HOUSEHOLD_ID).single(),
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
  };
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
