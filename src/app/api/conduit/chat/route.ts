import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getOrCreateAccount,
  rollBillingCycleIfDue,
  userDisplayName,
} from "@/lib/conduit/account";
import {
  type ChatMessage,
  type EmployeeKey,
  friendlyErrorFor,
  maxTokensFor,
  streamComplete,
} from "@/lib/ai/provider";
import { systemPromptFor } from "@/lib/ai/employees";
import type { AccountContext } from "@/lib/ai/employees/jarvis";
import { parseHandoff, parseArtifacts } from "@/lib/ai/parse";
import { estimateCostCents } from "@/lib/ai/pricing";
import { classifyIntent, type IntentClass } from "@/lib/ai/intent-classifier";
import { tierById } from "@/lib/billing/tiers";

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

  const initialAccount = await getOrCreateAccount(supabase, user);
  if (!initialAccount.business_type || !initialAccount.business_description) {
    return NextResponse.json(
      { error: "onboarding_required" },
      { status: 409 },
    );
  }
  const account = await rollBillingCycleIfDue(supabase, initialAccount);
  const businessType = account.business_type ?? initialAccount.business_type;
  const businessDescription =
    account.business_description ?? initialAccount.business_description;

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
    .limit(11);

  const ordered = (history ?? []).slice().reverse();

  const ctx: AccountContext = {
    user_name: userDisplayName(user),
    account_name: account.name,
    business_type: businessType,
    business_description: businessDescription,
    allowed_employees: account.internal_account
      ? [
          "jarvis",
          "marketing",
          "sales",
          "engineering",
          "finance",
          "compliance",
          "hr",
          "ops",
          "legal",
        ]
      : tierById(account.tier_id).allowedEmployees,
    tier_id: account.tier_id,
  };

  const employeeOverride = body.employee_override;
  const initialEmployee: EmployeeKey =
    employeeOverride && VALID_EMPLOYEES.includes(employeeOverride)
      ? employeeOverride
      : "jarvis";

  const accountId = account.id;
  const finalConvId = conversationId;
  const creatorMode = account.creator_mode;
  const creatorModeVersion = account.creator_mode_version ?? 1;
  const internalAccount = Boolean(account.internal_account);
  const tier = tierById(account.tier_id);
  // Effective allowance = tier monthly + bonus (top-ups). Internal accounts
  // get the legacy R3 monthly_token_cap as a hard floor (5M for Luis).
  const effectiveAllowance = internalAccount
    ? Math.max(tier.monthlyTokenAllowance, account.monthly_token_cap)
    : tier.monthlyTokenAllowance + (account.bonus_tokens ?? 0);
  let tokensUsedThisCycle = account.monthly_tokens_used;

  // Conduit Adaptive — classify the user's intent once per turn.
  // The same intent flows through Jarvis routing → handed-off employee.
  const intent: IntentClass = await classifyIntent(message, {
    employee: initialEmployee,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(enc.encode(sseEvent(event, data)));

      const runEmployee = async (
        employee: EmployeeKey,
        extraSystem?: string,
      ): Promise<{ ok: boolean }> => {
        // Tier gate: employee allowed for this account?
        if (
          !internalAccount &&
          !tier.allowedEmployees.includes(employee)
        ) {
          send("paywall_required", {
            reason: "employee_locked",
            employee,
            tier_id: tier.id,
            message: `${employee.charAt(0).toUpperCase() + employee.slice(1)} is a Pro feature. Upgrade to unlock the full team.`,
          });
          return { ok: false };
        }

        // Pre-flight token cap check
        if (
          !internalAccount &&
          tokensUsedThisCycle >= effectiveAllowance
        ) {
          send("paywall_required", {
            reason: "cap_reached",
            tier_id: tier.id,
            tokens_used: tokensUsedThisCycle,
            tokens_allowance: effectiveAllowance,
            message: `You've used all ${effectiveAllowance.toLocaleString()} tokens this month. Upgrade for more, or top up to keep working.`,
          });
          return { ok: false };
        }

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
        let cacheReadTokens = 0;
        let cacheCreationTokens = 0;
        let modelUsed = "";
        let providerUsed = "anthropic";

        // Per-employee intent shaping — Marketing always 'creative',
        // Engineering always 'code'. Otherwise carry the user's classified intent.
        const turnIntent: IntentClass =
          employee === "marketing"
            ? "creative"
            : employee === "engineering"
              ? "code"
              : intent;

        // Soft model-lock signal: if the ideal model exceeds tier ceiling
        // (e.g. Free user asks a reasoning question), emit paywall_required
        // ONCE but continue with the downgraded model so the user still gets
        // an answer.
        if (
          !internalAccount &&
          (turnIntent === "reasoning" || turnIntent === "code") &&
          tier.modelCeiling === "haiku"
        ) {
          send("paywall_required", {
            reason: "model_locked",
            tier_id: tier.id,
            intent: turnIntent,
            message:
              "Strategic reasoning is a Pro feature. Upgrade to unlock adaptive routing — or keep going on the lighter model.",
          });
        }

        try {
          for await (const chunk of streamComplete({
            messages,
            systemPrompt,
            metadata: {
              employee,
              accountId,
              creatorMode,
              creatorModeVersion,
              intent: turnIntent,
              tierCeiling: tier.modelCeiling,
              internalAccount,
            },
            maxTokens: maxTokensFor(employee),
          })) {
            if (chunk.delta) {
              fullText += chunk.delta;
              send("token", { employee, delta: chunk.delta });
            }
            if (chunk.done) {
              inputTokens = chunk.inputTokens ?? 0;
              outputTokens = chunk.outputTokens ?? 0;
              cacheReadTokens = chunk.cacheReadTokens ?? 0;
              cacheCreationTokens = chunk.cacheCreationTokens ?? 0;
              modelUsed = chunk.model ?? "";
              providerUsed = chunk.provider ?? "anthropic";
            }
          }
        } catch (err) {
          console.error(`[${employee}] stream error`, err);
          send("error", { employee, message: friendlyErrorFor(employee) });
          return { ok: false };
        }

        const { visibleContent: afterHandoff, handoff } =
          employee === "jarvis"
            ? parseHandoff(fullText)
            : { visibleContent: fullText.trim(), handoff: undefined };
        const { visibleContent, artifacts } = parseArtifacts(afterHandoff);

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

        // Usage event — always log a row, even if a stream emits 0 tokens
        // (better to see "0 / 0 / model" than miss the event entirely).
        const totalChargeable = inputTokens + outputTokens;
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
            cacheReadTokens,
            cacheCreationTokens,
          ),
          metadata: {
            cache_read_input_tokens: cacheReadTokens,
            cache_creation_input_tokens: cacheCreationTokens,
            creator_mode: creatorMode,
            creator_mode_version: creatorModeVersion,
            intent: turnIntent,
            user_intent: intent,
          },
        });

        // Increment running cap counter (chargeable = input + output, cache reads not counted toward cap)
        tokensUsedThisCycle += totalChargeable;
        await supabase
          .from("conduit_accounts")
          .update({ monthly_tokens_used: tokensUsedThisCycle })
          .eq("id", accountId);

        ordered.push({
          role: "assistant",
          employee,
          content: visibleContent,
          created_at: new Date().toISOString(),
        });

        send("message_end", { employee });

        if (handoff) {
          send("handoff", { to: handoff.to, brief: handoff.brief });
          await runEmployee(handoff.to, handoff.brief);
        }
        return { ok: true };
      };

      try {
        await runEmployee(initialEmployee);
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
