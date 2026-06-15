import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteCtx) {
  const { id: conversationId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!convo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: assignments } = await supabase
    .from("conduit_conversation_label_assignments")
    .select("label_id")
    .eq("conversation_id", conversationId);

  if (!assignments || assignments.length === 0) return NextResponse.json({ labels: [] });

  const labelIds = assignments.map((a) => a.label_id as string);
  const { data: labels } = await supabase
    .from("conduit_conversation_labels")
    .select("id, name, color")
    .in("id", labelIds)
    .eq("account_id", account.id);

  return NextResponse.json({ labels: labels ?? [] });
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { id: conversationId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { labelId?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { labelId } = body;
  if (!labelId) return NextResponse.json({ error: "labelId required" }, { status: 400 });

  const account = await getOrCreateAccount(supabase, user);

  // Verify conversation belongs to account
  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!convo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Verify label belongs to account
  const { data: label } = await supabase
    .from("conduit_conversation_labels")
    .select("id")
    .eq("id", labelId)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!label) return NextResponse.json({ error: "label_not_found" }, { status: 404 });

  const { error } = await supabase
    .from("conduit_conversation_label_assignments")
    .upsert({ conversation_id: conversationId, label_id: labelId });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
