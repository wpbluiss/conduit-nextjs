"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { createHousehold } from "@/lib/finance/data";

type Result = { ok: boolean; error?: string };

export async function createHouseholdAction(form: FormData): Promise<Result> {
  const name = String(form.get("name") ?? "").trim() || "My Household";
  const savingsGoal = parseFloat(String(form.get("savings_goal") ?? "")) || 0;
  const monthlyTarget = parseFloat(String(form.get("monthly_target") ?? "")) || 0;
  const targetDate = String(form.get("target_date") ?? "").trim() || null;

  const res = await createHousehold({ name, savingsGoal, monthlyTarget, targetDate });
  if (!res.ok) return res;

  // Optional first account (step 4)
  const accountName = String(form.get("account_name") ?? "").trim();
  const accountBalance = parseFloat(String(form.get("account_balance") ?? ""));
  if (accountName && !isNaN(accountBalance)) {
    const user = await getCurrentUser();
    if (user && res.id) {
      const supabase = await createSupabaseServerClient();
      await supabase.from("fin_accounts").insert({
        household_id: res.id,
        name: accountName,
        type: "checking",
        balance: accountBalance,
      });
    }
  }

  revalidatePath("/app", "layout");
  revalidatePath("/onboarding");
  return { ok: true };
}
