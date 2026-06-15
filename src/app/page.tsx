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
const SocialProofBar = dynamic(() => import("@/components/landing/TrustBar"));
const HowItWorks = dynamic(() => import("@/components/HowItWorks"));
const SpecialistShowcase = dynamic(
  () => import("@/components/SpecialistShowcase"),
);
const TestimonialsCarousel = dynamic(
  () => import("@/components/TestimonialsCarousel"),
);
const Pricing = dynamic(() => import("@/components/Pricing"));
const TrustBar = dynamic(() => import("@/components/TrustBar"));
const FAQ = dynamic(() => import("@/components/FAQ"));
const FinalCTA = dynamic(() => import("@/components/FinalCTA"));
const Footer = dynamic(() => import("@/components/Footer"));

export const metadata: Metadata = {
  title: "Praxis — Nine Specialists. Zero Payroll.",
  description:
    "Nine AI specialists covering marketing, sales, engineering, ops, finance, legal, HR, compliance, and voice — deployed in minutes, running 24/7.",
  openGraph: {
    title: "Praxis — Nine Specialists. Zero Payroll.",
    description:
      "Nine AI specialists covering marketing, sales, engineering, ops, finance, legal, HR, compliance, and voice — deployed in minutes, running 24/7.",
    url: "https://conduitai.io",
    siteName: "Praxis by Conduit AI",
    type: "website",
    images: [
      {
        url: "/api/og?title=Praxis+%E2%80%94+Nine+Specialists.+Zero+Payroll.&description=Nine+AI+specialists+running+24%2F7+for+your+business.",
        width: 1200,
        height: 630,
        alt: "Praxis — Nine Specialists. Zero Payroll.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Praxis — Nine Specialists. Zero Payroll.",
    description:
      "Nine AI specialists — marketing, sales, engineering, ops, finance, and more — running 24/7 for your business.",
    images: [
      "/api/og?title=Praxis+%E2%80%94+Nine+Specialists.+Zero+Payroll.&description=Nine+AI+specialists+running+24%2F7+for+your+business.",
    ],
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
      {/* Logo / social proof bar — immediately after hero */}
      <SocialProofBar />
      {/* How it works — tinted surface for visual separation from logo bar */}
      <div className="home-section-tinted">
        <HowItWorks />
      </div>
      {/* Specialist showcase — dark inverse band, the depth differentiator */}
      <SpecialistShowcase />
      {/* Single testimonial moment */}
      <TestimonialsCarousel />
      {/* Pricing — tinted surface to separate from testimonials */}
      <div className="home-section-tinted">
        <Pricing />
      </div>
      {/* Trust / security — back to canvas before FAQ */}
      <TrustBar />
      {/* FAQ — tinted surface so it reads as distinct from TrustBar */}
      <div className="home-section-tinted">
        <FAQ />
      </div>
      <FinalCTA />
      <Footer />
    </main>
    </MarketingMotionProvider>
  );
}
