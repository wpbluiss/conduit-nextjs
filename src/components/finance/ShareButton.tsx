"use client";

import { useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react";

export function ShareButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const url = "https://www.conduitai.io/cadence";

  async function share() {
    const payload = { title: "Cadence", text, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch { /* user cancelled */ return; }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <button
      onClick={share}
      className={className ?? "inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[var(--fin-muted)] hover:text-white hover:bg-white/5 transition"}
    >
      <ShareNetwork size={14} /> {copied ? "Copied!" : "Share"}
    </button>
  );
}
