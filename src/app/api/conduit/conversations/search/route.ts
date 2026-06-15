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

// GET /api/conduit/conversations/search?q=<query>
// Searches conduit_messages.content AND conduit_conversations.title for the current account.
// Returns up to 20 results with conversation title + message snippet.
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

  // Fetch all account conversations — used for scoping and title search.
  const { data: convos } = await supabase
    .from("conduit_conversations")
    .select("id, title, dominant_employee, updated_at")
    .eq("account_id", account.id);

  if (!convos || convos.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const convoIds = convos.map((c) => c.id);
  const convoMap = new Map(convos.map((c) => [c.id, c]));

  // Search message content via ILIKE (scoped to account's conversations).
  const { data: msgs } = await supabase
    .from("conduit_messages")
    .select("id, conversation_id, content, role, employee")
    .in("conversation_id", convoIds)
    .is("hidden_at", null)
    .ilike("content", `%${q}%`)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(MAX_RESULTS);

  // Dedupe: one result per conversation (the most-recent matching message).
  const seenConvoIds = new Set<string>();
  const results: {
    conversation_id: string;
    message_id: string | null;
    title: string | null;
    dominant_employee: string | null;
    updated_at: string | null;
    snippet: string;
    match_type: "message" | "title";
  }[] = [];

  for (const msg of msgs ?? []) {
    const cid = msg.conversation_id as string;
    if (seenConvoIds.has(cid)) continue;
    seenConvoIds.add(cid);

    const convo = convoMap.get(cid);
    results.push({
      conversation_id: cid,
      message_id: msg.id as string,
      title: convo?.title ?? null,
      dominant_employee: convo?.dominant_employee ?? null,
      updated_at: convo?.updated_at ?? null,
      snippet: extractSnippet(msg.content as string, q),
      match_type: "message",
    });
  }

  // Also include conversations whose title matches but had no message match.
  for (const convo of convos) {
    if (seenConvoIds.has(convo.id)) continue;
    const title = (convo.title as string | null) ?? "";
    if (!title.toLowerCase().includes(q.toLowerCase())) continue;

    seenConvoIds.add(convo.id);
    results.push({
      conversation_id: convo.id,
      message_id: null,
      title,
      dominant_employee: (convo.dominant_employee as string | null) ?? null,
      updated_at: (convo.updated_at as string | null) ?? null,
      snippet: title,
      match_type: "title",
    });

    if (results.length >= MAX_RESULTS) break;
  }

  // Sort by updated_at descending before returning.
  results.sort((a, b) => {
    const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return tb - ta;
  });

  return NextResponse.json({ results: results.slice(0, MAX_RESULTS) });
}
