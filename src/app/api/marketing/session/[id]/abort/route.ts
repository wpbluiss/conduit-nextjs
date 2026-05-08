// POST /api/marketing/session/[id]/abort — user-requested cancel.
// Mirrors /api/engineering/session/[id]/abort.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { abortMarketingWorkerSession } from "@/lib/marketing/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

const ABORTABLE = new Set(["pending", "generating", "editing"]);

export async function POST(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: session } = await supabase
    .from("conduit_marketing_sessions")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!ABORTABLE.has(session.status as string)) {
    return NextResponse.json(
      { error: "already_terminal", status: session.status },
      { status: 409 },
    );
  }

  const { error: updateErr } = await supabase
    .from("conduit_marketing_sessions")
    .update({
      status: "aborted",
      error_message: "user_aborted",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateErr) {
    return NextResponse.json(
      { error: "update_failed", detail: updateErr.message },
      { status: 500 },
    );
  }

  const kill = await abortMarketingWorkerSession(id);
  return NextResponse.json({
    ok: true,
    worker_killed: kill.ok && Boolean(kill.found),
    worker_reachable: kill.ok,
    detail: kill.error ?? null,
  });
}
