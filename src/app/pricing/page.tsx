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
    images: [
      {
        url: "/api/og?title=Pricing+%E2%80%94+Three+tiers%2C+one+workforce&description=Free%2C+Pro+%2429%2Fmo%2C+Enterprise+%24199%2Fmo.+Top+up+tokens+any+time.",
        width: 1200,
        height: 630,
        alt: "Pricing — Three tiers, one workforce",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Three tiers, one workforce",
    description:
      "Free, Pro $29/mo, Enterprise $199/mo. Praxis Flow on every tier; Praxis Depth on Enterprise.",
    images: [
      "/api/og?title=Pricing+%E2%80%94+Three+tiers%2C+one+workforce&description=Free%2C+Pro+%2429%2Fmo%2C+Enterprise+%24199%2Fmo.+Top+up+tokens+any+time.",
    ],
  },
  alternates: {
    canonical: "https://conduitai.io/pricing",
  },
};


const PRICING_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Praxis — AI specialist team",
  description:
    "Nine AI specialists covering marketing, sales, engineering, ops, finance, legal, HR, compliance, and voice — running 24/7 for your business.",
  url: "https://conduitai.io/pricing",
  brand: { "@type": "Brand", name: "Conduit AI" },
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "0",
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
      availability: "https://schema.org/InStock",
      url: "https://conduitai.io/auth/sign-up",
      description:
        "Get started free — Marketing specialist, 50k monthly tokens, voice input, 100 memory rows.",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "29",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "29",
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
      availability: "https://schema.org/InStock",
      url: "https://conduitai.io/auth/sign-up?tier=pro",
      description:
        "Solo founders running a real business — Marketing, Sales, Engineering, 1M tokens/mo, real builds, real leads.",
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      price: "199",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "199",
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
      availability: "https://schema.org/InStock",
      url: "https://conduitai.io/auth/sign-up?tier=enterprise",
      description:
        "Teams replacing whole departments — all 9 specialists including Finance, Compliance, HR, Ops, Legal, 5M tokens/mo, Praxis Depth, multi-user workspace.",
    },
  ],
};

export default function PricingPage() {
  return (
    <main className="conduit-bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_JSONLD) }}
      />
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
