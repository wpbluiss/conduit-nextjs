import Link from "next/link";
import { getSnapshot } from "@/lib/finance/data";
import {
  pooledCash, netWorth, investmentsValue, projectIncome,
  goalProgress, orderDebts, daysBetween, todayISO, onTimeStats,
} from "@/lib/finance/compute";
import { fmtMoney } from "@/lib/finance/constants";
import { GoalHero } from "@/components/finance/GoalHero";
import { MetricCard } from "@/components/finance/MetricCard";
import { QuickAddRow } from "@/components/finance/QuickAdd";
import { AllocationPlanner } from "@/components/finance/AllocationPlanner";
import { Card, SectionTitle, Pill, EmptyState } from "@/components/finance/ui";
import { Flame, Sparkle, Warning, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function FinanceHome() {
  const snap = await getSnapshot();
  if (!snap) {
    return (
      <Card>
        <p className="text-sm text-[var(--fin-muted)]">
          Couldn&apos;t load your household. Try refreshing.
        </p>
      </Card>
    );
  }

  const cash = pooledCash(snap.accounts);
  const nw = netWorth(snap);
  const invVal = investmentsValue(snap.investments);
  const income = projectIncome(snap.paychecks);
  const g = goalProgress(
    snap.savingsLog, snap.household.savings_goal,
    snap.household.goal_start_date, snap.household.goal_target_date,
  );
  const debt = orderDebts(snap.debts);
  const ot = onTimeStats(snap.payments);

  const dueSoon = snap.expenses
    .filter((e) => !e.paid && e.due_date)
    .map((e) => ({ ...e, days: daysBetween(todayISO(), e.due_date as string) }))
    .filter((e) => e.days <= 30 && e.days >= -7)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  const cs = snap.childSupport;

  // Proactive advisor status line
  const statusBits: string[] = [];
  statusBits.push(g.onTrack ? `You're ahead of pace by ${fmtMoney(Math.abs(g.aheadBehindDollars))}.` : `You're behind pace by ${fmtMoney(Math.abs(g.aheadBehindDollars))} — let's tighten up.`);
  if (debt.next) statusBits.push(`Attack next: ${debt.next.name} (${fmtMoney(debt.next.balance)}).`);
  if (dueSoon[0]) statusBits.push(`${dueSoon[0].name} due ${dueSoon[0].days <= 0 ? "now" : `in ${dueSoon[0].days}d`}.`);

  return (
    <div className="space-y-6">
      {/* Greeting + status */}
      <div className="fin-rise">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">
              Good to see you, Luis &amp; Delia
            </h1>
            <p className="text-sm text-[var(--fin-muted)] mt-1">
              One pool. One goal. Here&apos;s where you stand.
            </p>
          </div>
          <QuickAddRow />
        </div>
      </div>

      {/* Advisor proactive banner */}
      <Link href="/finance/advisor" className="block">
        <Card className="!p-4 hover:bg-white/[0.04] transition group">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-violet-400/15 p-2">
              <Sparkle size={18} weight="fill" className="text-violet-300" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] fin-mono uppercase tracking-[0.18em] text-[var(--fin-muted)]">
                Your private bank · daily brief
              </div>
              <p className="text-sm mt-1 text-white/90">{statusBits.join(" ")}</p>
            </div>
            <span className="text-xs text-violet-300 group-hover:translate-x-0.5 transition opacity-0 sm:opacity-100">
              Open advisor →
            </span>
          </div>
        </Card>
      </Link>

      {/* The centerpiece */}
      <GoalHero g={g} />

      {/* Pooled metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Pooled cash" value={cash} tone="cyan" glow hint="Checking + savings + cash" />
        <MetricCard label="Net worth" value={nw} tone="violet" delay={0.05} hint="Cash + investments − debt" />
        <MetricCard
          label="Income / mo (proj.)"
          value={income.monthly}
          tone="green"
          delay={0.1}
          hint={`Based on ${income.count} paycheck${income.count === 1 ? "" : "s"} logged`}
        />
        <MetricCard label="Total debt" value={debt.total} tone="pink" delay={0.15} hint={`${debt.debts.length} active`} />
      </div>

      {/* Allocation engine */}
      <AllocationPlanner snap={snap} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Debt-killer summary */}
        <Card>
          <SectionTitle
            eyebrow="Debt-Killer"
            title="Attack plan"
            action={<Link href="/finance/debts" className="text-xs text-violet-300 hover:underline">Open →</Link>}
          />
          {debt.next ? (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-pink-400/5 border border-pink-400/15 p-4">
                <Flame size={26} weight="fill" className="text-pink-300" />
                <div className="flex-1">
                  <div className="text-[11px] fin-mono uppercase tracking-wide text-[var(--fin-muted)]">
                    Attack next · {debt.recommendation}
                  </div>
                  <div className="text-lg font-semibold">{debt.next.name}</div>
                  <div className="text-xs text-[var(--fin-muted)]">{debt.rationale}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold">{fmtMoney(debt.next.balance)}</div>
                  {debt.next.apr > 0 && (
                    <div className="text-xs text-[var(--fin-muted)]">{debt.next.apr}% APR</div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-[var(--fin-muted)] mb-1.5">
                  <span>Paid off {fmtMoney(debt.paidOff)}</span>
                  <span>{fmtMoney(debt.total)} to go</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${debt.originalTotal > 0 ? (debt.paidOff / debt.originalTotal) * 100 : 0}%`,
                      background: "linear-gradient(90deg,#F472B6,#FBBF24)",
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-emerald-300">
              <CheckCircle size={24} weight="fill" /> Debt-free. Debt-killer now rolls into savings.
            </div>
          )}
        </Card>

        {/* Due soon */}
        <Card>
          <SectionTitle
            eyebrow="Cashflow"
            title="Due soon"
            action={<Link href="/finance/expenses" className="text-xs text-violet-300 hover:underline">Open →</Link>}
          />
          {dueSoon.length === 0 ? (
            <EmptyState>Nothing due in the next 30 days.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {dueSoon.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{e.name}</div>
                    <div className="text-[11px] text-[var(--fin-muted)] capitalize">{e.category.replace("_", " ")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{fmtMoney(e.amount)}</span>
                    <Pill tone={e.days <= 0 ? "red" : e.days <= 5 ? "amber" : "default"}>
                      {e.days <= 0 ? "due now" : `${e.days}d`}
                    </Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {cs && cs.remaining_balance > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--fin-muted)]">
              <Warning size={14} className="text-amber-300" />
              Child support: {fmtMoney(cs.monthly_amount)}/mo · {fmtMoney(cs.remaining_balance)} remaining (payable {cs.pay_window})
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <MetricCard label="Investments value" value={invVal} tone="cyan" hint="Long game — not the 15-mo engine" />
        <MetricCard label="On-time payments" value={ot.pct} prefix="" suffix="%" decimals={0} tone="green" hint={`${ot.streak} in a row`} />
        <MetricCard label="Monthly savings target" value={snap.household.monthly_savings_target} tone="violet" hint="Editable in Settings" />
      </div>
    </div>
  );
}
