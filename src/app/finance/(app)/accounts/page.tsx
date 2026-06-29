import { getSnapshot } from "@/lib/finance/data";
import { pooledCash, netWorth, totalDebt, investmentsValue } from "@/lib/finance/compute";
import { fmtMoney, personLabel, ACCOUNT_TYPES, PERSON_TAGS } from "@/lib/finance/constants";
import { addAccount, deleteAccount } from "@/lib/finance/actions";
import { Card, SectionTitle, Pill, EmptyState } from "@/components/finance/ui";
import { MetricCard } from "@/components/finance/MetricCard";
import { FormModal, Field, SelectField } from "@/components/finance/forms";
import { DeleteButton, EditBalanceModal } from "@/components/finance/RowControls";
import { Plus } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  checking: "Checking", savings: "Savings", credit_card: "Credit card",
  cash: "Cash", investment: "Investment", other: "Other",
};

export default async function AccountsPage() {
  const snap = await getSnapshot();
  if (!snap) return null;

  const cash = pooledCash(snap.accounts);
  const cards = snap.accounts.filter((a) => a.type === "credit_card");
  const cardDebt = cards.reduce((s, a) => s + Number(a.balance), 0);

  const addModal = (
    <FormModal
      trigger={<><Plus size={16} /> Add account</>}
      triggerVariant="animate"
      title="Add an account"
      action={addAccount}
    >
      <Field label="Name" name="name" placeholder="Joint Checking" required />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Type" name="type"
          options={ACCOUNT_TYPES.map((t) => ({ value: t, label: typeLabel[t] }))}
          defaultValue="checking"
        />
        <Field label="Balance" name="balance" type="number" step="0.01" placeholder="0.00" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Credit limit (cards)" name="credit_limit" type="number" step="0.01" />
        <Field label="APR % (cards)" name="apr" type="number" step="0.01" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Owner tag" name="owner_tag"
          options={PERSON_TAGS.map((t) => ({ value: t, label: personLabel(t) }))}
          defaultValue="shared"
        />
        <Field label="Institution" name="institution" placeholder="Bank name" />
      </div>
    </FormModal>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Accounts &amp; balances</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">Auto-updates as you log income &amp; bills. Edit any balance to match your bank.</p>
        </div>
        {addModal}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Pooled cash" value={cash} tone="cyan" glow />
        <MetricCard label="Net worth" value={netWorth(snap)} tone="violet" delay={0.05} />
        <MetricCard label="Card balances" value={cardDebt} tone="pink" delay={0.1} />
        <MetricCard label="Investments" value={investmentsValue(snap.investments)} tone="green" delay={0.15} />
      </div>

      <Card>
        <SectionTitle eyebrow="Ledger" title="Your accounts" />
        {snap.accounts.length === 0 ? (
          <EmptyState>No accounts yet. Add your checking, savings, and cards.</EmptyState>
        ) : (
          <div className="divide-y divide-white/5">
            {snap.accounts.map((a) => {
              const util = a.credit_limit ? (Number(a.balance) / Number(a.credit_limit)) * 100 : null;
              return (
                <div key={a.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{a.name}</span>
                      <Pill>{typeLabel[a.type] ?? a.type}</Pill>
                      {a.owner_tag !== "shared" && <Pill tone="violet">{personLabel(a.owner_tag)}</Pill>}
                    </div>
                    {util !== null && (
                      <div className="text-[11px] text-[var(--fin-muted)] mt-0.5">
                        Utilization {util.toFixed(0)}%{" "}
                        <span className={util > 10 ? "text-[#ffa876]" : "text-[#7cc6a0]"}>
                          ({util > 10 ? "above" : "under"} 10% line)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${a.type === "credit_card" ? "text-[#ffa876]" : ""}`}>
                      {fmtMoney(Number(a.balance), { cents: true })}
                    </span>
                    <EditBalanceModal id={a.id} name={a.name} balance={Number(a.balance)} />
                    <DeleteButton action={deleteAccount.bind(null, a.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
