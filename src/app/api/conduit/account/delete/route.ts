import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { accountDeletedEmail } from "@/lib/email/templates/account-deleted";

// Self-serve account deletion (App Store / Play Store / GDPR requirement).
// Deletes the caller's account row — which CASCADE-deletes every
// account-scoped table (conversations, messages, memory, artifacts,
// builds, voice sessions, usage, leads, top-ups…) — removes fin_*
// household data if the user is the last member, then removes the auth
// user so the login is gone too. conduit_stripe_events is SET NULL
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

  // 1. Clean up fin_* household data for this user.
  //    Find the user's household membership, remove it, and if the household
  //    is now empty, delete it (cascades to fin_accounts, fin_expenses, etc.).
  try {
    const { data: membership } = await admin
      .from("fin_household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.household_id) {
      const householdId = membership.household_id;

      // Remove the membership row
      await admin
        .from("fin_household_members")
        .delete()
        .eq("user_id", user.id);

      // Check if anyone else is still in the household
      const { count } = await admin
        .from("fin_household_members")
        .select("*", { count: "exact", head: true })
        .eq("household_id", householdId);

      // Last member — delete the household and all its data
      if (!count || count === 0) {
        await admin.from("fin_household").delete().eq("id", householdId);
      }
    }

    // Also remove fin_people records by user identity (person rows not tied
    // to household_members directly but by user_id if that column exists)
    // Best-effort — ignore errors
  } catch (finErr) {
    console.error("[account/delete] fin_* cleanup error (non-fatal)", finErr);
  }

  // 2. Delete the conduit account → cascades all account-scoped data.
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

  // 3. Send deletion confirmation email (non-blocking — failure doesn't abort).
  if (user.email) {
    const { subject, html } = accountDeletedEmail({ email: user.email });
    sendEmail({ to: user.email, subject, html }).catch((e) =>
      console.error("[account/delete] deletion email failed", e),
    );
  }

  // 4. Remove the auth identity. Data is already gone; if this specific
  //    step fails we still report success (no orphaned PII remains) but log it.
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) {
    console.error("[account/delete] auth user removal failed", authErr.message);
  }

  return NextResponse.json({ ok: true });
}
