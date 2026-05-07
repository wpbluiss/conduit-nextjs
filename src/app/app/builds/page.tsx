import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import { ExternalLink, Hammer, Lock } from "lucide-react";
import { isEngineeringConfigured } from "@/lib/builds/executor";

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

  const { data: builds } = await supabase
    .from("conduit_builds")
    .select(
      "id, template_id, build_name, status, live_url, github_repo_url, error_message, created_at, conversation_id",
    )
    .eq("account_id", account.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const empty = !builds || builds.length === 0;

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

        {empty ? (
          <div className="conduit-card p-8 max-w-md">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
              Nothing shipped yet
            </div>
            <p className="text-[var(--color-text)] mb-4">
              Ask Engineering for a landing page, CRM, blog, lead-capture
              page, or contact form.
            </p>
            <Link href="/app" className="btn-primary">
              Go to chat →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(builds ?? []).map((b) => (
              <div
                key={b.id}
                className="conduit-card border-l-[3px] p-5 flex flex-col gap-3"
                style={{ borderLeftColor: "var(--color-dept-engineering)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    {b.template_id}
                  </span>
                  <StatusPill status={b.status as string} />
                </div>
                <div className="serif text-lg leading-snug">{b.build_name}</div>
                {b.live_url ? (
                  <a
                    href={b.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hi)] inline-flex items-center gap-1 truncate"
                  >
                    {b.live_url}
                    <ExternalLink size={11} />
                  </a>
                ) : b.error_message ? (
                  <p className="text-xs text-[var(--color-pink)]">
                    {b.error_message}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Building…
                  </p>
                )}
                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] mt-auto pt-2">
                  <span>{new Date(b.created_at).toLocaleString()}</span>
                  {b.conversation_id && (
                    <Link
                      href={`/app?c=${b.conversation_id}`}
                      className="hover:text-[var(--color-text)]"
                    >
                      Open chat →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: "var(--color-text-muted)", label: "Pending" },
    building: { color: "var(--color-amber)", label: "Building" },
    live: { color: "var(--color-green)", label: "Live" },
    failed: { color: "var(--color-pink)", label: "Failed" },
    archived: { color: "var(--color-text-muted)", label: "Archived" },
  };
  const m = map[status] ?? map.pending;
  return (
    <span
      className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
      style={{
        color: m.color,
        background: `color-mix(in srgb, ${m.color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${m.color} 28%, transparent)`,
      }}
    >
      {m.label}
    </span>
  );
}
