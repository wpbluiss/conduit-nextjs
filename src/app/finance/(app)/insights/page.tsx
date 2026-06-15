import { getSnapshot, recordAndGetNetWorth } from "@/lib/finance/data";
import {
  safeToSpend, monthSpending, monthlyRecap, netWorth, pooledCash,
  investmentsValue, totalDebt, daysBetween, todayISO,
} from "@/lib/finance/compute";
import { fmtMoney } from "@/lib/finance/constants";
import { Card, SectionTitle, EmptyState, GradientText } from "@/components/finance/ui";
import { AnimatedNumber } from "@/components/finance/AnimatedNumber";
import { NetWorthAreaChart } from "@/components/finance/Charts";
import { BillCalendar, type DayMark } from "@/components/finance/BillCalendar";

export const dynamic = "force-dynamic";

const CAT_EMOJI: Record<string, string> = {
  housing: "🏠", utilities: "💡", groceries: "🛒", transport: "🚗", gas: "⛽",
  childcare: "🧸", babysitter: "🧸", insurance: "🛡️", phone: "📱", subscriptions: "📺",
  dining: "🍽️", medical: "🩺", debt: "💳", "child support": "⚖️", child_support: "⚖️",
  infrastructure: "🖥️", general: "💸",
};

export default async function InsightsPage() {
  const snap = await getSnapshot();
  if (!snap) return null;
  const safe = safeToSpend(snap);
  const spend = monthSpending(snap);
  const recap = monthlyRecap(snap);
  const totalSpend = spend.reduce((s, c) => s + c.amount, 0);
  const max = spend[0]?.amount ?? 1;
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  // Net worth trend (records today, returns history)
  const nwHistory = await recordAndGetNetWorth({
    net_worth: netWorth(snap),
    cash: pooledCash(snap.accounts),
    debt: totalDebt(snap.debts),
    investments: investmentsValue(snap.investments),
  });

  // Bill calendar marks for the current month
  const now = new Date();
  const ymKey = now.toISOString().slice(0, 7);
  const markMap = new Map<number, DayMark>();
  const addMark = (day: number, amount: number, overdue: boolean) => {
    const ex = markMap.get(day);
    markMap.set(day, { day, amount: (ex?.amount ?? 0) + amount, overdue: (ex?.overdue ?? false) || overdue });
  };
  for (const e of snap.expenses) {
    if (e.paid) continue;
    if (e.due_date && e.due_date.slice(0, 7) === ymKey) {
      const day = Number(e.due_date.slice(8, 10));
      addMark(day, Number(e.amount), daysBetween(todayISO(), e.due_date) < 0);
    } else if (e.recurring && e.recurrence === "monthly" && e.due_day) {
      addMark(e.due_day, Number(e.amount), false);
    }
  }
  if (snap.childSupport && Number(snap.childSupport.remaining_balance) > 0) {
    const paidThis = snap.payments.some((p) => p.kind === "child_support" && p.date.slice(0, 7) === ymKey);
    if (!paidThis) addMark(15, Number(snap.childSupport.monthly_amount), now.getDate() > 15);
  }
  const marks = Array.from(markMap.values());

  return (
    <div className="space-y-5">
      <div>
        <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Insights</h1>
        <p className="text-sm text-[var(--fin-muted)] mt-1">Where it goes, and what&apos;s truly free to spend.</p>
      </div>

      {/* Safe to spend — the number everyone wants */}
      <Card glow className="text-center">
        <div className="fin-mono text-[10px] uppercase tracking-[0.24em] text-[var(--fin-muted)]">Safe to spend right now</div>
        <div className={`fin-display text-5xl sm:text-6xl mt-2 ${safe < 0 ? "text-[#f0888c]" : ""}`}>
          {safe < 0 ? "−" : ""}<AnimatedNumber value={Math.abs(safe)} prefix="$" />
        </div>
        <p className="text-xs text-[var(--fin-muted)] mt-2 max-w-sm mx-auto">
          {safe < 0
            ? "Your upcoming bills outrun your cash + expected income. Hold off — cover the essentials first."
            : "After your cash, expected paycheck, and everything due in 30 days. This is yours to spend without guilt."}
        </p>
      </Card>

      {/* Monthly recap */}
      <div>
        <SectionTitle eyebrow={monthName} title="This month" />
        <div className="grid grid-cols-3 gap-3">
          <Card className="!p-4 text-center">
            <div className="text-xl font-semibold text-[#7cc6a0]"><AnimatedNumber value={recap.inflow} prefix="$" /></div>
            <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)] mt-1">Money in</div>
          </Card>
          <Card className="!p-4 text-center">
            <div className="text-xl font-semibold text-[#ffa876]"><AnimatedNumber value={recap.outflow} prefix="$" /></div>
            <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)] mt-1">Money out</div>
          </Card>
          <Card className="!p-4 text-center">
            <div className="text-xl font-semibold"><GradientText><AnimatedNumber value={recap.saved} prefix="$" /></GradientText></div>
            <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)] mt-1">Saved</div>
          </Card>
        </div>
      </div>

      {/* Net worth over time */}
      <Card>
        <SectionTitle eyebrow="Trend" title="Net worth over time" />
        {nwHistory.length < 2 ? (
          <EmptyState>Building your history — check back daily and watch the line climb. 📈</EmptyState>
        ) : (
          <NetWorthAreaChart data={nwHistory} />
        )}
      </Card>

      {/* Bill calendar */}
      <Card>
        <SectionTitle eyebrow="Calendar" title="Bills this month" />
        <BillCalendar year={now.getFullYear()} month={now.getMonth()} marks={marks} todayDay={now.getDate()} />
      </Card>

      {/* Where it goes */}
      <Card>
        <SectionTitle eyebrow="Spending" title={`Where ${monthName}'s money went`} />
        {spend.length === 0 ? (
          <EmptyState>Nothing logged as paid yet this month. Mark bills paid to see the breakdown.</EmptyState>
        ) : (
          <div className="space-y-3">
            {spend.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="capitalize">{CAT_EMOJI[c.key] ?? "💸"} {c.key.replace("_", " ")}</span>
                  <span className="font-semibold">{fmtMoney(c.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c.amount / max) * 100}%`, background: "linear-gradient(90deg,#d9532a,#ff8a3d,#ffa876)" }} />
                </div>
              </div>
            ))}
            <div className="text-[11px] text-[var(--fin-muted)] pt-1 fin-mono">Total out this month · {fmtMoney(totalSpend)}</div>
          </div>
        )}
      </Card>
    </div>
  );
}
