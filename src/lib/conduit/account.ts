import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface ConduitAccount {
  id: string;
  owner_user_id: string;
  name: string;
  business_type: string | null;
  business_description: string | null;
  creator_mode: boolean;
  monthly_token_cap: number;
  monthly_tokens_used: number;
  billing_cycle_start: string;
  created_at: string;
  updated_at: string;
}

/**
 * Returns the user's conduit account, creating a stub row if none exists.
 * Atomic: ON CONFLICT DO NOTHING avoids the 23505 race when two server-rendered
 * requests fire on first load.
 */
export async function getOrCreateAccount(
  supabase: SupabaseClient,
  user: User,
): Promise<ConduitAccount> {
  const fallbackName =
    (user.user_metadata?.business_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Your Workspace";

  // upsert is atomic — if the row already exists it's a no-op then we re-select.
  await supabase
    .from("conduit_accounts")
    .upsert(
      { owner_user_id: user.id, name: fallbackName },
      { onConflict: "owner_user_id", ignoreDuplicates: true },
    );

  const { data, error } = await supabase
    .from("conduit_accounts")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (error || !data) throw error ?? new Error("account_fetch_failed");
  return data as ConduitAccount;
}

export function userDisplayName(user: User): string {
  return (
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "there"
  );
}

export function accountIsOnboarded(account: ConduitAccount): boolean {
  return Boolean(account.business_type && account.business_description);
}

/**
 * Auto-rolls billing_cycle_start forward by 30-day windows when expired,
 * resetting monthly_tokens_used to 0.
 */
export async function rollBillingCycleIfDue(
  supabase: SupabaseClient,
  account: ConduitAccount,
): Promise<ConduitAccount> {
  const cycleStart = new Date(account.billing_cycle_start).getTime();
  const now = Date.now();
  const elapsedDays = (now - cycleStart) / (1000 * 60 * 60 * 24);
  if (elapsedDays < 30) return account;

  const { data } = await supabase
    .from("conduit_accounts")
    .update({
      monthly_tokens_used: 0,
      billing_cycle_start: new Date().toISOString(),
    })
    .eq("id", account.id)
    .select("*")
    .single();
  return (data as ConduitAccount) ?? account;
}
