import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { name?: string; color?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (body.name !== undefined) {
    const name = body.name.trim().slice(0, 32);
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    updates.name = name;
  }
  if (body.color !== undefined) {
    if (!COLOR_RE.test(body.color)) return NextResponse.json({ error: "invalid color" }, { status: 400 });
    updates.color = body.color;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const { data, error } = await supabase
    .from("conduit_conversation_labels")
    .update(updates)
    .eq("id", id)
    .eq("account_id", account.id)
    .select("id, name, color")
    .single();

  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ label: data });
}

export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  // RLS ensures only the account owner can delete; the eq() is defense-in-depth
  const { error } = await supabase
    .from("conduit_conversation_labels")
    .delete()
    .eq("id", id)
    .eq("account_id", account.id);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
