"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, Sparkles, X } from "lucide-react";
import { TIERS, type TierId } from "@/lib/billing/tiers";
import { track } from "@/lib/analytics/track";

export type PaywallReason =
  | "cap_reached"
  | "employee_locked"
  | "model_locked";

export interface PaywallPayload {
  reason: PaywallReason;
  message: string;
  employee?: string;
  intent?: string;
  tier_id?: TierId;
  tokens_used?: number;
  tokens_allowance?: number;
}

const FEATURES: {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}[] = [
  { label: "AI messages / month", free: "50k tokens", pro: "1M tokens" },
  { label: "Specialists", free: "2 (Atlas + Marketing)", pro: "All 9 specialists" },
  { label: "Connectors", free: false, pro: true },
  { label: "Custom specialists", free: false, pro: true },
  { label: "Export conversations", free: false, pro: true },
  { label: "Priority support", free: false, pro: true },
];

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={15} className="mx-auto text-[var(--cx-reward)]" aria-label="Included" />;
  if (value === false) return <Minus size={15} className="mx-auto text-[var(--color-text-muted)] opacity-40" aria-label="Not included" />;
  return <span>{value}</span>;
}

export function PaywallModal({
  payload,
  onClose,
}: {
  payload: PaywallPayload;
  onClose: () => void;
}) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    track("paywall_viewed", { reason: payload.reason });
  }, [payload.reason]);

  useEffect(() => {
    triggerRef.current = document.activeElement;
    return () => {
      (triggerRef.current as HTMLElement | null)?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable: HTMLElement[] = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    const first = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input',
    );
    first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const monthlyPrice = TIERS.pro.monthlyPriceCents / 100;
  const annualMonthlyPrice = Math.round(monthlyPrice * 12 * 0.8) / 12;
  const displayPrice = billing === "annual" ? annualMonthlyPrice : monthlyPrice;

  const upgrade = async () => {
    track("checkout_clicked", { tier_id: "pro", reason: payload.reason, billing });
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/conduit/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tier_id: "pro",
          billing_period: billing,
          return_url: window.location.href,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j.error === "billing_not_configured") {
          setError(
            "Billing isn't live yet — reach out to support@conduitai.io to upgrade manually.",
          );
        } else if (j.error === "tier_price_not_configured") {
          setError("Pricing isn't connected yet. Try again in a moment.");
        } else {
          setError("Couldn't start checkout. Try again in a moment.");
        }
        setBusy(false);
        return;
      }
      const j = await res.json();
      window.location.href = j.url;
    } catch {
      setError("Couldn't start checkout. Try again in a moment.");
      setBusy(false);
    }
  };

  const reasonLabel =
    payload.reason === "cap_reached"
      ? "Message cap reached"
      : payload.reason === "employee_locked"
        ? "Premium specialist"
        : "Premium feature";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/65"
      aria-modal="true"
      role="dialog"
      aria-labelledby="paywall-title"
    >
      <div
        ref={dialogRef}
        className="cx-glass-float cx-glass-border w-full max-w-2xl relative rounded-[16px] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--cx-reward)] mb-2">
            <Sparkles size={13} />
            {reasonLabel}
          </div>

          <h2 id="paywall-title" className="serif text-2xl md:text-3xl leading-tight">
            {payload.message}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Upgrade to Pro to continue.
          </p>

          {/* Billing toggle */}
          <div className="mt-4 inline-flex items-center gap-1 rounded-full p-1" style={{ background: "var(--color-surface-raised, #1a1a1a)", border: "1px solid var(--color-border)" }}>
            <button
              onClick={() => setBilling("monthly")}
              className="px-3 py-1 text-xs rounded-full transition-colors"
              style={
                billing === "monthly"
                  ? { background: "var(--color-border)", color: "var(--color-text)" }
                  : { color: "var(--color-text-muted)" }
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className="px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5"
              style={
                billing === "annual"
                  ? { background: "var(--color-border)", color: "var(--color-text)" }
                  : { color: "var(--color-text-muted)" }
              }
            >
              Annual
              <span className="cx-type-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "color-mix(in srgb, var(--cx-reward) 15%, transparent)", color: "var(--cx-reward)" }}>
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Feature table */}
        <div className="px-6 pb-2">
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            {/* Column headers */}
            <div className="grid grid-cols-3 text-xs">
              <div className="px-4 py-3 text-[var(--color-text-muted)] font-medium uppercase tracking-[0.12em]">
                Feature
              </div>
              <div className="px-4 py-3 text-center font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]" style={{ borderLeft: "1px solid var(--color-border)" }}>
                Free
              </div>
              <div
                className="px-4 py-3 text-center font-medium uppercase tracking-[0.12em]"
                style={{
                  borderLeft: "1px solid rgba(52,211,153,0.30)",
                  background: "color-mix(in srgb, var(--cx-reward) 8%, transparent)",
                  color: "var(--cx-reward)",
                }}
              >
                Pro
              </div>
            </div>

            {/* Feature rows */}
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className="grid grid-cols-3 text-sm"
                style={{
                  borderTop: "1px solid var(--color-border)",
                  background: i % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--color-border) 20%, transparent)",
                }}
              >
                <div className="px-4 py-2.5 text-[var(--color-text-muted)]">{f.label}</div>
                <div className="px-4 py-2.5 text-center text-[var(--color-text-muted)]" style={{ borderLeft: "1px solid var(--color-border)" }}>
                  <FeatureValue value={f.free} />
                </div>
                <div
                  className="px-4 py-2.5 text-center text-[var(--color-text)]"
                  style={{
                    borderLeft: "1px solid rgba(52,211,153,0.30)",
                    background: "color-mix(in srgb, var(--cx-reward) 5%, transparent)",
                  }}
                >
                  <FeatureValue value={f.pro} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pt-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
                ${displayPrice.toFixed(2)}
              </span>
              <span className="text-sm text-[var(--color-text-muted)] ml-1">/mo</span>
              {billing === "annual" && (
                <span className="ml-2 text-xs text-[var(--color-text-muted)] line-through">
                  ${monthlyPrice}/mo
                </span>
              )}
            </div>
            {billing === "annual" && (
              <span className="text-xs text-[var(--cx-reward)]">
                Billed ${(monthlyPrice * 12 * 0.8).toFixed(2)}/yr
              </span>
            )}
          </div>

          <button
            onClick={upgrade}
            disabled={busy}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
            style={{
              background: busy ? "var(--color-border)" : "var(--cx-reward)",
              color: busy ? "var(--color-text-muted)" : "#fff",
              boxShadow: busy ? "none" : "0 4px 16px rgba(52,211,153,0.35)",
            }}
          >
            {busy ? "Opening checkout…" : "Upgrade to Pro"}
          </button>

          {error && (
            <p className="mt-3 text-xs text-[var(--color-pink,#f87171)]">{error}</p>
          )}

          <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
            Cancel anytime · Seats billed per workspace
          </p>
        </div>
      </div>
    </div>
  );
}
