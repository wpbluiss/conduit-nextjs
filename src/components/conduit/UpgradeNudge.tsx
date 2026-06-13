"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import posthog from "posthog-js";

const STORAGE_KEY = "conduit_upgrade_nudge_dismissed";

export function UpgradeNudge({
  tierId,
  internalAccount,
}: {
  tierId: string;
  internalAccount: boolean;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (internalAccount) return;
    if (tierId !== "free") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== "1") setDismissed(false);
  }, [internalAccount, tierId]);

  if (dismissed || internalAccount || tierId !== "free") return null;

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
      className="hairline border-l-0 border-r-0 border-t-0 px-4 py-2 flex items-center gap-3 text-xs"
      style={{
        background:
          "color-mix(in srgb, var(--color-accent) 6%, transparent)",
      }}
    >
      <Sparkles size={14} className="text-[var(--color-accent)]" />
      <span className="text-[var(--color-text)]">
        You&apos;re on Praxis Free. Want premium routing?
      </span>
      <Link
        href="/app/settings"
        onClick={() => {
          posthog.capture("upgrade_intent_clicked", { source: "nudge_bar" });
          close();
        }}
        className="ml-auto inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
      >
        Upgrade →
      </Link>
      <button
        onClick={close}
        aria-label="Dismiss"
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <X size={14} />
      </button>
    </div>
  );
}
