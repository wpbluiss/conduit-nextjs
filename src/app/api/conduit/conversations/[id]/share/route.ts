import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/conduit/conversations/[id]/share — generate share token (idempotent)
export async function POST(_request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id, share_token, account_id")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!convo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (convo.share_token) {
    return NextResponse.json({ share_token: convo.share_token });
  }

  const { data: updated, error } = await supabase
    .from("conduit_conversations")
    .update({ share_token: crypto.randomUUID() })
    .eq("id", id)
    .eq("account_id", account.id)
    .select("share_token")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ share_token: updated.share_token });
}

// DELETE /api/conduit/conversations/[id]/share — revoke share token
export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  const { error } = await supabase
    .from("conduit_conversations")
    .update({ share_token: null })
    .eq("id", id)
    .eq("account_id", account.id);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
