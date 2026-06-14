import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// DELETE — disconnect Notion: remove token and clear cached pages.
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  await supabase
    .from("conduit_connector_cache")
    .delete()
    .eq("account_id", account.id)
    .eq("provider", "notion");

  await supabase
    .from("conduit_connector_tokens")
    .delete()
    .eq("account_id", account.id)
    .eq("provider", "notion");

  return NextResponse.json({ ok: true });
}
