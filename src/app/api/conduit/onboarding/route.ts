import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount, userDisplayName } from "@/lib/conduit/account";
import { systemPromptFor } from "@/lib/ai/employees";
import type { AccountContext } from "@/lib/ai/employees/jarvis";
import { complete, friendlyErrorFor } from "@/lib/ai/provider";
import { estimateCostCents } from "@/lib/ai/pricing";
import { withTimeAware } from "@/lib/ai/employees/time-aware";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    business_type?: string;
    business_description?: string;
    goals?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const name = body.name?.trim();
  const businessType = body.business_type?.trim();
  const businessDescription = body.business_description?.trim();
  if (!name || !businessType || !businessDescription) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const goals = Array.isArray(body.goals)
    ? body.goals
        .map((g) => String(g).trim())
        .filter((g) => g.length > 0 && g.length < 100)
        .slice(0, 3)
    : [];

  const account = await getOrCreateAccount(supabase, user);
  const { error: updateErr } = await supabase
    .from("conduit_accounts")
    .update({
      name,
      business_type: businessType,
      business_description: businessDescription,
      onboarding_goals: goals.length > 0 ? goals : null,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", account.id);
  if (updateErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Auto-create welcome conversation with an Atlas greeting
  const ctx: AccountContext = {
    user_name: userDisplayName(user),
    account_name: name,
    business_type: businessType,
    business_description: businessDescription,
    onboarding_goals: goals.length > 0 ? goals : null,
  };

  const { data: convo } = await supabase
    .from("conduit_conversations")
    .insert({ account_id: account.id, title: "Welcome to Praxis" })
    .select("id")
    .single();

  // R10: extract durable memory records from the business description so the
  // very first message has context. Run only if the account has no memory yet
  // (idempotent if onboarding is re-run from Settings).
  try {
    const { count: existingMemoryCount } = await supabase
      .from("conduit_memory")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account.id)
      .is("archived_at", null);
    if ((existingMemoryCount ?? 0) === 0) {
      const extraction = await complete({
        messages: [
          {
            role: "user",
            content: `Extract durable memory records from this business profile.

Business name: ${name}
Business type: ${businessType}
Owner's note: ${businessDescription}

Output ONLY valid JSON with this shape (no preamble, no code fences):
{ "memories": [ { "kind": "fact|context|preference|decision|goal", "content": "1-2 sentence durable statement, third person", "tags": ["lowercase","tags"] } ] }

Be conservative. 3-7 records max. Each should be a durable, useful long-term fact.`,
          },
        ],
        systemPrompt:
          "You extract durable memory records from a business profile. Output ONLY a JSON object — no preamble, no code fences, no commentary.",
        metadata: {
          employee: "jarvis",
          accountId: account.id,
          creatorMode: account.creator_mode,
          creatorModeVersion: account.creator_mode_version ?? 1,
          intent: "factual",
          internalAccount: Boolean(account.internal_account),
        },
        maxTokens: 800,
      });
      const stripped = extraction.content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "");
      let parsed: { memories?: Array<Record<string, unknown>> } = {};
      try {
        parsed = JSON.parse(stripped);
      } catch {
        /* swallow */
      }
      const validKinds = [
        "fact",
        "context",
        "preference",
        "decision",
        "goal",
      ];
      const rows = (parsed.memories ?? [])
        .filter((m) => {
          const k = (m.kind as string)?.toLowerCase();
          const c = (m.content as string)?.trim();
          return validKinds.includes(k) && c && c.length <= 1000;
        })
        .slice(0, 7)
        .map((m) => ({
          account_id: account.id,
          kind: (m.kind as string).toLowerCase(),
          content: (m.content as string).trim(),
          tags: Array.isArray(m.tags)
            ? (m.tags as unknown[])
                .map((t) => String(t).trim().toLowerCase())
                .filter((t) => t && t.length < 32)
                .slice(0, 5)
            : [],
          written_by: "jarvis",
        }));
      if (rows.length) {
        await supabase.from("conduit_memory").insert(rows);
      }
    }
  } catch (err) {
    console.error("memory_seed_failed", err);
    // Non-fatal — onboarding continues without seeded memory.
  }

  if (convo) {
    try {
      const res = await complete({
        messages: [
          {
            role: "user",
            content: `[System note: this is the user's first interaction. Greet them by name (${ctx.user_name}), reference ${ctx.account_name} (a ${ctx.business_type} business), and acknowledge they're working on: ${ctx.business_description}. Ask where they want to start. Keep it tight — 2-4 sentences. No handoff yet.]`,
          },
        ],
        systemPrompt: withTimeAware(systemPromptFor("jarvis", ctx), {
          timezone: account.timezone || "America/New_York",
        }),
        metadata: {
          employee: "jarvis",
          accountId: account.id,
          creatorMode: account.creator_mode,
          creatorModeVersion: account.creator_mode_version ?? 1,
          intent: "routing",
          internalAccount: Boolean(account.internal_account),
          // Onboarding always allowed even on Free tier (Atlas is in the allowlist).
        },
        maxTokens: 400,
      });

      await supabase.from("conduit_messages").insert({
        conversation_id: convo.id,
        role: "assistant",
        employee: "jarvis",
        content: res.content.trim(),
      });

      await supabase.from("conduit_usage_events").insert({
        account_id: account.id,
        employee: "jarvis",
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
          cache_read_input_tokens: res.cacheReadTokens,
          cache_creation_input_tokens: res.cacheCreationTokens,
          welcome: true,
        },
      });

      await supabase
        .from("conduit_accounts")
        .update({
          monthly_tokens_used:
            account.monthly_tokens_used + res.inputTokens + res.outputTokens,
        })
        .eq("id", account.id);
    } catch (err) {
      console.error("welcome greet error", err);
      await supabase.from("conduit_messages").insert({
        conversation_id: convo.id,
        role: "assistant",
        employee: "jarvis",
        content: `${ctx.user_name}! Welcome to Praxis. I just got read in on ${ctx.account_name} — a ${ctx.business_type} business. I see you're working on ${ctx.business_description}. Where do you want to start?`,
        metadata: { fallback: true, reason: friendlyErrorFor("jarvis") },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    conversation_id: convo?.id ?? null,
  });
}
