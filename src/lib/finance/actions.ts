"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getUserHouseholdId, createHousehold, joinHouseholdByCode } from "./data";

type Result = { ok: boolean; error?: string; id?: string };

// -------- Onboarding (multi-tenant) --------
export async function onboardCreateHousehold(form: FormData): Promise<Result> {
  const res = await createHousehold({
    name: str(form.get("name"), "My Household"),
    savingsGoal: num(form.get("savings_goal"), 10000),
    monthlyTarget: num(form.get("monthly_savings_target"), 1000),
    targetDate: str(form.get("goal_target_date")) || null,
  });
  refresh();
  return res;
}

export async function onboardJoinHousehold(form: FormData): Promise<Result> {
  const res = await joinHouseholdByCode(str(form.get("code")));
  refresh();
  return res;
}

async function db() {
  await getUserHouseholdId();
  return createSupabaseServerClient();
}

function refresh() {
  revalidatePath("/finance", "layout");
}

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = parseFloat(String(v ?? ""));
  return isNaN(n) ? fallback : n;
}
function str(v: FormDataEntryValue | null, fallback = ""): string {
  const s = String(v ?? "").trim();
  return s || fallback;
}

// -------- Auth helpers --------
export async function linkHousehold(): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };
  await getUserHouseholdId();
  return { ok: true };
}

// -------- Accounts --------
export async function addAccount(form: FormData): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_accounts").insert({
    household_id: (await getUserHouseholdId())!,
    name: str(form.get("name"), "Account"),
    type: str(form.get("type"), "checking"),
    balance: num(form.get("balance")),
    credit_limit: form.get("credit_limit") ? num(form.get("credit_limit")) : null,
    apr: form.get("apr") ? num(form.get("apr")) : null,
    owner_tag: str(form.get("owner_tag"), "shared"),
    institution: str(form.get("institution")) || null,
    notes: str(form.get("notes")) || null,
  });
  refresh();
  return { ok: !error, error: error?.message };
}

export async function updateAccountBalance(id: string, balance: number): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase
    .from("fin_accounts")
    .update({ balance, updated_at: new Date().toISOString() })
    .eq("id", id);
  refresh();
  return { ok: !error, error: error?.message };
}

export async function deleteAccount(id: string): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_accounts").delete().eq("id", id);
  refresh();
  return { ok: !error, error: error?.message };
}

// -------- Paychecks --------
export async function addPaycheck(form: FormData): Promise<Result> {
  const supabase = await db();
  const tag = str(form.get("person_tag"), "shared");
  const { error } = await supabase.from("fin_paychecks").insert({
    household_id: (await getUserHouseholdId())!,
    person_tag: tag,
    job: str(form.get("job")) || null,
    pay_date: str(form.get("pay_date")) || new Date().toISOString().slice(0, 10),
    gross: num(form.get("gross")),
    take_home: num(form.get("take_home")),
    mileage_reimbursement: num(form.get("mileage_reimbursement")),
    notes: str(form.get("notes")) || null,
  });
  refresh();
  return { ok: !error, error: error?.message };
}

// -------- Inflows --------
export async function addInflow(form: FormData): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_inflows").insert({
    household_id: (await getUserHouseholdId())!,
    person_tag: str(form.get("person_tag"), "shared"),
    date: str(form.get("date")) || new Date().toISOString().slice(0, 10),
    amount: num(form.get("amount")),
    source: str(form.get("source")) || null,
    notes: str(form.get("notes")) || null,
  });
  refresh();
  return { ok: !error, error: error?.message };
}

// -------- Expenses --------
export async function addExpense(form: FormData): Promise<Result> {
  const supabase = await db();
  const recurring = str(form.get("recurrence"), "none") !== "none";
  const { error } = await supabase.from("fin_expenses").insert({
    household_id: (await getUserHouseholdId())!,
    name: str(form.get("name"), "Expense"),
    category: str(form.get("category"), "general"),
    amount: num(form.get("amount")),
    person_tag: str(form.get("person_tag"), "shared"),
    date: str(form.get("date")) || new Date().toISOString().slice(0, 10),
    recurring,
    recurrence: str(form.get("recurrence"), "none"),
    due_day: form.get("due_day") ? Math.round(num(form.get("due_day"))) : null,
    due_date: str(form.get("due_date")) || null,
    notes: str(form.get("notes")) || null,
  });
  refresh();
  return { ok: !error, error: error?.message };
}

export async function markExpensePaid(id: string, paidDate?: string): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase
    .from("fin_expenses")
    .update({ paid: true, paid_date: paidDate || new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  refresh();
  return { ok: !error, error: error?.message };
}

export async function deleteExpense(id: string): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_expenses").delete().eq("id", id);
  refresh();
  return { ok: !error, error: error?.message };
}

