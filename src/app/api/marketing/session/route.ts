// POST /api/marketing/session — kicks off a Marketing asset generation.
//
// R16 Phase 3.1: gated to internal_account=true (same shape as R15
// initially launched Engineering). Phase 3.2 extends the
// /lib/engineering/limits.ts pattern to marketing once the per-tier
// caps are decided.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { startMarketingWorkerSession } from "@/lib/marketing/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  prompt?: string;
  conversationId?: string | null;
  brand?: {
    name?: string | null;
    audience?: string | null;
    voice?: string | null;
  } | null;
  referenceImageUrl?: string | null;
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
          "Marketing generation is in early access. Public release lands once Phase 3.2 ships the real provider integrations.",
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
      {
        error: "prompt_too_short",
        message: "Tell Marketing what to make (min 8 chars).",
      },
      { status: 400 },
    );
  }
  if (prompt.length > 4000) {
    return NextResponse.json(
      { error: "prompt_too_long", message: "Trim the brief under 4000 chars." },
      { status: 400 },
    );
  }
  const conversationId = body.conversationId ?? null;
  const brand = body.brand ?? null;
  const referenceImageUrl = body.referenceImageUrl ?? null;

  const { data: session, error } = await supabase
    .from("conduit_marketing_sessions")
    .insert({
      account_id: account.id,
      conversation_id: conversationId,
      prompt,
      brand,
      reference_image_url: referenceImageUrl,
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

  const start = await startMarketingWorkerSession({
    sessionId,
    accountId: account.id,
    prompt,
    brand,
    referenceImageUrl,
  });

  if (!start.ok) {
    await supabase
      .from("conduit_marketing_sessions")
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
          "The marketing worker isn't reachable right now. Try again in a minute.",
        detail: start.error,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    session_id: sessionId,
    status: "pending",
    realtime_channel: `marketing:${sessionId}`,
  });
}
