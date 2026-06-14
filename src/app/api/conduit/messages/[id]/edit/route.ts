import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// POST /api/conduit/messages/[id]/edit
// Hides the target message and all subsequent messages in the conversation
// so the conversation can be re-streamed from the edit point.
// The caller is expected to send a new chat message after this call.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: messageId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  // Load the target message to verify ownership and get its created_at
  const { data: msg } = await supabase
    .from("conduit_messages")
    .select("id, role, conversation_id, created_at")
    .eq("id", messageId)
    .maybeSingle();

  if (!msg) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (msg.role !== "user") {
    return NextResponse.json({ error: "only_user_messages" }, { status: 422 });
  }

  // Verify the conversation belongs to this account
  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("id", msg.conversation_id)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!convo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Hide the target message + all subsequent messages in the conversation
  const now = new Date().toISOString();
  await supabase
    .from("conduit_messages")
    .update({ hidden_at: now })
    .eq("conversation_id", msg.conversation_id)
    .gte("created_at", msg.created_at)
    .is("hidden_at", null);

  return NextResponse.json({ conversation_id: msg.conversation_id });
}
