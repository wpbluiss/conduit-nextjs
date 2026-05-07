import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const VALID_KINDS = ["fact", "preference", "decision", "goal", "context"];

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  let body: {
    kind?: string;
    content?: string;
    tags?: string[];
    archived?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.kind && VALID_KINDS.includes(body.kind)) update.kind = body.kind;
  if (typeof body.content === "string") {
    const trimmed = body.content.trim();
    if (!trimmed || trimmed.length > 1000) {
      return NextResponse.json({ error: "invalid_content" }, { status: 400 });
    }
    update.content = trimmed;
  }
  if (Array.isArray(body.tags)) {
    update.tags = body.tags
      .map((t) => String(t).trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length < 32)
      .slice(0, 5);
  }
  if (typeof body.archived === "boolean") {
    update.archived_at = body.archived ? new Date().toISOString() : null;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_op" }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("conduit_memory")
    .update(update)
    .eq("id", id)
    .eq("account_id", account.id);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
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
  const account = await getOrCreateAccount(supabase, user);
  // Soft delete: archive instead of hard delete so the supersede chain stays intact.
  const { error } = await supabase
    .from("conduit_memory")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("account_id", account.id);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
