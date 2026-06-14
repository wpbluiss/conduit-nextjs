"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { TIERS, TOPUPS, type TierId } from "@/lib/billing/tiers";
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

export function PaywallModal({
  payload,
  onClose,
}: {
  payload: PaywallPayload;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [showTopups, setShowTopups] = useState(
    payload.reason === "cap_reached",
  );
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    track("paywall_viewed", { reason: payload.reason });
  }, [payload.reason]);

  // Capture the element that had focus before the modal opened, so we can
  // restore it when the modal closes.
  useEffect(() => {
    triggerRef.current = document.activeElement;
    return () => {
      (triggerRef.current as HTMLElement | null)?.focus();
    };
  }, []);

  // ESC to close + focus trap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
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
    // Move focus into the modal on open.
    const first = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input',
    );
    first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const upgrade = async (tierId: TierId) => {
    track("checkout_clicked", { tier_id: tierId, reason: payload.reason });
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
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j.error === "billing_not_configured") {
          setError(
            "Billing isn't live yet — Stripe keys are being wired up. Reach out to support@conduitai.io to upgrade manually.",
          );
        } else if (j.error === "tier_price_not_configured") {
          setError(
            "Pricing for this tier isn't connected yet. Try again in a moment.",
          );
        } else {
          setError("Couldn't start checkout. Try again in a moment.");
        }
        setBusy(null);
        return;
      }
      const j = await res.json();
      window.location.href = j.url;
    } catch {
      setError("Couldn't start checkout. Try again in a moment.");
      setBusy(null);
    }
  };

  const topup = async (topupId: string) => {
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
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(
          j.error === "billing_not_configured"
            ? "Top-ups aren't live yet."
            : "Couldn't start checkout. Try again.",
        );
        setBusy(null);
        return;
      }
      const j = await res.json();
      window.location.href = j.url;
    } catch {
      setError("Couldn't start checkout. Try again.");
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70" aria-modal="true" role="dialog" aria-labelledby="paywall-title">
      <div ref={dialogRef} className="w-full max-w-xl conduit-card p-6 md:p-8 relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-3">
          <Sparkles size={14} />
          {payload.reason === "cap_reached"
            ? "Token cap reached"
            : payload.reason === "employee_locked"
              ? "Premium employee"
              : "Premium routing"}
        </div>

        <h2 id="paywall-title" className="serif text-2xl md:text-3xl leading-tight mb-3">
          {payload.message}
        </h2>

        {!showTopups ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => upgrade("pro")}
                disabled={busy !== null}
                className="conduit-card p-5 text-left hover:border-[var(--color-accent)] transition-colors disabled:opacity-50"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Recommended
                </div>
                <div className="serif text-2xl mt-1">{TIERS.pro.name}</div>
                <div className="mt-1">
                  <span className="text-3xl font-medium">
                    ${TIERS.pro.monthlyPriceCents / 100}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {" "}/mo
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-[var(--color-text-muted)]">
                  <li>1M tokens / month</li>
                  <li>Adaptive routing (Sonnet for reasoning)</li>
                  <li>All 4 employees</li>
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-[var(--color-accent)]">
                  {busy === "pro" ? "Opening checkout…" : "Upgrade"}
                  <ArrowRight size={12} />
                </span>
              </button>

              <button
                onClick={() => upgrade("enterprise")}
                disabled={busy !== null}
                className="conduit-card p-5 text-left hover:border-[var(--color-accent)] transition-colors disabled:opacity-50"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Full power
                </div>
                <div className="serif text-2xl mt-1">
                  {TIERS.enterprise.name}
                </div>
                <div className="mt-1">
                  <span className="text-3xl font-medium">
                    ${TIERS.enterprise.monthlyPriceCents / 100}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {" "}/mo
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-[var(--color-text-muted)]">
                  <li>5M tokens / month</li>
                  <li>Opus on reasoning + code</li>
                  <li>Multi-user, dedicated phone (when shipped)</li>
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-[var(--color-accent)]">
                  {busy === "enterprise" ? "Opening checkout…" : "Upgrade"}
                  <ArrowRight size={12} />
                </span>
              </button>
            </div>

            <button
              onClick={() => setShowTopups(true)}
              className="mt-4 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline"
            >
              Or top up tokens without subscribing →
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-muted)] mt-2 mb-4">
              One-time, no subscription. Bonus tokens stack on top of your
              monthly allowance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TOPUPS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => topup(t.id)}
                  disabled={busy !== null}
                  className="conduit-card p-4 text-left hover:border-[var(--color-accent)] transition-colors disabled:opacity-50"
                >
                  <div className="serif text-xl">
                    ${t.amountCents / 100}
                  </div>
                  <div className="mt-1 text-sm text-[var(--color-text)]">
                    {(t.tokensGranted / 1000).toLocaleString()}k tokens
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-accent)]">
                    {busy === t.id ? "Opening…" : "Buy"}
                    <ArrowRight size={11} />
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTopups(false)}
              className="mt-4 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline"
            >
              ← Back to plans
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-[var(--color-pink)]">{error}</p>
        )}

        <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] flex items-center justify-between">
          <Link
            href="/app/settings"
            className="hover:text-[var(--color-text)]"
            onClick={onClose}
          >
            Compare all plans →
          </Link>
          <button
            onClick={onClose}
            className="hover:text-[var(--color-text)]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
