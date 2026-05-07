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

  const account = await getOrCreateAccount(supabase, user);
  const { error: updateErr } = await supabase
    .from("conduit_accounts")
    .update({
      name,
      business_type: businessType,
      business_description: businessDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", account.id);
  if (updateErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Auto-create welcome conversation with a Jarvis greeting
  const ctx: AccountContext = {
    user_name: userDisplayName(user),
    account_name: name,
    business_type: businessType,
    business_description: businessDescription,
  };

  const { data: convo } = await supabase
    .from("conduit_conversations")
    .insert({ account_id: account.id, title: "Welcome to Conduit" })
    .select("id")
    .single();

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
          // Onboarding always allowed even on Free tier (Jarvis is in the allowlist).
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
        content: `${ctx.user_name}! Welcome to Conduit. I just got read in on ${ctx.account_name} — a ${ctx.business_type} business. I see you're working on ${ctx.business_description}. Where do you want to start?`,
        metadata: { fallback: true, reason: friendlyErrorFor("jarvis") },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    conversation_id: convo?.id ?? null,
  });
}
