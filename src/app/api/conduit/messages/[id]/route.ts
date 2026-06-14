import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// PATCH /api/conduit/messages/[id]
// Body: { action: "hide_from" }
// Soft-deletes the target message and all subsequent messages in the same
// conversation by setting hidden_at. Used when a user edits a previous turn.
// The old branch is preserved (hidden, not deleted); the new turn gets fresh
// messages appended by the normal chat route.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: messageId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  const body = (await req.json()) as { action?: string };
  if (body.action !== "hide_from") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  // Fetch the target message — verify it belongs to this account's conversation.
  const { data: msg } = await supabase
    .from("conduit_messages")
    .select("id, conversation_id, created_at")
    .eq("id", messageId)
    .maybeSingle();

  if (!msg) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Confirm the conversation belongs to this account.
  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("id", msg.conversation_id)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!convo) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Soft-hide the target message and all messages after it (by created_at).
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("conduit_messages")
    .update({ hidden_at: now })
    .eq("conversation_id", msg.conversation_id)
    .gte("created_at", msg.created_at)
    .is("hidden_at", null);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
