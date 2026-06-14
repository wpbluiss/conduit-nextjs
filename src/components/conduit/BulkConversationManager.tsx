"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Archive, ArchiveRestore, Check, X } from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { PinConversationButton } from "./PinConversationButton";
import { ConversationTitleEditor } from "./ConversationTitleEditor";
import { ConversationLabelManager } from "./ConversationLabels";
import type { ConversationLabel } from "./ConversationLabels";

const TEAM = new Set<string>(EMPLOYEE_ORDER);

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export type ConversationItem = {
  id: string;
  title: string | null;
  updated_at: string;
  dominant_employee: string | null;
  pinned: boolean;
  archived: boolean;
  labels: ConversationLabel[];
};

function ConversationRow({
  c,
  atLimit,
  allLabels,
  selectMode,
  isSelected,
  onToggleSelect,
  onEnterSelectMode,
  onUnarchiveSingle,
  onTouchStart,
  onTouchEnd,
}: {
  c: ConversationItem;
  atLimit: boolean;
  allLabels: ConversationLabel[];
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEnterSelectMode: (id: string) => void;
  onUnarchiveSingle: (id: string) => void;
  onTouchStart: (id: string) => void;
  onTouchEnd: () => void;
}) {
  const dom = c.dominant_employee;
  const isTeam = dom === "team";
  const empKey = (dom && TEAM.has(dom) ? dom : "jarvis") as EmployeeKey;
  const RecentIcon = EMPLOYEE_ICON[empKey];
  const color = DEPT_COLOR[empKey];

  return (
    <div
      onContextMenu={(e) => {
        if (!selectMode) {
          e.preventDefault();
          onEnterSelectMode(c.id);
        }
      }}
      onTouchStart={() => onTouchStart(c.id)}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchEnd}
      className={`group relative flex flex-col gap-1.5 px-4 py-3 rounded-lg conduit-card hover:border-[var(--color-accent)] transition-colors${
        isSelected
          ? " border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)]"
          : ""
      }${c.archived ? " opacity-60" : ""}`}
    >
      {/* Checkbox in select mode */}
      {selectMode && (
        <button
          type="button"
          onClick={() => onToggleSelect(c.id)}
          aria-label={isSelected ? "Deselect conversation" : "Select conversation"}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded flex items-center justify-center border-2 transition-colors shrink-0"
          style={{
            borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)",
            background: isSelected ? "var(--color-accent)" : "var(--color-surface)",
          }}
        >
          {isSelected && <Check size={9} style={{ color: "white" }} strokeWidth={3.5} />}
        </button>
      )}

      <div className={`flex items-center gap-3 min-w-0${selectMode ? " pl-7" : ""}`}>
        <Link href={`/app?c=${c.id}`} className="flex items-center shrink-0" tabIndex={-1} aria-hidden>
          {isTeam ? (
            <span
              aria-hidden
              className="inline-block w-5 h-5 rounded-full shrink-0"
              style={{
                background:
                  "conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineering), var(--color-dept-jarvis), var(--color-dept-marketing))",
              }}
            />
          ) : (
            <span
              aria-hidden
              className="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-md"
              style={{
                background: `color-mix(in srgb, ${color} 18%, var(--color-surface-elevated))`,
                color,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 60%, transparent)`,
              }}
            >
              <RecentIcon size={11} strokeWidth={2.5} />
            </span>
          )}
        </Link>
        <ConversationTitleEditor conversationId={c.id} initialTitle={c.title} />
        <Link
          href={`/app?c=${c.id}`}
          aria-label={`Open ${c.title || "Untitled chat"}`}
          className="text-xs text-[var(--color-text-muted)] shrink-0 pr-2 hover:text-[var(--color-text)] transition-colors"
        >
          {relativeDate(c.updated_at)}
        </Link>
        {c.archived ? (
          <button
            type="button"
            onClick={() => onUnarchiveSingle(c.id)}
            aria-label="Unarchive conversation"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            <ArchiveRestore size={11} />
            Unarchive
          </button>
        ) : (
          <div className="shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <PinConversationButton
              conversationId={c.id}
              pinned={c.pinned}
              atLimit={atLimit && !c.pinned}
            />
          </div>
        )}
      </div>

      <div className={selectMode ? "pl-14" : "pl-8"}>
        <ConversationLabelManager
          conversationId={c.id}
          assignedLabels={c.labels}
          allLabels={allLabels}
          onUpdate={() => {}}
        />
      </div>
    </div>
  );
}

export function BulkConversationManager({
  conversations,
  allLabels,
  atLimit,
  showArchived,
}: {
  conversations: ConversationItem[];
  allLabels: ConversationLabel[];
  atLimit: boolean;
  showArchived: boolean;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [pending, setPending] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enterSelectMode = useCallback((id: string) => {
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectMode) exitSelectMode();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectMode, exitSelectMode]);

  const doBulkAction = useCallback(
    async (action: "archive" | "unarchive", ids: string[]) => {
      if (ids.length === 0 || pending) return;
      setPending(true);
      try {
        const res = await fetch("/api/conduit/conversations", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids, action }),
        });
        if (res.ok) {
          exitSelectMode();
          router.refresh();
        }
      } finally {
        setPending(false);
      }
    },
    [pending, exitSelectMode, router],
  );

  const handleBulkAction = useCallback(() => {
    doBulkAction(showArchived ? "unarchive" : "archive", Array.from(selectedIds));
  }, [doBulkAction, showArchived, selectedIds]);

  const handleUnarchiveSingle = useCallback(
    (id: string) => {
      doBulkAction("unarchive", [id]);
    },
    [doBulkAction],
  );

  const handleTouchStart = useCallback((id: string) => {
    longPressRef.current = setTimeout(() => enterSelectMode(id), 500);
  }, [enterSelectMode]);

  const handleTouchEnd = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  return (
    <div className="relative">
      <div className="space-y-1">
        {conversations.map((c) => (
          <ConversationRow
            key={c.id}
            c={c}
            atLimit={atLimit}
            allLabels={allLabels}
            selectMode={selectMode}
            isSelected={selectedIds.has(c.id)}
            onToggleSelect={toggleSelect}
            onEnterSelectMode={enterSelectMode}
            onUnarchiveSingle={handleUnarchiveSingle}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        ))}
      </div>

      {/* Floating bulk action bar — appears when in select mode */}
      {selectMode && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-xl z-50 shadow-xl"
          style={{
            background: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          <span className="text-sm text-[var(--color-text-muted)]">
            {selectedIds.size === 0 ? "Right-click a conversation to select" : `${selectedIds.size} selected`}
          </span>
          <button
            type="button"
            onClick={handleBulkAction}
            disabled={selectedIds.size === 0 || pending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {pending ? "Working…" : showArchived ? "Unarchive" : "Archive"}
          </button>
          <button
            type="button"
            onClick={exitSelectMode}
            aria-label="Cancel selection"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-raised)]"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
