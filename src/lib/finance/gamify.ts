import type { Snapshot } from "./types";

// XP is earned from real, healthy financial behavior — so "playing the game"
// IS doing the right thing. All derived from logged data (no separate store).
const XP = {
  paycheck: 10,
  payment: 15,
  savings: 20,
  debtCleared: 75,
  vaultFunded: 150,
  creditLog: 10,
};

export interface GameState {
  xp: number;
  level: number;
  levelName: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelPct: number;
  savingStreak: number;
  onTimeStreak: number;
}

const LEVEL_NAMES = [
  "Starter", "Saver", "Builder", "Strategist", "Closer",
  "Operator", "Heavyweight", "Private Banker", "Tycoon", "Legend",
];

// Smooth curve: each level needs a bit more than the last.
function xpForLevel(level: number): number {
  // total XP required to REACH `level` (level 1 = 0)
  return Math.round(150 * (level - 1) * level / 2); // 0,150,450,900,1500...
}

export function gameState(s: Snapshot): GameState {
  const debtsCleared = s.debts.filter(
    (d) => (d.status === "paid" || Number(d.balance) <= 0) && Number(d.original_balance) > 0,
  ).length;
  const vaultsFunded = s.vaults.filter((v) => v.status === "funded" || Number(v.saved_amount) >= Number(v.target_amount) && Number(v.target_amount) > 0).length;

  const xp =
    s.paychecks.length * XP.paycheck +
    s.payments.length * XP.payment +
    s.savingsLog.filter((r) => Number(r.amount) > 0).length * XP.savings +
    debtsCleared * XP.debtCleared +
    vaultsFunded * XP.vaultFunded +
    s.creditScores.length * XP.creditLog;

  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const xpIntoLevel = xp - base;
  const xpForNextLevel = next - base;

  // saving streak: consecutive months (incl. current) with a positive savings entry
  const months = new Set(
    s.savingsLog.filter((r) => Number(r.amount) > 0).map((r) => r.date.slice(0, 7)),
  );
  let savingStreak = 0;
  const cur = new Date();
  for (;;) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    if (months.has(key)) {
      savingStreak++;
      cur.setMonth(cur.getMonth() - 1);
    } else break;
  }

  const rated = s.payments.filter((p) => p.on_time !== null);
  let onTimeStreak = 0;
  for (const p of rated) {
    if (p.on_time) onTimeStreak++;
    else break;
  }

  return {
    xp,
    level,
    levelName: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)],
    xpIntoLevel,
    xpForNextLevel,
    levelPct: xpForNextLevel > 0 ? (xpIntoLevel / xpForNextLevel) * 100 : 100,
    savingStreak,
    onTimeStreak,
  };
}

export interface Quest { label: string; emoji: string; done: boolean; xp: number; }

export function weeklyQuests(s: Snapshot): Quest[] {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceISO = since.toISOString().slice(0, 10);
  const recentPay = s.paychecks.some((p) => p.pay_date >= sinceISO);
  const onTime = s.payments.some((p) => p.on_time && p.date >= sinceISO);
  const saved = s.savingsLog.some((r) => Number(r.amount) > 0 && r.date >= sinceISO);
  const cardHealthy = s.accounts.some(
    (a) => a.type === "credit_card" && a.credit_limit && a.credit_limit > 0 && Number(a.balance) / Number(a.credit_limit) <= 0.1,
  );
  const defeated = s.debts.some((d) => d.status === "paid" || (Number(d.original_balance) > 0 && Number(d.balance) <= 0));
  return [
    { label: "Log a paycheck", emoji: "💵", done: recentPay, xp: 10 },
    { label: "Make an on-time payment", emoji: "⚡", done: onTime, xp: 15 },
    { label: "Feed your goal or a reward", emoji: "🎯", done: saved, xp: 20 },
    { label: "Keep a card under 10%", emoji: "💳", done: cardHealthy, xp: 15 },
    { label: "Defeat a boss", emoji: "💀", done: defeated, xp: 75 },
  ];
}

export function vaultPct(v: { saved_amount: number; target_amount: number }): number {
  return v.target_amount > 0 ? Math.min(100, (Number(v.saved_amount) / Number(v.target_amount)) * 100) : 0;
}

export function isVaultFunded(v: { saved_amount: number; target_amount: number; status: string }): boolean {
  return v.status === "funded" || v.status === "spent" || (Number(v.target_amount) > 0 && Number(v.saved_amount) >= Number(v.target_amount));
}
