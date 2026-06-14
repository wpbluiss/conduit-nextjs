import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { EMPLOYEES } from "@/lib/conduit/employees";
import type { EmployeeKey } from "@/lib/ai/provider";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// POST /api/conduit/messages/[id]/handoff
// Creates a new conversation pre-loaded with the quoted specialist message,
// pins it to the target specialist, and logs the handoff in the source message metadata.
export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { id: messageId } = await ctx.params;

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

  // Verify message exists and belongs to this account.
  const { data: msg } = await supabase
    .from("conduit_messages")
    .select("id, conversation_id, role, employee, content, metadata")
    .eq("id", messageId)
    .maybeSingle();

  if (!msg) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Verify conversation ownership.
  const { data: convo } = await supabase
    .from("conduit_conversations")
    .select("id, account_id, title")
    .eq("id", msg.conversation_id)
    .maybeSingle();

  if (!convo || convo.account_id !== account.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Only allow handoff from assistant messages.
  if (msg.role !== "assistant") {
    return NextResponse.json({ error: "only_assistant_messages" }, { status: 400 });
  }

  const fromEmployee = (msg.employee ?? "jarvis") as EmployeeKey;
  const toEmployee = targetEmployee as EmployeeKey;
  const fromName = (EMPLOYEES[fromEmployee as keyof typeof EMPLOYEES]?.name ?? fromEmployee);
  const toName = (EMPLOYEES[toEmployee as keyof typeof EMPLOYEES]?.name ?? targetEmployee);

  const quotedContent = (msg.content as string).slice(0, 800);
  const contextMessage = `This task was handed off from ${fromName} to ${toName}.

${fromName} said:
"${quotedContent}${(msg.content as string).length > 800 ? "…" : ""}"

Continue from here as ${toName}.`;

  // Create new conversation pinned to the target specialist.
  const newTitle = convo.title
    ? `↪ ${convo.title} (${toName})`
    : `Handed off to ${toName}`;

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

  // Insert the context as a system message in the new conversation,
  // storing the source conversation + specialist for activity-feed display.
  await supabase.from("conduit_messages").insert({
    conversation_id: newConvo.id,
    role: "system",
    employee: targetEmployee,
    content: contextMessage,
    metadata: {
      source_conversation_id: convo.id,
      source_message_id: messageId,
      source_specialist: fromEmployee,
    },
  });

  // Log the handoff in the source message metadata.
  const existingMeta = ((msg.metadata ?? {}) as Record<string, unknown>);
  await supabase
    .from("conduit_messages")
    .update({
      metadata: {
        ...existingMeta,
        handoff: {
          to: targetEmployee,
          conversation_id: newConvo.id,
        },
      },
    })
    .eq("id", messageId);

  return NextResponse.json({ newConversationId: newConvo.id });
}
