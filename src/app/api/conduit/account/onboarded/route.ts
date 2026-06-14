import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// PATCH /api/conduit/account/onboarded
// Sets onboarded_at = now() to mark the coach-mark tour as complete.
// Idempotent — safe to call multiple times.
export async function PATCH() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;

  if (account.onboarded_at) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("conduit_accounts")
    .update({ onboarded_at: new Date().toISOString() } as never)
    .eq("id", account.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
