import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { EMPLOYEES } from "@/lib/conduit/employees";
import type { EmployeeKey } from "@/lib/ai/provider";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  let body: { targetEmployee?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { targetEmployee } = body;
  if (!targetEmployee || typeof targetEmployee !== "string") {
    return NextResponse.json({ error: "targetEmployee required" }, { status: 400 });
  }

  // Verify ownership
  const { data: origConvo } = await supabase
    .from("conduit_conversations")
    .select("id, account_id, title, dominant_employee")
    .eq("id", id)
    .maybeSingle();

  if (!origConvo || origConvo.account_id !== account.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Don't allow double-handoff
  const { data: existingHandoff } = await supabase
    .from("conduit_conversations")
    .select("handoff_conversation_id")
    .eq("id", id)
    .maybeSingle();
  if (existingHandoff?.handoff_conversation_id) {
    return NextResponse.json({ error: "already_handed_off" }, { status: 409 });
  }

  // Load last 6 visible messages to build a brief context summary
  const { data: msgRows } = await supabase
    .from("conduit_messages")
    .select("role, employee, content")
    .eq("conversation_id", id)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(6);

  const recentMessages = (msgRows ?? []).reverse();

  // Build a plain-text context summary (no AI call — deterministic)
  const fromEmployee = origConvo.dominant_employee as EmployeeKey | null;
  const fromName = fromEmployee
    ? (EMPLOYEES[fromEmployee as keyof typeof EMPLOYEES]?.name ?? fromEmployee)
    : "Praxis";
  const toEmployee = targetEmployee as EmployeeKey;
  const toName =
    (EMPLOYEES[toEmployee as keyof typeof EMPLOYEES]?.name ?? targetEmployee);

  const excerpts = recentMessages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-4)
    .map((m) => {
      const label = m.role === "user" ? "Founder" : fromName;
      const text = (m.content as string).slice(0, 200);
      return `${label}: ${text}${(m.content as string).length > 200 ? "…" : ""}`;
    })
    .join("\n\n");

  const contextSummary = `This conversation was handed off from ${fromName} to ${toName}.

Recent context:
${excerpts || "(No messages yet)"}

Continue helping the founder from where ${fromName} left off, now as ${toName}.`;

  // Create the new conversation
  const newTitle = origConvo.title
    ? `↪ ${origConvo.title} (${toName})`
    : `Continued with ${toName}`;

  const { data: newConvo, error: createErr } = await supabase
    .from("conduit_conversations")
    .insert({
      account_id: account.id,
      title: newTitle,
      dominant_employee: targetEmployee,
    })
    .select("id")
    .single();

  if (createErr || !newConvo) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  // Insert context as a system message in the new conversation
  const { error: msgErr } = await supabase.from("conduit_messages").insert({
    conversation_id: newConvo.id,
    role: "system",
    employee: targetEmployee,
    content: contextSummary,
  });

  if (msgErr) {
    // Roll back the new conversation on failure
    await supabase.from("conduit_conversations").delete().eq("id", newConvo.id);
    return NextResponse.json({ error: "context_failed" }, { status: 500 });
  }

  // Mark the original conversation as handed off
  const { error: updateErr } = await supabase
    .from("conduit_conversations")
    .update({
      handoff_conversation_id: newConvo.id,
      handoff_employee: targetEmployee,
    })
    .eq("id", id)
    .eq("account_id", account.id);

  if (updateErr) {
    // Conversation created but handoff flag not set — non-fatal; new convo still works
    console.error("[handoff] failed to update original conversation:", updateErr);
  }

  return NextResponse.json({ newConversationId: newConvo.id });
}
