import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// DELETE /api/conduit/connectors/github
// Disconnects GitHub by removing the stored token row.
export async function DELETE() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("conduit_connector_tokens")
    .delete()
    .eq("account_id", account.id)
    .eq("provider", "github");

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
