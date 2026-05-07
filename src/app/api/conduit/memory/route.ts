import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";

export const runtime = "nodejs";

const VALID_KINDS = ["fact", "preference", "decision", "goal", "context"];

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);
  const includeArchived =
    request.nextUrl.searchParams.get("archived") === "1";
  const kind = request.nextUrl.searchParams.get("kind");

  let q = supabase
    .from("conduit_memory")
    .select(
      "id, kind, content, tags, source_conversation_id, source_message_id, written_by, created_at, updated_at, archived_at, superseded_by",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(500);
  if (!includeArchived) q = q.is("archived_at", null);
  if (kind && VALID_KINDS.includes(kind)) q = q.eq("kind", kind);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  const tier = tierById(account.tier_id);
  return NextResponse.json({
    memories: data ?? [],
    cap: account.internal_account ? 5000 : tier.memoryCap,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    kind?: string;
    content?: string;
    tags?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const kind = body.kind?.trim();
  const content = body.content?.trim();
  if (!kind || !VALID_KINDS.includes(kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }
  if (!content || content.length > 1000) {
    return NextResponse.json({ error: "invalid_content" }, { status: 400 });
  }
  const tags = (Array.isArray(body.tags) ? body.tags : [])
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length < 32)
    .slice(0, 5);

  const account = await getOrCreateAccount(supabase, user);

  // Cap check (manual user adds count too).
  const tier = tierById(account.tier_id);
  const memCap = account.internal_account ? 5000 : tier.memoryCap;
  const { count } = await supabase
    .from("conduit_memory")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id)
    .is("archived_at", null);
  if ((count ?? 0) >= memCap) {
    return NextResponse.json(
      {
        error: "memory_cap_reached",
        message: `You're at ${memCap} memories — archive a few before adding more.`,
      },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("conduit_memory")
    .insert({
      account_id: account.id,
      kind,
      content,
      tags,
      written_by: "user",
    })
    .select(
      "id, kind, content, tags, source_conversation_id, source_message_id, written_by, created_at, updated_at, archived_at",
    )
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ memory: data });
}
