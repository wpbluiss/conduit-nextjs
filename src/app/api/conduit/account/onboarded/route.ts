import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// PATCH /api/conduit/account/onboarded
// Marks the account's first-run tour as completed by setting onboarded_at.
// Idempotent — calling it multiple times has no adverse effect.
export async function PATCH() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);

  const { error } = await supabase
    .from("conduit_accounts")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", account.id)
    .is("onboarded_at", null);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/conduit/account/onboarded
// Resets the onboarded_at flag so the first-run tour will re-show.
// Used by the "Restart tour" button in Settings.
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);

  const { error } = await supabase
    .from("conduit_accounts")
    .update({ onboarded_at: null })
    .eq("id", account.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
