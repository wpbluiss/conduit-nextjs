import { getSnapshot } from "@/lib/finance/data";
import { orderDebts, effectiveBalance, todayISO } from "@/lib/finance/compute";
import { fmtMoney, personLabel, DEBT_STATUSES, PERSON_TAGS } from "@/lib/finance/constants";
import { addDebt, deleteDebt } from "@/lib/finance/actions";
import { Card, Pill, EmptyState, GradientText } from "@/components/finance/ui";
import { AnimatedNumber } from "@/components/finance/AnimatedNumber";
import { FormModal, Field, SelectField } from "@/components/finance/forms";
import { DeleteButton, LogDebtPaymentModal, ChildSupportPayModal } from "@/components/finance/RowControls";
import { Plus, Skull, Trophy } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

function bossEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/mercedes|auto|car/.test(n)) return "🚗";
  if (/perpay/.test(n)) return "📦";
  if (/railway|zoom|infra|vercel/.test(n)) return "🖥️";
  if (/dad|grandma|loan|personal/.test(n)) return "🤝";
  if (/card|credit|capital|kikoff/.test(n)) return "💳";
  return "👾";
}

export default async function DebtsPage() {
  const snap = await getSnapshot();
  if (!snap) return null;
  const debt = orderDebts(snap.debts);
  const cs = snap.childSupport;
  const crushed = debt.originalTotal > 0 ? (debt.paidOff / debt.originalTotal) * 100 : 0;
  const boss = debt.next;
  const defeated = snap.debts.filter((d) => d.status === "paid" || Number(effectiveBalance(d)) <= 0);

  const csPaidThisMonth = snap.payments.some(
    (p) => p.kind === "child_support" && p.date.slice(0, 7) === todayISO().slice(0, 7),
  );

  const addModal = (
    <FormModal trigger={<><Plus size={16} /> Add boss</>} triggerVariant="animate" title="Add a debt" action={addDebt}>
      <Field label="Name" name="name" placeholder="Card / loan name" required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Balance" name="balance" type="number" step="0.01" required />
        <Field label="Original balance" name="original_balance" type="number" step="0.01" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="APR %" name="apr" type="number" step="0.01" />
        <Field label="Min payment" name="min_payment" type="number" step="0.01" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Status" name="status" options={DEBT_STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") }))} defaultValue="active" />
        <Field label="Settle amount" name="settle_amount" type="number" step="0.01" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due day" name="due_day" type="number" min="1" />
        <SelectField label="Tag" name="person_tag" options={PERSON_TAGS.map((t) => ({ value: t, label: personLabel(t) }))} defaultValue="shared" />
      </div>
      <Field label="Notes" name="notes" />
    </FormModal>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Boss Battles</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">Defeat every debt. One at a time.</p>
        </div>
        {addModal}
      </div>

      {/* Campaign progress */}
      <Card className="!p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="fin-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fin-muted)]">Campaign</span>
          <span className="text-[var(--fin-muted)]">
            {debt.debts.length} left · <span className="text-[#ffa876]">{fmtMoney(debt.total)}</span> to clear
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${crushed}%`, background: "linear-gradient(90deg,#34d399,#22d3ee,#ff8a3d)" }} />
        </div>
        <div className="text-[11px] text-[#7cc6a0] mt-1.5 fin-mono">
          {crushed.toFixed(0)}% crushed · {fmtMoney(debt.paidOff)} defeated
        </div>
      </Card>

      {/* Featured boss */}
      {boss ? (
        <Card glow className="text-center">
          <div className="fin-mono text-[10px] uppercase tracking-[0.24em] text-[var(--fin-muted)]">Current boss · {debt.recommendation}</div>
          <div className="text-5xl mt-2">{bossEmoji(boss.name)}</div>
          <div className="fin-display text-2xl mt-1"><GradientText>{boss.name}</GradientText></div>
          <div className="text-sm text-[var(--fin-muted)]">
            HP <AnimatedNumber value={effectiveBalance(boss)} prefix="$" />
            {boss.apr > 0 && <> · {boss.apr}% APR</>}
          </div>
          {boss.original_balance > 0 && (
            <div className="h-3 rounded-full bg-white/5 overflow-hidden mt-3 max-w-sm mx-auto">
              <div className="h-full rounded-full" style={{
                width: `${Math.max(2, Math.min(100, (effectiveBalance(boss) / boss.original_balance) * 100))}%`,
                background: "linear-gradient(90deg,#e5484d,#ff8a3d)",
              }} />
            </div>
          )}
          <p className="text-[11px] text-[var(--fin-muted)] mt-2 max-w-md mx-auto">{debt.rationale}</p>
          <div className="mt-4 max-w-xs mx-auto">
            <LogDebtPaymentModal id={boss.id} name={boss.name} />
          </div>
        </Card>
      ) : (
        <Card className="text-center py-8">
          <Trophy size={40} weight="fill" className="text-[#ffa876] mx-auto" />
          <div className="fin-display text-2xl mt-2"><GradientText>All bosses defeated</GradientText></div>
          <p className="text-sm text-[var(--fin-muted)] mt-1">Debt-free. The debt-killer now rolls into your goal.</p>
        </Card>
      )}

      {/* Remaining bosses */}
      {debt.debts.length > 1 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {debt.debts.filter((d) => d.id !== boss?.id).map((d) => {
            const hp = effectiveBalance(d);
            const hpPct = d.original_balance > 0 ? (hp / d.original_balance) * 100 : 100;
            return (
              <Card key={d.id} className="!p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{bossEmoji(d.name)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{d.name}</span>
                      <span className="text-sm font-semibold">{fmtMoney(hp)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1.5">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, hpPct))}%`, background: "linear-gradient(90deg,#e5484d,#ff8a3d)" }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1.5">
                    {d.status !== "active" && <Pill tone="amber">{d.status.replace("_", " ")}</Pill>}
                    {d.apr > 0 && <Pill>{d.apr}% APR</Pill>}
                  </div>
                  <div className="flex items-center gap-1">
                    <LogDebtPaymentModal id={d.id} name={d.name} />
                    <DeleteButton action={deleteDebt.bind(null, d.id)} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Defeated */}
      {defeated.length > 0 && (
        <Card className="!p-4">
          <div className="fin-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fin-muted)] mb-2">Defeated</div>
          <div className="flex flex-wrap gap-2">
            {defeated.map((d) => (
              <span key={d.id} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--fin-muted)]">
                <Skull size={13} /> {d.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Recurring mini-boss: child support */}
      {cs && Number(cs.remaining_balance) > 0 && (
        <Card className="!p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">⚖️</span>
              <div className="min-w-0">
                <div className="font-medium">Child support <span className="text-[11px] text-[var(--fin-muted)]">· recurring</span></div>
                <div className="text-[11px] text-[var(--fin-muted)]">
                  {fmtMoney(cs.monthly_amount)}/mo · {fmtMoney(cs.remaining_balance)} left · payable {cs.pay_window}
                </div>
              </div>
            </div>
            {csPaidThisMonth ? <Pill tone="green">paid</Pill> : <ChildSupportPayModal amount={cs.monthly_amount} />}
          </div>
        </Card>
      )}
    </div>
  );
}
