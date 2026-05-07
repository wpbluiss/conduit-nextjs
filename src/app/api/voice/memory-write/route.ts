// Worker-only endpoint: lets the Railway voice worker append a memory
// summary at the end of a voice session. Authenticated by a shared
// CONDUIT_WORKER_SECRET present in both Vercel and Railway env.
//
// Honors the R10 invariant that Jarvis is the only writer — every row
// goes in with written_by='jarvis' regardless of which employee actually
// hosted the voice session.

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const VALID_KINDS = ["fact", "preference", "decision", "goal", "context"];
const MAX_CONTENT_LEN = 1000;

interface WriteBody {
  account_id?: string;
  kind?: string;
  content?: string;
  tags?: string[];
  source_session_id?: string;
}

export async function POST(request: NextRequest) {
  const expected = process.env.CONDUIT_WORKER_SECRET;
  const provided = request.headers.get("x-conduit-worker-secret");
  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: WriteBody;
  try {
    body = (await request.json()) as WriteBody;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!body.account_id || !body.kind || !body.content) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!VALID_KINDS.includes(body.kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }
  const content = body.content.trim();
  if (!content || content.length > MAX_CONTENT_LEN) {
    return NextResponse.json({ error: "invalid_content" }, { status: 400 });
  }

  const tags = (Array.isArray(body.tags) ? body.tags : [])
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length < 32)
    .slice(0, 5);
  if (body.source_session_id) {
    tags.push(`voice_session:${body.source_session_id}`);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("conduit_memory")
    .insert({
      account_id: body.account_id,
      kind: body.kind,
      content,
      tags,
      written_by: "jarvis",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "db_error", detail: error?.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, memory_id: data.id });
}
