import Link from "next/link";

export const metadata = { title: "Terms of Service — Cadence" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/finance" className="text-[12px] text-[#ffa876] hover:underline">← Back to Cadence</Link>
      <h1 className="fin-display text-3xl tracking-tight mt-4">Terms of Service</h1>
      <p className="text-[12px] text-[var(--fin-muted)] mt-1">Last updated: June 2026</p>

      <div className="prose-fin mt-8 space-y-6 text-sm leading-relaxed text-[var(--fin-text)]/90">
        <section className="rounded-xl border border-[#ff8a3d]/25 bg-[#ff8a3d]/[0.06] p-4">
          <p className="font-semibold text-white">Not financial, investment, tax, or legal advice.</p>
          <p className="text-[var(--fin-muted)] mt-1">
            Cadence is a personal budgeting, organization, and educational tool. Its insights and AI
            assistant are for general informational purposes only and are not a substitute for advice
            from a licensed financial advisor, accountant, or attorney. We are not a bank, broker-dealer,
            or registered investment adviser, and no fiduciary relationship is created by your use of Cadence.
            Decisions you make are your own.
          </p>
        </section>

        <P title="1. Who we are">
          Cadence (&quot;Cadence,&quot; &quot;the Service,&quot; &quot;we,&quot; &quot;us&quot;) is operated by Conduit AI.
          By creating an account or using the Service you agree to these Terms.
        </P>
        <P title="2. Eligibility">
          You must be at least 18 years old and able to form a binding contract. You are responsible for
          maintaining the confidentiality of your login and for all activity under your account.
        </P>
        <P title="3. The Service">
          Cadence lets you manually track income, expenses, debts, savings goals, investments, and credit,
          and provides an AI assistant that helps you organize and understand your finances. Optional
          bank-connection features (provided via third parties such as Plaid) let you import account and
          transaction data. Features may change over time.
        </P>
        <P title="4. AI assistant">
          The AI assistant generates responses automatically and may be inaccurate or incomplete. It does
          not move money and cannot execute transactions. Always verify important figures yourself.
        </P>
        <P title="5. Your data &amp; accuracy">
          You are responsible for the accuracy of information you enter. Projections and recommendations are
          estimates based on the data available and assumptions that may not hold.
        </P>
        <P title="6. Subscriptions &amp; billing">
          Some features may require a paid subscription. Prices, billing cycles, and what each plan includes
          are shown at the point of purchase. Subscriptions renew automatically until cancelled; you can
          cancel anytime and retain access through the end of the paid period. Payments are processed by our
          payment provider (e.g. Stripe or the applicable app store).
        </P>
        <P title="7. Acceptable use">
          Don&apos;t misuse the Service, attempt to access other users&apos; data, reverse-engineer it, or use it
          for unlawful purposes. We may suspend or terminate accounts that violate these Terms.
        </P>
        <P title="8. Termination &amp; data deletion">
          You may delete your account at any time, which removes your household data. We may terminate or
          suspend access for violations of these Terms.
        </P>
        <P title="9. Disclaimers &amp; limitation of liability">
          The Service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted
          by law, Conduit AI is not liable for any indirect, incidental, or consequential damages, or for any
          financial decisions made using the Service.
        </P>
        <P title="10. Changes">
          We may update these Terms; material changes will be noted in-app or by email. Continued use after
          changes means you accept the updated Terms.
        </P>
        <P title="11. Contact">
          Questions? Contact Conduit AI at <span className="text-[#ffa876]">support@conduitai.io</span>.
        </P>
      </div>
    </main>
  );
}

function P({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="text-[var(--fin-muted)] mt-1.5">{children}</p>
    </section>
  );
}
