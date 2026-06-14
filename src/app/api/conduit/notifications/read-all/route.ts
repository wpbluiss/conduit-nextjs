import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const dynamic = "force-dynamic";

export async function POST() {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("conduit_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("account_id", account.id)
    .is("read_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
