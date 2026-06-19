"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X, Info, Sparkles } from "lucide-react";
import { PraxisButton } from "@/components/conduit/ui/Button";

type BannerType =
  | "checkout_success"
  | "checkout_canceled"
  | "topup_success"
  | "upgrade_intent_pro"
  | "upgrade_intent_enterprise";

const MESSAGES: Record<BannerType, { icon: typeof CheckCircle; text: string; color: string }> = {
  checkout_success: {
    icon: CheckCircle,
    text: "You're upgraded! Your new plan is active.",
    color: "var(--cx-reward)",
  },
  topup_success: {
    icon: CheckCircle,
    text: "Tokens added to your account.",
    color: "var(--cx-reward)",
  },
  checkout_canceled: {
    icon: Info,
    text: "Checkout canceled — no charge was made.",
    color: "var(--cx-text-muted)",
  },
  upgrade_intent_pro: {
    icon: Sparkles,
    text: "You're one step from Pro — upgrade below to unlock 1M tokens/month, adaptive routing, and 4 employees.",
    color: "var(--cx-accent)",
  },
  upgrade_intent_enterprise: {
    icon: Sparkles,
    text: "You're one step from Enterprise — upgrade below to unlock your full AI workforce.",
    color: "var(--cx-accent)",
  },
};

export function BillingReturnBanner({ type }: { type: BannerType }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss success banners after 8 s.
    if (type !== "checkout_canceled") {
      const t = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(t);
    }
  }, [type]);

  if (!visible) return null;

  const { icon: Icon, text, color } = MESSAGES[type];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg mb-6 cx-type-base"
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        color: "var(--cx-text)",
      }}
    >
      <Icon size={16} style={{ color, flexShrink: 0 }} />
      <span className="flex-1">{text}</span>
      <PraxisButton type="button" variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={() => setVisible(false)}>
        <X size={14} />
      </PraxisButton>
    </div>
  );
}
