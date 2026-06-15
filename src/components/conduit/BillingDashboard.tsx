"use client";

import { useState } from "react";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { ORDERED_TIERS, TOPUPS, tierById, type TierId } from "@/lib/billing/tiers";
import { track } from "@/lib/analytics/track";
import { Button as PraxisButton } from "@/components/conduit/ui/Button";

interface UsageData {
  totals: { input: number; output: number; cost: number };
  byEmployee: Record<string, { input: number; output: number; cost: number }>;
  byDay: Record<string, number>;
  today: { input: number; output: number; cost: number };
  thisWeek: { input: number; output: number; cost: number };
  cap: { used: number; limit: number };
  buildsThisCycle?: number;
}

interface AccountData {
  id: string;
  name: string;
  business_type: string;
  business_description: string;
  tier_id?: string;
  subscription_status?: string;
  bonus_tokens?: number;
  internal_account?: boolean;
  has_stripe_customer?: boolean;
}

export function BillingDashboard({
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
  const allowance = tier.monthlyTokenAllowance + (account.bonus_tokens ?? 0);

  if (internal) {
    return (
      <div className="space-y-6 text-sm">
        <div className="conduit-card p-6">
          <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-1">
            Internal Account · Conduit AI Team
          </div>
          <div className="serif text-2xl">No charge, full access</div>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Internal team account — all tiers, all employees, no token cap.
          </p>
        </div>
        <TokenUsageBar usage={usage} cap={tier.monthlyTokenAllowance} bonus={0} />
      </div>
    );
  }

  const upgrade = async (tierId: TierId) => {
    setBusy(tierId);
    setError(null);
    track("checkout_clicked", { tier_id: tierId });
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
              ? "Pricing not connected — try again shortly."
              : "Couldn't start checkout.",
        );
        setBusy(null);
        return;
      }
      window.open(j.url, "_blank");
      setBusy(null);
    } catch {
      setError("Couldn't start checkout.");
      setBusy(null);
    }
  };

  const buyTopup = async (topupId: string) => {
    setBusy(topupId);
    setError(null);
    track("checkout_clicked", { topup_id: topupId });
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
      window.open(j.url, "_blank");
      setBusy(null);
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

  return (
    <div className="space-y-6 text-sm">
      {/* Current plan card */}
      <div className="conduit-card p-6 flex items-start justify-between gap-4">
        <div>
          <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Current plan ·{" "}
            {(account.subscription_status ?? "inactive").replace("_", " ")}
          </div>
          <div className="serif text-3xl mt-1">{tier.name}</div>
          <div className="cx-mono text-[var(--color-text-muted)] text-xs mt-1.5 tabular-nums">
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
          <PraxisButton
            variant="secondary"
            size="sm"
            onClick={openPortal}
            isLoading={busy === "portal"}
            loadingText="Opening…"
            isDisabled={busy !== null && busy !== "portal"}
            className="shrink-0"
          >
            Manage in Stripe
            <ExternalLink size={12} />
          </PraxisButton>
        )}
      </div>

      {/* Token usage */}
      <TokenUsageBar usage={usage} cap={tier.monthlyTokenAllowance} bonus={account.bonus_tokens ?? 0} />

      {error && <p className="text-sm text-[var(--color-pink)]">{error}</p>}

      {/* Plan comparison */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Plans
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ORDERED_TIERS.map((t) => {
            const isCurrent = t.id === tier.id;
            const tierIndex = ORDERED_TIERS.findIndex((x) => x.id === t.id);
            const currentIndex = ORDERED_TIERS.findIndex((x) => x.id === tier.id);
            const isUpgrade = !isCurrent && tierIndex > currentIndex;

            return (
              <div
                key={t.id}
                className={`conduit-card p-5 flex flex-col ${
                  isCurrent ? "border-[var(--color-accent)]" : ""
                }`}
              >
                {isCurrent && (
                  <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-1">
                    Current plan
                  </div>
                )}
                <div className="serif text-2xl">{t.name}</div>
                <div className="mt-1 mb-3">
                  <span className="text-2xl font-medium">
                    ${t.monthlyPriceCents / 100}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {" "}/mo
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--color-text-muted)] flex-1">
                  <li className="flex items-start gap-1.5">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                    />
                    {(t.monthlyTokenAllowance / 1000).toLocaleString()}k tokens / month
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
                  <PraxisButton
                    size="sm"
                    onClick={() => upgrade(t.id as TierId)}
                    isLoading={busy === t.id}
                    loadingText="Opening Stripe…"
                    isDisabled={busy !== null && busy !== t.id}
                    className="mt-4 w-full justify-center"
                  >
                    {`Upgrade to ${t.name}`}
                    <ArrowRight size={12} />
                  </PraxisButton>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Token top-ups */}
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
              className="conduit-card p-5 text-left hover:border-[var(--color-accent)] transition-colors disabled:opacity-50"
            >
              <div className="serif text-2xl">${t.amountCents / 100}</div>
              <div className="mt-1 text-sm">
                {(t.tokensGranted / 1000).toLocaleString()}k tokens
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-accent)]">
                {busy === t.id ? "Opening Stripe…" : "Buy"}
                <ArrowRight size={11} />
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 cx-type-xs text-[var(--color-text-muted)]">
          Bonus tokens stack on your monthly allowance and roll over until used.
        </p>
      </div>

      <p className="cx-mono cx-type-xs text-[var(--color-text-muted)] tabular-nums">
        Allowance this cycle: {allowance.toLocaleString()} tokens.
      </p>
    </div>
  );
}

function TokenUsageBar({
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
        <span className="cx-mono cx-type-base">
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
      {pct >= 80 && (
        <p className="mt-2 text-xs text-[var(--color-amber)]">
          {pct >= 100
            ? "Token cap reached. Top up or upgrade to continue."
            : `${pct}% used — consider a top-up or upgrade.`}
        </p>
      )}
    </div>
  );
}
