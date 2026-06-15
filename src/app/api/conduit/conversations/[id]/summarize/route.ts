import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { complete } from "@/lib/ai/provider";

export const runtime = "nodejs";

const MIN_MESSAGES = 4;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/conduit/conversations/[id]/summarize
// Called fire-and-forget when the user switches away from a conversation
// with ≥4 messages. Generates a 2-sentence summary and saves it to
// conduit_memory so future specialists have long-term context.
export async function POST(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  // Verify ownership
  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id, account_id, title")
    .eq("id", id)
    .maybeSingle();
  if (!convo || convo.account_id !== account.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Idempotent: skip if we already have a summary for this conversation
  const { count: existingCount } = await supabase
    .from("conduit_memory")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id)
    .eq("source_conversation_id", id)
    .contains("tags", ["conversation_summary"])
    .is("archived_at", null);
  if ((existingCount ?? 0) > 0) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Load the conversation messages (up to 30 pairs)
  const { data: msgs } = await supabase
    .from("conduit_messages")
    .select("role, employee, content")
    .eq("conversation_id", id)
    .is("hidden_at", null)
    .order("created_at", { ascending: true })
    .limit(60);

  const messages = msgs ?? [];
  if (messages.length < MIN_MESSAGES) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Identify the primary specialist (most frequent non-jarvis employee)
  const employeeCounts: Record<string, number> = {};
  for (const m of messages) {
    if (m.role === "assistant" && m.employee && m.employee !== "jarvis") {
      employeeCounts[m.employee] = (employeeCounts[m.employee] ?? 0) + 1;
    }
  }
  const primaryEmployee =
    Object.entries(employeeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "jarvis";

  // Build a compact transcript for the LLM
  const transcript = messages
    .map((m) => {
      const speaker = m.role === "user" ? "Owner" : (m.employee ?? "Specialist");
      const text = (m.content as string).slice(0, 400);
      return `${speaker}: ${text}`;
    })
    .join("\n");

  let summary: string;
  try {
    const res = await complete({
      messages: [
        {
          role: "user",
          content: `Summarize this specialist conversation in exactly 2 sentences. Focus on what was discussed and any decisions or actions taken. Be concrete and specific to this business.\n\nConversation:\n${transcript}`,
        },
      ],
      systemPrompt:
        "You write concise 2-sentence summaries of AI specialist conversations for long-term memory storage. Output only the summary — no preamble, no bullet points, no headers.",
      metadata: {
        employee: "jarvis",
        accountId: account.id,
        creatorMode: account.creator_mode,
        creatorModeVersion: account.creator_mode_version ?? 1,
        intent: "factual",
        internalAccount: Boolean(account.internal_account),
      },
      maxTokens: 200,
    });
    summary = res.content.trim();
  } catch (err) {
    console.error("conversation_summarize_failed", err);
    return NextResponse.json({ error: "summary_failed" }, { status: 500 });
  }

  if (!summary || summary.length < 10) {
    return NextResponse.json({ error: "empty_summary" }, { status: 500 });
  }

  await supabase.from("conduit_memory").insert({
    account_id: account.id,
    kind: "context",
    content: summary,
    tags: ["conversation_summary", primaryEmployee],
    source_conversation_id: id,
    written_by: "auto-summary",
  });

  return NextResponse.json({ ok: true });
}
