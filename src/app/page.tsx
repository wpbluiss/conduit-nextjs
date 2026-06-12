import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { AnalyticsPageView } from "@/components/conduit/AnalyticsPageView";

// Below-the-fold sections are dynamically imported to defer their JS
// chunks (including framer-motion) until after the LCP element is painted.
// SSR still renders them so content is in the HTML for SEO; only the
// client-side JS is deferred.
const ProductTiles = dynamic(() => import("@/components/ProductTiles"));
const Cinematic = dynamic(() => import("@/components/Cinematic"));
const Vision = dynamic(() => import("@/components/Vision"));
const Customers = dynamic(() => import("@/components/Customers"));
const EngineeringProof = dynamic(() => import("@/components/EngineeringProof"));
const Pricing = dynamic(() => import("@/components/Pricing"));
const FinalCTA = dynamic(() => import("@/components/FinalCTA"));
const Footer = dynamic(() => import("@/components/Footer"));

export const metadata: Metadata = {
  openGraph: {
    title: "Conduit AI — Intelligence at work",
    description:
      "Conduit AI builds Praxis, the operating system for autonomous AI workforces. Voice, sales, engineering, ops, finance — running 24/7.",
    url: "https://conduitai.io",
    siteName: "Conduit AI",
    type: "website",
    images: [{ url: "/praxis-mark.png", width: 632, height: 961, alt: "Praxis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conduit AI — Intelligence at work",
    description:
      "The operating system for autonomous AI workforces. Nine specialists, one shared brain, running 24/7.",
    images: ["/praxis-mark.png"],
  },
  alternates: {
    canonical: "https://conduitai.io",
  },
};

export default function Home() {
  return (
    <main>
      <AnalyticsPageView />
      <Navbar />
      <Hero />
      <ProductTiles />
      <Cinematic />
      <Vision />
      <Customers />
      <EngineeringProof />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
