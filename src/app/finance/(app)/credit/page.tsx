import { getSnapshot } from "@/lib/finance/data";
import { cardUtilization, onTimeStats } from "@/lib/finance/compute";
import { personLabel, PERSON_TAGS } from "@/lib/finance/constants";
import { addCreditScore } from "@/lib/finance/actions";
import { Card, SectionTitle, Pill, EmptyState } from "@/components/finance/ui";
import { MetricCard } from "@/components/finance/MetricCard";
import { FormModal, Field, SelectField } from "@/components/finance/forms";
import { CreditLineChart, UtilizationBars } from "@/components/finance/Charts";
import { Plus, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function CreditPage() {
  const snap = await getSnapshot();
  if (!snap) return null;

  const util = cardUtilization(snap.accounts);
  const ot = onTimeStats(snap.payments);

  // latest score per person
  const latest: Record<string, number> = {};
  for (const s of snap.creditScores) latest[s.person_tag] = s.score;

  // chart data: dates with luis/delia columns
  const dates = Array.from(new Set(snap.creditScores.map((s) => s.date))).sort();
  const chartData = dates.map((d) => {
    const row: Record<string, number | string> = {
      date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    for (const s of snap.creditScores.filter((x) => x.date === d)) row[s.person_tag] = s.score;
    return row;
  });

  const addModal = (
    <FormModal
      trigger={<><Plus size={16} /> Log score</>}
      triggerVariant="animate"
      title="Log a credit score"
      action={addCreditScore}
    >
      <SelectField label="Person" name="person_tag"
        options={PERSON_TAGS.filter((t) => t !== "shared").map((t) => ({ value: t, label: personLabel(t) }))}
        defaultValue="luis" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Score" name="score" type="number" min="300" required />
        <Field label="Date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <SelectField label="Bureau" name="bureau"
        options={["TransUnion", "Equifax", "Experian", "VantageScore", "FICO"].map((b) => ({ value: b, label: b }))}
        defaultValue="TransUnion" />
      <Field label="Notes" name="notes" />
    </FormModal>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Credit optimization</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">On-time + under 10% utilization → future approvals.</p>
        </div>
        {addModal}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Luis score" value={latest.luis ?? 0} prefix="" tone="violet" glow hint="latest logged" />
        <MetricCard label="Delia score" value={latest.delia ?? 0} prefix="" tone="cyan" delay={0.05} hint="latest logged" />
        <MetricCard label="On-time rate" value={ot.pct} prefix="" suffix="%" tone="green" delay={0.1} hint={`${ot.total} payments rated`} />
        <MetricCard label="On-time streak" value={ot.streak} prefix="" tone="amber" delay={0.15} hint="in a row" />
      </div>

      <Card>
        <SectionTitle eyebrow="Trend" title="Scores over time" />
        {chartData.length === 0 ? (
          <EmptyState>Log scores over time to see the climb.</EmptyState>
        ) : (
          <>
            <CreditLineChart data={chartData} people={[
              { key: "luis", color: "#7C5CFF" }, { key: "delia", color: "#22D3EE" },
            ]} />
            <div className="flex gap-4 mt-2 text-[11px] text-[var(--fin-muted)] fin-mono">
              <span><span className="inline-block w-2 h-2 rounded-full bg-violet-400 mr-1" />Luis</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-cyan-400 mr-1" />Delia</span>
            </div>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle eyebrow="Utilization" title="Per-card · 10% line" />
        {util.length === 0 ? (
          <EmptyState>Add credit cards with limits (in Accounts) to track utilization.</EmptyState>
        ) : (
          <>
            <UtilizationBars data={util.map((u) => ({ name: u.account.name, util: u.util }))} />
            <div className="space-y-1.5 mt-3">
              {util.map((u) => (
                <div key={u.account.id} className="flex items-center justify-between text-sm">
                  <span>{u.account.name}</span>
                  <span className="flex items-center gap-2">
                    <span className={u.over ? "text-amber-300" : "text-emerald-300"}>{u.util.toFixed(0)}%</span>
                    {u.over ? <Pill tone="amber"><Warning size={11} /> over 10%</Pill> : <Pill tone="green"><CheckCircle size={11} /> healthy</Pill>}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="!p-4">
        <p className="text-[12px] text-[var(--fin-muted)]">
          <span className="text-white font-medium">Coaching:</span> keep every card reporting under 10% of its limit,
          never miss a due date (autopay the minimums), and let on-time history compound. Clearing past-due items
          (Kikoff) first gives the fastest score bump and unlocks better approvals as you near the home purchase.
        </p>
      </Card>
    </div>
  );
}
