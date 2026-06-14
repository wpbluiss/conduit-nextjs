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
import { checkChatRateLimit } from "@/lib/ai/chat-rate-limit";
import { tierById } from "@/lib/billing/tiers";
import {
  executeBuild,
  heuristicTemplateMatch,
  isEngineeringConfigured,
  type BuildEvent,
} from "@/lib/builds/executor";
import { getTemplate } from "@/lib/builds/templates";
import { complete } from "@/lib/ai/provider";
import { withTimeAware } from "@/lib/ai/employees/time-aware";
import { insertNotification } from "@/lib/conduit/notifications";
import {
  checkRateLimit,
  isTeamQuery,
  roundTableBrief,
  selectParticipants,
  synthesisBrief,
} from "@/lib/ai/roundtable";
import {
  memoriesForEmployee,
  parseMemoryWrites,
  renderMemoryBlock,
  trimMemoriesForPrompt,
  type MemoryRecord,
} from "@/lib/ai/memory";
import {
  getConnectorToken,
  getUpcomingEvents,
  renderCalendarBlock,
} from "@/lib/connectors/google-calendar";
import {
  prepareChatTts,
  streamForEmployee,
  type ChatTtsConfig,
} from "@/lib/voice/chat-tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EMPLOYEES: EmployeeKey[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
  "finance",
  "compliance",
  "hr",
  "ops",
  "legal",
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
    employee_override?: EmployeeKey | "team";
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

  // Per-account request-rate limit (issue #19). Runs before any conversation
  // insert or model call so a hammering account costs us nothing. Internal
  // accounts (e.g. Luis) are exempt so dogfooding/automation isn't throttled.
  if (!account.internal_account) {
    const rl = checkChatRateLimit(account.id);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: `You're sending messages too quickly. Give the team a moment and try again in ~${rl.retryInSeconds}s.`,
          retry_after_seconds: rl.retryInSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryInSeconds),
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
          },
        },
      );
    }
  }

  const businessType = account.business_type ?? initialAccount.business_type;
  const businessDescription =
    account.business_description ?? initialAccount.business_description;

  // Get or create conversation
  let conversationId = body.conversation_id;
  const isNewConversation = !conversationId;
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

  // Load last 10 messages of context (exclude soft-hidden edit branches)
  const { data: history } = await supabase
    .from("conduit_messages")
    .select("role, employee, content, created_at")
    .eq("conversation_id", conversationId)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(11);

  const ordered = (history ?? []).slice().reverse();

  // R10: load memory once per turn for system-prompt injection.
  // R17: load with scope, then build per-employee blocks lazily.
  const { data: memoryRows } = await supabase
    .from("conduit_memory")
    .select(
      "id, account_id, kind, content, tags, source_conversation_id, source_message_id, written_by, created_at, updated_at, archived_at, superseded_by, pinned, locked, position_x, position_y",
    )
    .eq("account_id", account.id)
    .is("archived_at", null)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);
  const memIds = (memoryRows ?? []).map((m) => m.id as string);
  const { data: scopeRows } = memIds.length
    ? await supabase
        .from("conduit_memory_scope")
        .select("memory_id, employee_id")
        .in("memory_id", memIds)
    : { data: [] as { memory_id: string; employee_id: string }[] };
  const scopeMap = new Map<string, EmployeeKey[]>();
  for (const r of scopeRows ?? []) {
    const arr = scopeMap.get(r.memory_id as string) ?? [];
    arr.push(r.employee_id as EmployeeKey);
    scopeMap.set(r.memory_id as string, arr);
  }
  const allMemoriesWithScope: MemoryRecord[] = (memoryRows ?? []).map(
    (m) =>
      ({
        ...m,
        scope: scopeMap.get(m.id as string) ?? [],
      }) as MemoryRecord,
  );
  // memoryBlockFor returns the per-employee filtered + trimmed prompt block.
  // Atlas (jarvis) sees everything; other employees see global + their-scope.
  const memoryBlockFor = (employeeId: EmployeeKey): string =>
    renderMemoryBlock(
      trimMemoriesForPrompt(
        memoriesForEmployee(allMemoriesWithScope, employeeId),
      ),
    );

  // Load Google Calendar context for ops specialist (and Atlas who routes to ops).
  // Only fetches if a token exists; silently skips on error.
  const calendarEmployees = new Set<EmployeeKey>(["ops", "jarvis"]);
  let calendarBlock = "";
  const gcalToken = await getConnectorToken(supabase, account.id, "google_calendar");
  if (gcalToken) {
    try {
      const events = await getUpcomingEvents(supabase, gcalToken, 10);
      calendarBlock = renderCalendarBlock(events);
    } catch {
      // Non-fatal: continue without calendar context.
    }
  }

  const ctx: AccountContext = {
    user_name: userDisplayName(user),
    account_name: account.name,
    business_type: businessType,
    business_description: businessDescription,
    company_brief: account.company_brief ?? null,
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
    onboarding_goals: account.onboarding_goals ?? null,
    specialist_prefs: account.specialist_prefs ?? null,
  };

  const employeeOverride = body.employee_override;
  // Team round-table: explicit pin OR heuristic detection in user message.
  const teamRequested =
    employeeOverride === "team" || isTeamQuery(message);
  const initialEmployee: EmployeeKey =
    employeeOverride &&
    employeeOverride !== "team" &&
    VALID_EMPLOYEES.includes(employeeOverride as EmployeeKey)
      ? (employeeOverride as EmployeeKey)
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
  // The same intent flows through Atlas routing → handed-off employee.
  const intent: IntentClass = await classifyIntent(message, {
    employee: initialEmployee,
  });

  // R13: prepare per-account streaming TTS config once per request.
  // Cheap (one batched DB read) and a no-op when voice is off / capped.
  const ttsCfg: ChatTtsConfig = await prepareChatTts(supabase, account);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(enc.encode(sseEvent(event, data)));

      // Engineering: run a real build via templates + GitHub + Vercel.
      // Inserts conduit_builds + conduit_build_events rows; persists a
      // build artifact + the final assistant message; emits build_event
      // SSE events to the client. Returns true on success/handled, false
      // if upstream failed and we should NOT fall through to the LLM.
      const runBuild = async (
        templateId: string,
        userMessage: string,
      ): Promise<boolean> => {
        const tmpl = getTemplate(templateId);
        if (!tmpl) return false;

        // Insert intro assistant message + DB build row
        const intro = `On it. Building a ${tmpl.meta.name.toLowerCase()} for ${ctx.account_name}. ETA ~${tmpl.meta.estimated_build_time_seconds}s.`;
        const { data: introMsg } = await supabase
          .from("conduit_messages")
          .insert({
            conversation_id: finalConvId,
            role: "assistant",
            employee: "engineering",
            content: intro,
            metadata: { build: { template: templateId, status: "starting" } },
          })
          .select("id")
          .single();
        send("token", { employee: "engineering", delta: intro });
        send("message_end", { employee: "engineering" });

        const baseSlug =
          ctx.account_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) ||
          "build";
        const { data: buildRow } = await supabase
          .from("conduit_builds")
          .insert({
            account_id: accountId,
            conversation_id: finalConvId,
            message_id: introMsg?.id ?? null,
            template_id: templateId,
            build_name: `${ctx.account_name} ${tmpl.meta.name}`,
            build_slug: `${baseSlug}-${Date.now().toString(36).slice(-5)}`,
            status: "building",
            config: {},
          })
          .select("id, build_slug")
          .single();

        if (!buildRow) {
          send("error", {
            employee: "engineering",
            message: "Couldn't initialise the build. Try again.",
          });
          return false;
        }

        const buildId = buildRow.id as string;

        // Optional: Marketing handoff for copy-heavy templates.
        let config: Record<string, unknown> = {
          business_name: ctx.account_name,
        };
        if (tmpl.meta.marketing_handoff.length > 0) {
          send("build_event", {
            type: "marketing_briefed",
            message: "Pulling Marketing in for the copy.",
          });
          try {
            const m = await complete({
              messages: [
                {
                  role: "user",
                  content: `Generate JSON for these fields ONLY: ${tmpl.meta.marketing_handoff.join(", ")}.\n\nBusiness: ${ctx.account_name} (${ctx.business_type}). Note: ${ctx.business_description}.\n\nUser request: ${userMessage}\n\nRespond with VALID JSON only — no preamble, no code fences.`,
                },
              ],
              systemPrompt: `You are the Marketing employee. Output ONLY a JSON object with the requested fields. No preamble, no code fences, no commentary. For "features" use an array of {title, body} objects. For text fields, write real copy that fits a ${ctx.business_type} business.`,
              metadata: {
                employee: "marketing",
                accountId,
                creatorMode,
                creatorModeVersion,
                intent: "creative",
                tierCeiling: tier.modelCeiling,
                internalAccount,
              },
              maxTokens: 1500,
            });
            const stripped = m.content
              .trim()
              .replace(/^```(?:json)?\s*/i, "")
              .replace(/```\s*$/i, "");
            try {
              const parsed = JSON.parse(stripped);
              config = { ...config, ...parsed, business_name: ctx.account_name };
            } catch {
              // leave defaults
            }
          } catch {
            // marketing call failed — proceed with defaults
          }
        }

        // Track event emit
        const recordEvent = async (e: BuildEvent) => {
          send("build_event", e);
          await supabase.from("conduit_build_events").insert({
            build_id: buildId,
            event_type: e.type,
            message: e.message,
            metadata: e.metadata ?? {},
          });
        };

        const result = await executeBuild({
          templateId,
          buildName: `${ctx.account_name} ${tmpl.meta.name}`,
          config,
          onProgress: recordEvent,
        });

        const updates: Record<string, unknown> = {
          status: result.ok ? "live" : "failed",
          updated_at: new Date().toISOString(),
        };
        if (result.liveUrl) updates.live_url = result.liveUrl;
        if (result.repoUrl) updates.github_repo_url = result.repoUrl;
        if (result.vercelProjectId)
          updates.vercel_project_id = result.vercelProjectId;
        if (result.vercelDeploymentId)
          updates.vercel_deployment_id = result.vercelDeploymentId;
        if (!result.ok) updates.error_message = result.error ?? "unknown";
        await supabase
          .from("conduit_builds")
          .update(updates)
          .eq("id", buildId);

        const finalContent = result.ok
          ? `Done. Live at ${result.liveUrl}. Repo at ${result.repoUrl}. Want me to add anything?`
          : `Build hit a snag (${result.error}). ${result.repoUrl ? `Repo is ready at ${result.repoUrl}, deploy may catch up shortly.` : "Try again in a moment."}`;

        const { data: finalMsg } = await supabase
          .from("conduit_messages")
          .insert({
            conversation_id: finalConvId,
            role: "assistant",
            employee: "engineering",
            content: finalContent,
            metadata: { build_id: buildId, build_status: result.ok ? "live" : "failed" },
          })
          .select("id")
          .single();
        send("token", { employee: "engineering", delta: "\n\n" + finalContent });

        // Persist a build artifact card so it appears in /app/artifacts too
        if (result.ok && result.liveUrl) {
          const { data: artRow } = await supabase
            .from("conduit_artifacts")
            .insert({
              account_id: accountId,
              conversation_id: finalConvId,
              message_id: finalMsg?.id ?? null,
              type: "build",
              title: `${ctx.account_name} ${tmpl.meta.name}`,
              content: `Live: ${result.liveUrl}\nRepo: ${result.repoUrl}\nTemplate: ${tmpl.meta.name}`,
              produced_by: "engineering",
              metadata: {
                build_id: buildId,
                live_url: result.liveUrl,
                repo_url: result.repoUrl,
              },
            })
            .select("id, type, title")
            .single();
          if (artRow) {
            send("artifact", {
              id: artRow.id,
              type: artRow.type,
              title: artRow.title,
              employee: "engineering",
            });
          }
        }
        // Fire-and-forget notification so it never blocks the stream response.
        insertNotification(supabase, {
          accountId,
          type: result.ok ? "build_complete" : "build_complete",
          title: result.ok
            ? `Build live: ${ctx.account_name} ${tmpl.meta.name}`
            : `Build failed: ${ctx.account_name} ${tmpl.meta.name}`,
          body: result.ok
            ? `Deployed at ${result.liveUrl}`
            : result.error ?? "Unknown error",
          href: result.ok ? result.liveUrl ?? "/app/builds" : "/app/builds",
        }).catch(() => {});

        send("message_end", { employee: "engineering" });
        return true;
      };

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

        // R7: Engineering build path. If the user's message matches a
        // template AND env is configured, run the build instead of the LLM.
        // Falls through to the LLM (descriptive mode) when:
        //  - no template matches
        //  - GitHub/Vercel env vars not present
        //  - Engineering not on the account's tier (caught by gate above)
        if (employee === "engineering" && isEngineeringConfigured()) {
          const templateId = heuristicTemplateMatch(message);
          if (templateId) {
            const ok = await runBuild(templateId, message);
            if (ok) return { ok: true };
            // ok=false means we already emitted error events; don't fall through.
            return { ok: false };
          }
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
        const withBrief = extraSystem
          ? `${baseSystem}\n\n--- Brief from Atlas ---\n${extraSystem}`
          : baseSystem;
        const withTime = withTimeAware(withBrief, {
          timezone: account.timezone || "America/New_York",
        });
        // R10: prepend memory block to ALL employees' prompts (read-only for
        // everyone except Atlas; Atlas's MEMORY INSTRUCTIONS section is
        // already baked into the employee body). Memory comes ahead of time
        // so the model has context before it sees the user's turn.
        // R17: per-employee filter — Atlas sees all; others see global +
        // their-scope only.
        // R-561: prepend Google Calendar block for ops + Atlas when connected.
        const calendarPrefix = calendarEmployees.has(employee) ? calendarBlock : "";
        const systemPrompt = calendarPrefix + memoryBlockFor(employee) + withTime;

        let fullText = "";
        let inputTokens = 0;
        let outputTokens = 0;
        let cacheReadTokens = 0;
        let cacheCreationTokens = 0;
        let modelUsed = "";
        let providerUsed = "anthropic";

        // R13: open a streaming TTS bridge for this employee turn. Returns
        // null if voice is off / over cap / upstream not configured. Audio
        // chunks fire as SSE `audio` events as soon as ElevenLabs starts
        // emitting (typically ~500-900ms after the first sentence completes).
        const ttsTurn = await streamForEmployee({
          cfg: ttsCfg,
          employee,
          sendAudio: (b64) => send("audio", { employee, pcm: b64 }),
        });
        if (ttsTurn) {
          send("audio_start", { employee });
        }

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
              ttsTurn?.onDelta(chunk.delta);
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
          ttsTurn?.cancel();
          send("error", { employee, message: friendlyErrorFor(employee) });
          return { ok: false };
        }

        // R13: flush remaining text + close the TTS WS, then log usage.
        // finish() awaits a 250ms drain so the last audio chunk gets out
        // before the SSE stream closes.
        if (ttsTurn) {
          try {
            const ttsResult = await ttsTurn.finish();
            send("audio_end", {
              employee,
              chars: ttsResult.chars,
              first_audio_ms: ttsResult.first_audio_ms,
            });
            await supabase.from("conduit_voice_chat_sessions").insert({
              account_id: accountId,
              conversation_id: finalConvId,
              employee,
              voice_id: ttsResult.voice_id,
              characters_streamed: ttsResult.chars,
              first_audio_latency_ms: ttsResult.first_audio_ms,
            });
          } catch (err) {
            console.error(`[chat-tts] ${employee} finish failed:`, err);
          }
        }

        const { visibleContent: afterHandoff, handoff } =
          employee === "jarvis"
            ? parseHandoff(fullText)
            : { visibleContent: fullText.trim(), handoff: undefined };
        // R10: parse memory writes ONLY from Atlas (id: "jarvis"). Other
        // employees can't mutate memory.
        const { visibleContent: afterMemory, remembers, supersedes } =
          employee === "jarvis"
            ? parseMemoryWrites(afterHandoff)
            : {
                visibleContent: afterHandoff,
                remembers: [],
                supersedes: [],
              };
        const { visibleContent, artifacts } = parseArtifacts(afterMemory);

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

        // Memory writes — execute after we have the message id for source linkage.
        for (const sup of supersedes) {
          // Verify the old memory belongs to this account before mutating.
          // R17: also check the locked flag — locked memories are user-
          // authoritative and Atlas cannot overwrite them.
          const { data: old } = await supabase
            .from("conduit_memory")
            .select("id, account_id, locked")
            .eq("id", sup.oldId)
            .maybeSingle();
          if (!old || old.account_id !== accountId) continue;
          if (old.locked) {
            console.warn(
              `[chat] skipped [SUPERSEDE] on locked memory ${sup.oldId}`,
            );
            continue;
          }

          const { data: newRow } = await supabase
            .from("conduit_memory")
            .insert({
              account_id: accountId,
              kind: sup.kind,
              content: sup.content,
              tags: sup.tags,
              source_conversation_id: finalConvId,
              source_message_id: insertedMsg?.id ?? null,
              written_by: "jarvis",
            })
            .select("id, kind, content, tags")
            .single();
          if (newRow) {
            // R17: write scope rows for the new memory if Atlas specified one.
            if (sup.scope.length > 0) {
              await supabase.from("conduit_memory_scope").insert(
                sup.scope.map((employee_id) => ({
                  memory_id: newRow.id as string,
                  employee_id,
                })),
              );
            }
            await supabase
              .from("conduit_memory")
              .update({
                archived_at: new Date().toISOString(),
                superseded_by: newRow.id,
              })
              .eq("id", sup.oldId);
            send("memory_written", {
              id: newRow.id,
              kind: newRow.kind,
              content: newRow.content,
              tags: newRow.tags,
              superseded_id: sup.oldId,
            });
          }
        }
        if (remembers.length > 0) {
          // Cap enforcement: count current non-archived rows for this account
          // and archive oldest if we're over the tier cap.
          const memCap = internalAccount ? 5000 : tier.memoryCap;
          const { count } = await supabase
            .from("conduit_memory")
            .select("id", { count: "exact", head: true })
            .eq("account_id", accountId)
            .is("archived_at", null);
          const room = memCap - (count ?? 0);
          const overflow = remembers.length - room;
          if (overflow > 0) {
            const { data: oldest } = await supabase
              .from("conduit_memory")
              .select("id")
              .eq("account_id", accountId)
              .is("archived_at", null)
              .order("created_at", { ascending: true })
              .limit(overflow);
            if (oldest && oldest.length) {
              await supabase
                .from("conduit_memory")
                .update({ archived_at: new Date().toISOString() })
                .in(
                  "id",
                  oldest.map((r) => r.id),
                );
            }
          }
          for (const r of remembers) {
            const { data: row } = await supabase
              .from("conduit_memory")
              .insert({
                account_id: accountId,
                kind: r.kind,
                content: r.content,
                tags: r.tags,
                source_conversation_id: finalConvId,
                source_message_id: insertedMsg?.id ?? null,
                written_by: "jarvis",
              })
              .select("id, kind, content, tags")
              .single();
            if (row) {
              // R17: write scope rows when Atlas specified scope.
              if (r.scope.length > 0) {
                await supabase.from("conduit_memory_scope").insert(
                  r.scope.map((employee_id) => ({
                    memory_id: row.id as string,
                    employee_id,
                  })),
                );
              }
              send("memory_written", {
                id: row.id,
                kind: row.kind,
                content: row.content,
                tags: row.tags,
              });
            }
          }
        }

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

      const runRoundTable = async (): Promise<void> => {
        const allowedForAccount = (
          account.internal_account
            ? ([
                "jarvis",
                "marketing",
                "sales",
                "engineering",
                "finance",
                "compliance",
                "hr",
                "ops",
                "legal",
              ] as EmployeeKey[])
            : (tier.allowedEmployees as EmployeeKey[])
        ) as EmployeeKey[];

        const participants = selectParticipants(
          allowedForAccount,
          internalAccount,
          tier.id,
        );

        if (participants.length < 2) {
          // Not enough employees for a meaningful round-table — fall through to
          // single Atlas response.
          await runEmployee("jarvis");
          return;
        }

        // Rate limit
        const rate = checkRateLimit(accountId);
        if (!rate.ok) {
          send("round_table_rate_limited", {
            message: `Slow down — let the team finish before pulling them in again. Try again in ~${rate.retryInSeconds}s.`,
          });
          return;
        }

        // Cap-reached short circuit (matches single-employee path)
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
          return;
        }

        send("round_table_start", {
          participants,
          count: participants.length,
        });

        const userName = ctx.user_name;
        const brief = roundTableBrief(message, userName);

        const responses: { employee: EmployeeKey; content: string }[] = [];

        await Promise.all(
          participants.map(async (emp) => {
            send("round_table_thinking", { employee: emp });
            try {
              const baseSystem = systemPromptFor(emp, ctx);
              const systemPrompt =
                memoryBlockFor(emp) +
                withTimeAware(baseSystem, {
                  timezone: account.timezone || "America/New_York",
                });
              const res = await complete({
                messages: [{ role: "user", content: brief }],
                systemPrompt,
                metadata: {
                  employee: emp,
                  accountId,
                  creatorMode,
                  creatorModeVersion,
                  intent:
                    emp === "marketing"
                      ? "creative"
                      : emp === "engineering"
                        ? "code"
                        : emp === "finance" ||
                            emp === "legal" ||
                            emp === "compliance"
                          ? "reasoning"
                          : "routing",
                  tierCeiling: tier.modelCeiling,
                  internalAccount,
                },
                maxTokens: 350,
              });
              const content = res.content.trim();
              responses.push({ employee: emp, content });

              const { data: insertedMsg } = await supabase
                .from("conduit_messages")
                .insert({
                  conversation_id: finalConvId,
                  role: "assistant",
                  employee: emp,
                  content,
                  metadata: { round_table: true },
                })
                .select("id")
                .single();
              void insertedMsg;

              await supabase.from("conduit_usage_events").insert({
                account_id: accountId,
                employee: emp,
                provider: res.provider,
                model: res.model,
                input_tokens: res.inputTokens,
                output_tokens: res.outputTokens,
                estimated_cost_cents: estimateCostCents(
                  res.provider,
                  res.model,
                  res.inputTokens,
                  res.outputTokens,
                  res.cacheReadTokens,
                  res.cacheCreationTokens,
                ),
                metadata: {
                  round_table: true,
                  cache_read_input_tokens: res.cacheReadTokens,
                  cache_creation_input_tokens: res.cacheCreationTokens,
                },
              });
              tokensUsedThisCycle += res.inputTokens + res.outputTokens;

              // Stream each employee's full response in one chunk so the
              // client renders separate parallel bubbles cleanly. (Token-level
              // streaming with concurrent employees is the next round.)
              send("round_table_response", {
                employee: emp,
                content,
              });
            } catch (err) {
              console.error(`[round_table:${emp}]`, err);
              send("round_table_response", {
                employee: emp,
                content: friendlyErrorFor(emp),
                errored: true,
              });
            }
          }),
        );

        // Bump cap counter once at the end
        await supabase
          .from("conduit_accounts")
          .update({ monthly_tokens_used: tokensUsedThisCycle })
          .eq("id", accountId);

        // Synthesis turn — Atlas only
        try {
          send("round_table_synthesis_start", {});
          const baseSystem = systemPromptFor("jarvis", ctx);
          const systemPrompt =
            memoryBlockFor("jarvis") +
            withTimeAware(baseSystem, {
              timezone: account.timezone || "America/New_York",
            });
          const synth = await complete({
            messages: [
              {
                role: "user",
                content: synthesisBrief(message, responses),
              },
            ],
            systemPrompt,
            metadata: {
              employee: "jarvis",
              accountId,
              creatorMode,
              creatorModeVersion,
              intent: "reasoning",
              tierCeiling: tier.modelCeiling,
              internalAccount,
            },
            maxTokens: 600,
          });
          const synthContent = synth.content.trim();
          await supabase.from("conduit_messages").insert({
            conversation_id: finalConvId,
            role: "assistant",
            employee: "jarvis",
            content: synthContent,
            metadata: { round_table_synthesis: true },
          });
          await supabase.from("conduit_usage_events").insert({
            account_id: accountId,
            employee: "jarvis",
            provider: synth.provider,
            model: synth.model,
            input_tokens: synth.inputTokens,
            output_tokens: synth.outputTokens,
            estimated_cost_cents: estimateCostCents(
              synth.provider,
              synth.model,
              synth.inputTokens,
              synth.outputTokens,
              synth.cacheReadTokens,
              synth.cacheCreationTokens,
            ),
            metadata: {
              round_table_synthesis: true,
              cache_read_input_tokens: synth.cacheReadTokens,
              cache_creation_input_tokens: synth.cacheCreationTokens,
            },
          });
          tokensUsedThisCycle +=
            synth.inputTokens + synth.outputTokens;
          await supabase
            .from("conduit_accounts")
            .update({ monthly_tokens_used: tokensUsedThisCycle })
            .eq("id", accountId);

          send("round_table_synthesis", { content: synthContent });
        } catch (err) {
          console.error("round_table_synthesis", err);
          send("round_table_synthesis", {
            content: friendlyErrorFor("jarvis"),
            errored: true,
          });
        }

        send("round_table_end", {});
      };

      try {
        if (teamRequested) {
          await runRoundTable();
        } else {
          await runEmployee(initialEmployee);
        }
        await supabase
          .from("conduit_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", finalConvId);

        // Auto-generate a short title for brand-new conversations.
        // Runs after the main response so it never delays streaming.
        if (isNewConversation) {
          try {
            const firstAssistantMsg = ordered.find((m) => m.role === "assistant");
            if (firstAssistantMsg) {
              const titleRes = await complete({
                systemPrompt: "You generate short conversation titles. Return ONLY the title — no quotes, no trailing punctuation, no preamble.",
                messages: [
                  {
                    role: "user",
                    content: `Write a ≤8-word title for this conversation.\n\nUser: ${message.slice(0, 500)}\nAssistant: ${firstAssistantMsg.content.slice(0, 500)}`,
                  },
                ],
                metadata: {
                  employee: "jarvis",
                  accountId,
                  creatorMode: false,
                  creatorModeVersion: 1,
                  intent: "routing",
                  tierCeiling: "haiku",
                  internalAccount: false,
                },
                maxTokens: 20,
              });
              const generatedTitle = titleRes.content
                .trim()
                .replace(/^["']|["']$/g, "")
                .slice(0, 60);
              if (generatedTitle) {
                await supabase
                  .from("conduit_conversations")
                  .update({ title: generatedTitle })
                  .eq("id", finalConvId);
                send("title_updated", {
                  conversation_id: finalConvId,
                  title: generatedTitle,
                });
              }
            }
          } catch (titleErr) {
            console.warn("[chat] title generation failed:", titleErr);
          }
        }

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
