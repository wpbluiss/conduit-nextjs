import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  // RLS ensures only the account owner can delete; the eq() is defense-in-depth
  const { error } = await supabase
    .from("conduit_conversation_labels")
    .delete()
    .eq("id", id)
    .eq("account_id", account.id);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
