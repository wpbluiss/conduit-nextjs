"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useUser } from "@/context/UserContext";

export function UpgradeCTABanner({
  internalAccount,
}: {
  internalAccount: boolean;
}) {
  const user = useUser();
  if (!user || internalAccount || user.plan !== "free") return null;

  return (
    <div
      className="flex items-center gap-2 px-4 md:px-8 py-2 cx-type-xs shrink-0"
      style={{
        background:
          "color-mix(in srgb, var(--color-accent) 7%, var(--color-surface))",
        borderTop: "1px solid color-mix(in srgb, var(--color-accent) 18%, transparent)",
      }}
    >
      <Sparkles
        size={12}
        strokeWidth={1.75}
        aria-hidden
        className="shrink-0"
        style={{ color: "var(--color-accent)" }}
      />
      <span style={{ color: "var(--color-text-muted)" }} className="truncate">
        Unlock custom specialists, file attachments, and 10× messages with{" "}
        <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
          Praxis Pro
        </span>
      </span>
      <Link
        href="/app/settings/billing"
        className="ml-auto shrink-0 inline-flex items-center gap-0.5 font-medium transition-opacity hover:opacity-80"
        style={{ color: "var(--color-accent-hi)" }}
      >
        Upgrade →
      </Link>
    </div>
  );
}
