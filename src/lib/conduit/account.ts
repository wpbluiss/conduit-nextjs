import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createSupabaseServerClient,
  getCurrentUser,
} from "@/lib/supabase/server";

export interface ConduitAccount {
  id: string;
  owner_user_id: string;
  name: string;
  business_type: string | null;
  business_description: string | null;
  creator_mode: boolean;
  creator_mode_version: number;
  monthly_token_cap: number;
  monthly_tokens_used: number;
  billing_cycle_start: string;
  // R4 billing fields
  tier_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  bonus_tokens: number;
  internal_account: boolean;
  // R5 voice prefs
  voice_enabled: boolean;
  voice_speed: number;
  voice_auto_play: boolean;
  // R8 time-aware
  timezone: string;
  // R9 voice-room teaser
  notify_voice_room_ready: boolean;
  // R3 theme pref — 'system' (default) | 'light' | 'dark'.
  // Hydrated only after migration 021 runs; falls back to 'system' for
  // older rows that don't have the column yet.
  theme_preference?: "system" | "light" | "dark" | null;
  // Profile avatar URL — set via the avatar upload endpoint.
  // Nullable until migration 031 runs + user uploads a photo.
  avatar_url?: string | null;
  // R20 notification prefs — nullable until migration 030 runs.
  notification_prefs?: { product_updates?: boolean; weekly_digest?: boolean } | null;
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

/**
 * Per-request shared account fetch. Use this from server components instead of
 * the two-step "get supabase, get user, getOrCreateAccount" pattern — the
 * layout and the destination page then share one auth check + one account
 * fetch via React `cache()`, instead of doing both twice.
 *
 * Returns null if the user isn't authenticated; the caller is responsible for
 * the redirect (kept here so this stays safe to call from anywhere).
 */
export const getCurrentAccount = cache(async function (): Promise<{
  account: ConduitAccount;
  user: User;
} | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user) return null;
  const account = await getOrCreateAccount(supabase, user);
  return { account, user };
});
