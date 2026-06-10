import { getSnapshot } from "@/lib/finance/data";
import { daysBetween, todayISO } from "@/lib/finance/compute";
import { fmtMoney, personLabel } from "@/lib/finance/constants";
import { deleteExpense } from "@/lib/finance/actions";
import { Card, SectionTitle, Pill, EmptyState } from "@/components/finance/ui";
import { AddExpenseModal } from "@/components/finance/QuickAdd";
import { DeleteButton, MarkPaidButton } from "@/components/finance/RowControls";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const snap = await getSnapshot();
  if (!snap) return null;

  const withDays = snap.expenses.map((e) => ({
    ...e,
    days: e.due_date ? daysBetween(todayISO(), e.due_date) : null,
  }));
  const recurring = withDays.filter((e) => e.recurring);
  const oneOff = withDays.filter((e) => !e.recurring);
  const monthlyRecurring = recurring
    .filter((e) => e.recurrence === "monthly")
    .reduce((s, e) => s + Number(e.amount), 0);

  function Row({ e }: { e: (typeof withDays)[number] }) {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{e.name}</span>
            <Pill>{e.category.replace("_", " ")}</Pill>
            {e.person_tag !== "shared" && <Pill tone="violet">{personLabel(e.person_tag)}</Pill>}
            {e.recurring && <Pill tone="cyan">{e.recurrence}</Pill>}
            {e.paid && <Pill tone="green">paid</Pill>}
          </div>
          {e.due_date && !e.paid && (
            <div className="text-[11px] text-[var(--fin-muted)] mt-0.5">
              Due {new Date(e.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {e.days !== null && (
                <span className={e.days <= 0 ? " text-[#f0888c]" : e.days <= 5 ? " text-[#ffa876]" : ""}>
                  {" "}· {e.days <= 0 ? "due now" : `${e.days}d`}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{fmtMoney(Number(e.amount), { cents: true })}</span>
          {!e.paid && <MarkPaidButton id={e.id} />}
          <DeleteButton action={deleteExpense.bind(null, e.id)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Expenses</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">
            Recurring &amp; one-off. {fmtMoney(monthlyRecurring)}/mo recurring.
          </p>
        </div>
        <AddExpenseModal variant="animate" />
      </div>

      <Card>
        <SectionTitle eyebrow="Recurring" title="Bills with due dates" />
        {recurring.length === 0 ? (
          <EmptyState>No recurring bills yet.</EmptyState>
        ) : (
          <div className="divide-y divide-white/5">{recurring.map((e) => <Row key={e.id} e={e} />)}</div>
        )}
      </Card>

      <Card>
        <SectionTitle eyebrow="One-off" title="Other expenses" />
        {oneOff.length === 0 ? (
          <EmptyState>No one-off expenses logged.</EmptyState>
        ) : (
          <div className="divide-y divide-white/5">{oneOff.map((e) => <Row key={e.id} e={e} />)}</div>
        )}
      </Card>
    </div>
  );
}
