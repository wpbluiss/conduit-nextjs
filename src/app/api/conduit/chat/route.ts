import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount, userDisplayName } from "@/lib/conduit/account";
import {
  type ChatMessage,
  type EmployeeKey,
  friendlyErrorFor,
  streamComplete,
} from "@/lib/ai/provider";
import { systemPromptFor } from "@/lib/ai/employees";
import type { AccountContext } from "@/lib/ai/employees/jarvis";
import { parseHandoff, parseArtifacts } from "@/lib/ai/parse";
import { estimateCostCents } from "@/lib/ai/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EMPLOYEES: EmployeeKey[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
];

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
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
    conversation_id?: string;
    message?: string;
    employee_override?: EmployeeKey;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }

  const account = await getOrCreateAccount(supabase, user);
  if (!account.business_type || !account.business_description) {
    return NextResponse.json(
      { error: "onboarding_required" },
      { status: 409 },
    );
  }

  // Get or create conversation
  let conversationId = body.conversation_id;
  if (!conversationId) {
    const title = message.slice(0, 60);
    const { data, error } = await supabase
      .from("conduit_conversations")
      .insert({ account_id: account.id, title })
      .select("id")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
    conversationId = data.id as string;
  } else {
    // Verify ownership
    const { data: convo } = await supabase
      .from("conduit_conversations")
      .select("id, account_id")
      .eq("id", conversationId)
      .single();
    if (!convo || convo.account_id !== account.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }

  // Insert user message
  await supabase.from("conduit_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
  });

  // Load last 10 messages of context
  const { data: history } = await supabase
    .from("conduit_messages")
    .select("role, employee, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(11); // include the just-inserted one

  const ordered = (history ?? []).slice().reverse();

  const ctx: AccountContext = {
    user_name: userDisplayName(user),
    account_name: account.name,
    business_type: account.business_type,
    business_description: account.business_description,
  };

  const employeeOverride = body.employee_override;
  const initialEmployee: EmployeeKey =
    employeeOverride && VALID_EMPLOYEES.includes(employeeOverride)
      ? employeeOverride
      : "jarvis";

  const accountId = account.id;
  const finalConvId = conversationId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(enc.encode(sseEvent(event, data)));

      const runEmployee = async (
        employee: EmployeeKey,
        extraSystem?: string,
      ): Promise<{ ok: boolean }> => {
        const messages: ChatMessage[] = ordered.map((m) => ({
          role:
            m.role === "system"
              ? "system"
              : m.role === "assistant"
                ? "assistant"
                : "user",
          content:
            m.role === "assistant" && m.employee
              ? `[${m.employee.toUpperCase()}]: ${m.content}`
              : m.content,
        }));

        const baseSystem = systemPromptFor(employee, ctx);
        const systemPrompt = extraSystem
          ? `${baseSystem}\n\n--- Brief from Jarvis ---\n${extraSystem}`
          : baseSystem;

        let fullText = "";
        let inputTokens = 0;
        let outputTokens = 0;
        let modelUsed = "";
        let providerUsed = "anthropic";

        try {
          for await (const chunk of streamComplete({
            messages,
            systemPrompt,
            metadata: { employee, accountId },
            maxTokens: employee === "marketing" ? 4096 : 2048,
          })) {
            if (chunk.delta) {
              fullText += chunk.delta;
              send("token", { employee, delta: chunk.delta });
            }
            if (chunk.done) {
              inputTokens = chunk.inputTokens ?? 0;
              outputTokens = chunk.outputTokens ?? 0;
              modelUsed = chunk.model ?? "";
              providerUsed = chunk.provider ?? "anthropic";
            }
          }
        } catch (err) {
          console.error(`[${employee}] stream error`, err);
          send("error", { employee, message: friendlyErrorFor(employee) });
          return { ok: false };
        }

        // Parse handoff (Jarvis only) + artifacts
        const { visibleContent: afterHandoff, handoff } =
          employee === "jarvis"
            ? parseHandoff(fullText)
            : { visibleContent: fullText.trim(), handoff: undefined };
        const { visibleContent, artifacts } = parseArtifacts(afterHandoff);

        // Persist message
        const { data: insertedMsg } = await supabase
          .from("conduit_messages")
          .insert({
            conversation_id: finalConvId,
            role: "assistant",
            employee,
            content: visibleContent,
            metadata: handoff ? { handoff } : {},
          })
          .select("id")
          .single();

        // Persist artifacts
        for (const art of artifacts) {
          const { data: artRow } = await supabase
            .from("conduit_artifacts")
            .insert({
              account_id: accountId,
              conversation_id: finalConvId,
              message_id: insertedMsg?.id ?? null,
              type: art.type,
              title: art.title,
              content: art.content,
              produced_by: employee,
            })
            .select("id, type, title")
            .single();
          if (artRow) {
            send("artifact", {
              id: artRow.id,
              type: artRow.type,
              title: artRow.title,
              employee,
            });
          }
        }

        // Usage event
        if (inputTokens || outputTokens) {
          await supabase.from("conduit_usage_events").insert({
            account_id: accountId,
            employee,
            provider: providerUsed,
            model: modelUsed,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            estimated_cost_cents: estimateCostCents(
              providerUsed as "anthropic",
              modelUsed,
              inputTokens,
              outputTokens,
            ),
          });
        }

        // Push the freshly visible content into the in-memory ordered history
        // so a follow-on employee call has it.
        ordered.push({
          role: "assistant",
          employee,
          content: visibleContent,
          created_at: new Date().toISOString(),
        });

        send("message_end", { employee });

        // Trigger handoff
        if (handoff) {
          send("handoff", { to: handoff.to, brief: handoff.brief });
          await runEmployee(handoff.to, handoff.brief);
        }
        return { ok: true };
      };

      try {
        await runEmployee(initialEmployee);
        // Bump conversation updated_at
        await supabase
          .from("conduit_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", finalConvId);

        send("done", { conversation_id: finalConvId });
        controller.close();
      } catch (err) {
        console.error("chat fatal", err);
        send("error", { message: friendlyErrorFor(initialEmployee) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
