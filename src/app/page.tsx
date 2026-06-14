import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { AnalyticsPageView } from "@/components/conduit/AnalyticsPageView";
import { MarketingMotionProvider } from "@/components/MarketingMotionProvider";

// Code-split below-fold sections so the browser doesn't parse their JS
// before the LCP element (Hero) is painted. Each section is still
// server-rendered (ssr: true default) for SEO; only the client bundle
// is deferred. loading: () => null prevents layout shift while chunks
// load — these sections are entirely out of the initial viewport.
const StatsBar = dynamic(() => import("@/components/StatsBar"));
const DemoStrip = dynamic(() => import("@/components/DemoStrip"));
const HowItWorks = dynamic(() => import("@/components/HowItWorks"));
const ProductTiles = dynamic(() => import("@/components/ProductTiles"));
const FeatureGrid = dynamic(() => import("@/components/FeatureGrid"));
const SpecialistSpotlight = dynamic(
  () => import("@/components/SpecialistSpotlight"),
);
const Cinematic = dynamic(() => import("@/components/Cinematic"));
const Vision = dynamic(() => import("@/components/Vision"));
const Customers = dynamic(() => import("@/components/Customers"));
const EngineeringProof = dynamic(() => import("@/components/EngineeringProof"));
const SocialProof = dynamic(() => import("@/components/SocialProof"));
const FounderScenarios = dynamic(() => import("@/components/FounderScenarios"));
const TestimonialsCarousel = dynamic(
  () => import("@/components/TestimonialsCarousel"),
);
const SpecialistShowcase = dynamic(
  () => import("@/components/SpecialistShowcase"),
);
const WhyPraxisTable = dynamic(() =>
  import("@/components/marketing/WhyPraxisTable").then((m) => ({ default: m.WhyPraxisTable })),
);
const RoiCalculator = dynamic(() => import("@/components/RoiCalculator"));
const Pricing = dynamic(() => import("@/components/Pricing"));
const FounderTestimonials = dynamic(
  () => import("@/components/FounderTestimonials"),
);
const TrustBar = dynamic(() => import("@/components/TrustBar"));
const FAQ = dynamic(() => import("@/components/FAQ"));
const FinalCTA = dynamic(() => import("@/components/FinalCTA"));
const Footer = dynamic(() => import("@/components/Footer"));

export const metadata: Metadata = {
  title: "Conduit AI — Intelligence at work",
  description:
    "Conduit AI builds Praxis, the operating system for autonomous AI workforces. Voice, sales, engineering, ops, finance — running 24/7.",
  openGraph: {
    title: "Conduit AI — Intelligence at work",
    description:
      "Conduit AI builds Praxis, the operating system for autonomous AI workforces. Voice, sales, engineering, ops, finance — running 24/7.",
    url: "https://conduitai.io",
    siteName: "Conduit AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conduit AI — Intelligence at work",
    description:
      "The operating system for autonomous AI workforces. Nine specialists, one shared brain, running 24/7.",
  },
  alternates: {
    canonical: "https://conduitai.io",
  },
};

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Conduit AI",
  url: "https://conduitai.io",
  logo: "https://conduitai.io/praxis-mark.png",
  sameAs: [],
  description:
    "Conduit AI builds Praxis, the operating system for autonomous AI workforces.",
};

export default function Home() {
  return (
    <MarketingMotionProvider>
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
      />
      <AnalyticsPageView />
      <Navbar />
      <Hero />
      <StatsBar />
      <DemoStrip />
      <HowItWorks />
      <ProductTiles />
      <FeatureGrid />
      <SpecialistSpotlight />
      <Cinematic />
      <Vision />
      <Customers />
      <EngineeringProof />
      <SocialProof />
      <FounderScenarios />
      <TestimonialsCarousel />
      <SpecialistShowcase />
      <WhyPraxisTable />
      <RoiCalculator />
      <Pricing />
      <FounderTestimonials />
      <TrustBar />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
    </MarketingMotionProvider>
  );
}
