import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import { PageHeader } from "@/components/marketing/PageHeader";
const Footer = dynamic(() => import("@/components/Footer"));
const FinalCTA = dynamic(() => import("@/components/FinalCTA"));

export const metadata: Metadata = {
  title: "Changelog — Conduit AI",
  description:
    "Every shipped change to Praxis. Date-stamped, factual, no marketing.",
};

const ENTRIES: {
  date: string;
  title: string;
  tag: "feature" | "fix" | "infra";
  body: string;
}[] = [
  {
    date: "May 8, 2026",
    title: "Visual overhaul v3 — light-first, indigo accent",
    tag: "feature",
    body: "Rebrand to a light-first institutional palette. Indigo replaces ember as primary; ember demoted to celebration moments only. New BrandMark, scroll-aware nav, customer proof bar.",
  },
  {
    date: "May 7, 2026",
    title: "Praxis Engineering — full-team builds",
    tag: "feature",
    body: "Engineering employee can now open builds for anyone, not just internal users. Daily caps enforced server-side; usage banner inside the Builds tab.",
  },
  {
    date: "May 6, 2026",
    title: "Voice room — Atlas + the full team",
    tag: "feature",
    body: "Walk into the voice room and the whole team is already there. Atlas hands the floor to specialists by intent; LiveKit handles the audio layer.",
  },
  {
    date: "May 5, 2026",
    title: "Build session — reopen + replay",
    tag: "feature",
    body: "Engineering builds now persist as resumable sessions. Click any past build and step through the diff log.",
  },
  {
    date: "May 3, 2026",
    title: "Voice — disable AGC on mic publish",
    tag: "fix",
    body: "LiveKit was applying browser AGC to the mic track, causing volume drift. Disabled on publish; voices come through at native gain.",
  },
  {
    date: "Apr 30, 2026",
    title: "Lunaro Insurance — first vertical live",
    tag: "feature",
    body: "Praxis is now running production traffic for Lunaro Insurance. 200+ contacts, 6 pipelines, 9 specialist employees on standby.",
  },
];

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
            {ENTRIES.map((e) => {
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
