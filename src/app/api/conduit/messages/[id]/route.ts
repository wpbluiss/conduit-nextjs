import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// PATCH /api/conduit/messages/[id]
// Body: { action: "hide_from" }  — soft-hides target + all subsequent messages
// Body: { action: "edit", content: string } — updates content of the target
//   user message and soft-hides all subsequent messages (the old assistant
//   reply branch). The new turn is then sent via the normal chat route.
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

  const body = (await req.json()) as { action?: string; content?: string };
  if (body.action !== "hide_from" && body.action !== "edit") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  // Fetch the target message — verify it belongs to this account's conversation.
  const { data: msg } = await supabase
    .from("conduit_messages")
    .select("id, conversation_id, created_at, role")
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

  if (body.action === "edit") {
    if (msg.role !== "user") {
      return NextResponse.json({ error: "not_user_message" }, { status: 400 });
    }
    const newContent = (body.content ?? "").trim().slice(0, 32000);
    if (!newContent) {
      return NextResponse.json({ error: "empty_content" }, { status: 400 });
    }

    // Update the target message content.
    const { error: updateErr } = await supabase
      .from("conduit_messages")
      .update({ content: newContent })
      .eq("id", messageId);

    if (updateErr) {
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    // Soft-hide all subsequent messages (the old assistant reply branch).
    const now = new Date().toISOString();
    const { error: hideErr } = await supabase
      .from("conduit_messages")
      .update({ hidden_at: now })
      .eq("conversation_id", msg.conversation_id)
      .gt("created_at", msg.created_at)
      .is("hidden_at", null);

    if (hideErr) {
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // action === "hide_from": soft-hide the target message and all messages after it.
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
