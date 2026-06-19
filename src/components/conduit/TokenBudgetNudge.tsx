"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { track } from "@/lib/analytics/track";
import { PraxisButton } from "@/components/conduit/ui/Button";

const STORAGE_KEY = "conduit_budget_nudge_dismissed_v1";
const WARN_THRESHOLD = 0.8;

export function TokenBudgetNudge({
  tokensUsed,
  tokensAllowance,
  tierId,
  internalAccount,
}: {
  tokensUsed: number;
  tokensAllowance: number;
  tierId: string;
  internalAccount: boolean;
}) {
  const [dismissed, setDismissed] = useState(true);

  const pct = tokensAllowance > 0 ? tokensUsed / tokensAllowance : 0;
  const shouldShow =
    !internalAccount && tierId === "free" && pct >= WARN_THRESHOLD;

  useEffect(() => {
    if (!shouldShow) return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen !== "1") setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, [shouldShow]);

  if (!shouldShow || dismissed) return null;

  const pctDisplay = Math.round(pct * 100);
  const remaining = Math.max(0, tokensAllowance - tokensUsed).toLocaleString();

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="alert"
      className="hairline border-l-0 border-r-0 border-t-0 px-4 py-2 flex items-center gap-3 cx-type-xs"
      style={{
        background: "var(--cx-accent-tint)",
        borderBottomColor: "color-mix(in srgb, var(--cx-accent) 20%, transparent)",
      }}
    >
      <AlertTriangle
        size={14}
        style={{ color: "var(--cx-accent)", flexShrink: 0 }}
      />
      <span style={{ color: "var(--color-text)" }}>
        <span style={{ color: "var(--cx-text)", fontWeight: 500 }}>
          {pctDisplay}%
        </span>{" "}
        of your free tokens used — {remaining} remaining this month.
      </span>
      <Link
        href="/app/settings"
        onClick={() => {
          track("upgrade_initiated", { source: "budget_nudge_bar" });
          close();
        }}
        className="ml-auto inline-flex items-center gap-1 font-medium shrink-0 hover:opacity-80 transition-opacity"
        style={{ color: "var(--cx-accent)" }}
      >
        Upgrade →
      </Link>
      <PraxisButton type="button" variant="ghost" size="icon-sm" onClick={close} aria-label="Dismiss">
        <X size={14} />
      </PraxisButton>
    </div>
  );
}
