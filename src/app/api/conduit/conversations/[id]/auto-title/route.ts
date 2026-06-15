import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { complete } from "@/lib/ai/provider";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// PATCH /api/conduit/conversations/[id]/auto-title
// Fire-and-forget after the first AI response in a new conversation.
// Generates a ≤6-word noun-phrase title and patches conduit_conversations.title.
// Guard: skips if the title has already been user-edited (doesn't match the
// first-message placeholder that the chat route writes on conversation create).
export async function PATCH(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id, account_id, title")
    .eq("id", id)
    .maybeSingle();
  if (!convo || convo.account_id !== account.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: msgs } = await supabase
    .from("conduit_messages")
    .select("role, content")
    .eq("conversation_id", id)
    .is("hidden_at", null)
    .order("created_at", { ascending: true })
    .limit(4);

  const messages: { role: string; content: string }[] = msgs ?? [];
  const firstUser = messages.find((m) => m.role === "user");
  const firstAssistant = messages.find((m) => m.role === "assistant");
  if (!firstUser || !firstAssistant) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Skip if the title has been user-edited (no longer matches the placeholder
  // the chat route writes: first 60 chars of the opening user message).
  const placeholder = firstUser.content.slice(0, 60);
  if (convo.title !== null && convo.title !== placeholder) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let title: string;
  try {
    const res = await complete({
      systemPrompt:
        "You write ultra-short conversation titles. Return ONLY the title — no quotes, no punctuation at the end, no preamble.",
      messages: [
        {
          role: "user",
          content: `Summarize this conversation in 6 words or fewer as a noun phrase.\n\nUser: ${firstUser.content.slice(0, 500)}\nAssistant: ${firstAssistant.content.slice(0, 500)}`,
        },
      ],
      metadata: {
        employee: "jarvis",
        accountId: account.id,
        creatorMode: false,
        creatorModeVersion: 1,
        intent: "routing",
        tierCeiling: "haiku",
        internalAccount: false,
      },
      maxTokens: 20,
    });
    title = res.content
      .trim()
      .replace(/^["']|["']$/g, "")
      .slice(0, 60);
  } catch {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!title) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await supabase
    .from("conduit_conversations")
    .update({ title })
    .eq("id", id)
    .eq("account_id", account.id);

  return NextResponse.json({ ok: true, title });
}
