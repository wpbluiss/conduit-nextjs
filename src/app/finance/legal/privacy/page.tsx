import Link from "next/link";

export const metadata = { title: "Privacy Policy — Cadence" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/finance" className="text-[12px] text-[#ffa876] hover:underline">← Back to Cadence</Link>
      <h1 className="fin-display text-3xl tracking-tight mt-4">Privacy Policy</h1>
      <p className="text-[12px] text-[var(--fin-muted)] mt-1">Last updated: June 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--fin-text)]/90">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="font-semibold text-white">We never sell your personal or financial data.</p>
          <p className="text-[var(--fin-muted)] mt-1">
            Cadence (operated by Conduit AI) takes your financial privacy seriously. This policy explains
            what we collect, why, and your choices.
          </p>
        </section>

        <P title="1. Information we collect">
          <b>Account:</b> email and authentication details. <br />
          <b>Financial data you enter:</b> accounts, balances, paychecks, expenses, debts, savings, investments,
          credit scores, and goals. <br />
          <b>Connected accounts (optional):</b> if you link a bank via our provider (e.g. Plaid), we receive
          balances and transactions you authorize — we never see your bank login credentials. <br />
          <b>AI conversations:</b> messages you send the assistant. <br />
          <b>Usage &amp; device:</b> basic analytics and error logs to keep the app working.
        </P>
        <P title="2. How we use it">
          To provide the Service: show your finances, compute projections, power the AI assistant, send
          reminders you enable, process subscriptions, and improve reliability. We do not use your individual
          financial data to train third-party advertising models.
        </P>
        <P title="3. Who we share it with (subprocessors)">
          We share data only with vendors that help us run Cadence, under contract: <b>Supabase</b> (database,
          authentication, hosting), <b>Anthropic</b> (powers the AI assistant — your prompts are processed to
          generate replies), <b>Plaid</b> (only if you connect a bank), and <b>Stripe</b> / the relevant app
          store (only to process payments). We may disclose data if required by law.
        </P>
        <P title="4. Security">
          Data is encrypted in transit and at rest, access is restricted per household by database row-level
          security, and secrets are stored server-side. No system is perfectly secure, but we work to protect
          your information and will notify you of material breaches as required by law.
        </P>
        <P title="5. Your rights">
          You can access and edit your data in-app, export it, and delete your account (which removes your
          household data). To make a request, use in-app account deletion or email{" "}
          <span className="text-[#ffa876]">privacy@conduitai.io</span>.
        </P>
        <P title="6. Data retention">
          We keep your data while your account is active. When you delete your account, we remove your
          household&apos;s financial data (some minimal records may be retained as required for legal/accounting).
        </P>
        <P title="7. Children">
          Cadence is not directed to children under 13 and we do not knowingly collect their data.
        </P>
        <P title="8. Changes">
          We may update this policy; material changes will be noted in-app or by email.
        </P>
        <P title="9. Contact">
          Conduit AI — <span className="text-[#ffa876]">privacy@conduitai.io</span>.
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
