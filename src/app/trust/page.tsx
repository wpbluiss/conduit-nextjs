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
    images: [{ url: "/praxis-mark.png", width: 632, height: 961, alt: "Praxis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trust + Security — Conduit AI",
    description:
      "How Praxis handles your data. Encryption, retention, access, and what we promise.",
    images: ["/praxis-mark.png"],
  },
};

const PILLARS = [
  {
    Icon: Lock,
    title: "Encrypted in transit and at rest",
    body: "TLS 1.3 to every endpoint. Postgres at rest encryption via Supabase. LiveKit audio over DTLS-SRTP. Customer data never crosses provider boundaries unencrypted.",
  },
  {
    Icon: Database,
    title: "Data residency you can trust",
    body: "Customer data lives in Supabase (US region) and Vercel Functions (matched US regions). No third-party data sales. No model fine-tuning on your conversations.",
  },
  {
    Icon: ShieldCheck,
    title: "Auth + access control",
    body: "Supabase Auth with row-level security on every customer-facing table. Org-scoped queries throughout. Admins audit-logged. Service-role keys never leave the server.",
  },
  {
    Icon: Eye,
    title: "What we don't do",
    body: "We don't train on your messages. We don't sell data to brokers. We don't ship analytics SDKs that exfiltrate behavior. We're a small team — fewer chances for shadow data flows.",
  },
];

export default function TrustPage() {
  return (
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
                <div className="conduit-card p-7 md:p-8 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge-subtle)]">
                      <p.Icon size={20} weight="regular" color="#5B63E8" />
                    </div>
                    <h3
                      className="text-[18px] leading-[1.2] tracking-[-0.01em] text-[var(--color-cream)]"
                      style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                    >
                      {p.title}
                    </h3>
                  </div>
                  <p className="conduit-body-md">{p.body}</p>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealCards>
        </div>
      </section>

      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px]">
            <p className="conduit-caption conduit-caption-ember">Compliance roadmap</p>
            <h2 className="conduit-display-xl mt-5">
              SOC 2 in 2026.
            </h2>
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
            <Link
              href="mailto:luis@conduitai.io?subject=Trust%20%2B%20Security%20question"
              className="conduit-btn-secondary mt-9 inline-flex"
            >
              Ask the founder
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
