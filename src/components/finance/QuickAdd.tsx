"use client";

import { Plus, Money, Gift, Receipt, PiggyBank } from "@phosphor-icons/react";
import { FormModal, Field, SelectField } from "./forms";
import {
  addPaycheck, addInflow, addExpense, addSavings,
} from "@/lib/finance/actions";
import {
  PERSON_TAGS, EXPENSE_CATEGORIES, RECURRENCES,
} from "@/lib/finance/constants";

const today = () => new Date().toISOString().slice(0, 10);
const personOpts = PERSON_TAGS.map((t) => ({
  value: t,
  label: t === "shared" ? "Shared" : t[0].toUpperCase() + t.slice(1),
}));

export function LogPaycheckModal({ variant = "outline" }: { variant?: "outline" | "animate" | "primary" | "ghost" } = {}) {
  return (
    <FormModal
      trigger={<><Money size={16} /> Log paycheck</>}
      triggerVariant={variant}
      title="Log a paycheck"
      description="Every paycheck is a data point — projections sharpen as you log more."
      action={addPaycheck}
    >
      <SelectField label="Who" name="person_tag" options={personOpts} defaultValue="luis" />
      <Field label="Job / source" name="job" placeholder="Courthouse day, restaurant…" />
      <Field label="Pay date" name="pay_date" type="date" defaultValue={today()} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Gross" name="gross" type="number" step="0.01" placeholder="0.00" />
        <Field label="Take-home" name="take_home" type="number" step="0.01" placeholder="0.00" required />
      </div>
      <Field label="Mileage reimb." name="mileage_reimbursement" type="number" step="0.01" placeholder="0.00" />
      <Field label="Notes" name="notes" />
    </FormModal>
  );
}

export function AddInflowModal({ variant = "outline" }: { variant?: "outline" | "animate" | "primary" | "ghost" } = {}) {
  return (
    <FormModal
      trigger={<><Gift size={16} /> One-off inflow</>}
      triggerVariant={variant}
      title="Add an inflow"
      description="Gifts, refunds, side cash — anything that lands in the pool."
      action={addInflow}
    >
      <Field label="Amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
      <Field label="Source" name="source" placeholder="Gift, tax refund…" />
      <SelectField label="Tag" name="person_tag" options={personOpts} defaultValue="shared" />
      <Field label="Date" name="date" type="date" defaultValue={today()} />
      <Field label="Notes" name="notes" />
    </FormModal>
  );
}

export function AddExpenseModal({ variant = "outline" }: { variant?: "outline" | "animate" | "primary" | "ghost" } = {}) {
  return (
    <FormModal
      trigger={<><Receipt size={16} /> Expense</>}
      triggerVariant={variant}
      title="Add an expense"
      action={addExpense}
    >
      <Field label="Name" name="name" placeholder="Car insurance" required />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Category"
          name="category"
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c.replace("_", " ") }))}
          defaultValue="general"
        />
        <Field label="Amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Tag" name="person_tag" options={personOpts} defaultValue="shared" />
        <SelectField
          label="Recurrence"
          name="recurrence"
          options={RECURRENCES.map((r) => ({ value: r, label: r }))}
          defaultValue="none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due date" name="due_date" type="date" />
        <Field label="Due day (1-31)" name="due_day" type="number" min="1" placeholder="e.g. 15" />
      </div>
      <Field label="Notes" name="notes" />
    </FormModal>
  );
}

export function AddSavingsModal({ variant = "animate" }: { variant?: "outline" | "animate" | "primary" | "ghost" } = {}) {
  return (
    <FormModal
      trigger={<><PiggyBank size={16} weight="fill" /> Add to goal</>}
      triggerVariant={variant}
      title="Add to the $75K goal"
      description="Log money moved to the down-payment fund."
      action={addSavings}
    >
      <Field label="Amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
      <Field label="Date" name="date" type="date" defaultValue={today()} />
      <Field label="Note" name="note" placeholder="From this paycheck…" />
    </FormModal>
  );
}

export function QuickAddRow() {
  return (
    <div className="flex flex-wrap gap-2">
      <AddSavingsModal />
      <LogPaycheckModal />
      <AddInflowModal />
      <AddExpenseModal />
    </div>
  );
}

export { Plus };
