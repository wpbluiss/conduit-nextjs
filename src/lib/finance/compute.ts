import type {
  Account, Paycheck, Expense, Debt, SavingsLog, Investment, Snapshot,
} from "./types";

const DAY = 1000 * 60 * 60 * 24;

export function daysBetween(a: string | Date, b: string | Date): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Balances ----------
export function pooledCash(accounts: Account[]): number {
  return accounts
    .filter((a) => ["checking", "savings", "cash"].includes(a.type))
    .reduce((s, a) => s + Number(a.balance), 0);
}

export function investmentsValue(investments: Investment[]): number {
  return investments.reduce((s, i) => s + Number(i.shares) * Number(i.current_price), 0);
}

export function investmentsCost(investments: Investment[]): number {
  return investments.reduce((s, i) => s + Number(i.cost_basis), 0);
}

export function totalDebt(debts: Debt[]): number {
  return debts
    .filter((d) => d.status !== "paid")
    .reduce((s, d) => s + Number(d.status === "settle" && d.settle_amount != null ? d.settle_amount : d.balance), 0);
}

export function netWorth(s: Snapshot): number {
  const cardBalances = s.accounts
    .filter((a) => a.type === "credit_card")
    .reduce((sum, a) => sum + Number(a.balance), 0);
  // credit-card balances also live in debts in the seed; net worth uses
  // cash + investments minus the debt module total (cards already represented).
  void cardBalances;
  return pooledCash(s.accounts) + investmentsValue(s.investments) - totalDebt(s.debts);
}

// ---------- Income projection (variable income) ----------
export interface IncomeProjection {
  monthly: number;
  perPaycheckAvg: number;
  count: number;
  avgIntervalDays: number | null;
  byPerson: { tag: string; monthly: number; count: number }[];
  windowDays: number;
}

// Build the per-person cadence map (keyed by lowercased name = person_tag) for projectIncome.
export function payFrequencyMap(
  people: { name: string; pay_frequency?: string | null }[],
): Record<string, string | null> {
  return Object.fromEntries(people.map((p) => [p.name.toLowerCase(), p.pay_frequency ?? null]));
}

// Periods per month for an explicit pay cadence, or null to fall back to inference.
function periodsPerMonth(freq: string | null | undefined): number | null {
  switch (freq) {
    case "weekly": return 4.33;
    case "biweekly": return 2.17;
    case "semimonthly": return 2;
    case "monthly": return 1;
    default: return null;
  }
}

export function projectIncome(
  paychecks: Paycheck[],
  frequencies: Record<string, string | null> = {},
): IncomeProjection {
  const amt = (p: Paycheck) => Number(p.take_home) + Number(p.mileage_reimbursement || 0);
  const sorted = [...paychecks].sort(
    (a, b) => new Date(a.pay_date).getTime() - new Date(b.pay_date).getTime(),
  );
  const count = sorted.length;
  const totalTakeHome = sorted.reduce((s, p) => s + amt(p), 0);
  const perPaycheckAvg = count ? totalTakeHome / count : 0;

  // Interval is measured between DISTINCT paydays (two jobs paid the same day,
  // or two halves of one check, count as a single payday — not a 0-day cadence).
  const allDays = Array.from(new Set(sorted.map((p) => p.pay_date))).sort();
  let avgIntervalDays: number | null = null;
  if (allDays.length >= 2) {
    const span = daysBetween(allDays[0], allDays[allDays.length - 1]);
    avgIntervalDays = span > 0 ? span / (allDays.length - 1) : null;
  }

  // Project one person: group their checks by payday, then scale the average
  // payday by a realistic cadence. The interval is clamped to weekly..monthly so
  // clustered historical entries can't explode the projection into fantasy land.
  function projectPerson(rows: Paycheck[], tag: string): number {
    if (rows.length === 0) return 0;
    const byDay = new Map<string, number>();
    for (const p of rows) byDay.set(p.pay_date, (byDay.get(p.pay_date) ?? 0) + amt(p));
    const days = Array.from(byDay.keys()).sort();
    const avgPayday = days.reduce((s, d) => s + byDay.get(d)!, 0) / days.length;
    // Exact: if we know this person's cadence, use it directly.
    const ppm = periodsPerMonth(frequencies[tag]);
    if (ppm) return avgPayday * ppm;
    // Otherwise infer from the data, clamped to a realistic weekly–monthly range.
    if (days.length < 2) return avgPayday * 2.17; // one payday so far — assume ~biweekly until more data
    let interval = daysBetween(days[0], days[days.length - 1]) / (days.length - 1);
    interval = Math.min(31, Math.max(7, interval));
    return avgPayday * (30.44 / interval);
  }

  const tags = Array.from(new Set(sorted.map((p) => p.person_tag)));
  const byPerson = tags.map((tag) => {
    const rows = sorted.filter((p) => p.person_tag === tag);
    return { tag, monthly: projectPerson(rows, tag), count: rows.length };
  });

  // Household monthly = sum of each person's projection (never mix cadences).
  const monthly = byPerson.reduce((s, b) => s + b.monthly, 0);
  const windowDays = count >= 2 ? daysBetween(sorted[0].pay_date, sorted[count - 1].pay_date) : 0;
  return { monthly, perPaycheckAvg, count, avgIntervalDays, byPerson, windowDays };
}

