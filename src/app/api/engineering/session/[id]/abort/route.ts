// POST /api/engineering/session/[id]/abort — user-requested cancel.
//
// Marks the row 'aborted' and asks the worker to SIGTERM the claude
// subprocess. Both halves are best-effort: if the worker is gone, the
// DB row still reflects the user's intent. If the row's already
// terminal, returns 409 so the UI can refresh cleanly.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { abortWorkerSession } from "@/lib/engineering/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

const ABORTABLE = new Set(["pending", "running", "deploying"]);

export async function POST(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // RLS scopes the lookup; non-owners get null.
  const { data: session } = await supabase
    .from("conduit_engineering_sessions")
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

  // Mark intent first. If the worker is unreachable, the row still
  // reflects user choice — and the worker, when it comes back, will
  // see the aborted status and skip the 'failed' write.
  const completedAt = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("conduit_engineering_sessions")
    .update({
      status: "aborted",
      error_message: "user_aborted",
      completed_at: completedAt,
    })
    .eq("id", id);
  if (updateErr) {
    return NextResponse.json(
      { error: "update_failed", detail: updateErr.message },
      { status: 500 },
    );
  }

  const kill = await abortWorkerSession(id);
  return NextResponse.json({
    ok: true,
    worker_killed: kill.ok && Boolean(kill.found),
    worker_reachable: kill.ok,
    detail: kill.error ?? null,
  });
}
