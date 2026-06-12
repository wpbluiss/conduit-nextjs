import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Code, Cpu, Lightning } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import { PageHeader } from "@/components/marketing/PageHeader";
const Footer = dynamic(() => import("@/components/Footer"));
const FinalCTA = dynamic(() => import("@/components/FinalCTA"));

export const metadata: Metadata = {
  title: "Engineering — Conduit AI",
  description:
    "How Praxis is built. Architecture notes, engineering decisions, and posts from the team shipping autonomous AI workforces.",
};

const POSTS: { title: string; tagline: string; date: string; soon?: boolean }[] = [
  {
    title: "Why we ripped out LangChain",
    tagline:
      "Three months in we had four orchestration layers. We deleted three.",
    date: "Coming soon",
    soon: true,
  },
  {
    title: "Praxis Engineering: code as a first-class artifact",
    tagline:
      "Real commits, real deploys. How the engineering employee actually ships.",
    date: "Coming soon",
    soon: true,
  },
  {
    title: "Voice latency: 480ms to 110ms",
    tagline:
      "Streaming TTS, deferred barge-in detection, and the path to feel-instant.",
    date: "Coming soon",
    soon: true,
  },
];

const PRINCIPLES = [
  {
    Icon: Code,
    title: "Code over plans",
    body: "Every employee ships an artifact. Plans are stale by the time they're written.",
  },
  {
    Icon: Cpu,
    title: "Fluid Compute, not edge",
    body: "Full Node.js on Vercel Functions. Same regions, no cold-start tax.",
  },
  {
    Icon: Lightning,
    title: "Streams or it didn't happen",
    body: "Every model call streams. Every UI surface renders progressively.",
  },
];

export default function EngineeringPage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="Engineering"
        title={
          <>
            How Praxis is{" "}
            <span className="conduit-ember-text">actually built.</span>
          </>
        }
        subtitle="Architecture notes, engineering decisions, and posts from the team shipping autonomous AI workforces. Less marketing, more diff."
      />

      {/* Principles */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <p className="conduit-caption text-[var(--color-ink-tertiary)] mb-6">
            How we work
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="conduit-card p-7 md:p-8">
                <p.Icon size={22} weight="regular" color="#5B63E8" />
                <h3
                  className="text-[20px] mt-5 leading-[1.2] tracking-[-0.01em] text-[var(--color-ink-primary)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {p.title}
                </h3>
                <p className="conduit-body-md mt-3">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Posts list */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="conduit-caption conduit-caption-ember">Writing</p>
              <h2 className="conduit-display-xl mt-5">From the lab.</h2>
            </div>
            <Link
              href="https://github.com/wpbluiss"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-2 text-[14px] text-[var(--color-ink-secondary)] hover:text-[var(--color-indigo-500)] transition-colors"
            >
              GitHub
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>

          <div className="space-y-1 border-t border-[var(--color-border-subtle)]">
            {POSTS.map((p) => (
              <article
                key={p.title}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_200px] gap-4 md:gap-10 py-7 border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface-subtle)] transition-colors px-2 -mx-2 rounded-md"
              >
                <div>
                  <h3
                    className="text-[22px] md:text-[24px] leading-[1.2] tracking-[-0.015em] text-[var(--color-ink-primary)]"
                    style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                  >
                    {p.title}
                  </h3>
                  <p className="conduit-body-md mt-2">{p.tagline}</p>
                </div>
                <div className="flex md:justify-end items-start">
                  <span
                    className="text-[12px] uppercase tracking-[0.08em]"
                    style={{
                      color: p.soon
                        ? "var(--color-ink-tertiary)"
                        : "var(--color-ink-secondary)",
                    }}
                  >
                    {p.date}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <p className="conduit-body-md mt-12 text-[var(--color-ink-tertiary)]">
            More posts as we ship them. We&rsquo;re not in a rush to fill this
            page; everything that lands here will be honest about the tradeoffs.
          </p>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
  );
}
