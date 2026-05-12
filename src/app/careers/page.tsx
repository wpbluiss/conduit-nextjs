import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Careers — Conduit AI",
  description:
    "We're not hiring yet. Here's how we'd think about it when we are.",
};

const PRINCIPLES = [
  {
    title: "Builders, not staff",
    body: "Every Conduit AI employee owns shipped artifacts — code, copy, customer outcomes — not just process. If you'd be happier in a planning role, we're not the right team yet.",
  },
  {
    title: "AI-native by default",
    body: "You'll work alongside Praxis. Atlas drafts the comms, Engineering writes the first pass, Marketing runs the campaigns. Your job is judgment and taste, not throughput.",
  },
  {
    title: "Small team, high stake",
    body: "We expect to stay small for a long time. Headcount is the last lever we pull. Every hire is high-leverage, paid above market, and on the cap table early.",
  },
  {
    title: "Long compounding bets",
    body: "We're not optimizing for an exit. We're building the operating system for a generation of businesses that don't hire. Long-horizon thinkers welcome.",
  },
];

export default function CareersPage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="Careers"
        title={
          <>
            We&rsquo;re not hiring yet.{" "}
            <span className="conduit-ember-text">Here&rsquo;s how we&rsquo;d think about it when we are.</span>
          </>
        }
        subtitle="Praxis is a workforce. The whole point is to not need many humans. When we do hire, the bar is high and the team stays small."
      />

      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[820px]">
            <p className="conduit-caption text-[var(--color-ink-tertiary)] mb-6">
              How we&rsquo;d think about it
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="conduit-card p-7 md:p-8">
                  <h3
                    className="text-[20px] leading-[1.2] tracking-[-0.01em] text-[var(--color-ink-primary)]"
                    style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                  >
                    {p.title}
                  </h3>
                  <p className="conduit-body-md mt-3">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px]">
            <p className="conduit-caption conduit-caption-ember">
              Open to being convinced
            </p>
            <h2 className="conduit-display-xl mt-5">
              Got a thesis on what we&rsquo;re missing?
            </h2>
            <p className="conduit-body-lg mt-6">
              The strongest argument for joining a team like this is showing
              up with the work already done — a build, a tear-down, a customer
              you brought along. We&rsquo;ll always read a thoughtful note.
            </p>
            <Link
              href="mailto:luis@conduitai.io?subject=I%20want%20to%20build%20at%20Conduit%20AI"
              className="conduit-btn-primary mt-9 inline-flex"
            >
              Write the founder
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
  );
}
