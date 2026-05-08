import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  ListChecks,
  Path,
  Quotes,
} from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";

export const metadata: Metadata = {
  title: "Lunaro Insurance — A Praxis customer story",
  description:
    "From blank repo to a working vertical CRM in a weekend, then a 50/50 partnership. The story of the first product built on Praxis.",
};

const STORY = [
  {
    eyebrow: "The problem",
    body: "Insurance CRMs were stuck in 2008. Independent agencies were paying SaaS rent for tools that took half a day to onboard and didn't know what 'pipeline' meant in their vertical. Lunaro's founder had run a brokerage and watched his team waste hours every week reformatting spreadsheets.",
  },
  {
    eyebrow: "The bet",
    body: "Could Praxis ship a real vertical CRM — with the actual fields agencies use, the actual pipelines they run, the actual reports they need — in a weekend, not a quarter?",
  },
  {
    eyebrow: "The build",
    body: "Friday afternoon: blank repo. Saturday: schema, pipelines, lead capture, contact detail page, basic reporting, auth. Sunday: theming, polish, deploy. The Engineering employee handled the bulk of the surface; Atlas held requirements; Marketing wrote the landing page; Sales piped in real prospect data. By Monday morning we had a working CRM.",
  },
  {
    eyebrow: "The result",
    body: "Conduit and Lunaro Insurance turned the build into a 50/50 partnership. The CRM runs at jonathan-demo.vercel.app today, and the first agency is live with 200+ contacts and 6 working pipelines. The next 5 agencies are in onboarding.",
  },
];

const HIGHLIGHTS = [
  {
    Icon: Path,
    title: "Six pipelines, vertical-shaped",
    body: "Auto, home, life, commercial, renewals, prospects. Each with the stages an agency actually moves leads through, not generic CRM phases.",
  },
  {
    Icon: ListChecks,
    title: "Lead capture from day one",
    body: "Forms wired to the pipeline, contact detail, agent assignment, follow-up reminders. The fields you'd expect a 5-year-old SaaS to have.",
  },
  {
    Icon: Buildings,
    title: "Multi-agency from the start",
    body: "Tenancy isolation per agency, shared brand-ish theming, role-based access. Agencies don't see each other's books — first principle, not patch.",
  },
];

export default function LunaroCaseStudy() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden conduit-hero-section">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 80% 0%, rgba(124,91,255,0.18), transparent 60%),
              radial-gradient(ellipse 50% 40% at 0% 100%, rgba(214,120,23,0.08), transparent 55%)
            `,
          }}
        />
        <div className="relative conduit-container">
          <div className="max-w-[820px]">
            <Link
              href="/customers"
              className="inline-flex items-center gap-1.5 conduit-caption text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] transition-colors mb-6"
            >
              ← Customers
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <svg width="44" height="44" viewBox="0 0 16 16" aria-hidden>
                <circle cx="8" cy="8" r="6.2" fill="#7C5BFF" />
                <circle cx="11" cy="6" r="5" fill="#0A0908" />
              </svg>
              <span
                className="text-[28px] tracking-tight text-[var(--color-cream)]"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                Lunaro Insurance
              </span>
            </div>

            <h1 className="conduit-display-hero">
              Insurance CRM, built on{" "}
              <span className="conduit-ember-text">Praxis.</span>
            </h1>
            <p className="conduit-body-lg mt-7 max-w-[640px]">
              The first vertical product built on the Praxis workforce. From
              blank repo to a working CRM in a weekend, then a real go-to-market
              partnership.
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-14 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat n="200+" label="Contacts" />
            <Stat n="6" label="Pipelines" />
            <Stat n="9" label="AI employees" />
            <Stat n="Weeks" label="To ship" />
          </div>
        </div>
      </section>

      {/* The Story */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="conduit-prose">
            <p className="conduit-caption conduit-caption-ember">The story</p>
            <h2 className="conduit-display-2xl mt-5">
              From blank repo to first agency.
            </h2>

            <div className="mt-12 space-y-12 md:space-y-14">
              {STORY.map((s) => (
                <div key={s.eyebrow}>
                  <p className="conduit-caption text-[var(--color-cream-mute)]">
                    {s.eyebrow}
                  </p>
                  <p className="text-[18px] md:text-[19px] mt-3 text-[var(--color-cream-soft)] leading-[1.75]">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What's running */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-14 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">
              What&rsquo;s running today
            </p>
            <h2 className="conduit-display-2xl mt-5">
              Three things you&rsquo;d expect.
            </h2>
            <p className="conduit-body-lg mt-5 max-w-[600px]">
              The bar wasn&rsquo;t to ship something novel. It was to ship the
              boring stuff that&rsquo;s actually load-bearing for a real agency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="conduit-card p-7 md:p-8">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge-subtle)] mb-6">
                  <h.Icon size={22} weight="regular" color="#D67817" />
                </div>
                <h3
                  className="text-[22px] leading-[1.15] tracking-[-0.015em] text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {h.title}
                </h3>
                <p className="text-[14px] mt-3 text-[var(--color-cream-soft)] leading-[1.65]">
                  {h.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote block */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="conduit-prose">
            <Quotes
              size={36}
              weight="duotone"
              color="#D67817"
              className="mb-5 opacity-70"
            />
            <blockquote className="text-[24px] md:text-[28px] leading-[1.5] tracking-[-0.015em] text-[var(--color-cream)] italic">
              &ldquo;Quote pending Jonathan review. The placeholder is honest
              — we&rsquo;d rather wait for a real one than fabricate something
              for the page.&rdquo;
            </blockquote>
            <p className="conduit-caption text-[var(--color-cream-mute)] mt-7">
              — Lunaro Insurance, founder
            </p>

            <div className="mt-12 pt-12 border-t border-[var(--color-edge-subtle)] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-[15px] text-[var(--color-ember-500)] hover:gap-3 transition-[gap] font-medium"
              >
                Read more about Lunaro
                <ArrowUpRight size={16} weight="bold" />
              </Link>
              <Link
                href="mailto:luis@conduitai.io?subject=Praxis%20for%20our%20vertical"
                className="conduit-btn-primary"
              >
                See if Praxis fits your vertical
                <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="conduit-card p-5">
      <span
        className="block text-[32px] md:text-[40px] leading-[0.95] text-[var(--color-cream)] tracking-[-0.025em]"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
      >
        {n}
      </span>
      <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)] mt-2 block">
        {label}
      </span>
    </div>
  );
}
