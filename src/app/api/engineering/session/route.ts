// POST /api/engineering/session — kicks off a new Engineering build.
//
// R15.5: public release. The internal_account 403 gate is gone; every
// authenticated user can request a build. Tier-based daily limits
// (build count + $ spend cap) gate runaway usage. internal_account
// users bypass all caps.
//
// Optional `parentSessionId` clones the parent's workspace files into
// the new session before claude runs — used by the "Continue from
// previous build" flow. The worker tolerates a missing parent
// workspace (e.g. parent was cleaned up after failure) by starting fresh.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { startWorkerSession } from "@/lib/engineering/worker";
import {
  decideLimit,
  loadDailyEngineeringUsage,
} from "@/lib/engineering/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  prompt?: string;
  buildType?: string | null;
  conversationId?: string | null;
  parentSessionId?: string | null;
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

  // R15.5: tier-based daily limit instead of internal_account 403.
  const usage = await loadDailyEngineeringUsage(supabase, account.id, account);
  const decision = decideLimit(usage);
  if (!decision.allowed) {
    return NextResponse.json(
      {
        error: decision.reason ?? "rate_limited",
        message: decision.message ?? "Daily build limit reached.",
        usage: {
          buildsToday: usage.buildsToday,
          spendCentsToday: usage.spendCentsToday,
          buildsLimit: usage.buildsLimit,
          spendCapCents: usage.spendCapCents,
          tier: usage.tier,
        },
      },
      { status: 429 },
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
  const parentSessionId = body.parentSessionId ?? null;

  // RLS guards parent ownership, but a 404 here gives a cleaner UX than
  // surfacing the worker-side "couldn't find parent workspace" log.
  if (parentSessionId) {
    const { data: parent } = await supabase
      .from("conduit_engineering_sessions")
      .select("id")
      .eq("id", parentSessionId)
      .maybeSingle();
    if (!parent) {
      return NextResponse.json(
        { error: "parent_not_found", message: "Parent build not found." },
        { status: 404 },
      );
    }
  }

  const { data: session, error } = await supabase
    .from("conduit_engineering_sessions")
    .insert({
      account_id: account.id,
      conversation_id: conversationId,
      prompt,
      build_type: buildType,
      parent_session_id: parentSessionId,
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
    parentSessionId,
  });

  if (!start.ok) {
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
    usage: {
      buildsToday: usage.buildsToday + 1,
      spendCentsToday: usage.spendCentsToday,
      buildsLimit: usage.buildsLimit,
      spendCapCents: usage.spendCapCents,
      tier: usage.tier,
    },
  });
}
