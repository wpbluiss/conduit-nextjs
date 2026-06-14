import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { id: parentId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { messageId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { messageId } = body;
  if (!messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 });

  const account = await getOrCreateAccount(supabase, user);

  // Verify parent conversation belongs to this account (RLS handles it but be explicit)
  const { data: parent } = await supabase
    .from("conduit_conversations")
    .select("id, title, account_id, dominant_employee")
    .eq("id", parentId)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!parent) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Fetch messages up to (and including) the target message, ordered by created_at
  const { data: allMessages } = await supabase
    .from("conduit_messages")
    .select("id, role, employee, content, metadata, created_at")
    .eq("conversation_id", parentId)
    .order("created_at", { ascending: true });

  const messages = allMessages ?? [];
  const cutoffIdx = messages.findIndex((m) => m.id === messageId);
  if (cutoffIdx === -1) return NextResponse.json({ error: "message_not_found" }, { status: 404 });
  const slice = messages.slice(0, cutoffIdx + 1);

  // Create the forked conversation
  const { data: forked, error: forkError } = await supabase
    .from("conduit_conversations")
    .insert({
      account_id: account.id,
      title: parent.title ? `Fork of ${parent.title}` : "Forked chat",
      dominant_employee: parent.dominant_employee,
      forked_from_conversation_id: parentId,
      forked_at_message_id: messageId,
    })
    .select("id")
    .single();

  if (forkError || !forked) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Copy messages into the new conversation
  if (slice.length > 0) {
    const copies = slice.map((m) => ({
      conversation_id: forked.id,
      role: m.role as string,
      employee: m.employee as string | null,
      content: m.content as string,
      metadata: (m.metadata ?? {}) as Record<string, unknown>,
    }));
    const { error: msgError } = await supabase.from("conduit_messages").insert(copies);
    if (msgError) {
      // Clean up the orphaned conversation row
      await supabase.from("conduit_conversations").delete().eq("id", forked.id);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
  }

  return NextResponse.json({ conversationId: forked.id });
}
