import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { AnalyticsPageView } from "@/components/conduit/AnalyticsPageView";
import ProductTiles from "@/components/ProductTiles";
import Cinematic from "@/components/Cinematic";
import Vision from "@/components/Vision";
import Customers from "@/components/Customers";
import EngineeringProof from "@/components/EngineeringProof";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

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
