import type { Metadata } from "next";
import { GitMerge, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/marketing/PageHeader";
import { HealthCheck } from "./HealthCheck";

export const metadata: Metadata = {
  title: "System Status — Conduit AI",
  description:
    "Live health indicator for Praxis and the Conduit AI platform. Recent product updates from the team.",
  openGraph: {
    title: "System Status — Conduit AI",
    url: "https://conduitai.io/status",
    siteName: "Conduit AI",
    type: "website",
    images: [{ url: "/praxis-mark.png", width: 632, height: 961, alt: "Praxis" }],
  },
};

type GithubPR = {
  number: number;
  title: string;
  html_url: string;
  merged_at: string | null;
  user: { login: string } | null;
};

async function getRecentUpdates(): Promise<GithubPR[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/wpbluiss/conduit-nextjs/pulls?state=closed&per_page=15&sort=updated&direction=desc",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return [];
    const prs = (await res.json()) as GithubPR[];
    return prs.filter((p) => p.merged_at).slice(0, 8);
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function StatusPage() {
  const updates = await getRecentUpdates();

  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="System Status"
        title={
          <>
            Praxis is{" "}
            <span className="conduit-ember-text">running.</span>
          </>
        }
        subtitle="Live health for the Conduit AI platform. Incidents are rare; when they happen, we fix forward."
      />

      {/* Live health */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[720px]">
            <p className="conduit-caption conduit-caption-ember mb-8">
              Live health
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: "Praxis Console", key: "console" },
                { label: "API", key: "api" },
                { label: "Voice (Atlas)", key: "voice" },
                { label: "Database", key: "db" },
              ].map((svc) => (
                <div
                  key={svc.key}
                  className="conduit-card p-6 flex flex-col gap-3"
                >
                  <p className="text-[14px] text-[var(--color-cream-soft)] font-medium">
                    {svc.label}
                  </p>
                  <HealthCheck />
                </div>
              ))}
            </div>

            <p className="text-[13px] text-[var(--color-cream-mute)] mt-6">
              Health is checked every 30 seconds. Indicator turns red if{" "}
              <code className="font-mono text-[12px] px-1 py-0.5 rounded bg-[var(--color-ink-surface)]">
                /api/health
              </code>{" "}
              returns a non-200 response.
            </p>
          </div>
        </div>
      </section>

      {/* Recent updates */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[720px]">
            <p className="conduit-caption conduit-caption-ember mb-8">
              Recent updates
            </p>

            {updates.length === 0 ? (
              <p className="conduit-body-md text-[var(--color-cream-mute)]">
                No recent updates to show.
              </p>
            ) : (
              <ul className="space-y-3">
                {updates.map((pr) => (
                  <li key={pr.number}>
                    <a
                      href={pr.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="conduit-card p-5 flex items-start gap-4 group hover:border-[var(--color-indigo-500)] transition-colors no-underline"
                    >
                      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-[var(--color-indigo-50)] mt-0.5">
                        <GitMerge size={16} weight="regular" color="#5B63E8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] text-[var(--color-ink-primary)] leading-[1.4] group-hover:text-[var(--color-indigo-500)] transition-colors">
                          {pr.title}
                        </p>
                        {pr.merged_at && (
                          <p className="text-[12px] text-[var(--color-cream-mute)] mt-1">
                            Merged{" "}
                            <time dateTime={pr.merged_at}>
                              {formatDate(pr.merged_at)}
                            </time>
                          </p>
                        )}
                      </div>
                      <ArrowUpRight
                        size={14}
                        className="shrink-0 text-[var(--color-cream-faint)] group-hover:text-[var(--color-indigo-500)] transition-colors mt-1"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
