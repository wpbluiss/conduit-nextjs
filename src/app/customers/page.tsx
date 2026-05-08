import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";

export const metadata: Metadata = {
  title: "Customers — Built on Praxis",
  description:
    "The companies running on Praxis. Lunaro Insurance, the first vertical, plus the slots opening up next.",
};

export default function CustomersIndex() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden conduit-hero-section">
        <div className="conduit-mesh" aria-hidden />
        <div className="conduit-ember-radial" aria-hidden />
        <div className="relative conduit-container">
          <div className="max-w-[820px]">
            <p className="conduit-caption conduit-caption-ember">Customers</p>
            <h1 className="conduit-display-hero mt-6">
              Built for companies that{" "}
              <span className="conduit-ember-text">build.</span>
            </h1>
            <p className="conduit-body-lg mt-6 max-w-[640px]">
              The first wave of customers running on Praxis. Each is a
              partnership, not a sale — we build alongside them.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            <Link
              href="/customers/lunaro"
              className="conduit-card group block p-8 md:p-10 min-h-[420px] flex flex-col"
            >
              <div className="flex items-center gap-3 mb-7">
                <svg width="36" height="36" viewBox="0 0 16 16" aria-hidden>
                  <circle cx="8" cy="8" r="6.2" fill="#7C5BFF" />
                  <circle cx="11" cy="6" r="5" fill="#0A0908" />
                </svg>
                <span
                  className="text-[22px] tracking-tight text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  Lunaro Insurance
                </span>
              </div>

              <p className="conduit-caption text-[var(--color-cream-mute)]">
                Vertical CRM · Insurance · Live
              </p>
              <h2
                className="text-[28px] md:text-[32px] mt-3 leading-[1.1] tracking-[-0.02em] text-[var(--color-cream)]"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                The first vertical built on Praxis.
              </h2>
              <p className="conduit-body-md mt-4 flex-1 leading-[1.65]">
                A purpose-built insurance CRM for independent agencies. Built
                in a weekend, then turned into a 50/50 partnership.
              </p>

              <div className="mt-7 flex items-baseline flex-wrap gap-x-5 gap-y-3 pt-7 border-t border-[var(--color-edge-subtle)]">
                <Stat n="200+" label="Contacts" />
                <Stat n="6" label="Pipelines" />
                <Stat n="9" label="AI employees" />
              </div>

              <div className="mt-7 inline-flex items-center gap-1.5 text-[14px] text-[var(--color-ember-500)] font-medium group-hover:gap-2.5 transition-[gap]">
                Read the case study
                <ArrowRight size={14} weight="bold" />
              </div>
            </Link>

            <div className="grid grid-rows-2 gap-5 lg:gap-6">
              <GhostCard caption="Customer story · soon" />
              <GhostCard caption="Customer story · soon" />
            </div>
          </div>

          {/* Become a customer CTA */}
          <div className="mt-16 md:mt-20 conduit-card p-8 md:p-12 text-center">
            <p className="conduit-caption conduit-caption-ember">
              Become a customer
            </p>
            <h2 className="conduit-display-xl mt-5 max-w-[640px] mx-auto">
              Have a vertical that needs a workforce?
            </h2>
            <p className="conduit-body-lg mt-5 max-w-[560px] mx-auto">
              We&rsquo;re selective about customer partnerships in this phase
              — we want to build alongside you. Tell us your vertical and how
              you&rsquo;d use Praxis.
            </p>
            <Link
              href="mailto:luis@conduitai.io?subject=Become%20a%20customer"
              className="conduit-btn-primary mt-9 inline-flex"
            >
              Send the pitch
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

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <span
        className="block text-[26px] leading-[1.0] text-[var(--color-cream)] tracking-[-0.025em]"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
      >
        {n}
      </span>
      <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)] mt-1.5 block">
        {label}
      </span>
    </div>
  );
}

function GhostCard({ caption }: { caption: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-edge)] p-6 flex items-center justify-center min-h-[200px] bg-[var(--color-ink-canvas)]/40">
      <p className="conduit-caption text-[var(--color-cream-faint)]">
        {caption}
      </p>
    </div>
  );
}
