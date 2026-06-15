import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string; labelId: string }>;
}

export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const { id: conversationId, labelId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  // Verify conversation ownership before allowing label removal
  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!convo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error } = await supabase
    .from("conduit_conversation_label_assignments")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("label_id", labelId);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
