// /app/builds — preserves R7 templates list as tab 1, R15 engineering
// sessions list as tab 2.
//
// R15.5 changes: the internal-only gate on the engineering tab is gone.
// Every authenticated user can see + open their engineering builds. The
// daily build + spend caps are enforced server-side; UsageBanner inside
// BuildsTabs surfaces today's usage.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import { Hammer } from "lucide-react";
import { isEngineeringConfigured } from "@/lib/builds/executor";
import { loadDailyEngineeringUsage } from "@/lib/engineering/limits";
import BuildsTabs, {
  type R7Build,
  type EngSession,
} from "@/components/conduit/engineering/BuildsTabs";

export const dynamic = "force-dynamic";

interface Ctx {
  searchParams: Promise<{ session?: string; continue?: string }>;
}

export default async function BuildsPage({ searchParams }: Ctx) {
  const sp = await searchParams;
  // Backward-compat: /app/builds?session=<id> → /app/builds/<id>
  if (sp.session) {
    redirect(`/app/builds/${sp.session}`);
  }

  const current = await getCurrentAccount();
  if (!current) return null;
  const { account } = current;
  const supabase = await createSupabaseServerClient();
  const tier = tierById(account.tier_id);
  const internal = Boolean(account.internal_account);
  const configured = isEngineeringConfigured();

  const [{ data: r7Rows }, { data: engRows }, usage] = await Promise.all([
    supabase
      .from("conduit_builds")
      .select(
        "id, template_id, build_name, status, live_url, github_repo_url, error_message, created_at, conversation_id",
      )
      .eq("account_id", account.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("conduit_engineering_sessions")
      .select(
        "id, prompt, build_type, status, deploy_url, github_repo, total_input_tokens, total_output_tokens, error_message, started_at, completed_at, created_at, parent_session_id",
      )
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(100),
    loadDailyEngineeringUsage(supabase, account.id, account),
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="cx-heading-2xl mb-2 flex items-center gap-2">
          <Hammer size={22} /> Builds
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Every site Engineering has shipped for you.
        </p>

        {!configured && (
          <div className="conduit-card p-4 mb-6 text-xs text-[var(--color-amber)] border-[var(--color-amber)]/40">
            Build provider not connected yet. Engineering can describe a
            build but won&apos;t ship a live site until upstream keys land.
          </div>
        )}

        <BuildsTabs
          r7Builds={(r7Rows ?? []) as unknown as R7Build[]}
          engSessions={(engRows ?? []) as unknown as EngSession[]}
          internal={internal}
          tierName={tier.name}
          usage={usage}
        />

        {!internal && tier.id === "free" && (
          <p className="mt-6 text-xs text-[var(--color-text-muted)]">
            On the Free plan you get 1 engineering build per day.{" "}
            <Link
              href="/app/settings/billing"
              className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
            >
              Upgrade to Pro for 10/day →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
