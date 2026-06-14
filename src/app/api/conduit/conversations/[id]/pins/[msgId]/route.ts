import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string; msgId: string }>;
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const { id: conversationId, msgId: messageId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  const { error } = await supabase
    .from("conduit_pinned_messages")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("message_id", messageId)
    .eq("account_id", account.id);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
