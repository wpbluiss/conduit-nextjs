import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  let body: { title?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t || t.length > 120)
      return NextResponse.json({ error: "invalid_title" }, { status: 400 });
    update.title = t;
  }
  if (typeof body.body === "string") {
    const b = body.body.trim();
    if (!b || b.length > 4000)
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    update.body = b;
  }

  const { error } = await supabase
    .from("conduit_prompt_templates")
    .update(update)
    .eq("id", id)
    .eq("account_id", account.id);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  const { error } = await supabase
    .from("conduit_prompt_templates")
    .delete()
    .eq("id", id)
    .eq("account_id", account.id);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
