"use client";

import { usePathname } from "next/navigation";
import { Menu, Activity, BarChart2, Bookmark, Brain, Building2, CreditCard, Hammer, MessageSquare, Mic, Package, Settings, Sparkles, Users2 } from "lucide-react";
import { PraxisButton } from "@/components/conduit/PraxisButton";
import type { LucideIcon } from "lucide-react";

interface PageMeta {
  label: string;
  Icon: LucideIcon;
  parent?: string;
}

const PAGE_MAP: Record<string, PageMeta> = {
  "/app":               { label: "Chat",          Icon: Sparkles },
  "/app/conversations": { label: "Conversations", Icon: MessageSquare },
  "/app/analytics":     { label: "Analytics",     Icon: BarChart2 },
  "/app/activity":      { label: "Activity",      Icon: Activity },
  "/app/artifacts":     { label: "Artifacts",     Icon: Bookmark },
  "/app/outputs":       { label: "Outputs",       Icon: Package },
  "/app/builds":        { label: "Builds",        Icon: Hammer },
  "/app/memory":        { label: "Memory",        Icon: Brain },
  "/app/voice":         { label: "Voice",         Icon: Mic },
  "/app/team":          { label: "Team",          Icon: Users2 },
  "/app/workspace":     { label: "Workspace",     Icon: Building2 },
  "/app/billing":       { label: "Billing",       Icon: CreditCard },
  "/app/settings":      { label: "Settings",      Icon: Settings },
};

function resolvePageMeta(pathname: string): PageMeta {
  if (PAGE_MAP[pathname]) return PAGE_MAP[pathname];
  // Prefix match — longest wins (e.g. /app/builds/[session] → Builds)
  const sorted = Object.keys(PAGE_MAP).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (key !== "/app" && pathname.startsWith(key + "/")) return PAGE_MAP[key];
  }
  return { label: "Praxis", Icon: Sparkles };
}

export function ConsoleTopBar() {
  const pathname = usePathname();
  const { label, Icon } = resolvePageMeta(pathname);
  const isChat = pathname === "/app";

  const openSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("praxis:sidebar:open"));
    }
  };

  return (
    <header
      className="shrink-0 flex items-center h-12 px-3 gap-2 cx-glass z-20"
      style={{ borderBottom: "1px solid var(--cx-glass-border, rgba(255,255,255,0.08))" }}
      aria-label="Console navigation"
    >
      {/* Mobile hamburger — triggers Sidebar via CustomEvent */}
      <PraxisButton
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={openSidebar}
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        className="md:hidden -ml-1 shrink-0"
      >
        <Menu size={18} />
      </PraxisButton>

      {/* Accent bar + page title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className="hidden md:block shrink-0 w-0.5 h-4 rounded-full"
          style={{ background: "var(--cx-accent)" }}
          aria-hidden="true"
        />
        <Icon
          size={14}
          aria-hidden="true"
          style={{ color: isChat ? "var(--cx-accent)" : "var(--cx-text-muted)" }}
          className="shrink-0"
        />
        <span
          className="cx-type-sm font-semibold truncate"
          style={{ color: "var(--cx-text)", letterSpacing: "var(--cx-ls-tight)" }}
        >
          {label}
        </span>
      </div>

      {/* Right action area — keyboard shortcuts trigger */}
      <PraxisButton
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("praxis:shortcuts:open"));
          }
        }}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (⌘/)"
        className="shrink-0 hidden md:inline-flex"
      >
        <span
          className="cx-mono"
          style={{
            fontSize: "var(--cx-type-xs)",
            color: "var(--cx-text-faint)",
            letterSpacing: "0",
          }}
        >
          ⌘/
        </span>
      </PraxisButton>
    </header>
  );
}
