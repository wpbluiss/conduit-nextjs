import { getSnapshot } from "@/lib/finance/data";
import { daysBetween, totalDebt } from "@/lib/finance/compute";
import { fmtMoney } from "@/lib/finance/constants";
import { Card, SectionTitle, Pill, GradientText } from "@/components/finance/ui";
import { ProgressRing } from "@/components/finance/ProgressRing";
import { AnimatedNumber } from "@/components/finance/AnimatedNumber";
import { Buildings, CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

// The plan, in one place — tweak as the numbers firm up.
const PLAN = {
  price: 750_000,
  downPaymentAllIn: 50_000, // 3.5% down + closing + reserves
  creditTarget: 620,
  buyDate: "2027-09-01",
  pitiMonthly: 6_000,
  rentPerUnit: 2_000,
  rentedUnits: 3,
  // honest score projections (estimates) for the "on track by" line
  creditETA: { luis: "Feb 2027", delia: "Oct 2026" } as Record<string, string>,
};

export default async function FourplexPage() {
  const snap = await getSnapshot();
  if (!snap) return null;

  const saved = snap.savingsLog.reduce((s, r) => s + Number(r.amount), 0);
  const dpPct = Math.min(100, (saved / PLAN.downPaymentAllIn) * 100);

  const debtLeft = totalDebt(snap.debts);

  const today = new Date().toISOString().slice(0, 10);
  const daysToBuy = Math.max(0, daysBetween(today, PLAN.buyDate));
  const monthsToBuy = Math.round((daysToBuy / 30.44) * 10) / 10;

  // latest score per person (creditScores arrive oldest→newest)
  const latest: Record<string, number> = {};
  for (const s of snap.creditScores) latest[s.person_tag] = s.score;

  const rentCoverage = PLAN.rentPerUnit * PLAN.rentedUnits; // what the 3 rented units bring in
  const yourHousingCost = Math.max(0, PLAN.pitiMonthly - rentCoverage);

  const scoreRow = (tag: "luis" | "delia", name: string) => {
    const cur = latest[tag] ?? 0;
    const toGo = Math.max(0, PLAN.creditTarget - cur);
    const pct = Math.min(100, Math.max(0, ((cur - 450) / (PLAN.creditTarget - 450)) * 100));
    const there = cur >= PLAN.creditTarget;
    return (
      <div key={tag}>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-medium">{name}</span>
          <span className="flex items-center gap-2">
            <span className={there ? "text-[#7cc6a0]" : ""}>{cur || "—"}</span>
            <span className="text-[var(--fin-muted)] text-xs">→ {PLAN.creditTarget}</span>
            {there
              ? <Pill tone="green"><CheckCircle size={11} /> qualified</Pill>
              : <Pill tone="amber">{toGo} to go · ~{PLAN.creditETA[tag]}</Pill>}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#d9532a,#ff8a3d,#ffa876)" }} />
        </div>
      </div>
    );
  };

  const phases: { label: string; done: boolean; active: boolean; note: string }[] = [
    { label: "Kill the high-interest debt", done: false, active: debtLeft > 0, note: `${fmtMoney(debtLeft)} left · ~2–3 months` },
    { label: "Bank the down payment", done: false, active: debtLeft <= 0, note: `${fmtMoney(saved)} of ${fmtMoney(PLAN.downPaymentAllIn)} · ~$5K/mo after debt` },
    { label: "Both scores to 620+", done: (latest.luis ?? 0) >= 620 && (latest.delia ?? 0) >= 620, active: true, note: "FHA uses the lower score — Luis is the gate" },
    { label: "Buy the fourplex (FHA, live in 1)", done: false, active: false, note: "Rent the other 3 · house-hack" },
    { label: "Refi at year 2–3 → pull equity → repeat", done: false, active: false, note: "Drop MIP, cash-out, buy #2 (BRRRR)" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-11 h-11 rounded-xl bg-[#ff8a3d]/10 border border-[#ff8a3d]/20">
          <Buildings size={22} weight="duotone" className="text-[#ffa876]" />
        </div>
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">The Fourplex</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-0.5">Live in one, rent three. The plan, on the clock.</p>
        </div>
      </div>

      {/* Countdown hero */}
      <Card glow className="text-center">
        <div className="fin-mono text-[10px] uppercase tracking-[0.24em] text-[var(--fin-muted)]">Target buy date · {new Date(PLAN.buyDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
        <div className="fin-display text-5xl sm:text-6xl mt-2">
          <AnimatedNumber value={monthsToBuy} decimals={1} /> <span className="text-2xl text-[var(--fin-muted)]">months out</span>
        </div>
        <p className="text-xs text-[var(--fin-muted)] mt-2 max-w-sm mx-auto">
          A {fmtMoney(PLAN.price)} fourplex. {daysToBuy} days to get the credit and the cash in place.
        </p>
      </Card>

      {/* Down payment + credit */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="flex flex-col items-center">
          <SectionTitle eyebrow="Cash" title="Down payment fund" />
          <ProgressRing pct={dpPct} size={210}>
            <div className="text-center">
              <div className="fin-display text-3xl"><GradientText>{fmtMoney(saved)}</GradientText></div>
              <div className="text-[11px] text-[var(--fin-muted)] mt-1">of {fmtMoney(PLAN.downPaymentAllIn)} all-in</div>
            </div>
          </ProgressRing>
          <p className="text-[11px] text-[var(--fin-muted)] text-center mt-3">
            FHA 3.5% down + closing + reserves. Saving kicks in once the debt is dead.
          </p>
        </Card>

        <Card>
          <SectionTitle eyebrow="The gate" title="Credit to 620" />
          <div className="space-y-4">
            {scoreRow("luis", "Luis")}
            {scoreRow("delia", "Delia")}
          </div>
          <p className="text-[11px] text-[var(--fin-muted)] mt-4">
            FHA approves on the <span className="text-white">lower</span> of your two scores — so Luis is the one to watch.
            Paying the cards down is what moves these, fast.
          </p>
        </Card>
      </div>

      {/* Deal math */}
      <Card>
        <SectionTitle eyebrow="Does it pencil?" title="The deal math" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="fin-card p-3">
            <div className="text-lg font-semibold">{fmtMoney(PLAN.pitiMonthly)}</div>
            <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)] mt-1">Mortgage/mo</div>
          </div>
          <div className="fin-card p-3">
            <div className="text-lg font-semibold text-[#7cc6a0]">{fmtMoney(rentCoverage)}</div>
            <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)] mt-1">3 units rent</div>
          </div>
          <div className="fin-card p-3">
            <div className="text-lg font-semibold"><GradientText>{fmtMoney(yourHousingCost)}</GradientText></div>
            <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)] mt-1">Your cost/mo</div>
          </div>
          <div className="fin-card p-3">
            <div className="text-lg font-semibold text-[#7cc6a0]">{fmtMoney(1100 - yourHousingCost)}</div>
            <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)] mt-1">vs RV saved</div>
          </div>
        </div>
        <p className="text-[11px] text-[var(--fin-muted)] mt-3">
          FHA&apos;s self-sufficiency test only approves a 3–4 unit if <span className="text-white">75% of all units&apos; rent ≥ the mortgage</span> —
          so the building has to pay for itself before you&apos;re even cleared. Buy one already tenant-occupied and keep ~6 months
          reserves, and a vacancy can&apos;t sink you.
        </p>
      </Card>

      {/* Roadmap */}
      <Card>
        <SectionTitle eyebrow="Roadmap" title="The 5 moves" />
        <div className="space-y-3">
          {phases.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              {p.done
                ? <CheckCircle size={20} weight="fill" className="text-[#7cc6a0] mt-0.5 shrink-0" />
                : <Circle size={20} weight={p.active ? "duotone" : "regular"} className={`mt-0.5 shrink-0 ${p.active ? "text-[#ffa876]" : "text-[var(--fin-muted)]"}`} />}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${p.active ? "" : p.done ? "" : "text-[var(--fin-muted)]"}`}>{p.label}</span>
                  {p.active && <Pill tone="amber">now</Pill>}
                </div>
                <div className="text-[11px] text-[var(--fin-muted)] mt-0.5">{p.note}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-4">
        <p className="text-[12px] text-[var(--fin-muted)]">
          <span className="text-white font-medium">Why this works:</span> tenants pay your mortgage, rent rises while the
          loan stays fixed, and the value compounds. Married at 22, signing on a fourplex, money working while you sleep —
          it&apos;s a spreadsheet with a deadline, and you&apos;re already on it. 🏗️
        </p>
      </Card>
    </div>
  );
}
