"use client";

import { useTransition } from "react";
import { Trash, CheckCircle } from "@phosphor-icons/react";
import { FormModal, Field, SelectField } from "./forms";
import {
  logDebtPayment, markExpensePaid, updateAccountBalance,
  updateInvestmentPrice, logChildSupportPayment,
} from "@/lib/finance/actions";

type Result = { ok: boolean; error?: string };

export function DeleteButton({ action }: { action: () => Promise<Result> }) {
  const [pending, start] = useTransition();
  return (
    <button
      aria-label="Delete"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this? This can't be undone.")) start(() => { action(); });
      }}
      className="p-1.5 rounded-md text-[var(--fin-muted)] hover:text-[#f0888c] hover:bg-[#e5484d]/10 transition disabled:opacity-40"
    >
      <Trash size={16} />
    </button>
  );
}

export function MarkPaidButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => { markExpensePaid(id); })}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-[#7cc6a0] hover:bg-[#5b9d76]/10 transition disabled:opacity-40"
    >
      <CheckCircle size={14} weight="fill" /> {pending ? "…" : "Mark paid"}
    </button>
  );
}

export function LogDebtPaymentModal({ id, name }: { id: string; name: string }) {
  return (
    <FormModal
      trigger="Log payment"
      triggerVariant="outline"
      title={`Pay ${name}`}
      description="Reduces the balance and records on-time history."
      action={(fd) =>
        logDebtPayment(
          id,
          parseFloat(String(fd.get("amount")) || "0"),
          String(fd.get("on_time")) === "yes",
          name,
        )
      }
    >
      <Field label="Amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
      <SelectField
        label="On time?"
        name="on_time"
        options={[{ value: "yes", label: "On time" }, { value: "no", label: "Late" }]}
        defaultValue="yes"
      />
    </FormModal>
  );
}

export function ChildSupportPayModal({ amount }: { amount: number }) {
  return (
    <FormModal
      trigger="Log payment"
      triggerVariant="outline"
      title="Log child support payment"
      action={(fd) =>
        logChildSupportPayment(
          parseFloat(String(fd.get("amount")) || "0"),
          String(fd.get("on_time")) === "yes",
        )
      }
    >
      <Field label="Amount" name="amount" type="number" step="0.01" defaultValue={amount} required />
      <SelectField
        label="On time? (1st–15th)"
        name="on_time"
        options={[{ value: "yes", label: "On time" }, { value: "no", label: "Late" }]}
        defaultValue="yes"
      />
    </FormModal>
  );
}

export function EditBalanceModal({ id, name, balance }: { id: string; name: string; balance: number }) {
  return (
    <FormModal
      trigger="Edit"
      triggerVariant="ghost"
      title={`Update ${name}`}
      action={(fd) => updateAccountBalance(id, parseFloat(String(fd.get("balance")) || "0"))}
    >
      <Field label="Current balance" name="balance" type="number" step="0.01" defaultValue={balance} required />
    </FormModal>
  );
}

export function UpdatePriceModal({ id, ticker, price }: { id: string; ticker: string; price: number }) {
  return (
    <FormModal
      trigger="Price"
      triggerVariant="ghost"
      title={`Update ${ticker} price`}
      description="Manual price update — live sync can be added later."
      action={(fd) => updateInvestmentPrice(id, parseFloat(String(fd.get("price")) || "0"))}
    >
      <Field label="Current price / share" name="price" type="number" step="0.01" defaultValue={price} required />
    </FormModal>
  );
}
