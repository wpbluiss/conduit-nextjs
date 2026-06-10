import { getSnapshot } from "@/lib/finance/data";
import { projectIncome } from "@/lib/finance/compute";
import { fmtMoney, personLabel } from "@/lib/finance/constants";
import { Card, SectionTitle, Pill, EmptyState } from "@/components/finance/ui";
import { MetricCard } from "@/components/finance/MetricCard";
import { LogPaycheckModal } from "@/components/finance/QuickAdd";
import { IncomeBarChart } from "@/components/finance/Charts";

export const dynamic = "force-dynamic";

export default async function PaychecksPage() {
  const snap = await getSnapshot();
  if (!snap) return null;
  const income = projectIncome(snap.paychecks);

  // monthly buckets for the chart (last 8 months)
  const byMonth = new Map<string, { luis: number; delia: number; shared: number }>();
  for (const p of [...snap.paychecks].reverse()) {
    const key = p.pay_date.slice(0, 7);
    const m = byMonth.get(key) ?? { luis: 0, delia: 0, shared: 0 };
    const amt = Number(p.take_home) + Number(p.mileage_reimbursement || 0);
    if (p.person_tag === "luis") m.luis += amt;
    else if (p.person_tag === "delia") m.delia += amt;
    else m.shared += amt;
    byMonth.set(key, m);
  }
  const chartData = Array.from(byMonth.entries())
    .slice(-8)
    .map(([k, v]) => ({
      label: new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }),
      ...v,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Paychecks</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">
            Income is variable — every check sharpens the projection.
          </p>
        </div>
        <LogPaycheckModal variant="animate" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Projected / mo" value={income.monthly} tone="green" glow
          hint={`Based on ${income.count} paycheck${income.count === 1 ? "" : "s"}`} />
        <MetricCard label="Avg take-home" value={income.perPaycheckAvg} tone="cyan" delay={0.05} hint="per paycheck" />
        <MetricCard label="Avg interval" value={income.avgIntervalDays ?? 0} prefix="" suffix=" days" tone="violet" delay={0.1}
          hint={income.avgIntervalDays ? "between checks" : "log 2+ to compute"} />
        <MetricCard label="Logged" value={income.count} prefix="" tone="amber" delay={0.15} hint="data points" />
      </div>

      {chartData.length > 0 && (
        <Card>
          <SectionTitle eyebrow="Trend" title="Take-home by month" />
          <IncomeBarChart data={chartData} />
          <div className="flex gap-4 mt-2 text-[11px] text-[var(--fin-muted)] fin-mono">
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#d9532a] mr-1" />Luis</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#ff8a3d] mr-1" />Delia</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#ffa876] mr-1" />Shared</span>
          </div>
        </Card>
      )}

      {income.byPerson.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {income.byPerson.map((p) => (
            <Card key={p.tag} className="!p-4">
              <div className="text-[11px] fin-mono uppercase tracking-wide text-[var(--fin-muted)]">{personLabel(p.tag)} · proj/mo</div>
              <div className="text-xl font-semibold mt-1">{fmtMoney(p.monthly)}</div>
              <div className="text-[11px] text-[var(--fin-muted)]">{p.count} logged</div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <SectionTitle eyebrow="History" title="Logged paychecks" />
        {snap.paychecks.length === 0 ? (
          <EmptyState>No paychecks logged yet.</EmptyState>
        ) : (
          <div className="divide-y divide-white/5">
            {snap.paychecks.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Pill tone={p.person_tag === "luis" ? "violet" : p.person_tag === "delia" ? "cyan" : "default"}>
                      {personLabel(p.person_tag)}
                    </Pill>
                    {p.job && <span className="text-sm text-[var(--fin-muted)]">{p.job}</span>}
                  </div>
                  <div className="text-[11px] text-[var(--fin-muted)] mt-0.5">
                    {new Date(p.pay_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {p.mileage_reimbursement > 0 && ` · +${fmtMoney(Number(p.mileage_reimbursement))} mileage`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{fmtMoney(Number(p.take_home), { cents: true })}</div>
                  {p.gross > 0 && <div className="text-[11px] text-[var(--fin-muted)]">gross {fmtMoney(Number(p.gross))}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
