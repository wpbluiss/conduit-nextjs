import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { id: conversationId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  let body: { message_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { message_id } = body;
  if (!message_id) {
    return NextResponse.json({ error: "message_id required" }, { status: 400 });
  }

  // Verify the original conversation belongs to this account.
  const { data: original } = await supabase
    .from("conduit_conversations")
    .select("id, title, account_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!original || original.account_id !== account.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Verify the fork-point message belongs to this conversation.
  const { data: forkMsg } = await supabase
    .from("conduit_messages")
    .select("id, created_at")
    .eq("id", message_id)
    .eq("conversation_id", conversationId)
    .maybeSingle();
  if (!forkMsg) {
    return NextResponse.json({ error: "message_not_found" }, { status: 404 });
  }

  // Fetch all messages up to and including the fork point.
  const { data: sourceMessages } = await supabase
    .from("conduit_messages")
    .select("role, employee, content, metadata")
    .eq("conversation_id", conversationId)
    .lte("created_at", forkMsg.created_at)
    .order("created_at", { ascending: true })
    .limit(2000);

  if (!sourceMessages || sourceMessages.length === 0) {
    return NextResponse.json({ error: "no_messages" }, { status: 422 });
  }

  // Create the forked conversation.
  const forkTitle = original.title
    ? `Fork of ${original.title}`
    : "Forked conversation";
  const { data: forked, error: convErr } = await supabase
    .from("conduit_conversations")
    .insert({
      account_id: account.id,
      title: forkTitle,
      forked_from_conversation_id: conversationId,
      forked_at_message_id: message_id,
    })
    .select("id")
    .single();

  if (convErr || !forked) {
    console.error("[fork] conversation insert failed:", convErr);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  // Copy messages into the new conversation.
  const copies = sourceMessages.map((m) => ({
    conversation_id: forked.id,
    role: m.role,
    employee: m.employee,
    content: m.content,
    metadata: m.metadata,
  }));

  const { error: msgErr } = await supabase
    .from("conduit_messages")
    .insert(copies);

  if (msgErr) {
    console.error("[fork] message copy failed:", msgErr);
    // Roll back the conversation row on failure.
    await supabase.from("conduit_conversations").delete().eq("id", forked.id);
    return NextResponse.json({ error: "copy_failed" }, { status: 500 });
  }

  return NextResponse.json({ conversation_id: forked.id });
}
