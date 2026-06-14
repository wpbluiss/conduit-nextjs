import type { Metadata } from "next";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Database,
  ArrowRight,
  Eye,
} from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { MarketingMotionProvider } from "@/components/MarketingMotionProvider";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ScrollRevealCards, ScrollRevealItem } from "@/components/marketing/ScrollRevealCards";

export const metadata: Metadata = {
  title: "Trust + Security — Conduit AI",
  description:
    "How Praxis handles your data, your team's voice, and your customers' contacts. Encryption, retention, access, and what we promise.",
  openGraph: {
    title: "Trust + Security — Conduit AI",
    description:
      "How Praxis handles your data, your team's voice, and your customers' contacts. Encryption, retention, access, and what we promise.",
    url: "https://conduitai.io/trust",
    siteName: "Conduit AI",
    type: "website",
    images: [{ url: "/praxis-mark.png", width: 1200, height: 630, alt: "Praxis trust and security" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trust + Security — Conduit AI",
    description:
      "How Praxis handles your data. Encryption, retention, access, and what we promise.",
    images: ["/praxis-mark.png"],
  },
  alternates: {
    canonical: "https://conduitai.io/trust",
  },
};

const PILLARS = [
  {
    Icon: Lock,
    title: "Encrypted in transit and at rest",
    body: "TLS 1.3 to every endpoint. Postgres at rest encryption via Supabase. LiveKit audio over DTLS-SRTP. Customer data never crosses provider boundaries unencrypted.",
    iconColor: "#D67817",
    iconBg: "rgba(214,120,23,0.10)",
    iconBorder: "rgba(214,120,23,0.24)",
    iconGlow: "rgba(214,120,23,0.18)",
    radial: "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(214,120,23,0.09) 0%, transparent 70%)",
  },
  {
    Icon: Database,
    title: "Data residency you can trust",
    body: "Customer data lives in Supabase (US region) and Vercel Functions (matched US regions). No third-party data sales. No model fine-tuning on your conversations.",
    iconColor: "#5B63E8",
    iconBg: "rgba(91,99,232,0.10)",
    iconBorder: "rgba(91,99,232,0.24)",
    iconGlow: "rgba(91,99,232,0.18)",
    radial: "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(91,99,232,0.09) 0%, transparent 70%)",
  },
  {
    Icon: ShieldCheck,
    title: "Auth + access control",
    body: "Supabase Auth with row-level security on every customer-facing table. Org-scoped queries throughout. Admins audit-logged. Service-role keys never leave the server.",
    iconColor: "#34D399",
    iconBg: "rgba(52,211,153,0.10)",
    iconBorder: "rgba(52,211,153,0.24)",
    iconGlow: "rgba(52,211,153,0.18)",
    radial: "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(52,211,153,0.09) 0%, transparent 70%)",
  },
  {
    Icon: Eye,
    title: "What we don't do",
    body: "We don't train on your messages. We don't sell data to brokers. We don't ship analytics SDKs that exfiltrate behavior. We're a small team — fewer chances for shadow data flows.",
    iconColor: "#A855F7",
    iconBg: "rgba(168,85,247,0.10)",
    iconBorder: "rgba(168,85,247,0.24)",
    iconGlow: "rgba(168,85,247,0.18)",
    radial: "radial-gradient(ellipse 80% 70% at 0% 0%, rgba(168,85,247,0.09) 0%, transparent 70%)",
  },
];

export default function TrustPage() {
  return (
    <MarketingMotionProvider>
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="Trust + Security"
        title={
          <>
            Your data is{" "}
            <span className="conduit-ember-text">your data.</span>
          </>
        }
        subtitle="What Praxis touches, where it lives, and what we'll never do with it. Plain language, no SOC-2 cosplay until we have the cert."
      />

      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <ScrollRevealCards className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 max-w-[920px]">
            {PILLARS.map((p) => (
              <ScrollRevealItem key={p.title}>
                <div className="conduit-card relative overflow-hidden p-7 md:p-8 h-full">
                  {/* Per-pillar corner radial accent */}
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: p.radial }}
                  />
                  {/* Icon + title row */}
                  <div className="relative flex items-start gap-4 mb-5">
                    <div
                      className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{
                        background: p.iconBg,
                        border: `1px solid ${p.iconBorder}`,
                        boxShadow: `0 0 16px ${p.iconGlow}`,
                      }}
                    >
                      <p.Icon size={22} weight="duotone" color={p.iconColor} />
                    </div>
                    <h3
                      className="text-[18px] md:text-[19px] leading-[1.25] tracking-[-0.01em] text-[var(--color-cream)] pt-1"
                      style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                    >
                      {p.title}
                    </h3>
                  </div>
                  <p className="relative conduit-body-md leading-[1.65]">{p.body}</p>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealCards>
        </div>
      </section>

      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)] relative overflow-hidden">
        {/* Faint teal radial anchored top-right, matching the Auth + access control pillar tint */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 100% 0%, rgba(52,211,153,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="conduit-container">
          <ScrollRevealCards className="max-w-[760px]">
            <ScrollRevealItem>
              <p className="conduit-caption conduit-caption-ember">Compliance roadmap</p>
              <h2 className="conduit-display-xl mt-5">
                SOC 2 in 2026.
              </h2>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <p className="conduit-body-lg mt-6">
                We&rsquo;re a small team building something used by paying
                customers. SOC 2 Type I is on the calendar for late 2026 with a
                Type II audit window starting Q1 2027. HIPAA is on the table for
                Praxis verticals that need it (we&rsquo;d love to hear from you
                if that&rsquo;s a hard requirement).
              </p>
              <p className="conduit-body-lg mt-5">
                Until those certs ship, you can ask us anything. We&rsquo;ll
                answer honestly, and we&rsquo;ll DPA your team where the
                relationship justifies it.
              </p>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <Link
                href="mailto:luis@conduitai.io?subject=Trust%20%2B%20Security%20question"
                className="conduit-btn-secondary mt-9 inline-flex"
              >
                Ask the founder
                <ArrowRight size={16} weight="bold" />
              </Link>
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
