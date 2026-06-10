import { getSnapshot } from "@/lib/finance/data";
import { orderDebts, effectiveBalance, daysBetween, todayISO } from "@/lib/finance/compute";
import { fmtMoney, personLabel, DEBT_STATUSES, PERSON_TAGS } from "@/lib/finance/constants";
import { addDebt, deleteDebt } from "@/lib/finance/actions";
import { Card, SectionTitle, Pill, EmptyState, GradientText } from "@/components/finance/ui";
import { ProgressRing } from "@/components/finance/ProgressRing";
import { AnimatedNumber } from "@/components/finance/AnimatedNumber";
import { FormModal, Field, SelectField } from "@/components/finance/forms";
import { DeleteButton, LogDebtPaymentModal, ChildSupportPayModal } from "@/components/finance/RowControls";
import { Plus, Flame } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "default" | "red" | "amber" | "green" | "violet"> = {
  active: "default", past_due: "red", charged_off: "amber",
  plan: "violet", settle: "amber", paid: "green",
};

export default async function DebtsPage() {
  const snap = await getSnapshot();
  if (!snap) return null;
  const debt = orderDebts(snap.debts);
  const cs = snap.childSupport;
  const progressPct = debt.originalTotal > 0 ? (debt.paidOff / debt.originalTotal) * 100 : 0;

  const csPaidThisMonth = snap.payments.some(
    (p) => p.kind === "child_support" && p.date.slice(0, 7) === todayISO().slice(0, 7),
  );

  const addModal = (
    <FormModal
      trigger={<><Plus size={16} /> Add debt</>}
      triggerVariant="animate"
      title="Add a debt"
      action={addDebt}
    >
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
        <SelectField label="Status" name="status"
          options={DEBT_STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") }))} defaultValue="active" />
        <Field label="Settle amount" name="settle_amount" type="number" step="0.01" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due day" name="due_day" type="number" min="1" />
        <SelectField label="Tag" name="person_tag"
          options={PERSON_TAGS.map((t) => ({ value: t, label: personLabel(t) }))} defaultValue="shared" />
      </div>
      <Field label="Notes" name="notes" />
    </FormModal>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Debt-Killer</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">Drive every balance to zero.</p>
        </div>
        {addModal}
      </div>

      {/* Progress-to-zero ring + attack next */}
      <Card glow className="flex flex-col lg:flex-row items-center gap-8">
        <ProgressRing pct={progressPct} size={210} stroke={14}>
          <div className="fin-mono text-[10px] uppercase tracking-[0.24em] text-[var(--fin-muted)]">Crushed</div>
          <div className="text-3xl font-semibold mt-1">
            <GradientText><AnimatedNumber value={progressPct} decimals={0} suffix="%" prefix="" /></GradientText>
          </div>
          <div className="text-[11px] text-[var(--fin-muted)] mt-1">{fmtMoney(debt.total)} left</div>
        </ProgressRing>
        <div className="flex-1 w-full">
          {debt.next ? (
            <div className="rounded-xl bg-[#ff8a3d]/5 border border-[#ff8a3d]/15 p-4 flex items-center gap-3">
              <Flame size={28} weight="fill" className="text-[#ffa876]" />
              <div className="flex-1">
                <div className="text-[11px] fin-mono uppercase tracking-wide text-[var(--fin-muted)]">
                  Attack next · strategy: {debt.recommendation}
                </div>
                <div className="text-lg font-semibold">{debt.next.name} — {fmtMoney(debt.next.balance)}</div>
                <div className="text-xs text-[var(--fin-muted)]">{debt.rationale}</div>
              </div>
            </div>
          ) : (
            <div className="text-[#7cc6a0] font-medium">🎉 All debts cleared. Debt-killer rolls into savings now.</div>
          )}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div><div className="text-[10px] fin-mono uppercase text-[var(--fin-muted)]">Remaining</div><div className="text-lg font-semibold">{fmtMoney(debt.total)}</div></div>
            <div><div className="text-[10px] fin-mono uppercase text-[var(--fin-muted)]">Paid off</div><div className="text-lg font-semibold text-[#7cc6a0]">{fmtMoney(debt.paidOff)}</div></div>
            <div><div className="text-[10px] fin-mono uppercase text-[var(--fin-muted)]">Active</div><div className="text-lg font-semibold">{debt.debts.length}</div></div>
          </div>
        </div>
      </Card>

      {/* Strategy note */}
      <Card className="!p-4">
        <p className="text-sm text-[var(--fin-muted)]">
          <span className="text-white font-medium">Recommended order ({debt.recommendation}):</span>{" "}
          {debt.debts.map((d) => d.name).join(" → ") || "—"}.{" "}
          Smallest-first builds momentum; the advisor switches to avalanche when high APRs make it cheaper.
        </p>
      </Card>

      {/* Debt list */}
      <Card>
        <SectionTitle eyebrow="Balances" title="All debts" />
        {snap.debts.length === 0 ? (
          <EmptyState>No debts. Incredible.</EmptyState>
        ) : (
          <div className="divide-y divide-white/5">
            {snap.debts.map((d) => {
              const eb = effectiveBalance(d);
              const pct = d.original_balance > 0 ? ((d.original_balance - eb) / d.original_balance) * 100 : 0;
              return (
                <div key={d.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{d.name}</span>
                      <Pill tone={statusTone[d.status] ?? "default"}>{d.status.replace("_", " ")}</Pill>
                      {d.apr > 0 && <Pill>{d.apr}% APR</Pill>}
                      {d.person_tag !== "shared" && <Pill tone="violet">{personLabel(d.person_tag)}</Pill>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {d.status === "settle" && d.settle_amount != null
                          ? <>{fmtMoney(d.settle_amount)} <span className="text-[11px] text-[var(--fin-muted)]">settle</span></>
                          : fmtMoney(eb)}
                      </span>
                      {d.status !== "paid" && <LogDebtPaymentModal id={d.id} name={d.name} />}
                      <DeleteButton action={deleteDebt.bind(null, d.id)} />
                    </div>
                  </div>
                  {d.original_balance > 0 && d.status !== "paid" && (
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-2">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: "linear-gradient(90deg,#ffa876,#ffa876)" }} />
                    </div>
                  )}
                  {d.notes && <div className="text-[11px] text-[var(--fin-muted)] mt-1">{d.notes}</div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Child support */}
      {cs && (
        <Card>
          <SectionTitle eyebrow="Obligation · Luis" title="Child support" />
          <div className="grid sm:grid-cols-4 gap-4 items-center">
            <div><div className="text-[10px] fin-mono uppercase text-[var(--fin-muted)]">Monthly</div><div className="text-lg font-semibold">{fmtMoney(cs.monthly_amount)}</div></div>
            <div><div className="text-[10px] fin-mono uppercase text-[var(--fin-muted)]">Remaining</div><div className="text-lg font-semibold text-[#ffa876]">{fmtMoney(cs.remaining_balance)}</div></div>
            <div>
              <div className="text-[10px] fin-mono uppercase text-[var(--fin-muted)]">Payoff (at {fmtMoney(cs.monthly_amount)}/mo)</div>
              <div className="text-lg font-semibold">
                {cs.monthly_amount > 0 ? `${Math.ceil(cs.remaining_balance / cs.monthly_amount)} mo` : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] fin-mono uppercase text-[var(--fin-muted)]">This month</div>
              <div className="mt-1">
                {csPaidThisMonth ? <Pill tone="green">paid</Pill> : <ChildSupportPayModal amount={cs.monthly_amount} />}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[var(--fin-muted)] mt-3">
            Payable {cs.pay_window} each month. {cs.notes}
            {!csPaidThisMonth && (() => {
              const day = new Date().getDate();
              const left = 15 - day;
              return left >= 0 ? ` · ${left} day${left === 1 ? "" : "s"} left in the 1st–15th window.` : " · past the 15th — pay ASAP.";
            })()}
          </p>
        </Card>
      )}
    </div>
  );
}
