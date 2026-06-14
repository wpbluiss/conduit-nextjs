import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const MAX_PINS = 5;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

async function verifyConversationOwnership(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  conversationId: string,
  accountId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("conduit_conversations")
    .select("account_id")
    .eq("id", conversationId)
    .maybeSingle();
  return !!data && data.account_id === accountId;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const { id: conversationId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  const owned = await verifyConversationOwnership(supabase, conversationId, account.id);
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Fetch pins + join message content for previews
  const { data: pins, error } = await supabase
    .from("conduit_pinned_messages")
    .select("id, message_id, sort_order, pinned_at")
    .eq("conversation_id", conversationId)
    .eq("account_id", account.id)
    .order("pinned_at", { ascending: true });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  if (!pins || pins.length === 0) {
    return NextResponse.json({ pins: [] });
  }

  // Fetch message content for each pinned message
  const messageIds = pins.map((p) => p.message_id);
  const { data: messages } = await supabase
    .from("conduit_messages")
    .select("id, content, role, employee")
    .in("id", messageIds);

  const msgMap = new Map((messages ?? []).map((m) => [m.id, m]));

  const enriched = pins
    .map((p) => {
      const msg = msgMap.get(p.message_id);
      if (!msg) return null;
      return {
        id: p.id,
        message_id: p.message_id,
        sort_order: p.sort_order,
        pinned_at: p.pinned_at,
        content: msg.content,
        role: msg.role,
        employee: msg.employee,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ pins: enriched });
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { id: conversationId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  const owned = await verifyConversationOwnership(supabase, conversationId, account.id);
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: { message_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const messageId = body.message_id;
  if (!messageId || typeof messageId !== "string") {
    return NextResponse.json({ error: "message_id_required" }, { status: 400 });
  }

  // Verify message belongs to this conversation
  const { data: msg } = await supabase
    .from("conduit_messages")
    .select("id, conversation_id")
    .eq("id", messageId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (!msg) return NextResponse.json({ error: "message_not_found" }, { status: 404 });

  // Check pin limit server-side
  const { count } = await supabase
    .from("conduit_pinned_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("account_id", account.id);

  if ((count ?? 0) >= MAX_PINS) {
    return NextResponse.json({ error: "pin_limit_reached", max: MAX_PINS }, { status: 422 });
  }

  const { data: pin, error } = await supabase
    .from("conduit_pinned_messages")
    .insert({
      account_id: account.id,
      conversation_id: conversationId,
      message_id: messageId,
      sort_order: count ?? 0,
    })
    .select("id, message_id, sort_order, pinned_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Already pinned — return ok
      return NextResponse.json({ ok: true, already_pinned: true });
    }
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pin });
}
