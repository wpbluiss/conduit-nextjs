import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/conduit/artifacts/[id]/share — generate share token (idempotent)
export async function POST(_request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  // Verify ownership before touching the row
  const { data: artifact } = await supabase
    .from("conduit_artifacts")
    .select("id, share_token, account_id")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!artifact) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Return existing token if already shared
  if (artifact.share_token) {
    return NextResponse.json({ share_token: artifact.share_token });
  }

  const { data: updated, error } = await supabase
    .from("conduit_artifacts")
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

// DELETE /api/conduit/artifacts/[id]/share — revoke share token
export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);

  const { error } = await supabase
    .from("conduit_artifacts")
    .update({ share_token: null })
    .eq("id", id)
    .eq("account_id", account.id);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
