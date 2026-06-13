import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import { AnalyticsPageView } from "@/components/conduit/AnalyticsPageView";
import { PageHeader } from "@/components/marketing/PageHeader";
import { PricingFAQ } from "@/components/marketing/PricingFAQ";
import { PricingComparisonTable } from "@/components/marketing/PricingComparisonTable";

export const metadata: Metadata = {
  title: "Pricing — Three tiers, one workforce",
  description:
    "Free, Pro $29/mo, Enterprise $199/mo. Praxis Flow on every tier; Praxis Depth on Enterprise. Top up tokens any time.",
  openGraph: {
    title: "Pricing — Three tiers, one workforce",
    description:
      "Free, Pro $29/mo, Enterprise $199/mo. Praxis Flow on every tier; Praxis Depth on Enterprise. Top up tokens any time.",
    url: "https://conduitai.io/pricing",
    siteName: "Conduit AI",
    type: "website",
    images: [{ url: "/praxis-mark.png", width: 1200, height: 630, alt: "Praxis pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Three tiers, one workforce",
    description:
      "Free, Pro $29/mo, Enterprise $199/mo. Praxis Flow on every tier; Praxis Depth on Enterprise.",
    images: ["/praxis-mark.png"],
  },
  alternates: {
    canonical: "https://conduitai.io/pricing",
  },
};


export default function PricingPage() {
  return (
    <main className="conduit-bg-canvas">
      <AnalyticsPageView />
      <Navbar />

      <PageHeader
        caption="Pricing"
        title={
          <>
            Three tiers.{" "}
            <span className="conduit-ember-text">One workforce.</span>
          </>
        }
        subtitle="Free to start. Pro for solo founders running a real business. Enterprise for teams replacing whole departments. Top up tokens any time, no commitment."
      />

      {/* Tier cards (reuses homepage Pricing section) */}
      <Pricing />

      {/* Comparison table */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-12 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">Compare</p>
            <h2 className="conduit-display-2xl mt-5">
              Every line, side by side.
            </h2>
          </div>

          <PricingComparisonTable />
        </div>
      </section>

      {/* FAQ */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="conduit-prose">
            <p className="conduit-caption conduit-caption-ember">FAQ</p>
            <h2 className="conduit-display-2xl mt-5">
              Common questions, answered straight.
            </h2>

            <PricingFAQ />
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="conduit-prose text-center">
            <p className="conduit-caption conduit-caption-ember">
              Need more?
            </p>
            <h2 className="conduit-display-xl mt-5">
              Custom token volumes, isolation, SLAs.
            </h2>
            <p className="conduit-body-lg mt-5">
              For teams replacing whole departments, ask about custom
              enterprise plans. Direct line, no sales gauntlet.
            </p>
            <Link
              href="mailto:luis@conduitai.io?subject=Praxis%20custom%20enterprise"
              className="conduit-btn-primary mt-9 inline-flex"
            >
              Email luis@conduitai.io
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
