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
import { MarketingMotionProvider } from "@/components/MarketingMotionProvider";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ScrollRevealCards, ScrollRevealItem } from "@/components/marketing/ScrollRevealCards";

export const metadata: Metadata = {
  title: "About — Conduit AI",
  description:
    "Conduit AI is the company. Praxis is the product. We're building the operating system for businesses that won't be staffed.",
  openGraph: {
    title: "About — Conduit AI",
    description:
      "Conduit AI is the company. Praxis is the product. We're building the operating system for businesses that won't be staffed.",
    url: "https://conduitai.io/about",
    siteName: "Conduit AI",
    type: "website",
    images: [{ url: "/praxis-mark.png", width: 1200, height: 630, alt: "Conduit AI — About" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Conduit AI",
    description:
      "Conduit AI is the company. Praxis is the product. Building the OS for businesses that won't be staffed.",
    images: ["/praxis-mark.png"],
  },
  alternates: {
    canonical: "https://conduitai.io/about",
  },
};

const APPROACH = [
  {
    Icon: Wrench,
    title: "Specialist over generalist",
    body: "Each employee is purpose-built with a real domain. Sales has pipelines. Engineering has builds. Marketing has its own briefs. Generality is a recipe for shallowness.",
    iconColor: "#5B63E8",
    iconBg: "rgba(91,99,232,0.10)",
    iconBorder: "rgba(91,99,232,0.24)",
    iconGlow: "rgba(91,99,232,0.18)",
    radial: "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(91,99,232,0.08) 0%, transparent 70%)",
  },
  {
    Icon: Brain,
    title: "Memory over context",
    body: "Atlas remembers what was said three weeks ago — across conversations, across employees. The compounding effect of memory is what separates a workforce from a chat product.",
    iconColor: "#A855F7",
    iconBg: "rgba(168,85,247,0.10)",
    iconBorder: "rgba(168,85,247,0.24)",
    iconGlow: "rgba(168,85,247,0.18)",
    radial: "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(168,85,247,0.08) 0%, transparent 70%)",
  },
  {
    Icon: Lightning,
    title: "Execution over advice",
    body: "Praxis ships work, not summaries of work that should be done. Engineering deploys, Sales touches the lead, Marketing publishes the draft. Output is the only thing that matters.",
    iconColor: "#D67817",
    iconBg: "rgba(214,120,23,0.10)",
    iconBorder: "rgba(214,120,23,0.24)",
    iconGlow: "rgba(214,120,23,0.18)",
    radial: "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(214,120,23,0.08) 0%, transparent 70%)",
  },
];

export default function AboutPage() {
  return (
    <MarketingMotionProvider>
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="About Conduit AI"
        title={
          <>
            We&rsquo;re building the operating system for{" "}
            <span className="conduit-ember-text">
              the businesses that won&rsquo;t be staffed.
            </span>
          </>
        }
        subtitle="Conduit AI is the company. Praxis is the product. Here's where we're headed and why."
      />

      {/* Mission */}
      <section
        id="vision"
        className="relative overflow-hidden conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 100% 0%, rgba(214,120,23,0.07) 0%, transparent 65%)",
          }}
        />
        <div className="conduit-container">
          <ScrollRevealCards className="conduit-prose">
            <ScrollRevealItem>
              <p className="conduit-caption conduit-caption-ember">Mission</p>
              <h2 className="conduit-display-xl mt-5">
                Replace payroll with software that{" "}
                <span className="conduit-ember-text">actually works.</span>
              </h2>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <div className="space-y-6 mt-10 text-[17px] md:text-[18px] text-[var(--color-cream-soft)] leading-[1.7]">
                <p>
                  Most companies treat AI as a tool inside their existing stack.
                  We think that&rsquo;s a category error. AI shouldn&rsquo;t be
                  a tool — it should be the team.
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
            </ScrollRevealItem>
          </ScrollRevealCards>
        </div>
      </section>

      {/* Approach */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <ScrollRevealCards margin="25%" className="max-w-[760px] mb-14 md:mb-16">
            <ScrollRevealItem>
              <p className="conduit-caption conduit-caption-ember">Approach</p>
              <h2 className="conduit-display-2xl mt-5">
                Three principles we won&rsquo;t bend on.
              </h2>
            </ScrollRevealItem>
          </ScrollRevealCards>

          <ScrollRevealCards margin="30%" className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {APPROACH.map((a) => (
              <ScrollRevealItem key={a.title}>
                <div className="conduit-card relative overflow-hidden p-7 md:p-8 h-full">
                  {/* Per-principle corner radial accent */}
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: a.radial }}
                  />
                  <div
                    className="relative w-12 h-12 flex items-center justify-center rounded-xl mb-6"
                    style={{
                      background: a.iconBg,
                      border: `1px solid ${a.iconBorder}`,
                      boxShadow: `0 0 16px ${a.iconGlow}`,
                    }}
                  >
                    <a.Icon size={22} weight="duotone" color={a.iconColor} />
                  </div>
                  <h3
                    className="relative text-[22px] leading-[1.15] tracking-[-0.015em] text-[var(--color-cream)]"
                    style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                  >
                    {a.title}
                  </h3>
                  <p className="relative text-[14px] mt-3 text-[var(--color-cream-soft)] leading-[1.65]">
                    {a.body}
                  </p>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealCards>

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
          <ScrollRevealCards margin="25%" className="max-w-[760px] mb-14 md:mb-16">
            <ScrollRevealItem>
              <p className="conduit-caption conduit-caption-ember">Customers</p>
              <h2 className="conduit-display-2xl mt-5">
                Currently running on Praxis.
              </h2>
            </ScrollRevealItem>
          </ScrollRevealCards>

          <ScrollRevealCards margin="30%" className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ScrollRevealItem className="md:col-span-2">
            <Link
              href="/customers/lunaro"
              className="conduit-card group block p-7 md:p-8 h-full"
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
            </ScrollRevealItem>

            <ScrollRevealItem>
              <div className="conduit-card p-7 md:p-8 border-dashed border-[var(--color-edge)] flex items-center justify-center h-full">
                <p className="conduit-caption text-[var(--color-cream-faint)] text-center">
                  More customers · soon
                </p>
              </div>
            </ScrollRevealItem>
          </ScrollRevealCards>
        </div>
      </section>

      {/* Contact */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <ScrollRevealCards className="conduit-prose">
            <ScrollRevealItem>
              <p className="conduit-caption conduit-caption-ember">Contact</p>
              <h2 className="conduit-display-xl mt-5">
                Where to reach us.
              </h2>
            </ScrollRevealItem>
            <ScrollRevealItem>
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
            </ScrollRevealItem>
          </ScrollRevealCards>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
    </MarketingMotionProvider>
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
