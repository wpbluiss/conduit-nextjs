import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { StatusIndicator } from "./StatusIndicator";

export const metadata: Metadata = {
  title: "System Status — Conduit AI",
  description: "Live health status and recent updates for Conduit AI and Praxis.",
  openGraph: {
    title: "System Status — Conduit AI",
    description: "Live health status and recent updates for Conduit AI and Praxis.",
    url: "https://conduitai.io/status",
    siteName: "Conduit AI",
    type: "website",
  },
  alternates: { canonical: "https://conduitai.io/status" },
};

// Fetch recent merged PRs from GitHub public API at build/revalidate time.
async function getRecentUpdates(): Promise<{ title: string; mergedAt: string; url: string }[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/wpbluiss/conduit-nextjs/pulls?state=closed&per_page=5&sort=updated&direction=desc",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return [];
    const prs = (await res.json()) as {
      title: string;
      merged_at: string | null;
      html_url: string;
      pull_request?: { merged_at: string | null };
    }[];
    return prs
      .filter((pr) => pr.merged_at)
      .map((pr) => ({
        title: pr.title,
        mergedAt: pr.merged_at as string,
        url: pr.html_url,
      }));
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function StatusPage() {
  const updates = await getRecentUpdates();

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen" style={{ background: "var(--color-bg-canvas)" }}>
        <div className="max-w-2xl mx-auto px-6 py-20 md:py-28">
          <p
            className="text-sm font-mono tracking-widest uppercase mb-3"
            style={{ color: "var(--color-indigo-500)" }}
          >
            System status
          </p>
          <h1
            className="text-4xl md:text-5xl font-semibold tracking-tight mb-6"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Conduit AI
          </h1>
          <p className="text-base mb-12" style={{ color: "var(--color-ink-secondary)" }}>
            Live status of Praxis and the Conduit AI platform.
          </p>

          {/* Live health indicator — client-side poll */}
          <StatusIndicator />

          {/* Recent updates */}
          {updates.length > 0 && (
            <section className="mt-16">
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--color-ink-tertiary)" }}>
                Recent updates
              </h2>
              <ol className="space-y-4">
                {updates.map((u, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 py-4 border-t"
                    style={{ borderColor: "var(--color-border-subtle)" }}
                  >
                    <time
                      className="shrink-0 text-xs font-mono pt-0.5"
                      style={{ color: "var(--color-ink-tertiary)", minWidth: "5rem" }}
                      dateTime={u.mergedAt}
                    >
                      {formatDate(u.mergedAt)}
                    </time>
                    <a
                      href={u.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm hover:underline underline-offset-2 transition-colors"
                      style={{ color: "var(--color-ink-primary)" }}
                    >
                      {u.title}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
