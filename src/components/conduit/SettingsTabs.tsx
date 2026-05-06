"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UsageData {
  totals: { input: number; output: number; cost: number };
  byEmployee: Record<string, { input: number; output: number; cost: number }>;
  byDay: Record<string, number>;
}

interface AccountData {
  id: string;
  name: string;
  business_type: string;
  business_description: string;
}

export function SettingsTabs({
  email,
  fullName,
  account,
  usage,
}: {
  email: string;
  fullName: string;
  account: AccountData;
  usage: UsageData;
}) {
  const [tab, setTab] = useState<"profile" | "business" | "usage" | "billing">(
    "profile",
  );

  return (
    <div>
      <div className="flex gap-1 hairline border-l-0 border-r-0 border-t-0 mb-6">
        {(
          [
            ["profile", "Profile"],
            ["business", "Business"],
            ["usage", "Usage"],
            ["billing", "Billing"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-[var(--color-accent)] text-[var(--color-text)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <ProfileTab email={email} fullName={fullName} />
      )}
      {tab === "business" && <BusinessTab account={account} />}
      {tab === "usage" && <UsageTab usage={usage} />}
      {tab === "billing" && <BillingTab />}
    </div>
  );
}

function ProfileTab({ email, fullName }: { email: string; fullName: string }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
          Name
        </div>
        <div>{fullName || "—"}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
          Email
        </div>
        <div>{email}</div>
      </div>
    </div>
  );
}

function BusinessTab({ account }: { account: AccountData }) {
  const router = useRouter();
  const [name, setName] = useState(account.name);
  const [businessType, setBusinessType] = useState(account.business_type);
  const [description, setDescription] = useState(account.business_description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/conduit/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        business_type: businessType,
        business_description: description,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Save failed.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block mb-2">
          Business name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[var(--color-surface-elevated)] hairline px-4 py-3 outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block mb-2">
          Business type
        </label>
        <input
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="w-full bg-[var(--color-surface-elevated)] hairline px-4 py-3 outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block mb-2">
          What you&apos;re working on
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full bg-[var(--color-surface-elevated)] hairline px-4 py-3 outline-none focus:border-[var(--color-accent)] resize-none"
        />
      </div>
      {error && <p className="text-sm text-[var(--color-pink)]">{error}</p>}
      {saved && <p className="text-sm text-[var(--color-green)]">Saved.</p>}
      <button
        onClick={save}
        disabled={saving}
        className="btn-primary disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function UsageTab({ usage }: { usage: UsageData }) {
  const days = Object.keys(usage.byDay).sort();
  const max = Math.max(1, ...Object.values(usage.byDay));

  return (
    <div className="space-y-6 text-sm">
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-2">
          This month
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Input tokens"
            value={usage.totals.input.toLocaleString()}
          />
          <Stat
            label="Output tokens"
            value={usage.totals.output.toLocaleString()}
          />
          <Stat
            label="Estimated cost"
            value={`$${(usage.totals.cost / 100).toFixed(2)}`}
          />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-2">
          Tokens by day
        </div>
        {days.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No usage yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {days.map((d) => {
              const v = usage.byDay[d];
              const h = Math.round((v / max) * 100);
              return (
                <div
                  key={d}
                  title={`${d}: ${v.toLocaleString()} tokens`}
                  className="flex-1 bg-[var(--color-accent)] opacity-80 hover:opacity-100"
                  style={{ height: `${Math.max(2, h)}%` }}
                />
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-2">
          By employee
        </div>
        <div className="space-y-2">
          {Object.entries(usage.byEmployee).map(([emp, v]) => (
            <div
              key={emp}
              className="flex items-center justify-between hairline px-4 py-2"
            >
              <span className="capitalize">{emp}</span>
              <span className="text-[var(--color-text-muted)] text-xs">
                {(v.input + v.output).toLocaleString()} tokens · $
                {(v.cost / 100).toFixed(2)}
              </span>
            </div>
          ))}
          {Object.keys(usage.byEmployee).length === 0 && (
            <p className="text-[var(--color-text-muted)]">No usage yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="hairline px-6 py-10 text-center">
      <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Coming soon
      </div>
      <p className="serif text-2xl mt-2">Billing & subscriptions</p>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        Pay for tokens, add credit, manage your plan. Shipping in the next
        update.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hairline px-4 py-3">
      <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="serif text-2xl mt-1">{value}</div>
    </div>
  );
}
