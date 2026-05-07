// GET /api/engineering/session/[id] — full session detail + paginated logs.
// Logs are returned newest-first up to ?limit (default 500); pass
// ?before=<iso> to page back. Realtime subscriptions handle the live tail
// directly against Supabase, so this is mostly a backfill / reopen path.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // RLS scopes session lookup; if the user doesn't own it, this returns null.
  const { data: session, error: sessionErr } = await supabase
    .from("conduit_engineering_sessions")
    .select(
      "id, prompt, build_type, status, deploy_url, github_repo, total_input_tokens, total_output_tokens, error_message, started_at, completed_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (sessionErr) {
    return NextResponse.json(
      { error: "fetch_failed", detail: sessionErr.message },
      { status: 500 },
    );
  }
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 500), 1), 2000);
  const before = url.searchParams.get("before");

  let q = supabase
    .from("conduit_engineering_logs")
    .select("id, ts, level, message")
    .eq("session_id", id)
    .order("ts", { ascending: true })
    .limit(limit);
  if (before) q = q.lt("ts", before);

  const { data: logs, error: logsErr } = await q;
  if (logsErr) {
    return NextResponse.json(
      { error: "logs_failed", detail: logsErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ session, logs: logs ?? [] });
}
