import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const MAX_RESULTS = 20;
const SNIPPET_RADIUS = 80;

function extractSnippet(content: string, query: string): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, SNIPPET_RADIUS * 2);
  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(content.length, idx + query.length + SNIPPET_RADIUS);
  const snippet = content.slice(start, end);
  return (start > 0 ? "…" : "") + snippet + (end < content.length ? "…" : "");
}

// GET /api/conduit/messages/search?q=<query>
// Searches conduit_messages content for the current account.
// Returns up to 20 results with conversation title + snippet.
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Fetch account's conversation IDs for scoping the message search.
  const { data: convos } = await supabase
    .from("conduit_conversations")
    .select("id, title, dominant_employee, updated_at")
    .eq("account_id", account.id);

  if (!convos || convos.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const convoIds = convos.map((c) => c.id);
  const convoMap = new Map(convos.map((c) => [c.id, c]));

  // Full-text search via ILIKE (works without a tsvector column).
  const { data: msgs } = await supabase
    .from("conduit_messages")
    .select("id, conversation_id, content, role, employee")
    .in("conversation_id", convoIds)
    .is("hidden_at", null)
    .ilike("content", `%${q}%`)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(MAX_RESULTS);

  if (!msgs) {
    return NextResponse.json({ results: [] });
  }

  // Dedupe: one result per conversation (the most-recent matching message).
  const seenConvoIds = new Set<string>();
  const results = [];

  for (const msg of msgs) {
    const cid = msg.conversation_id as string;
    if (seenConvoIds.has(cid)) continue;
    seenConvoIds.add(cid);

    const convo = convoMap.get(cid);
    results.push({
      conversation_id: cid,
      title: convo?.title ?? null,
      dominant_employee: convo?.dominant_employee ?? null,
      updated_at: convo?.updated_at ?? null,
      snippet: extractSnippet(msg.content as string, q),
      role: msg.role,
      employee: msg.employee,
    });
  }

  return NextResponse.json({ results });
}
