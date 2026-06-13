import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 50;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id, title, created_at, updated_at, account_id")
    .eq("id", id)
    .maybeSingle();

  if (!convo || convo.account_id !== account.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const before = url.searchParams.get("before"); // ISO timestamp cursor
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam
    ? Math.min(Math.max(1, parseInt(limitParam, 10)), MAX_PAGE_LIMIT)
    : DEFAULT_PAGE_LIMIT;

  // Fetch limit+1 rows to detect whether there are older messages.
  // Order descending so "before" cursor and limit apply to the correct window;
  // we reverse to ascending before returning.
  let query = supabase
    .from("conduit_messages")
    .select("id, role, employee, content, metadata, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: rows } = await query;
  const allRows = rows ?? [];
  const hasMore = allRows.length > limit;
  const messages = allRows.slice(0, limit).reverse(); // ascending for display

  return NextResponse.json({ conversation: convo, messages, hasMore });
}

export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { error } = await supabase
    .from("conduit_conversations")
    .delete()
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