// -------- Debts --------
export async function addDebt(form: FormData): Promise<Result> {
  const supabase = await db();
  const bal = num(form.get("balance"));
  const { error } = await supabase.from("fin_debts").insert({
    household_id: (await getUserHouseholdId())!,
    name: str(form.get("name"), "Debt"),
    balance: bal,
    original_balance: form.get("original_balance") ? num(form.get("original_balance")) : bal,
    apr: num(form.get("apr")),
    min_payment: num(form.get("min_payment")),
    due_day: form.get("due_day") ? Math.round(num(form.get("due_day"))) : null,
    status: str(form.get("status"), "active"),
    settle_amount: form.get("settle_amount") ? num(form.get("settle_amount")) : null,
    person_tag: str(form.get("person_tag"), "shared"),
    notes: str(form.get("notes")) || null,
  });
  refresh();
  return { ok: !error, error: error?.message };
}

export async function logDebtPayment(
  id: string, amount: number, onTime = true, name = "",
): Promise<Result> {
  const supabase = await db();
  const { data: debt } = await supabase.from("fin_debts").select("*").eq("id", id).single();
  if (!debt) return { ok: false, error: "Debt not found" };
  const newBalance = Math.max(0, Number(debt.balance) - amount);
  const status = newBalance <= 0 ? "paid" : debt.status === "past_due" ? "active" : debt.status;
  await supabase.from("fin_debts").update({ balance: newBalance, status, updated_at: new Date().toISOString() }).eq("id", id);
  const { error } = await supabase.from("fin_payments").insert({
    household_id: (await getUserHouseholdId())!, kind: "debt", ref_id: id,
    label: name || debt.name, amount, on_time: onTime,
    date: new Date().toISOString().slice(0, 10),
  });
  refresh();
  return { ok: !error, error: error?.message };
}

export async function deleteDebt(id: string): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_debts").delete().eq("id", id);
  refresh();
  return { ok: !error, error: error?.message };
}

// -------- Child support --------
export async function logChildSupportPayment(amount: number, onTime = true): Promise<Result> {
  const supabase = await db();
  const { data: cs } = await supabase.from("fin_child_support").select("*").limit(1).maybeSingle();
  if (!cs) return { ok: false, error: "No child support record" };
  const remaining = Math.max(0, Number(cs.remaining_balance) - amount);
  await supabase.from("fin_child_support").update({ remaining_balance: remaining, updated_at: new Date().toISOString() }).eq("id", cs.id);
  const { error } = await supabase.from("fin_payments").insert({
    household_id: (await getUserHouseholdId())!, kind: "child_support", ref_id: cs.id,
    label: "Child support", amount, on_time: onTime,
    date: new Date().toISOString().slice(0, 10),
  });
  refresh();
  return { ok: !error, error: error?.message };
}

export async function updateChildSupport(form: FormData): Promise<Result> {
  const supabase = await db();
  const { data: cs } = await supabase.from("fin_child_support").select("id").limit(1).maybeSingle();
  const patch = {
    monthly_amount: num(form.get("monthly_amount"), 175),
    remaining_balance: num(form.get("remaining_balance")),
    notes: str(form.get("notes")) || null,
  };
  let error;
  if (cs) {
    ({ error } = await supabase.from("fin_child_support").update(patch).eq("id", cs.id));
  } else {
    ({ error } = await supabase.from("fin_child_support").insert({ household_id: (await getUserHouseholdId())!, ...patch }));
  }
  refresh();
  return { ok: !error, error: error?.message };
}

// -------- Savings / goal --------
export async function addSavings(form: FormData): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_savings_log").insert({
    household_id: (await getUserHouseholdId())!,
    amount: num(form.get("amount")),
    date: str(form.get("date")) || new Date().toISOString().slice(0, 10),
    note: str(form.get("note")) || null,
  });
  refresh();
  return { ok: !error, error: error?.message };
}

export async function updateGoalSettings(form: FormData): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_household").update({
    savings_goal: num(form.get("savings_goal"), 75000),
    monthly_savings_target: num(form.get("monthly_savings_target"), 5000),
    goal_target_date: str(form.get("goal_target_date")) || null,
  }).eq("id", (await getUserHouseholdId())!);
  refresh();
  return { ok: !error, error: error?.message };
}

export async function updateExpectedDeposit(form: FormData): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_household").update({
    expected_next_deposit: num(form.get("expected_next_deposit")),
    expected_deposit_date: str(form.get("expected_deposit_date")) || null,
    expected_deposit_note: str(form.get("expected_deposit_note")) || null,
  }).eq("id", (await getUserHouseholdId())!);
  refresh();
  return { ok: !error, error: error?.message };
}

