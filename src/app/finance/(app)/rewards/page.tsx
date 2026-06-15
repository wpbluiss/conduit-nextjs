import { getSnapshot } from "@/lib/finance/data";
import { gameState, isVaultFunded } from "@/lib/finance/gamify";
import { fmtMoney } from "@/lib/finance/constants";
import { LevelBar } from "@/components/finance/LevelBar";
import { VaultCard } from "@/components/finance/VaultCard";
import { CreateVaultModal } from "@/components/finance/CreateVaultModal";
import { MysteryReveal } from "@/components/finance/MysteryReveal";
import { Card, EmptyState } from "@/components/finance/ui";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const snap = await getSnapshot();
  if (!snap) return null;
  const g = gameState(snap);

  const active = snap.vaults.filter((v) => v.status !== "spent");
  const unlocked = snap.vaults.filter((v) => isVaultFunded(v) && v.status !== "spent").length;
  const totalSaved = snap.vaults.reduce((s, v) => s + Number(v.saved_amount), 0);

  const revealedMysteries = snap.vaults
    .filter((v) => v.is_mystery && v.revealed && v.mystery_destination)
    .map((v) => ({ id: v.id, destination: v.mystery_destination!, blurb: v.mystery_blurb, emoji: v.emoji }));
  const passport = snap.vaults.filter((v) => v.is_mystery && v.revealed);

  return (
    <div className="space-y-5">
      <MysteryReveal vaults={revealedMysteries} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Rewards</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">
            Save up, unlock, and spend it guilt-free — it&apos;s already paid for.
          </p>
          {Number(snap.household.vault_autofund_pct) > 0 && (
            <p className="text-[11px] text-[#ffa876] mt-1 fin-mono">
              🎁 auto-stashing {Math.round(Number(snap.household.vault_autofund_pct) * 100)}% of every paycheck into your Mystery Trip
            </p>
          )}
        </div>
        <CreateVaultModal />
      </div>

      <LevelBar g={g} />

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="fin-card p-3">
          <div className="text-lg font-semibold text-[#ffa876]">{fmtMoney(totalSaved)}</div>
          <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)]">Stashed</div>
        </div>
        <div className="fin-card p-3">
          <div className="text-lg font-semibold text-[#7cc6a0]">{unlocked}</div>
          <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)]">Unlocked</div>
        </div>
        <div className="fin-card p-3">
          <div className="text-lg font-semibold">{active.length}</div>
          <div className="text-[10px] fin-mono uppercase tracking-wide text-[var(--fin-muted)]">Active jars</div>
        </div>
      </div>

      {snap.vaults.length === 0 ? (
        <EmptyState>No reward jars yet. Create your first — a trip, a treat, anything.</EmptyState>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {snap.vaults.map((v) => <VaultCard key={v.id} v={v} />)}
        </div>
      )}

      {/* Trip Passport — places you've earned */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="fin-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fin-muted)]">🛂 Trip Passport</div>
          <span className="text-[11px] text-[var(--fin-muted)]">{passport.length} earned</span>
        </div>
        {passport.length === 0 ? (
          <EmptyState>Your first stamp is waiting — fund a Mystery Trip to reveal where you&apos;re going. ✈️</EmptyState>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {passport.map((v, i) => (
              <div
                key={v.id}
                className="rounded-xl border border-[#ff8a3d]/25 bg-[#ff8a3d]/[0.05] p-4 text-center"
                style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 2}deg)` }}
              >
                <div className="text-3xl">{v.emoji}</div>
                <div className="font-semibold text-sm mt-1 leading-tight">{v.mystery_destination ?? v.name}</div>
                <div className="fin-mono text-[9px] uppercase tracking-[0.18em] text-[#ffa876] mt-1.5 border-t border-[#ff8a3d]/20 pt-1.5">
                  {v.status === "spent" ? "Visited" : "Funded"} ✓
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
