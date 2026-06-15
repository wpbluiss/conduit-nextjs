import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Self-serve account deletion (App Store / Play Store requirement).
// Deletes the caller's account row — which CASCADE-deletes every
// account-scoped table (conversations, messages, memory, artifacts,
// builds, voice sessions, usage, leads, top-ups…) — then removes the
// auth user so the login is gone too. conduit_stripe_events is SET NULL
// (retained for financial audit, no PII linkage).
export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);

  // Guard: internal/owner accounts can't be self-deleted (prevents nuking
  // the founder account from the UI). Those go through support.
  if (account.internal_account) {
    return NextResponse.json(
      { error: "internal_account_protected" },
      { status: 403 },
    );
  }

  const admin = createSupabaseAdminClient();

  // 1. Delete the account → cascades all account-scoped data.
  const { error: delErr } = await admin
    .from("conduit_accounts")
    .delete()
    .eq("id", account.id);
  if (delErr) {
    return NextResponse.json(
      { error: "delete_failed", detail: delErr.message },
      { status: 500 },
    );
  }

  // 2. Remove the auth identity. Data is already gone; if this specific
  //    step fails we still report success (no orphaned PII remains) but log it.
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) {
    console.error("[account/delete] auth user removal failed", authErr.message);
  }

  return NextResponse.json({ ok: true });
}
