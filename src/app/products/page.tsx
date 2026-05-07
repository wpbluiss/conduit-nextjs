import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Products — Praxis by Conduit",
  description:
    "Praxis Console (live), Praxis Mobile (TestFlight this week), and Praxis HQ (Q3 2026). Three surfaces, one autonomous workforce.",
};

interface Product {
  slug: string;
  name: string;
  status: string;
  tagline: string;
  body: string[];
  cta: { label: string; href: string };
  accent: string;
  accentSoft: string;
}

const PRODUCTS: Product[] = [
  {
    slug: "praxis-console",
    name: "Praxis Console",
    status: "Live",
    tagline: "The web app where you talk to your AI workforce.",
    body: [
      "Atlas, your Chief of Staff, picks up the phone first. He routes to specialist employees — Marketing, Sales, Engineering, Finance, Compliance, HR, Ops, Legal — or handles strategic work himself.",
      "Voice mode runs as a Zoom-like room with the team. Sales has a real lead pipeline (no Apollo, no Bright Data — Overpass + Reddit + Google Maps). Engineering ships real sites you can put a domain on the same hour.",
    ],
    cta: { label: "Open the Console", href: "/auth/sign-up" },
    accent: "#FF8A3D",
    accentSoft: "rgba(255, 138, 61, 0.14)",
  },
  {
    slug: "praxis-mobile",
    name: "Praxis Mobile",
    status: "TestFlight this week",
    tagline: "Voice-first Praxis in your pocket.",
    body: [
      "Native iOS and Android. The fastest path to your workforce while you&apos;re between meetings or driving back from a property tour.",
      "Push notifications when Atlas needs a decision or a lead heats up. Voice room joinable from a notification. The chat surfaces and roundtable carry over from the Console.",
    ],
    cta: { label: "Join the waitlist", href: "/products/praxis-mobile" },
    accent: "#34D399",
    accentSoft: "rgba(52, 211, 153, 0.14)",
  },
  {
    slug: "praxis-hq",
    name: "Praxis HQ",
    status: "Q3 2026",
    tagline: "A 3D office you can walk through.",
    body: [
      "Each employee has a desk, an avatar, a presence. Step into the marketing room and watch a campaign get drafted in real time, then walk down the hall to engineering and spin up a build.",
      "The bet is that spatial software makes your AI workforce feel like a workforce, not a chat window. Same brain underneath; different surface for the moments that deserve it.",
    ],
    cta: { label: "Early access", href: "/products/praxis-hq" },
    accent: "#A855F7",
    accentSoft: "rgba(168, 85, 247, 0.14)",
  },
];

export default function ProductsIndex() {
  return (
    <main>
      <Navbar />

      <section className="relative px-6 pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6">Praxis · Product family</p>
          <h1 className="serif text-[44px] md:text-[68px] leading-[1.0] tracking-[-0.02em] text-[#F5F1EA]">
            Three surfaces.
            <br />
            One workforce.
          </h1>
          <p className="mt-7 text-[17px] md:text-[20px] text-[#8C8884] leading-[1.7] max-w-2xl">
            The Praxis product family runs on the same brain — Atlas plus eight
            specialists. Pick the surface that fits the moment.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 md:py-16 border-t border-[#1F1C19]">
        <div className="max-w-5xl mx-auto space-y-6">
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              className="block p-7 md:p-10 bg-[#0A0908] border border-[#1F1C19] hover:border-[var(--accent)]/60 transition-colors group"
              style={{ ["--accent" as string]: p.accent }}
            >
              <div className="grid md:grid-cols-[1fr_auto] gap-6 md:gap-12 items-start">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      aria-hidden
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        background:
                          p.status === "Live" ? p.accent : "transparent",
                        boxShadow: `inset 0 0 0 1px ${p.accent}`,
                      }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: p.accent }}
                    >
                      {p.status}
                    </span>
                  </div>
                  <h2 className="serif text-[32px] md:text-[44px] text-[#F5F1EA] leading-[1.05]">
                    {p.name}
                  </h2>
                  <p
                    className="mt-3 text-[16px] md:text-[18px]"
                    style={{ color: p.accent }}
                  >
                    {p.tagline}
                  </p>
                  <div className="mt-5 space-y-4 text-[15px] text-[#8C8884] leading-[1.7]">
                    {p.body.map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
                <div className="md:pt-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-[14px] font-medium group-hover:gap-2.5 transition-all"
                    style={{ color: p.accent }}
                  >
                    {p.cta.label}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
