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

export function projectIncome(paychecks: Paycheck[]): IncomeProjection {
  const sorted = [...paychecks].sort(
    (a, b) => new Date(a.pay_date).getTime() - new Date(b.pay_date).getTime(),
  );
  const count = sorted.length;
  const totalTakeHome = sorted.reduce(
    (s, p) => s + Number(p.take_home) + Number(p.mileage_reimbursement || 0), 0,
  );
  const perPaycheckAvg = count ? totalTakeHome / count : 0;

  let avgIntervalDays: number | null = null;
  if (count >= 2) {
    const span = daysBetween(sorted[0].pay_date, sorted[count - 1].pay_date);
    avgIntervalDays = span > 0 ? span / (count - 1) : null;
  }

  // Monthly projection: if we know cadence, scale per-paycheck avg; else
  // fall back to summing a trailing 30-day window.
  let monthly = 0;
  if (avgIntervalDays && avgIntervalDays > 0) {
    monthly = perPaycheckAvg * (30.44 / avgIntervalDays);
  } else if (count === 1) {
    monthly = perPaycheckAvg; // single data point: treat as ~monthly
  }

  const tags = Array.from(new Set(sorted.map((p) => p.person_tag)));
  const byPerson = tags.map((tag) => {
    const rows = sorted.filter((p) => p.person_tag === tag);
    const sum = rows.reduce((s, p) => s + Number(p.take_home) + Number(p.mileage_reimbursement || 0), 0);
    let m = 0;
    if (rows.length >= 2) {
      const span = daysBetween(rows[0].pay_date, rows[rows.length - 1].pay_date);
      const interval = span > 0 ? span / (rows.length - 1) : 0;
      m = interval > 0 ? (sum / rows.length) * (30.44 / interval) : sum;
    } else {
      m = sum;
    }
    return { tag, monthly: m, count: rows.length };
  });

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
