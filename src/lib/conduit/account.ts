import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface ConduitAccount {
  id: string;
  owner_user_id: string;
  name: string;
  business_type: string | null;
  business_description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Returns the user's conduit account, creating a stub row if none exists.
 * The stub has placeholder name and null business_type — onboarding fills these in.
 */
export async function getOrCreateAccount(
  supabase: SupabaseClient,
  user: User,
): Promise<ConduitAccount> {
  const { data: existing } = await supabase
    .from("conduit_accounts")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (existing) return existing as ConduitAccount;

  const fallbackName =
    (user.user_metadata?.business_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Your Workspace";

  const { data, error } = await supabase
    .from("conduit_accounts")
    .insert({
      owner_user_id: user.id,
      name: fallbackName,
    })
    .select("*")
    .single();

  if (error) throw error;
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
