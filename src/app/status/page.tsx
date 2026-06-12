import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Warning, XCircle } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/marketing/PageHeader";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "System Status — Conduit AI",
  description:
    "Live health indicators for Praxis and the Conduit AI platform.",
  openGraph: {
    title: "System Status — Conduit AI",
    description: "Live health indicators for the Conduit AI platform.",
    url: "https://conduitai.io/status",
    siteName: "Conduit AI",
    type: "website",
    images: [{ url: "/praxis-mark.png", width: 632, height: 961, alt: "Praxis" }],
  },
};

// Revalidate every 60 seconds for near-live health status.
export const revalidate = 60;

type HealthStatus = "operational" | "degraded" | "down";

interface ServiceCheck {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
}

interface RecentUpdate {
  title: string;
  mergedAt: string;
  url: string;
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("conduit_accounts")
      .select("id", { count: "exact", head: true })
      .limit(1);
    const latencyMs = Date.now() - start;
    if (error) return { name: "Database", status: "degraded", latencyMs };
    return { name: "Database", status: "operational", latencyMs };
  } catch {
    return { name: "Database", status: "down", latencyMs: Date.now() - start };
  }
}

async function fetchRecentUpdates(): Promise<RecentUpdate[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/wpbluiss/conduit-nextjs/pulls?state=closed&sort=updated&direction=desc&per_page=6",
      {
        headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return [];
    const prs = (await res.json()) as {
      title: string;
      merged_at: string | null;
      html_url: string;
    }[];
    return prs
      .filter((pr) => pr.merged_at)
      .slice(0, 5)
      .map((pr) => ({
        title: pr.title,
        mergedAt: pr.merged_at!,
        url: pr.html_url,
      }));
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: HealthStatus }) {
  if (status === "operational") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
        style={{ color: "var(--color-green, #34D399)" }}
      >
        <CheckCircle size={16} weight="fill" aria-hidden />
        Operational
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
        style={{ color: "#EAB308" }}
      >
        <Warning size={16} weight="fill" aria-hidden />
        Degraded
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
      style={{ color: "#F87171" }}
    >
      <XCircle size={16} weight="fill" aria-hidden />
      Down
    </span>
  );
}

function OverallBanner({ checks }: { checks: ServiceCheck[] }) {
  const allOk = checks.every((c) => c.status === "operational");
  const anyDown = checks.some((c) => c.status === "down");

  if (allOk) {
    return (
      <div
        className="conduit-card flex items-center gap-4 p-6"
        style={{
          borderColor: "rgba(52, 211, 153, 0.3)",
          background: "rgba(52, 211, 153, 0.04)",
        }}
      >
        <CheckCircle
          size={32}
          weight="fill"
          style={{ color: "var(--color-green, #34D399)", flexShrink: 0 }}
          aria-hidden
        />
        <div>
          <p
            className="text-[18px] font-semibold"
            style={{ color: "var(--color-cream, #F5F1EA)" }}
          >
            All systems operational
          </p>
          <p className="text-[14px] mt-0.5" style={{ color: "var(--color-cream-mute, #8A88A4)" }}>
            Praxis is running normally.
          </p>
        </div>
      </div>
    );
  }

  if (anyDown) {
    return (
      <div
        className="conduit-card flex items-center gap-4 p-6"
        style={{
          borderColor: "rgba(248, 113, 113, 0.3)",
          background: "rgba(248, 113, 113, 0.04)",
        }}
      >
        <XCircle
          size={32}
          weight="fill"
          style={{ color: "#F87171", flexShrink: 0 }}
          aria-hidden
        />
        <div>
          <p
            className="text-[18px] font-semibold"
            style={{ color: "var(--color-cream, #F5F1EA)" }}
          >
            Service disruption detected
          </p>
          <p className="text-[14px] mt-0.5" style={{ color: "var(--color-cream-mute, #8A88A4)" }}>
            We&apos;re investigating. Check back shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="conduit-card flex items-center gap-4 p-6"
      style={{
        borderColor: "rgba(234, 179, 8, 0.3)",
        background: "rgba(234, 179, 8, 0.04)",
      }}
    >
      <Warning
        size={32}
        weight="fill"
        style={{ color: "#EAB308", flexShrink: 0 }}
        aria-hidden
      />
      <div>
        <p
          className="text-[18px] font-semibold"
          style={{ color: "var(--color-cream, #F5F1EA)" }}
        >
          Partial degradation
        </p>
        <p className="text-[14px] mt-0.5" style={{ color: "var(--color-cream-mute, #8A88A4)" }}>
          Some services are running slowly. We&apos;re investigating.
        </p>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function StatusPage() {
  const [dbCheck, recentUpdates] = await Promise.all([
    checkDatabase(),
    fetchRecentUpdates(),
  ]);

  // App is always "operational" if this page renders — the server itself is up.
  const appCheck: ServiceCheck = { name: "App + API", status: "operational" };
  const checks: ServiceCheck[] = [appCheck, dbCheck];

  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="Status"
        title="System status"
        subtitle="Live health for the Praxis platform and underlying infrastructure."
      />

      <section className="conduit-section conduit-bg-canvas">
        <div className="conduit-container">
          <div className="max-w-[720px] space-y-10">

            {/* Overall banner */}
            <OverallBanner checks={checks} />

            {/* Service breakdown */}
            <div>
              <h2 className="conduit-caption conduit-caption-ember mb-5">Services</h2>
              <div className="space-y-2">
                {checks.map((check) => (
                  <div
                    key={check.name}
                    className="conduit-card flex items-center justify-between p-5"
                  >
                    <div>
                      <p
                        className="text-[15px] font-medium"
                        style={{ color: "var(--color-cream, #F5F1EA)" }}
                      >
                        {check.name}
                      </p>
                      {check.latencyMs !== undefined && (
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--color-cream-mute, #8A88A4)" }}>
                          {check.latencyMs} ms response time
                        </p>
                      )}
                    </div>
                    <StatusBadge status={check.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent updates */}
            {recentUpdates.length > 0 && (
              <div>
                <h2 className="conduit-caption conduit-caption-ember mb-5">Recent updates</h2>
                <div className="space-y-2">
                  {recentUpdates.map((update) => (
                    <div
                      key={update.url}
                      className="conduit-card p-5 flex items-start justify-between gap-4"
                    >
                      <div>
                        <p
                          className="text-[14px]"
                          style={{ color: "var(--color-cream, #F5F1EA)" }}
                        >
                          {update.title}
                        </p>
                        <p className="text-[12px] mt-1" style={{ color: "var(--color-cream-mute, #8A88A4)" }}>
                          {formatDate(update.mergedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No updates fallback */}
            {recentUpdates.length === 0 && (
              <div>
                <h2 className="conduit-caption conduit-caption-ember mb-5">Recent updates</h2>
                <div className="conduit-card p-5">
                  <p className="text-[14px]" style={{ color: "var(--color-cream-mute, #8A88A4)" }}>
                    No recent updates available.
                  </p>
                </div>
              </div>
            )}

            {/* Incident reporting nudge */}
            <p className="text-[13px]" style={{ color: "var(--color-cream-mute, #8A88A4)" }}>
              Experiencing an issue?{" "}
              <Link
                href="mailto:luis@conduitai.io?subject=Praxis%20incident%20report"
                className="inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--color-indigo-500, #5B63E8)" }}
              >
                Email us <ArrowRight size={11} aria-hidden />
              </Link>
            </p>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
