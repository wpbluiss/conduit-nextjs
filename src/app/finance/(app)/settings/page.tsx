import { getSnapshot } from "@/lib/finance/data";
import { goalProgress, daysBetween } from "@/lib/finance/compute";
import { fmtMoney } from "@/lib/finance/constants";
import { updateGoalSettings, updateChildSupport } from "@/lib/finance/actions";
import { Card, SectionTitle, EmptyState } from "@/components/finance/ui";
import { Field } from "@/components/finance/forms";
import { SettingsForm } from "@/components/finance/SettingsForm";
import { SavingsAreaChart } from "@/components/finance/Charts";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const snap = await getSnapshot();
  if (!snap) return null;
  const h = snap.household;
  const g = goalProgress(snap.savingsLog, h.savings_goal, h.goal_start_date, h.goal_target_date);

  // savings target-vs-actual line
  let running = 0;
  const start = new Date(h.goal_start_date);
  const total = h.goal_target_date ? Math.max(1, daysBetween(h.goal_start_date, h.goal_target_date)) : 456;
  const chart = snap.savingsLog.map((s) => {
    running += Number(s.amount);
    const elapsed = Math.max(0, daysBetween(h.goal_start_date, s.date));
    return {
      date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      actual: Math.round(running),
      target: Math.round((h.savings_goal / total) * elapsed),
    };
  });
  void start;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--fin-muted)] mt-1">Tune the goal and obligations. Nothing is hardcoded.</p>
      </div>

      {h.join_code && (
        <Card className="!p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="fin-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fin-muted)]">Household · invite your partner</div>
              <p className="text-sm text-[var(--fin-muted)] mt-1">Share this code so they join the same pooled view.</p>
            </div>
            <div className="fin-mono text-xl font-semibold tracking-[0.25em] text-[#ffa876]">{h.join_code}</div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle eyebrow="The goal" title="Savings target" />
          <SettingsForm action={updateGoalSettings} submitLabel="Save goal">
            <Field label="Savings goal $" name="savings_goal" type="number" step="100" defaultValue={h.savings_goal} />
            <Field label="Monthly savings target $" name="monthly_savings_target" type="number" step="50" defaultValue={h.monthly_savings_target} />
            <Field label="Target date" name="goal_target_date" type="date" defaultValue={h.goal_target_date ?? ""} />
          </SettingsForm>
          <p className="text-[11px] text-[var(--fin-muted)] mt-3">
            Currently {fmtMoney(g.saved)} of {fmtMoney(h.savings_goal)} · pace needed {fmtMoney(g.monthlyPaceNeeded)}/mo.
          </p>
        </Card>

        <Card>
          <SectionTitle eyebrow="Obligation" title="Child support (Luis)" />
          <SettingsForm action={updateChildSupport} submitLabel="Save">
            <Field label="Monthly amount $" name="monthly_amount" type="number" step="5" defaultValue={snap.childSupport?.monthly_amount ?? 175} />
            <Field label="Remaining balance $" name="remaining_balance" type="number" step="25" defaultValue={snap.childSupport?.remaining_balance ?? 3500} />
            <Field label="Notes" name="notes" defaultValue={snap.childSupport?.notes ?? ""} />
          </SettingsForm>
        </Card>
      </div>

      <Card>
        <SectionTitle eyebrow="Goal" title="Target vs. actual savings" />
        {chart.length === 0 ? (
          <EmptyState>Log savings on the Home screen to chart your trajectory.</EmptyState>
        ) : (
          <SavingsAreaChart data={chart} />
        )}
      </Card>
    </div>
  );
}
