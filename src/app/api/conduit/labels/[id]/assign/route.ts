import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// POST — assign label to a conversation
// DELETE — remove label from a conversation
// Body: { conversation_id: string }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: labelId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { conversation_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const conversationId = body.conversation_id;
  if (!conversationId) return NextResponse.json({ error: "conversation_id_required" }, { status: 400 });

  const account = await getOrCreateAccount(supabase, user);

  // Verify label belongs to this account
  const { data: label } = await supabase
    .from("conduit_labels")
    .select("id")
    .eq("id", labelId)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!label) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Verify conversation belongs to this account
  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!convo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error } = await supabase
    .from("conduit_conversation_labels")
    .insert({ label_id: labelId, conversation_id: conversationId });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: labelId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { conversation_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const conversationId = body.conversation_id;
  if (!conversationId) return NextResponse.json({ error: "conversation_id_required" }, { status: 400 });

  const account = await getOrCreateAccount(supabase, user);

  // Verify label belongs to this account (prevents cross-account manipulation)
  const { data: label } = await supabase
    .from("conduit_labels")
    .select("id")
    .eq("id", labelId)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!label) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await supabase
    .from("conduit_conversation_labels")
    .delete()
    .eq("label_id", labelId)
    .eq("conversation_id", conversationId);

  return new NextResponse(null, { status: 204 });
}
