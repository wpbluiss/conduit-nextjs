"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics/track";
import { Button } from "@/components/conduit/ui/Button";

const STORAGE_KEY = "conduit_post_onboarding_nudge_v1";
const AUTO_DISMISS_MS = 8000;

export function PostOnboardingNudge() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        localStorage.removeItem(STORAGE_KEY);
        setVisible(true);
      }
    } catch {
      // storage blocked — skip nudge
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  const handleSeePlans = () => {
    track("upgrade_intent_clicked", { source: "post_onboarding" });
    setVisible(false);
    router.push("/app/settings?tab=billing");
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-40 w-72 cx-glass-float cx-glass-border p-5 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setVisible(false)} aria-label="Dismiss" className="absolute top-3 right-3">
        <X size={14} />
      </Button>

      <p className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-1">
        You&apos;re all set
      </p>
      <p className="text-sm font-medium mb-3 pr-4">
        Your team is ready — start exploring or upgrade for more tokens.
      </p>

      <div className="flex flex-col gap-2">
        <Button
          onClick={() => setVisible(false)}
          className="w-full justify-center text-xs"
        >
          Explore your team
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleSeePlans} className="text-[var(--cx-accent)] hover:text-[var(--cx-accent-bright)]">
          See plans <ArrowRight size={12} />
        </Button>
      </div>
    </div>
  );
}
