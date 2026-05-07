import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  const { data: build } = await supabase
    .from("conduit_builds")
    .select("*")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!build) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { data: events } = await supabase
    .from("conduit_build_events")
    .select("event_type, message, metadata, created_at")
    .eq("build_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ build, events: events ?? [] });
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

  let body: { archived?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.archived === "boolean") {
    update.archived_at = body.archived ? new Date().toISOString() : null;
    update.status = body.archived ? "archived" : "live";
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_op" }, { status: 400 });
  }

  const { error } = await supabase
    .from("conduit_builds")
    .update(update)
    .eq("id", id)
    .eq("account_id", account.id);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
