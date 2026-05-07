// /app/builds — preserves R7 templates list as tab 1, adds R15 engineering
// sessions list as tab 2. Tab state is client-side; the page itself is a
// server component that fetches both datasets and hands them to a client
// shell. R7 cards keep their existing visual + behavior unchanged.

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import { Hammer, Lock } from "lucide-react";
import { isEngineeringConfigured } from "@/lib/builds/executor";
import BuildsTabs, {
  type R7Build,
  type EngSession,
} from "@/components/conduit/engineering/BuildsTabs";

export const dynamic = "force-dynamic";

export default async function BuildsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const account = await getOrCreateAccount(supabase, user);
  const tier = tierById(account.tier_id);
  const internal = Boolean(account.internal_account);
  const buildsAllowed =
    internal || tier.allowedEmployees.includes("engineering");
  const configured = isEngineeringConfigured();

  if (!buildsAllowed) {
    return (
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="serif text-3xl mb-2 flex items-center gap-2">
            <Hammer size={22} /> Builds
          </h1>
          <div className="conduit-card p-6 mt-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-2">
              <Lock size={12} /> Pro feature
            </div>
            <p className="serif text-2xl">Engineering builds are a Pro perk</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Upgrade to ship landing pages, CRMs, blogs, and forms straight
              from chat.
            </p>
            <Link href="/app/settings" className="btn-primary mt-4">
              Compare plans →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [{ data: r7Rows }, { data: engRows }] = await Promise.all([
    supabase
      .from("conduit_builds")
      .select(
        "id, template_id, build_name, status, live_url, github_repo_url, error_message, created_at, conversation_id",
      )
      .eq("account_id", account.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    internal
      ? supabase
          .from("conduit_engineering_sessions")
          .select(
            "id, prompt, build_type, status, deploy_url, github_repo, total_input_tokens, total_output_tokens, error_message, started_at, completed_at, created_at",
          )
          .eq("account_id", account.id)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as EngSession[] }),
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="serif text-3xl mb-2 flex items-center gap-2">
          <Hammer size={22} /> Builds
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
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
        />
      </div>
    </div>
  );
}
