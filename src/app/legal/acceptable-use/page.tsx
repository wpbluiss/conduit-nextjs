import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — Praxis",
  description:
    "Rules governing permitted and prohibited uses of the Praxis AI workforce platform.",
};

const SECTIONS = [
  {
    title: "1. Overview",
    body: "This Acceptable Use Policy (\"AUP\") describes what you may and may not do with the Praxis platform operated by Conduit AI. It supplements the Terms of Service and applies to all users. Conduit AI may update this AUP at any time; continued use after an update constitutes acceptance.",
  },
  {
    title: "2. Permitted uses",
    body: "You may use Praxis for lawful business and personal productivity purposes, including drafting content, analysing information, automating tasks, and communicating with AI employees. You are responsible for ensuring your use complies with all laws applicable to you, including privacy, employment, and export control laws.",
  },
  {
    title: "3. Prohibited uses",
    body: "You may not use Praxis to: (a) generate, store, or transmit content that is illegal, defamatory, fraudulent, obscene, or that violates third-party intellectual property rights; (b) harass, threaten, or harm any individual or group; (c) create or distribute malware, spam, phishing schemes, or deceptive content; (d) attempt to access other users' accounts or data; (e) reverse-engineer, decompile, or extract model weights or proprietary algorithms; (f) circumvent rate limits, access controls, or usage caps; (g) use the platform to train or fine-tune competing AI systems; or (h) represent AI-generated output as independent human professional advice in regulated contexts without appropriate disclosure.",
  },
  {
    title: "4. AI output responsibilities",
    body: "You are responsible for reviewing all output produced by Praxis AI employees before acting on it. AI-generated content — including content from the legal, finance, compliance, and HR employees — is not professional advice. Do not use Praxis output as the sole basis for consequential legal, financial, medical, or safety decisions.",
  },
  {
    title: "5. Data and confidentiality",
    body: "Do not submit information to Praxis that you are not authorised to disclose. This includes trade secrets belonging to third parties, personal data subject to stricter processing requirements (such as health data or children's data), or classified information. Our Privacy Policy describes how we handle the data you do share.",
  },
  {
    title: "6. Automated access",
    body: "Accessing Praxis via automated scripts, bots, or crawlers is permitted only via officially documented API integrations. Scraping or bulk-downloading content from the platform is prohibited. We reserve the right to rate-limit or suspend accounts that place excessive load on the platform.",
  },
  {
    title: "7. Enforcement",
    body: "We may investigate suspected violations and, without prior notice, suspend or permanently terminate accounts that violate this AUP. We may also report illegal activity to appropriate authorities. Termination does not entitle you to a refund of any prepaid subscription fees.",
  },
  {
    title: "8. Contact",
    body: "To report suspected misuse or ask questions about this policy, email trust@conduitai.io.",
  },
];

export default function AcceptableUsePage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="Legal"
        title={
          <>
            Acceptable <span className="conduit-ember-text">Use</span>
          </>
        }
        subtitle="Last updated June 2026. Rules governing permitted and prohibited uses of the Praxis AI workforce platform."
      />

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
              href="/legal/terms"
              className="hover:text-[var(--color-indigo-500)] transition-colors underline underline-offset-4"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
