import Link from "next/link";
import { PLANS } from "@/lib/finance/plan";
import {
  Sparkle, Wallet, Flame, ChartLineUp, Gauge, Target, Check,
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-static";

const FEATURES = [
  { icon: Sparkle, title: "AI advisor", body: "Talk to it like a private wealth team. Log a paycheck, split a windfall, or ask “what's my best move” — in plain English." },
  { icon: Target, title: "One goal, one pool", body: "Pool every dollar toward what matters. A live goal ring shows exactly how far ahead or behind pace you are." },
  { icon: Flame, title: "Debt-killer", body: "Every balance, ordered for momentum or maximum interest saved, with a clear “attack next” and progress to zero." },
  { icon: Wallet, title: "Cashflow command center", body: "See what's due this week, what's left after bills, and where each dollar of your next check should go." },
  { icon: ChartLineUp, title: "Investments", body: "Track contributions and growth across separate buckets — honest about the long game vs. short-term goals." },
  { icon: Gauge, title: "Credit optimization", body: "Score trends, per-card utilization with the 10% line, and on-time streaks that coach you toward approvals." },
];

export default function CadenceLanding() {
  return (
    <div>
      {/* Nav */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cadence-icon.svg" alt="Cadence" width={28} height={28} className="rounded-lg" />
          <span className="fin-display text-lg"><span className="fin-gradient-text">Cadence</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/finance/sign-in" className="text-[var(--fin-muted)] hover:text-white transition">Sign in</Link>
          <Link href="/finance/sign-up" className="fin-btn-animate rounded-lg px-4 py-2 font-medium">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-20 text-center">
        <div className="fin-mono text-[11px] uppercase tracking-[0.3em] text-[var(--fin-muted)] mb-4">
          By Conduit AI
        </div>
        <h1 className="fin-display text-4xl sm:text-6xl tracking-tight leading-[1.05]">
          Your money,<br /><span className="fin-gradient-text">on a private banker&apos;s radar.</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--fin-muted)] max-w-xl mx-auto mt-5">
          Cadence is an AI-powered private bank for your household. Track income, crush debt, and hit your
          savings goal — with an advisor that actually knows your numbers.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/finance/sign-up" className="fin-btn-animate rounded-xl px-6 py-3 font-semibold">
            Start free
          </Link>
          <Link href="/finance/sign-in" className="rounded-xl border border-white/15 px-6 py-3 font-medium hover:bg-white/5 transition">
            Sign in
          </Link>
        </div>
        <p className="text-[11px] text-[var(--fin-muted)] mt-3">Free to start · Add it to your home screen · Cancel anytime</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="fin-card p-5">
                <div className="rounded-lg bg-[#ff8a3d]/15 p-2 w-fit">
                  <Icon size={20} weight="fill" className="text-[#ffa876]" />
                </div>
                <h3 className="font-semibold mt-3">{f.title}</h3>
                <p className="text-sm text-[var(--fin-muted)] mt-1.5 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <h2 className="fin-display text-3xl text-center tracking-tight">Simple pricing</h2>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {(["free", "plus"] as const).map((key) => {
            const p = PLANS[key];
            return (
              <div key={key} className={`fin-card p-6 ${key === "plus" ? "fin-glow" : ""}`}>
                <div className="font-semibold">{p.name}</div>
                <div className="mt-2"><span className="text-3xl font-semibold">{p.price}</span>{key === "plus" && <span className="text-sm text-[var(--fin-muted)]">/mo</span>}</div>
                <p className="text-xs text-[var(--fin-muted)] mt-1">{p.blurb}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check size={15} className="text-[#ffa876] mt-0.5 shrink-0" /> {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/finance/sign-up" className={`mt-5 block text-center rounded-lg px-4 py-2.5 text-sm font-medium ${key === "plus" ? "fin-btn-animate" : "border border-white/15 hover:bg-white/5 transition"}`}>
                  {key === "plus" ? "Start Plus" : "Start free"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 text-center">
        <h2 className="fin-display text-3xl sm:text-4xl tracking-tight">
          Get your money <span className="fin-gradient-text">in rhythm.</span>
        </h2>
        <Link href="/finance/sign-up" className="fin-btn-animate inline-block rounded-xl px-7 py-3 font-semibold mt-6">
          Create your free account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[var(--fin-muted)]">
          <div>© {new Date().getFullYear()} Conduit AI · Cadence</div>
          <div className="flex items-center gap-4">
            <Link href="/finance/legal/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/finance/legal/privacy" className="hover:text-white transition">Privacy</Link>
            <a href="mailto:support@conduitai.io" className="hover:text-white transition">Support</a>
          </div>
        </div>
        <p className="max-w-6xl mx-auto px-5 sm:px-8 pb-8 text-[11px] text-[var(--fin-muted)]">
          Cadence is a budgeting and educational tool, not financial, investment, tax, or legal advice.
        </p>
      </footer>
    </div>
  );
}
