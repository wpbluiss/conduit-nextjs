import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Database, Eye, Trash } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy — Praxis",
  description:
    "How Conduit AI collects, uses, and protects data for Praxis users.",
};

const PILLARS = [
  {
    Icon: Database,
    title: "What we collect",
    body: "Account information (email, name), workspace configuration (business type, description), conversations and messages with AI employees, Memory entries you create, usage data (feature interactions, session duration), and billing records. We collect only what is needed to run the Service.",
  },
  {
    Icon: Lock,
    title: "How we protect it",
    body: "All data is encrypted in transit via TLS 1.3 and at rest via Supabase's Postgres encryption. Row-level security ensures your data is only accessible to authenticated requests scoped to your account. Service-role keys never leave the server.",
  },
  {
    Icon: Eye,
    title: "How we use it",
    body: "To deliver the Praxis service, improve product quality, send transactional communications (receipts, account notices), and respond to support requests. We do not sell your data to third parties. We do not use your conversations to fine-tune external AI models.",
  },
  {
    Icon: Trash,
    title: "Your rights",
    body: "You can delete your account at any time from Settings. Deletion removes your account, conversations, Memory entries, and workspace data. Some billing and compliance records may be retained for the minimum period required by applicable law.",
  },
];

const SECTIONS = [
  {
    title: "Third-party services",
    body: "Praxis uses Supabase (database + auth), Vercel (hosting), Stripe (payments), and voice infrastructure for the voice feature. Each provider is bound by its own privacy terms. We share only the minimum data necessary for each service to function.",
  },
  {
    title: "Cookies and tracking",
    body: "We use a single session cookie for authentication. We do not use advertising cookies or behavioral tracking SDKs. We do not participate in ad networks or cross-site tracking.",
  },
  {
    title: "Data residency",
    body: "Customer data is stored in Supabase (US region) and served by Vercel Functions (matched US regions). No data is replicated to data centers outside the United States without your consent.",
  },
  {
    title: "Retention",
    body: "Conversation history and Memory entries are retained for the life of your account and deleted when you delete your account. Aggregated, anonymized usage metrics may be retained indefinitely. Billing records are retained as required by law (typically 7 years).",
  },
  {
    title: "Children's privacy",
    body: "Praxis is not directed at children under 18 and we do not knowingly collect data from children. If you believe a child has provided us with personal data, contact us immediately at support@conduitai.io.",
  },
  {
    title: "Changes to this policy",
    body: "We may update this Privacy Policy from time to time. Material changes will be communicated in the app or by email. Continued use of Praxis after changes take effect constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact",
    body: "Questions about how we handle your data? Email support@conduitai.io or write to Conduit AI, West Palm Beach, FL.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="Legal"
        title={
          <>
            Privacy <span className="conduit-ember-text">Policy</span>
          </>
        }
        subtitle="Last updated June 2026. How Conduit AI collects, uses, and protects data for Praxis users."
      />

      {/* Pillars grid */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 max-w-[920px]">
            {PILLARS.map((p) => (
              <div key={p.title} className="conduit-card p-7 md:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--color-indigo-50)]">
                    <p.Icon size={20} weight="regular" color="#5B63E8" />
                  </div>
                  <h3
                    className="text-[18px] leading-[1.2] tracking-[-0.01em] text-[var(--color-ink-primary)]"
                    style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                  >
                    {p.title}
                  </h3>
                </div>
                <p className="conduit-body-md">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Body sections */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] space-y-10">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2
                  className="text-[18px] tracking-tight text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {s.title}
                </h2>
                <p className="conduit-body-md mt-3">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="max-w-[760px] mt-14 pt-8 border-t border-[var(--color-edge-subtle)] flex flex-col sm:flex-row gap-4 text-[14px] text-[var(--color-cream-mute)]">
            <Link
              href="/legal/terms"
              className="hover:text-[var(--color-indigo-500)] transition-colors underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <Link
              href="/trust"
              className="hover:text-[var(--color-indigo-500)] transition-colors underline underline-offset-4"
            >
              Trust + Security
            </Link>
            <Link
              href="mailto:support@conduitai.io?subject=Privacy%20question"
              className="hover:text-[var(--color-indigo-500)] transition-colors underline underline-offset-4"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
