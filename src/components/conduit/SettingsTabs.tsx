"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, employeeLabel } from "./EmployeeBadge";
import { ORDERED_TIERS, TOPUPS, tierById, type TierId } from "@/lib/billing/tiers";

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
  creator_mode?: boolean;
  creator_mode_version?: number;
  tier_id?: string;
  subscription_status?: string;
  bonus_tokens?: number;
  internal_account?: boolean;
  has_stripe_customer?: boolean;
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
        <ProfileTab
          email={email}
          fullName={fullName}
          creatorMode={Boolean(account.creator_mode)}
          creatorModeVersion={account.creator_mode_version ?? 1}
        />
      )}
      {tab === "business" && <BusinessTab account={account} />}
      {tab === "usage" && <UsageTab usage={usage} />}
      {tab === "billing" && <BillingTab account={account} usage={usage} />}
    </div>
  );
}

function ProfileTab({
  email,
  fullName,
  creatorMode,
  creatorModeVersion,
}: {
  email: string;
  fullName: string;
  creatorMode: boolean;
  creatorModeVersion: number;
}) {
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
      {creatorMode && (
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
            Mode
          </div>
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs"
            style={{
              borderColor: "var(--color-accent)",
              color: "var(--color-accent-hi)",
              background:
                "color-mix(in srgb, var(--color-accent) 8%, transparent)",
            }}
          >
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--color-accent)" }}
            />
            Creator Mode v{creatorModeVersion}
            {creatorModeVersion >= 2 ? " — premium routing" : ""}
          </span>
        </div>
      )}
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

