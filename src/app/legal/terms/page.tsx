import type { Metadata } from "next";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Terms of Service — Praxis",
  description:
    "Terms governing your use of Praxis, the AI workforce product built by Conduit AI.",
};

const SECTIONS = [
  {
    title: "1. The service",
    body: "Praxis is an AI workforce platform operated by Conduit AI. By creating an account or using the Service you agree to these Terms. Praxis provides access to AI employees (\"employees\") that assist with sales, marketing, engineering, finance, legal, compliance, HR, and operations tasks.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years old and able to form a binding contract. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.",
  },
  {
    title: "3. Acceptable use",
    body: "You may not use Praxis to generate content that is unlawful, harmful, or violates third-party rights. You may not attempt to access other users' data, reverse-engineer the platform, circumvent security controls, or use the service for purposes that violate applicable law. We may suspend or terminate accounts that violate these Terms.",
  },
  {
    title: "4. AI employee output",
    body: "Praxis employees generate responses automatically and may be inaccurate, incomplete, or out of date. Output from AI employees is provided for assistance purposes only — it is not a substitute for the judgment of qualified professionals. You are responsible for reviewing all AI-generated output before acting on it.",
  },
  {
    title: "5. Subscriptions and billing",
    body: "Some features require a paid subscription. Prices, billing cycles, and plan limits are shown at the point of purchase. Subscriptions renew automatically until cancelled; you can cancel at any time and retain access through the end of the paid period. Payments are processed by Stripe.",
  },
  {
    title: "6. Data and privacy",
    body: "We collect and process data as described in our Privacy Policy. You retain ownership of your data. We do not sell your data to third parties or use your conversations to train external AI models.",
  },
  {
    title: "7. Account deletion",
    body: "You may delete your account at any time from Settings. Deletion removes your account, conversations, memories, and associated data. Some records may be retained for legal or billing compliance purposes for the minimum period required by law.",
  },
  {
    title: "8. Uptime and availability",
    body: "Praxis is provided \"as is\" without uptime guarantees. We aim for continuous availability but do not warrant that the Service will be uninterrupted or error-free. Planned maintenance will be communicated when possible.",
  },
  {
    title: "9. Disclaimers",
    body: "To the maximum extent permitted by law, Conduit AI is not liable for any indirect, incidental, or consequential damages arising from your use of Praxis or any AI employee output. The Service is provided without warranties of any kind, express or implied.",
  },
  {
    title: "10. Changes to these Terms",
    body: "We may update these Terms from time to time. Material changes will be communicated in the app or by email. Continued use of Praxis after changes take effect constitutes acceptance of the updated Terms.",
  },
  {
    title: "11. Governing law",
    body: "These Terms are governed by the laws of the State of Florida, United States, without regard to conflict of law principles. Disputes will be resolved in the courts of Palm Beach County, Florida.",
  },
  {
    title: "12. Contact",
    body: "Questions about these Terms? Email us at support@conduitai.io.",
  },
];

export default function TermsPage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="Legal"
        title={
          <>
            Terms of <span className="conduit-ember-text">Service</span>
          </>
        }
        subtitle="Last updated June 2026. These terms govern your use of Praxis, the AI workforce product built by Conduit AI."
      />

      {/* AI disclaimer callout */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-border-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px]">
            <div className="rounded-2xl border border-[var(--color-edge)] bg-[var(--color-ink-surface-elevated)] p-6 flex gap-4">
              <div className="shrink-0 mt-0.5">
                <WarningCircle size={20} weight="fill" color="#F59E0B" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[var(--color-cream)]">
                  AI assistance, not professional advice
                </p>
                <p className="text-[14px] text-[var(--color-cream-soft)] mt-2 leading-[1.65]">
                  Praxis employees — including the legal, finance, compliance,
                  and HR employees — provide AI-generated assistance. Their
                  output is not a substitute for advice from a licensed
                  attorney, accountant, financial advisor, or other qualified
                  professional. Do not rely on Praxis output as your sole basis
                  for consequential business, legal, or financial decisions.
                </p>
              </div>
            </div>
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
              href="/legal/privacy"
              className="hover:text-[var(--color-indigo-500)] transition-colors underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <Link
              href="/trust"
              className="hover:text-[var(--color-indigo-500)] transition-colors underline underline-offset-4"
            >
              Trust + Security
            </Link>
            <Link
              href="mailto:support@conduitai.io?subject=Terms%20question"
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
