import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { complete } from "@/lib/ai/provider";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/conduit/conversations/[id]/title
// Called fire-and-forget after the first AI response in a new conversation.
// Generates a ≤5-word noun-phrase title and PATCHes conduit_conversations.title.
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

  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id, account_id")
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

  let title: string;
  try {
    const res = await complete({
      systemPrompt:
        "You write ultra-short conversation titles. Return ONLY the title — no quotes, no punctuation at the end, no preamble.",
      messages: [
        {
          role: "user",
          content: `Summarize this conversation in 5 words or fewer as a noun phrase.\n\nUser: ${firstUser.content.slice(0, 500)}\nAssistant: ${firstAssistant.content.slice(0, 500)}`,
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
