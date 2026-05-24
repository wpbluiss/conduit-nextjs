import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const VALID_KINDS = ["fact", "preference", "decision", "goal", "context"];
const VALID_EMPLOYEES = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
  "finance",
  "compliance",
  "hr",
  "ops",
  "legal",
];

function sanitizeScope(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((s) => String(s).trim().toLowerCase())
    .filter((s) => VALID_EMPLOYEES.includes(s))
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .slice(0, 9);
}

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
    pinned?: boolean;
    locked?: boolean;
    scope?: string[];
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
  if (typeof body.pinned === "boolean") {
    update.pinned = body.pinned;
  }
  if (typeof body.locked === "boolean") {
    update.locked = body.locked;
  }

  // Scope is replaced atomically when provided. Empty array = global.
  const scopeProvided = Array.isArray(body.scope);
  const scope = scopeProvided ? sanitizeScope(body.scope) : null;

  if (Object.keys(update).length === 0 && !scopeProvided) {
    return NextResponse.json({ error: "no_op" }, { status: 400 });
  }
  if (Object.keys(update).length > 0) {
    update.updated_at = new Date().toISOString();
    const { error } = await supabase
      .from("conduit_memory")
      .update(update)
      .eq("id", id)
      .eq("account_id", account.id);
    if (error) {
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
  }

  if (scopeProvided && scope !== null) {
    // Verify ownership before mutating scope rows.
    const { data: own } = await supabase
      .from("conduit_memory")
      .select("id")
      .eq("id", id)
      .eq("account_id", account.id)
      .maybeSingle();
    if (!own) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    // Atomic replace: delete all + insert new. Acceptable inside the
    // request lifetime; RLS prevents foreign rows from being touched.
    await supabase.from("conduit_memory_scope").delete().eq("memory_id", id);
    if (scope.length > 0) {
      await supabase.from("conduit_memory_scope").insert(
        scope.map((employee_id) => ({
          memory_id: id,
          employee_id,
        })),
      );
    }
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
