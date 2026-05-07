// POST /api/engineering/session — kicks off a new Engineering build.
// v1 gate: account.internal_account === true. Everyone else gets a clean 403
// with "early access" copy that the modal can render.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { startWorkerSession } from "@/lib/engineering/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  prompt?: string;
  buildType?: string | null;
  conversationId?: string | null;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  if (!account.internal_account) {
    return NextResponse.json(
      {
        error: "early_access",
        message:
          "Engineering builds are in early access. We'll open them up after the next round of hardening.",
      },
      { status: 403 },
    );
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const prompt = (body.prompt ?? "").trim();
  if (prompt.length < 8) {
    return NextResponse.json(
      { error: "prompt_too_short", message: "Tell me what to build (min 8 chars)." },
      { status: 400 },
    );
  }
  if (prompt.length > 4000) {
    return NextResponse.json(
      { error: "prompt_too_long", message: "Trim the prompt under 4000 chars." },
      { status: 400 },
    );
  }
  const buildType = body.buildType?.trim() ?? null;
  const conversationId = body.conversationId ?? null;

  const { data: session, error } = await supabase
    .from("conduit_engineering_sessions")
    .insert({
      account_id: account.id,
      conversation_id: conversationId,
      prompt,
      build_type: buildType,
      status: "pending",
    })
    .select("id, status, created_at")
    .single();

  if (error || !session) {
    return NextResponse.json(
      { error: "insert_failed", detail: error?.message },
      { status: 500 },
    );
  }

  const sessionId = session.id as string;
  const start = await startWorkerSession({
    sessionId,
    accountId: account.id,
    prompt,
    buildType,
  });

  if (!start.ok) {
    // Mark the row failed so the UI doesn't spin. The user can try again.
    await supabase
      .from("conduit_engineering_sessions")
      .update({
        status: "failed",
        error_message: `worker_start_${start.error ?? start.status}`,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    return NextResponse.json(
      {
        error: "worker_unavailable",
        message:
          "The build worker isn't reachable right now. Try again in a minute.",
        detail: start.error,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    session_id: sessionId,
    status: "pending",
    realtime_channel: `engineering:${sessionId}`,
  });
}
