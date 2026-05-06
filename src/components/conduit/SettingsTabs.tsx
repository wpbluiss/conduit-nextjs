"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, employeeLabel } from "./EmployeeBadge";

interface UsageData {
  totals: { input: number; output: number; cost: number };
  byEmployee: Record<string, { input: number; output: number; cost: number }>;
  byDay: Record<string, number>;
  today: { input: number; output: number; cost: number };
  thisWeek: { input: number; output: number; cost: number };
  cap: { used: number; limit: number };
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
      <div className="flex gap-1 border-b border-[var(--color-border)] mb-6">
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
          className="w-full conduit-card px-4 py-3 outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block mb-2">
          Business type
        </label>
        <input
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="w-full conduit-card px-4 py-3 outline-none focus:border-[var(--color-accent)]"
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
          className="w-full conduit-card px-4 py-3 outline-none focus:border-[var(--color-accent)] resize-none"
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
  const last14 = days.slice(-14);
  const fillByDay = last14.map((d) => ({ d, v: usage.byDay[d] }));
  const max = Math.max(1, ...fillByDay.map((x) => x.v));
  const empNames: EmployeeKey[] = ["jarvis", "marketing", "sales", "engineering"];
  const empValues = empNames.map((emp) => ({
    emp,
    val: (usage.byEmployee[emp]?.input ?? 0) + (usage.byEmployee[emp]?.output ?? 0),
  }));
  const empTotal = Math.max(1, empValues.reduce((s, x) => s + x.val, 0));

  const capPct = Math.min(
    100,
    Math.round((usage.cap.used / Math.max(1, usage.cap.limit)) * 100),
  );

  return (
    <div className="space-y-8 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Today" value={`$${(usage.today.cost / 100).toFixed(2)}`} sub={`${(usage.today.input + usage.today.output).toLocaleString()} tokens`} />
        <Stat label="This week" value={`$${(usage.thisWeek.cost / 100).toFixed(2)}`} sub={`${(usage.thisWeek.input + usage.thisWeek.output).toLocaleString()} tokens`} />
        <Stat label="This month" value={`$${(usage.totals.cost / 100).toFixed(2)}`} sub={`${(usage.totals.input + usage.totals.output).toLocaleString()} tokens`} />
      </div>

      <div className="conduit-card px-5 py-4">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Token cap (this cycle)
          </span>
          <span className="text-sm">
            {usage.cap.used.toLocaleString()} /{" "}
            {usage.cap.limit.toLocaleString()}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${capPct}%`,
              background:
                capPct >= 100
                  ? "var(--color-pink)"
                  : capPct >= 80
                    ? "var(--color-amber)"
                    : "var(--color-accent)",
            }}
          />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Tokens · last 14 days
        </div>
        {fillByDay.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No usage yet.</p>
        ) : (
          <div className="conduit-card p-4">
            <div className="flex items-end gap-1 h-32">
              {fillByDay.map(({ d, v }) => {
                const h = Math.round((v / max) * 100);
                return (
                  <div
                    key={d}
                    title={`${d}: ${v.toLocaleString()} tokens`}
                    className="flex-1 rounded-t-md bg-[var(--color-accent)] opacity-70 hover:opacity-100 transition-opacity"
                    style={{ height: `${Math.max(2, h)}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>{fillByDay[0]?.d}</span>
              <span>{fillByDay[fillByDay.length - 1]?.d}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="conduit-card p-5">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
            Share by employee
          </div>
          {empTotal === 1 ? (
            <p className="text-[var(--color-text-muted)]">No usage yet.</p>
          ) : (
            <Donut data={empValues} total={empTotal} />
          )}
        </div>
        <div className="conduit-card p-5">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
            By employee
          </div>
          <div className="space-y-2">
            {empNames.map((emp) => {
              const v = usage.byEmployee[emp];
              if (!v) return null;
              return (
                <div
                  key={emp}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: DEPT_COLOR[emp] }}
                    />
                    {employeeLabel(emp)}
                  </span>
                  <span className="text-[var(--color-text-muted)] text-xs">
                    {(v.input + v.output).toLocaleString()} · $
                    {(v.cost / 100).toFixed(2)}
                  </span>
                </div>
              );
            })}
            {empNames.every((e) => !usage.byEmployee[e]) && (
              <p className="text-[var(--color-text-muted)] text-xs">
                No usage yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Donut({
  data,
  total,
}: {
  data: { emp: EmployeeKey; val: number }[];
  total: number;
}) {
  const r = 50;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segments = data
    .filter((d) => d.val > 0)
    .map((d) => {
      const frac = d.val / total;
      const length = frac * c;
      const seg = (
        <circle
          key={d.emp}
          cx="60"
          cy="60"
          r={r}
          fill="transparent"
          stroke={`var(--color-dept-${d.emp})`}
          strokeWidth="14"
          strokeDasharray={`${length} ${c - length}`}
          strokeDashoffset={-offset}
          transform="rotate(-90 60 60)"
        />
      );
      offset += length;
      return seg;
    });
  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="transparent"
          stroke="var(--color-border)"
          strokeWidth="14"
        />
        {segments}
      </svg>
      <div className="text-xs space-y-1">
        {data
          .filter((d) => d.val > 0)
          .map((d) => (
            <div key={d.emp} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: DEPT_COLOR[d.emp] }}
              />
              <span>{employeeLabel(d.emp)}</span>
              <span className="text-[var(--color-text-muted)]">
                {Math.round((d.val / total) * 100)}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="conduit-card px-6 py-10 text-center">
      <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        Coming soon
      </div>
      <p className="serif text-2xl mt-2">Billing &amp; subscriptions</p>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        Pay for tokens, add credit, manage your plan. Shipping in the next
        update.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="conduit-card px-4 py-3">
      <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="serif text-2xl mt-1">{value}</div>
      {sub && (
        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