// ---------- Savings goal ----------
export interface GoalProgress {
  saved: number;
  goal: number;
  pct: number;
  expectedByNow: number;
  aheadBehindDollars: number; // positive = ahead
  daysElapsed: number;
  daysTotal: number;
  dailyRateNeeded: number;
  dailyRateActual: number;
  projectedCompletion: string | null;
  onTrack: boolean;
  monthlyPaceNeeded: number;
}

export function goalProgress(
  savingsLog: SavingsLog[],
  goal: number,
  startDate: string,
  targetDate: string | null,
): GoalProgress {
  const saved = savingsLog.reduce((s, r) => s + Number(r.amount), 0);
  const today = new Date();
  const start = new Date(startDate);
  const target = targetDate ? new Date(targetDate) : new Date(start.getTime() + 456 * DAY);
  const daysTotal = Math.max(1, daysBetween(start, target));
  const daysElapsed = Math.max(0, Math.min(daysTotal, daysBetween(start, today)));
  const remainingDays = Math.max(1, daysTotal - daysElapsed);

  const expectedByNow = (goal / daysTotal) * daysElapsed;
  const aheadBehindDollars = saved - expectedByNow;
  const dailyRateNeeded = (goal - saved) / remainingDays;
  const dailyRateActual = daysElapsed > 0 ? saved / daysElapsed : 0;

  let projectedCompletion: string | null = null;
  if (dailyRateActual > 0) {
    const daysToFinish = (goal - saved) / dailyRateActual;
    projectedCompletion = new Date(today.getTime() + daysToFinish * DAY)
      .toISOString().slice(0, 10);
  }

  return {
    saved,
    goal,
    pct: Math.max(0, Math.min(100, (saved / goal) * 100)),
    expectedByNow,
    aheadBehindDollars,
    daysElapsed,
    daysTotal,
    dailyRateNeeded,
    dailyRateActual,
    projectedCompletion,
    onTrack: aheadBehindDollars >= 0,
    monthlyPaceNeeded: dailyRateNeeded * 30.44,
  };
}

// ---------- Debt strategy ----------
export interface DebtOrdered {
  debts: Debt[];
  total: number;
  paidOff: number;
  originalTotal: number;
  next: Debt | null;
  snowball: Debt[];
  avalanche: Debt[];
  recommendation: "snowball" | "avalanche";
  rationale: string;
}

export function activeDebts(debts: Debt[]): Debt[] {
  return debts.filter((d) => d.status !== "paid" && Number(effectiveBalance(d)) > 0);
}

export function effectiveBalance(d: Debt): number {
  return d.status === "settle" && d.settle_amount != null ? Number(d.settle_amount) : Number(d.balance);
}

export function orderDebts(debts: Debt[]): DebtOrdered {
  const active = activeDebts(debts);
  const snowball = [...active].sort((a, b) => effectiveBalance(a) - effectiveBalance(b));
  const avalanche = [...active].sort((a, b) => {
    if (Number(b.apr) !== Number(a.apr)) return Number(b.apr) - Number(a.apr);
    return effectiveBalance(a) - effectiveBalance(b);
  });

  // Heuristic: prefer avalanche only when there is meaningful APR spread AND
  // the highest-APR debt is not also the smallest (i.e. when avalanche truly
  // diverges from snowball and saves interest). Otherwise momentum wins.
  const aprs = active.map((d) => Number(d.apr));
  const maxApr = Math.max(0, ...aprs);
  const hasInterestSpread = maxApr >= 15 && active.length > 1;
  const divergent = snowball[0]?.id !== avalanche[0]?.id;
  const recommendation: "snowball" | "avalanche" =
    hasInterestSpread && divergent ? "avalanche" : "snowball";

  const rationale =
    recommendation === "avalanche"
      ? `Highest-APR balance is ${maxApr.toFixed(2)}% — paying that first saves the most interest.`
      : `Balances are small and rates are close — knock out the smallest first for fast wins and momentum.`;

  return {
    debts: recommendation === "avalanche" ? avalanche : snowball,
    total: active.reduce((s, d) => s + effectiveBalance(d), 0),
    paidOff: debts.reduce((s, d) => s + Math.max(0, Number(d.original_balance) - effectiveBalance(d)), 0),
    originalTotal: debts.reduce((s, d) => s + Number(d.original_balance), 0),
    next: (recommendation === "avalanche" ? avalanche : snowball)[0] ?? null,
    snowball,
    avalanche,
    recommendation,
    rationale,
  };
}

