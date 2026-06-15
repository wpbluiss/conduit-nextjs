import { getSnapshot } from "@/lib/finance/data";
import { gameState, isVaultFunded } from "@/lib/finance/gamify";
import { fmtMoney } from "@/lib/finance/constants";
import { LevelBar } from "@/components/finance/LevelBar";
import { VaultCard } from "@/components/finance/VaultCard";
import { CreateVaultModal } from "@/components/finance/CreateVaultModal";
import { EmptyState } from "@/components/finance/ui";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const snap = await getSnapshot();
  if (!snap) return null;
  const g = gameState(snap);

  const active = snap.vaults.filter((v) => v.status !== "spent");
  const unlocked = snap.vaults.filter((v) => isVaultFunded(v) && v.status !== "spent").length;
  const totalSaved = snap.vaults.reduce((s, v) => s + Number(v.saved_amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Rewards</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">
            Save up, unlock, and spend it guilt-free — it&apos;s already paid for.
          </p>
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
    </div>
  );
}
