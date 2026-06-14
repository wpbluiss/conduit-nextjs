import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { PageHeader } from "@/components/marketing/PageHeader";
import { CHANGELOG_ENTRIES } from "@/lib/conduit/changelog-entries";

export const metadata: Metadata = {
  title: "Changelog — Conduit AI",
  description:
    "Every shipped change to Praxis. Date-stamped, factual, no marketing.",
  openGraph: {
    title: "Changelog — Conduit AI",
    description:
      "Every shipped change to Praxis. Date-stamped, factual, no marketing.",
    url: "https://conduitai.io/changelog",
    siteName: "Conduit AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog — Conduit AI",
    description:
      "Every shipped change to Praxis. Date-stamped, factual, no marketing.",
  },
  alternates: {
    canonical: "https://conduitai.io/changelog",
  },
};

const TAG_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  feature: {
    bg: "rgba(91, 99, 232, 0.10)",
    color: "var(--color-indigo-700)",
    label: "Feature",
  },
  fix: {
    bg: "rgba(22, 163, 74, 0.10)",
    color: "var(--color-conduit-success)",
    label: "Fix",
  },
  infra: {
    bg: "rgba(202, 138, 4, 0.10)",
    color: "var(--color-conduit-warning)",
    label: "Infra",
  },
};

export default function ChangelogPage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="Changelog"
        title={
          <>
            Every change.{" "}
            <span className="conduit-ember-text">Date-stamped.</span>
          </>
        }
        subtitle="What we shipped, when. No filler, no roadmap promises — only the work that actually landed."
      />

      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[820px] space-y-12">
            {CHANGELOG_ENTRIES.map((e) => {
              const tag = TAG_STYLES[e.tag];
              return (
                <article
                  key={`${e.date}-${e.title}`}
                  className="grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)] gap-3 md:gap-10 pb-12 border-b border-[var(--color-border-subtle)] last:border-b-0"
                >
                  <div className="md:pt-1">
                    <p
                      className="text-[13px] uppercase tracking-[0.08em] text-[var(--color-ink-tertiary)]"
                      style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
                    >
                      {e.date}
                    </p>
                  </div>
                  <div>
                    <span
                      className="inline-block text-[11px] uppercase tracking-[0.08em] font-semibold rounded-full px-2.5 py-1 mb-3"
                      style={{ background: tag.bg, color: tag.color }}
                    >
                      {tag.label}
                    </span>
                    <h2
                      className="text-[22px] md:text-[24px] leading-[1.25] tracking-[-0.015em] text-[var(--color-ink-primary)]"
                      style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                    >
                      {e.title}
                    </h2>
                    <p className="conduit-body-md mt-3">{e.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
  );
}