// ---------- Allocation engine ----------
export interface AllocationLine {
  bucket: "expenses" | "savings" | "debt";
  label: string;
  amount: number;
  detail: string;
}

export function planAllocation(
  inflow: number,
  snapshot: Snapshot,
): { lines: AllocationLine[]; leftover: number } {
  let remaining = inflow;
  const lines: AllocationLine[] = [];
  const horizon = 14; // days

  // 1) Cover due / near-term unpaid expenses first
  const dueSoon = snapshot.expenses.filter((e) => {
    if (e.paid) return false;
    if (!e.due_date) return false;
    const d = daysBetween(todayISO(), e.due_date);
    return d <= horizon;
  });
  const dueTotal = dueSoon.reduce((s, e) => s + Number(e.amount), 0);
  if (dueTotal > 0) {
    const amt = Math.min(remaining, dueTotal);
    lines.push({
      bucket: "expenses",
      label: "Cover due bills",
      amount: amt,
      detail: `${dueSoon.length} bill(s) due within ${horizon} days`,
    });
    remaining -= amt;
  }

  const debtOrder = orderDebts(snapshot.debts);

  // 2) Savings target, 3) debt-killer. If debt is cleared, savings absorbs all.
  if (remaining > 0) {
    if (debtOrder.total <= 0) {
      lines.push({
        bucket: "savings",
        label: "Down-payment goal",
        amount: remaining,
        detail: "Debt is clear — everything rolls into the goal",
      });
      remaining = 0;
    } else {
      // Split remaining: savings target share vs debt-killer.
      const savingsTarget = Number(snapshot.household.monthly_savings_target);
      const savingsShare = Math.min(remaining, Math.max(0, savingsTarget * 0.5));
      if (savingsShare > 0) {
        lines.push({
          bucket: "savings",
          label: "Down-payment goal",
          amount: savingsShare,
          detail: "Toward the $75K target",
        });
        remaining -= savingsShare;
      }
      if (remaining > 0) {
        lines.push({
          bucket: "debt",
          label: `Attack: ${debtOrder.next?.name ?? "next debt"}`,
          amount: remaining,
          detail: debtOrder.rationale,
        });
        remaining = 0;
      }
    }
  }

  return { lines, leftover: remaining };
}

// ---------- Combined "due now" list (expenses + child support) ----------
export interface DueItem {
  id: string;
  kind: "expense" | "child_support";
  name: string;
  amount: number;
  due_date: string | null;
  days: number | null;
  category: string;
  person_tag: string;
}

export function dueNow(s: Snapshot, withinDays = 16): DueItem[] {
  const items: DueItem[] = [];
  for (const e of s.expenses) {
    if (e.paid) continue;
    const days = e.due_date ? daysBetween(todayISO(), e.due_date) : null;
    if (days !== null && days > withinDays) continue;
    if (days === null) continue; // only dated bills show in "due now"
    items.push({
      id: e.id, kind: "expense", name: e.name, amount: Number(e.amount),
      due_date: e.due_date, days, category: e.category, person_tag: e.person_tag,
    });
  }
  // Child support: show if not paid this calendar month and still owed.
  const cs = s.childSupport;
  if (cs && Number(cs.remaining_balance) > 0) {
    const paidThisMonth = s.payments.some(
      (p) => p.kind === "child_support" && p.date.slice(0, 7) === todayISO().slice(0, 7),
    );
    if (!paidThisMonth) {
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 15).toISOString().slice(0, 10);
      items.push({
        id: cs.id, kind: "child_support", name: "Child support",
        amount: Number(cs.monthly_amount), due_date: dueDate,
        days: daysBetween(todayISO(), dueDate), category: "child_support", person_tag: "luis",
      });
    }
  }
  return items.sort((a, b) => (a.days ?? 99) - (b.days ?? 99));
}

// ---------- Couple activity feed ----------
export interface ActivityItem {
  id: string; date: string; person: string; text: string; amount: number; emoji: string;
}

