import Link from "next/link";
import { getSnapshot } from "@/lib/finance/data";
import {
  pooledCash, netWorth, projectIncome, goalProgress, orderDebts,
  onTimeStats, dueNow,
} from "@/lib/finance/compute";
import { gameState, vaultPct } from "@/lib/finance/gamify";
import { fmtMoney, personLabel } from "@/lib/finance/constants";
import { LevelBar } from "@/components/finance/LevelBar";
import { MetricCard } from "@/components/finance/MetricCard";
import { MoneyStrip } from "@/components/finance/MoneyStrip";
import { CompactGoalDebt } from "@/components/finance/CompactGoalDebt";
import { QuestHero } from "@/components/finance/QuestHero";
import { MysteryReveal } from "@/components/finance/MysteryReveal";
import { QuickAddRow } from "@/components/finance/QuickAdd";
import { AllocationPlanner } from "@/components/finance/AllocationPlanner";
import { Card, Pill } from "@/components/finance/ui";
import { MarkPaidButton, ChildSupportPayModal } from "@/components/finance/RowControls";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function FinanceHome() {
  const snap = await getSnapshot();
  if (!snap) return <Card>Couldn&apos;t load your household. Try refreshing.</Card>;

  const cash = pooledCash(snap.accounts);
  const income = projectIncome(snap.paychecks);
  const g = goalProgress(snap.savingsLog, snap.household.savings_goal, snap.household.goal_start_date, snap.household.goal_target_date);
  const debt = orderDebts(snap.debts);
  const ot = onTimeStats(snap.payments);
  const game = gameState(snap);
  // The reward you're chasing — most progress first, surprises win ties.
  const heroVault =
    snap.vaults
      .filter((v) => v.status === "active")
      .sort((a, b) => {
        const d = vaultPct(b) - vaultPct(a);
        return d !== 0 ? d : (b.is_mystery ? 1 : 0) - (a.is_mystery ? 1 : 0);
      })[0] ?? null;

  const due = dueNow(snap, 16);
  const dueTotal = due.reduce((s, d) => s + d.amount, 0);
  const expected = Number(snap.household.expected_next_deposit);
  const leftover = expected - dueTotal;

  const statusBits: string[] = [];
  statusBits.push(g.onTrack ? `Ahead of pace by ${fmtMoney(Math.abs(g.aheadBehindDollars))}.` : `Behind pace by ${fmtMoney(Math.abs(g.aheadBehindDollars))} — let's tighten up.`);
  if (debt.next) statusBits.push(`Attack next: ${debt.next.name} (${fmtMoney(debt.next.balance)}).`);
  if (due[0]) statusBits.push(`${due[0].name} due ${due[0].days !== null && due[0].days <= 0 ? "now" : `in ${due[0].days}d`}.`);

  function pillTone(days: number | null): "red" | "amber" | "default" {
    if (days === null) return "default";
    if (days <= 0) return "red";
    if (days <= 3) return "amber";
    return "default";
  }

  const revealedMysteries = snap.vaults
    .filter((v) => v.is_mystery && v.revealed && v.mystery_destination)
    .map((v) => ({ id: v.id, destination: v.mystery_destination!, blurb: v.mystery_blurb, emoji: v.emoji }));

  return (
    <div className="space-y-5">
      <MysteryReveal vaults={revealedMysteries} />
      {/* Greeting */}
      <div className="fin-rise flex items-center justify-between gap-3">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Hey, Luis &amp; Delia</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">Level up. Unlock the good stuff.</p>
        </div>
      </div>

      {/* Game layer: level + XP */}
      <LevelBar g={game} />

      {/* THE CENTERPIECE: the reward you're chasing */}
      <QuestHero vault={heroVault} autofundPct={Number(snap.household.vault_autofund_pct)} />

      {/* Goal + Boss battles */}
      <CompactGoalDebt
        saved={g.saved}
        goal={g.goal}
        goalPct={g.pct}
        projectedCompletion={g.projectedCompletion}
        debtLeft={debt.total}
        debtPaid={debt.paidOff}
        debtOriginal={debt.originalTotal}
        attackNext={debt.next?.name ?? null}
      />

      {/* Quick add */}
      <QuickAddRow />

      {/* Money strip */}
      <MoneyStrip
        pooled={cash}
        expected={expected}
        expectedDate={snap.household.expected_deposit_date}
        expectedNote={snap.household.expected_deposit_note}
        aheadBehind={g.aheadBehindDollars}
        onTrack={g.onTrack}
      />

      {/* Coming up: what's due (calmer, lower) */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="fin-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fin-muted)]">Handle first</div>
            <h2 className="text-lg font-semibold tracking-tight">Coming up</h2>
          </div>
          <div className="text-right">
            <div className="fin-mono text-[10px] uppercase tracking-wide text-[var(--fin-muted)]">To pay</div>
            <div className="text-xl font-semibold text-[#ffa876]">{fmtMoney(dueTotal)}</div>
          </div>
        </div>

        {due.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-[var(--fin-muted)]">Nothing due in the next 16 days. 🎉</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {due.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{d.name}</span>
                    <Pill tone={pillTone(d.days)}>
                      {d.days !== null && d.days <= 0 ? "due now" : `${d.days}d`}
                    </Pill>
                  </div>
                  <div className="text-[11px] text-[var(--fin-muted)] capitalize mt-0.5">
                    {d.category.replace("_", " ")} · {personLabel(d.person_tag)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold">{fmtMoney(d.amount, { cents: d.amount % 1 !== 0 })}</span>
                  {d.kind === "child_support"
                    ? <ChildSupportPayModal amount={d.amount} />
                    : <MarkPaidButton id={d.id} />}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Leftover math */}
        <div className="border-t border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--fin-muted)]">Incoming (est.) {fmtMoney(expected)} − due {fmtMoney(dueTotal)}</span>
            <span className={`text-lg font-semibold ${leftover < 0 ? "text-[#f0888c]" : "text-[#7cc6a0]"}`}>
              {leftover < 0 ? "−" : ""}{fmtMoney(Math.abs(leftover))} left
            </span>
          </div>
          {leftover < 0 && (
            <p className="text-[11px] text-[#ffa876] mt-1">
              Heads up: your due bills exceed the expected check by {fmtMoney(Math.abs(leftover))}. Prioritize the overdraft + past-due items first.
            </p>
          )}
        </div>
      </Card>

      {/* Advisor brief */}
      <Link href="/finance/advisor" className="block">
        <Card className="!p-4 hover:bg-white/[0.04] transition">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-[#ff8a3d]/15 p-2 shrink-0">
              <Sparkle size={18} weight="fill" className="text-[#ffa876]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] fin-mono uppercase tracking-[0.18em] text-[var(--fin-muted)]">Your private bank · brief</div>
              <p className="text-sm mt-1 text-white/90">{statusBits.join(" ")}</p>
            </div>
          </div>
        </Card>
      </Link>

      {/* Windfall splitter */}
      <AllocationPlanner snap={snap} />

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Income / mo" value={income.monthly} tone="green" hint={`${income.count} logged`} />
        <MetricCard label="Net worth" value={netWorth(snap)} tone="violet" delay={0.05} />
        <MetricCard label="On-time" value={ot.pct} prefix="" suffix="%" tone="cyan" delay={0.1} hint={`${ot.streak} streak`} />
      </div>
    </div>
  );
}
