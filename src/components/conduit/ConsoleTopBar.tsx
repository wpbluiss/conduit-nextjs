"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  BarChart2,
  Bookmark,
  Brain,
  Building2,
  ChevronRight,
  CreditCard,
  Hammer,
  Menu,
  MessageSquare,
  Mic,
  Package,
  Settings,
  Sparkles,
  Users2,
} from "lucide-react";
import { PraxisButton } from "@/components/conduit/PraxisButton";
import { useTopBar } from "@/context/TopBarContext";
import type { LucideIcon } from "lucide-react";

interface PageMeta {
  label: string;
  Icon: LucideIcon;
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
  const sorted = Object.keys(PAGE_MAP).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (key !== "/app" && pathname.startsWith(key + "/")) return PAGE_MAP[key];
  }
  return { label: "Praxis", Icon: Sparkles };
}

export interface ConsoleTopBarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  userEmail?: string;
}

export function ConsoleTopBar({
  avatarUrl,
  displayName,
  userEmail = "",
}: ConsoleTopBarProps) {
  const pathname = usePathname();
  const { label, Icon } = resolvePageMeta(pathname);
  const { breadcrumb } = useTopBar();

  const userInitial = (displayName || userEmail)[0]?.toUpperCase() ?? "?";
  const userName = displayName || userEmail.split("@")[0];

  const openSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("praxis:sidebar:open"));
    }
  };

  return (
    <header
      className="shrink-0 flex items-center h-12 px-3 gap-2 cx-glass z-20"
      style={{
        borderBottom: "1px solid var(--cx-border)",
      }}
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
        <Menu size={18} strokeWidth={1.75} />
      </PraxisButton>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Accent bar — desktop only */}
        <span
          className="hidden md:block shrink-0 w-0.5 h-4 rounded-full"
          style={{ background: "var(--cx-accent)" }}
          aria-hidden="true"
        />

        {/* Section icon */}
        <Icon
          size={14}
          strokeWidth={1.75}
          aria-hidden="true"
          style={{ color: "var(--cx-text-muted)" }}
          className="shrink-0"
        />

        {/* Section label */}
        <span
          className="font-semibold truncate"
          style={{
            fontSize: "var(--cx-type-base)",
            color: "var(--cx-text)",
            letterSpacing: "var(--cx-ls-tight)",
          }}
        >
          {label}
        </span>

        {/* Specialist breadcrumb — set by pages via useSetBreadcrumb */}
        {breadcrumb?.specialist && (
          <>
            <ChevronRight
              size={12}
              strokeWidth={1.75}
              className="shrink-0"
              style={{ color: "var(--cx-text-faint)" }}
              aria-hidden="true"
            />
            <span
              className="truncate font-medium"
              style={{
                fontSize: "var(--cx-type-sm)",
                color: "var(--cx-text-muted)",
                letterSpacing: "var(--cx-ls-tight)",
              }}
            >
              {breadcrumb.specialist}
            </span>
          </>
        )}

        {/* Conversation title — mono metadata, hidden on small screens */}
        {breadcrumb?.conversationTitle && (
          <>
            <ChevronRight
              size={12}
              strokeWidth={1.75}
              className="shrink-0 hidden sm:block"
              style={{ color: "var(--cx-text-faint)" }}
              aria-hidden="true"
            />
            <span
              className="truncate hidden sm:block"
              style={{
                fontFamily: "var(--cx-font-mono)",
                fontSize: "var(--cx-type-xs)",
                color: "var(--cx-text-faint)",
              }}
            >
              {breadcrumb.conversationTitle}
            </span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Keyboard shortcut hint — desktop only */}
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
          className="hidden md:inline-flex"
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

        {/* Account avatar — links to profile settings */}
        <Link
          href="/app/settings/profile"
          aria-label={`Account: ${userName}`}
          title={userName}
          className="cx-focus-ring rounded-full ml-1"
          style={{ display: "inline-flex" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              background: avatarUrl
                ? "transparent"
                : "color-mix(in srgb, var(--cx-accent) 15%, var(--cx-surface))",
              border:
                "1px solid color-mix(in srgb, var(--cx-accent) 25%, var(--cx-border))",
              transition: "opacity var(--cx-dur-fast) var(--cx-ease)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.opacity = "0.8")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.opacity = "1")
            }
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span
                style={{
                  color: "var(--cx-accent-bright)",
                  fontSize: "var(--cx-type-xs)",
                  fontWeight: 600,
                }}
              >
                {userInitial}
              </span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
