"use client";

import { FormModal, Field, SelectField } from "./forms";
import { createVault } from "@/lib/finance/actions";
import { Plus } from "@phosphor-icons/react";

const CATEGORIES = [
  { value: "trip", label: "✈️ Trip" },
  { value: "treat", label: "🍷 Treat / date" },
  { value: "fund", label: "🎁 Big purchase" },
  { value: "emergency", label: "🛟 Safety net" },
  { value: "reward", label: "🎯 Other" },
];

export function CreateVaultModal() {
  return (
    <FormModal
      trigger={<><Plus size={16} /> New reward</>}
      triggerVariant="animate"
      title="Create a reward vault"
      description="A jar for something fun. Fund it, and when it hits 100% you spend it guilt-free."
      action={createVault}
    >
      <Field label="Name" name="name" placeholder="Cabo trip, new TV, date nights…" required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Emoji" name="emoji" placeholder="✈️" defaultValue="🎯" />
        <Field label="Target $" name="target_amount" type="number" step="50" placeholder="2000" required />
      </div>
      <SelectField label="Type" name="category" options={CATEGORIES} defaultValue="trip" />
    </FormModal>
  );
}