function BillingTab({
  account,
  usage,
}: {
  account: AccountData;
  usage: UsageData;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tier = tierById(account.tier_id ?? "free");
  const internal = Boolean(account.internal_account);

  if (internal) {
    return (
      <div className="space-y-6 text-sm">
        <div className="conduit-card p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-1">
            Internal Account · Conduit Team
          </div>
          <div className="serif text-2xl">No charge, full access</div>
          <p className="mt-2 text-[var(--color-text-muted)]">
            You&apos;re on the internal team account. All tiers, all
            employees, no token cap. Subscription UI is hidden.
          </p>
        </div>
        <UsageSummary usage={usage} cap={tier.monthlyTokenAllowance} bonus={0} />
      </div>
    );
  }

  const upgrade = async (tierId: TierId) => {
    setBusy(tierId);
    setError(null);
    try {
      const res = await fetch("/api/conduit/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tier_id: tierId,
          return_url: window.location.href,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          j.error === "billing_not_configured"
            ? "Billing isn't live yet."
            : j.error === "tier_price_not_configured"
              ? "Pricing not connected. Try again shortly."
              : "Couldn't start checkout.",
        );
        setBusy(null);
        return;
      }
      window.location.href = j.url;
    } catch {
      setError("Couldn't start checkout.");
      setBusy(null);
    }
  };

  const buyTopup = async (topupId: string) => {
    setBusy(topupId);
    setError(null);
    try {
      const res = await fetch("/api/conduit/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topup_id: topupId,
          return_url: window.location.href,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          j.error === "billing_not_configured"
            ? "Top-ups aren't live yet."
            : "Couldn't start checkout.",
        );
        setBusy(null);
        return;
      }
      window.location.href = j.url;
    } catch {
      setError("Couldn't start checkout.");
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy("portal");
    setError(null);
    try {
      const res = await fetch("/api/conduit/billing/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ return_url: window.location.href }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          j.error === "no_customer"
            ? "Subscribe first to access the billing portal."
            : "Couldn't open portal.",
        );
        setBusy(null);
        return;
      }
      window.location.href = j.url;
    } catch {
      setError("Couldn't open portal.");
      setBusy(null);
    }
  };

  const allowance = tier.monthlyTokenAllowance + (account.bonus_tokens ?? 0);

  return (
    <div className="space-y-6 text-sm">
      {/* Current plan */}
      <div className="conduit-card p-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Current plan ·{" "}
            {(account.subscription_status ?? "inactive").replace(
              "_",
              " ",
            )}
          </div>
          <div className="serif text-2xl mt-1">{tier.name}</div>
          <div className="text-[var(--color-text-muted)] text-xs mt-1">
            {tier.monthlyPriceCents > 0
              ? `$${tier.monthlyPriceCents / 100} / month`
              : "Free forever"}{" "}
            · {tier.monthlyTokenAllowance.toLocaleString()} tokens / month
            {account.bonus_tokens && account.bonus_tokens > 0
              ? ` · +${account.bonus_tokens.toLocaleString()} bonus`
              : ""}
          </div>
        </div>
        {account.has_stripe_customer && (
          <button
            onClick={openPortal}
            disabled={busy !== null}
            className="btn-secondary !text-xs disabled:opacity-50"
          >
            {busy === "portal" ? "Opening…" : "Manage in Stripe"}
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      <UsageSummary
        usage={usage}
        cap={tier.monthlyTokenAllowance}
        bonus={account.bonus_tokens ?? 0}
      />

      {error && (
        <p className="text-sm text-[var(--color-pink)]">{error}</p>
      )}

      {/* Tier comparison */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Plans
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ORDERED_TIERS.map((t) => {
            const isCurrent = t.id === tier.id;
            const isUpgrade =
              !isCurrent &&
              ORDERED_TIERS.findIndex((x) => x.id === t.id) >
                ORDERED_TIERS.findIndex((x) => x.id === tier.id);
            return (
              <div
                key={t.id}
                className={`conduit-card p-5 ${
                  isCurrent
                    ? "border-[var(--color-accent)]"
                    : ""
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {isCurrent ? "Current" : t.name}
                </div>
                <div className="serif text-2xl mt-1">{t.name}</div>
                <div className="mt-1">
                  <span className="text-2xl font-medium">
                    ${t.monthlyPriceCents / 100}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {" "}/mo
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs text-[var(--color-text-muted)]">
                  <li className="flex items-start gap-1.5">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                    />
                    {(t.monthlyTokenAllowance / 1000).toLocaleString()}k
                    tokens / month
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                    />
                    {t.modelCeiling === "haiku"
                      ? "Fast routing model"
                      : t.modelCeiling === "sonnet"
                        ? "Adaptive routing (Sonnet on reasoning)"
                        : "Premium routing (Opus on reasoning + code)"}
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                    />
                    {t.allowedEmployees.length} employees
                  </li>
                  {t.features.multiUser && (
                    <li className="flex items-start gap-1.5">
                      <Check
                        size={12}
                        className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                      />
                      Multi-user (when shipped)
                    </li>
                  )}
                </ul>
                {isUpgrade && t.id !== "free" && (
                  <button
                    onClick={() => upgrade(t.id as TierId)}
                    disabled={busy !== null}
                    className="mt-4 btn-primary w-full justify-center !text-xs !py-2 disabled:opacity-50"
                  >
                    {busy === t.id ? "Opening…" : `Upgrade to ${t.name}`}
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top-ups */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Buy more tokens
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TOPUPS.map((t) => (
            <button
              key={t.id}
              onClick={() => buyTopup(t.id)}
              disabled={busy !== null}
              className="conduit-card p-4 text-left hover:border-[var(--color-accent)] transition-colors disabled:opacity-50"
            >
              <div className="serif text-xl">${t.amountCents / 100}</div>
              <div className="mt-1 text-sm">
                {(t.tokensGranted / 1000).toLocaleString()}k tokens
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-accent)]">
                {busy === t.id ? "Opening…" : "Buy"}
                <ArrowRight size={11} />
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
          Bonus tokens stack on top of your monthly allowance and roll over
          until used.
        </p>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)]">
        Allowance: {allowance.toLocaleString()} this cycle.
      </p>
    </div>
  );
}

function UsageSummary({
  usage,
  cap,
  bonus,
}: {
  usage: UsageData;
  cap: number;
  bonus: number;
}) {
  const used = usage.cap.used;
  const total = cap + bonus;
  const pct = Math.min(100, Math.round((used / Math.max(1, total)) * 100));
  return (
    <div className="conduit-card p-5">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Tokens this cycle
        </span>
        <span className="text-sm">
          {used.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background:
              pct >= 100
                ? "var(--color-pink)"
                : pct >= 80
                  ? "var(--color-amber)"
                  : "var(--color-accent)",
          }}
        />
      </div>
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