// Resolve a person_tag to a display name using the household's actual members
// (tags are the lowercased member name), so this works for any household — not
// just Luis & Delia. Unknown tags are title-cased; empty/"shared" → "Shared".
function nameFor(tag: string, people: { name: string }[]): string {
  const match = people.find((p) => p.name.toLowerCase() === tag);
  if (match) return match.name;
  if (!tag || tag === "shared") return "Shared";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export function recentActivity(s: Snapshot, limit = 8): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const p of s.paychecks)
    items.push({ id: `pc-${p.id}`, date: p.pay_date, person: nameFor(p.person_tag, s.people), text: "logged a paycheck", amount: Number(p.take_home), emoji: "💵" });
  for (const i of s.inflows)
    items.push({ id: `in-${i.id}`, date: i.date, person: nameFor(i.person_tag, s.people), text: i.source || "added money", amount: Number(i.amount), emoji: "🎁" });
  for (const r of s.savingsLog)
    items.push({ id: `sv-${r.id}`, date: r.date, person: "Shared", text: "added to the goal", amount: Number(r.amount), emoji: "🏆" });
  for (const p of s.payments)
    items.push({ id: `py-${p.id}`, date: p.date, person: "Shared", text: `paid ${p.label ?? "a bill"}`, amount: -Number(p.amount), emoji: "✅" });
  return items
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);
}

// ---------- Insights: safe-to-spend, spending breakdown, monthly recap ----------
export function thisMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function safeToSpend(s: Snapshot): number {
  const cash = pooledCash(s.accounts);
  const expected = Number(s.household.expected_next_deposit);
  const expDate = s.household.expected_deposit_date;
  const within30 = expDate ? daysBetween(todayISO(), expDate) <= 30 && daysBetween(todayISO(), expDate) >= -2 : false;
  const obligations = dueNow(s, 30).reduce((sum, d) => sum + d.amount, 0);
  return cash + (within30 ? expected : 0) - obligations;
}

export interface CatSpend { key: string; amount: number; }
export function monthSpending(s: Snapshot, ym = thisMonthKey()): CatSpend[] {
  const map = new Map<string, number>();
  const add = (k: string, v: number) => map.set(k, (map.get(k) ?? 0) + v);
  for (const e of s.expenses) if (e.paid && e.paid_date?.slice(0, 7) === ym) add(e.category || "general", Number(e.amount));
  for (const p of s.payments) if (p.date.slice(0, 7) === ym) add(p.kind === "child_support" ? "child support" : p.kind, Number(p.amount));
  return Array.from(map.entries())
    .map(([key, amount]) => ({ key, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export interface Recap { inflow: number; outflow: number; saved: number; net: number; }
export function monthlyRecap(s: Snapshot, ym = thisMonthKey()): Recap {
  const inflow =
    s.paychecks.filter((p) => p.pay_date.slice(0, 7) === ym).reduce((t, p) => t + Number(p.take_home) + Number(p.mileage_reimbursement || 0), 0) +
    s.inflows.filter((i) => i.date.slice(0, 7) === ym).reduce((t, i) => t + Number(i.amount), 0);
  const outflow =
    s.payments.filter((p) => p.date.slice(0, 7) === ym).reduce((t, p) => t + Number(p.amount), 0) +
    s.expenses.filter((e) => e.paid && e.paid_date?.slice(0, 7) === ym).reduce((t, e) => t + Number(e.amount), 0);
  const saved = s.savingsLog.filter((r) => r.date.slice(0, 7) === ym && Number(r.amount) > 0).reduce((t, r) => t + Number(r.amount), 0);
  return { inflow, outflow, saved, net: inflow - outflow };
}

// ---------- Credit utilization ----------
export function cardUtilization(accounts: Account[]): {
  account: Account; util: number; over: boolean;
}[] {
  return accounts
    .filter((a) => a.type === "credit_card" && a.credit_limit && a.credit_limit > 0)
    .map((a) => {
      const util = (Number(a.balance) / Number(a.credit_limit)) * 100;
      return { account: a, util, over: util > 10 };
    });
}

// ---------- On-time payment streak ----------
export function onTimeStats(payments: { on_time: boolean | null }[]): {
  pct: number; streak: number; total: number;
} {
  const rated = payments.filter((p) => p.on_time !== null);
  const onTime = rated.filter((p) => p.on_time).length;
  // streak from most recent backwards (payments assumed sorted desc by caller)
  let streak = 0;
  for (const p of rated) {
    if (p.on_time) streak++;
    else break;
  }
  return {
    pct: rated.length ? (onTime / rated.length) * 100 : 100,
    streak,
    total: rated.length,
  };
}
