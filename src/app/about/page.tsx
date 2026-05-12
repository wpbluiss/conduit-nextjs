import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Lightning,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";

export const metadata: Metadata = {
  title: "About — Conduit AI",
  description:
    "Conduit AI is the company. Praxis is the product. We're building the operating system for businesses that won't be staffed.",
};

const APPROACH = [
  {
    Icon: Wrench,
    title: "Specialist over generalist",
    body: "Each employee is purpose-built with a real domain. Sales has pipelines. Engineering has builds. Marketing has its own briefs. Generality is a recipe for shallowness.",
  },
  {
    Icon: Brain,
    title: "Memory over context",
    body: "Atlas remembers what was said three weeks ago — across conversations, across employees. The compounding effect of memory is what separates a workforce from a chat product.",
  },
  {
    Icon: Lightning,
    title: "Execution over advice",
    body: "Praxis ships work, not summaries of work that should be done. Engineering deploys, Sales touches the lead, Marketing publishes the draft. Output is the only thing that matters.",
  },
];

export default function AboutPage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden conduit-hero-section">
        <div className="conduit-mesh" aria-hidden />
        <div className="conduit-ember-radial" aria-hidden />
        <div className="relative conduit-container">
          <div className="max-w-[820px]">
            <p className="conduit-caption conduit-caption-ember">
              About Conduit AI
            </p>
            <h1 className="conduit-display-hero mt-6">
              We&rsquo;re building the operating system for{" "}
              <span className="conduit-ember-text">
                the businesses that won&rsquo;t be staffed.
              </span>
            </h1>
            <p className="conduit-body-lg mt-6 max-w-[640px]">
              Conduit AI is the company. Praxis is the product. Here&rsquo;s
              where we&rsquo;re headed and why.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section
        id="vision"
        className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]"
      >
        <div className="conduit-container">
          <div className="conduit-prose">
            <p className="conduit-caption conduit-caption-ember">Mission</p>
            <h2 className="conduit-display-xl mt-5">
              Replace payroll with software that{" "}
              <span className="conduit-ember-text">actually works.</span>
            </h2>
            <div className="space-y-6 mt-10 text-[17px] md:text-[18px] text-[var(--color-cream-soft)] leading-[1.7]">
              <p>
                Most companies treat AI as a tool inside their existing stack.
                We think that&rsquo;s a category error. AI shouldn&rsquo;t be a
                tool — it should be the team.
              </p>
              <p>
                Praxis isn&rsquo;t a copilot or a chat product. It&rsquo;s a
                workforce. Nine specialist employees, one shared brain, voice +
                text + execution. The same way you&rsquo;d build a team of
                humans, but the team works 24/7 without payroll, benefits, or
                coordination overhead.
              </p>
              <p>
                We believe the next decade of business will be defined by the
                founders who deploy this kind of workforce, not the founders
                who scale headcount.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-14 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">Approach</p>
            <h2 className="conduit-display-2xl mt-5">
              Three principles we won&rsquo;t bend on.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {APPROACH.map((a) => (
              <div key={a.title} className="conduit-card p-7 md:p-8">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge-subtle)] mb-6">
                  <a.Icon size={22} weight="regular" color="#5B63E8" />
                </div>
                <h3
                  className="text-[22px] leading-[1.15] tracking-[-0.015em] text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {a.title}
                </h3>
                <p className="text-[14px] mt-3 text-[var(--color-cream-soft)] leading-[1.65]">
                  {a.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/approach"
              className="inline-flex items-center gap-2 text-[15px] text-[var(--color-indigo-500)] hover:gap-3 transition-[gap] font-medium"
            >
              Read the full thesis
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      {/* Customers */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-14 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">Customers</p>
            <h2 className="conduit-display-2xl mt-5">
              Currently running on Praxis.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/customers/lunaro"
              className="conduit-card group block p-7 md:p-8 md:col-span-2"
            >
              <div className="flex items-center gap-3 mb-5">
                <svg width="32" height="32" viewBox="0 0 16 16" aria-hidden>
                  <circle cx="8" cy="8" r="6.2" fill="#7C5BFF" />
                  <circle cx="11" cy="6" r="5" fill="#0A0908" />
                </svg>
                <span
                  className="text-[20px] tracking-tight text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  Lunaro Insurance
                </span>
              </div>
              <p className="text-[15px] md:text-[16px] text-[var(--color-cream-soft)] leading-[1.65]">
                The first vertical built on Praxis. We partnered with Lunaro
                Insurance 50/50 to ship a vertical CRM for independent
                insurance agencies — from blank repo to working product in a
                weekend, then a real go-to-market.
              </p>
              <div className="mt-6 inline-flex items-center gap-1.5 text-[14px] text-[var(--color-indigo-500)] font-medium group-hover:gap-2.5 transition-[gap]">
                Read the case study
                <ArrowRight size={14} weight="bold" />
              </div>
            </Link>

            <div className="conduit-card p-7 md:p-8 border-dashed border-[var(--color-edge)] flex items-center justify-center">
              <p className="conduit-caption text-[var(--color-cream-faint)] text-center">
                More customers · soon
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="conduit-prose">
            <p className="conduit-caption conduit-caption-ember">Contact</p>
            <h2 className="conduit-display-xl mt-5">
              Where to reach us.
            </h2>

            <div className="mt-10 space-y-1">
              <ContactRow
                label="Partnership inquiries"
                value="luis@conduitai.io"
                href="mailto:luis@conduitai.io?subject=Partnership%20inquiry"
                live
              />
              <ContactRow
                label="Press"
                value="press@conduitai.io"
                href="mailto:press@conduitai.io"
                live
              />
              <ContactRow
                label="Headquarters"
                value="West Palm Beach, FL"
              />
              <ContactRow
                label="Working hours"
                value="Always — Praxis runs 24/7. Humans respond M-F."
              />
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
  );
}

function ContactRow({
  label,
  value,
  href,
  live,
}: {
  label: string;
  value: string;
  href?: string;
  live?: boolean;
}) {
  const inner = (
    <span className="text-[15px] md:text-[16px] text-[var(--color-cream)] tracking-tight">
      {value}
    </span>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-1 md:gap-6 py-5 border-b border-[var(--color-edge-subtle)]">
      <div className="conduit-caption text-[var(--color-cream-mute)]">
        {label}
      </div>
      <div className="flex items-center gap-2">
        {href ? (
          <Link
            href={href}
            className="text-[15px] md:text-[16px] text-[var(--color-cream)] hover:text-[var(--color-indigo-500)] tracking-tight underline underline-offset-4 decoration-[var(--color-edge)] hover:decoration-[var(--color-indigo-500)] transition-colors"
          >
            {value}
          </Link>
        ) : (
          inner
        )}
        {live ? (
          <CheckCircle size={14} weight="fill" color="#4ADE80" />
        ) : null}
      </div>
    </div>
  );
}