// -------- Investments --------
export async function addInvestment(form: FormData): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_investments").insert({
    household_id: (await getUserHouseholdId())!,
    bucket: str(form.get("bucket"), "luis"),
    ticker: str(form.get("ticker"), "VOO").toUpperCase(),
    shares: num(form.get("shares")),
    cost_basis: num(form.get("cost_basis")),
    current_price: num(form.get("current_price")),
    last_price_update: new Date().toISOString().slice(0, 10),
    notes: str(form.get("notes")) || null,
  });
  refresh();
  return { ok: !error, error: error?.message };
}

export async function logInvestmentBuy(form: FormData): Promise<Result> {
  const supabase = await db();
  const bucket = str(form.get("bucket"), "luis");
  const ticker = str(form.get("ticker"), "VOO").toUpperCase();
  const amount = num(form.get("amount"));
  const price = num(form.get("price"));
  const shares = price > 0 ? amount / price : num(form.get("shares"));

  const { data: existing } = await supabase
    .from("fin_investments").select("*")
    .eq("bucket", bucket).eq("ticker", ticker).maybeSingle();

  let investmentId = existing?.id;
  if (existing) {
    await supabase.from("fin_investments").update({
      shares: Number(existing.shares) + shares,
      cost_basis: Number(existing.cost_basis) + amount,
      current_price: price || existing.current_price,
      last_price_update: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    const { data: created } = await supabase.from("fin_investments").insert({
      household_id: (await getUserHouseholdId())!, bucket, ticker,
      shares, cost_basis: amount, current_price: price,
      last_price_update: new Date().toISOString().slice(0, 10),
    }).select("id").single();
    investmentId = created?.id;
  }

  const { error } = await supabase.from("fin_investment_txns").insert({
    household_id: (await getUserHouseholdId())!, investment_id: investmentId ?? null,
    bucket, ticker, amount, shares, price,
    date: str(form.get("date")) || new Date().toISOString().slice(0, 10),
    notes: str(form.get("notes")) || null,
  });
  refresh();
  return { ok: !error, error: error?.message };
}

export async function updateInvestmentPrice(id: string, price: number): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_investments").update({
    current_price: price, last_price_update: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  refresh();
  return { ok: !error, error: error?.message };
}

// -------- Credit scores --------
export async function addCreditScore(form: FormData): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.from("fin_credit_scores").insert({
    household_id: (await getUserHouseholdId())!,
    person_tag: str(form.get("person_tag"), "luis"),
    date: str(form.get("date")) || new Date().toISOString().slice(0, 10),
    score: Math.round(num(form.get("score"))),
    bureau: str(form.get("bureau"), "TransUnion"),
    notes: str(form.get("notes")) || null,
  });
  refresh();
  return { ok: !error, error: error?.message };
}

// ===================== Billing (Stripe) =====================
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.conduitai.io";

// Starts a Stripe Checkout session for Cadence Plus. Returns a URL to redirect to.
export async function createCheckout(): Promise<Result & { url?: string }> {
  if (!stripe || !process.env.STRIPE_PRICE_CADENCE_PLUS) {
    return { ok: false, error: "Billing isn't switched on yet — add your Stripe key + price." };
  }
  const user = await getCurrentUser();
  const hh = await getUserHouseholdId();
  if (!user || !hh) return { ok: false, error: "Not signed in" };

  const supabase = await db();
  const { data: household } = await supabase
    .from("fin_household").select("stripe_customer_id").eq("id", hh).single();

  let customerId = household?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { household_id: hh },
    });
    customerId = customer.id;
    await supabase.from("fin_household").update({ stripe_customer_id: customerId }).eq("id", hh);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: hh,
    line_items: [{ price: process.env.STRIPE_PRICE_CADENCE_PLUS, quantity: 1 }],
    success_url: `${SITE_URL}/finance/upgrade?status=success`,
    cancel_url: `${SITE_URL}/finance/upgrade?status=cancelled`,
    allow_promotion_codes: true,
    metadata: { household_id: hh },
  });
  return { ok: true, url: session.url ?? undefined };
}

// Opens the Stripe customer portal so the user can manage/cancel their plan.
export async function openBillingPortal(): Promise<Result & { url?: string }> {
  if (!stripe) return { ok: false, error: "Billing isn't switched on yet." };
  const hh = await getUserHouseholdId();
  if (!hh) return { ok: false, error: "Not signed in" };
  const supabase = await db();
  const { data: household } = await supabase
    .from("fin_household").select("stripe_customer_id").eq("id", hh).single();
  if (!household?.stripe_customer_id) return { ok: false, error: "No billing account yet." };
  const session = await stripe.billingPortal.sessions.create({
    customer: household.stripe_customer_id as string,
    return_url: `${SITE_URL}/finance/settings`,
  });
  return { ok: true, url: session.url };
}

// Deletes the caller's account data (and the household if they're the last member).
export async function deleteMyAccount(): Promise<Result> {
  const supabase = await db();
  const { error } = await supabase.rpc("fin_delete_my_account");
  return { ok: !error, error: error?.message };
}
