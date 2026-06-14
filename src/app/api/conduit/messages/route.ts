import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const PAGE_SIZE = 30;

// GET /api/conduit/messages?conversation_id=<id>&before_id=<message_id>
// Returns the PAGE_SIZE messages that come before the given message ID,
// ordered ascending (oldest first) so the caller can prepend them.
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  const { searchParams } = req.nextUrl;
  const conversationId = searchParams.get("conversation_id");
  const beforeId = searchParams.get("before_id");

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversation_id required" },
      { status: 400 },
    );
  }

  // Verify the conversation belongs to the current account.
  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!convo) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Fetch the cursor message's created_at so we can use it for comparison.
  // Cursor = (created_at, id) to avoid drift on ties.
  let cursorCreatedAt: string | null = null;
  if (beforeId) {
    const { data: cursor } = await supabase
      .from("conduit_messages")
      .select("created_at")
      .eq("id", beforeId)
      .maybeSingle();
    cursorCreatedAt = cursor?.created_at ?? null;
  }

  let query = supabase
    .from("conduit_messages")
    .select("id, role, employee, content, metadata, created_at")
    .eq("conversation_id", conversationId)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1); // fetch one extra to determine hasMore

  if (cursorCreatedAt) {
    // Messages strictly before the cursor (older than the oldest known message).
    query = query.lt("created_at", cursorCreatedAt);
  }

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const hasMore = (rows?.length ?? 0) > PAGE_SIZE;
  const page = (rows ?? []).slice(0, PAGE_SIZE);

  // Fetch artifacts for these messages.
  const messageIds = page.map((r) => r.id);
  let artifactsByMsg: Record<
    string,
    { id: string; title: string; type: string }[]
  > = {};
  if (messageIds.length) {
    const { data: arts } = await supabase
      .from("conduit_artifacts")
      .select("id, title, type, message_id")
      .in("message_id", messageIds);
    artifactsByMsg = (arts ?? []).reduce(
      (acc, a) => {
        const mid = a.message_id as string | null;
        if (!mid) return acc;
        (acc[mid] = acc[mid] || []).push({
          id: a.id,
          title: a.title,
          type: a.type,
        });
        return acc;
      },
      {} as Record<string, { id: string; title: string; type: string }[]>,
    );
  }

  // Fetch existing feedback reactions for these messages.
  let feedbackByMsg: Record<string, 1 | -1> = {};
  if (messageIds.length) {
    try {
      const { data: feedbackRows } = await supabase
        .from("conduit_message_feedback")
        .select("message_id, rating")
        .in("message_id", messageIds)
        .eq("account_id", account.id);
      feedbackByMsg = (feedbackRows ?? []).reduce(
        (acc, f) => {
          acc[f.message_id as string] = f.rating as 1 | -1;
          return acc;
        },
        {} as Record<string, 1 | -1>,
      );
    } catch {
      // Non-fatal: feedback hydration failure doesn't block message load.
    }
  }

  // Return in ascending order (oldest first) so the caller prepends correctly.
  const messages = page.reverse().map((r) => ({
    id: r.id,
    role: r.role,
    employee: r.employee,
    content: r.content,
    metadata: r.metadata,
    artifacts: artifactsByMsg[r.id],
    feedback: feedbackByMsg[r.id] ?? null,
  }));

  return NextResponse.json({ messages, hasMore });
}
