"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, CheckSquare, Square, X, ArchiveRestore } from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON } from "@/components/conduit/EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { PinConversationButton } from "@/components/conduit/PinConversationButton";
import { ConversationLabelManager } from "@/components/conduit/ConversationLabels";
import type { ConversationLabel } from "@/components/conduit/ConversationLabels";
import { useToast } from "@/context/ToastContext";

const TEAM = new Set<string>(EMPLOYEE_ORDER);

export type ConversationItem = {
  id: string;
  title: string | null;
  updated_at: string;
  dominant_employee: string | null;
  pinned: boolean;
  archived: boolean;
  labels: ConversationLabel[];
};

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ConversationRow({
  c,
  atLimit,
  allLabels,
  selectMode,
  selected,
  onToggle,
  showArchived,
}: {
  c: ConversationItem;
  atLimit: boolean;
  allLabels: ConversationLabel[];
  selectMode: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
  showArchived: boolean;
}) {
  const dom = c.dominant_employee as string | null;
  const isTeam = dom === "team";
  const empKey = (dom && TEAM.has(dom) ? dom : "jarvis") as EmployeeKey;
  const RecentIcon = EMPLOYEE_ICON[empKey];
  const color = DEPT_COLOR[empKey];

  return (
    <div
      className="group relative flex flex-col gap-1.5 px-4 py-3 rounded-lg conduit-card hover:border-[var(--color-accent)] transition-colors"
      style={selected ? { borderColor: "var(--color-accent)", background: "color-mix(in srgb, var(--color-accent) 5%, var(--color-surface-elevated))" } : undefined}
    >
      <div className="flex items-center gap-3 min-w-0">
        {selectMode && (
          <button
            type="button"
            onClick={() => onToggle(c.id)}
            aria-label={selected ? "Deselect conversation" : "Select conversation"}
            className="shrink-0 transition-colors"
            style={{ color: selected ? "var(--color-accent)" : "var(--color-text-muted)" }}
          >
            {selected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
        )}
        <Link
          href={`/app?c=${c.id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
          onClick={(e) => selectMode && e.preventDefault()}
          onClickCapture={() => selectMode && onToggle(c.id)}
        >
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
          <span className="flex-1 truncate text-sm" style={{ opacity: c.archived ? 0.5 : 1 }}>
            {c.title || "Untitled chat"}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] shrink-0 pr-2">
            {relativeDate(c.updated_at)}
          </span>
        </Link>
        {!selectMode && (
          <div className="shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <PinConversationButton
              conversationId={c.id}
              pinned={c.pinned}
              atLimit={atLimit && !c.pinned}
            />
          </div>
        )}
      </div>
      {!selectMode && (
        <div className="pl-8">
          <ConversationLabelManager
            conversationId={c.id}
            assignedLabels={c.labels}
            allLabels={allLabels}
            onUpdate={() => {}}
          />
        </div>
      )}
    </div>
  );
}

export function ConversationBulkSelect({
  conversations,
  allLabels,
  maxPinned,
}: {
  conversations: ConversationItem[];
  allLabels: ConversationLabel[];
  maxPinned: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visible = showArchived
    ? conversations
    : conversations.filter((c) => !c.archived);

  const pinned = visible.filter((c) => c.pinned && !c.archived);
  const unpinned = visible.filter((c) => !c.pinned && !c.archived);
  const archived = conversations.filter((c) => c.archived);
  const atLimit = pinned.length >= maxPinned;

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allVisible = showArchived
      ? conversations.map((c) => c.id)
      : conversations.filter((c) => !c.archived).map((c) => c.id);
    setSelected(new Set(allVisible));
  }, [conversations, showArchived]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setSelectMode(false);
  }, []);

  const bulkAction = useCallback(
    async (action: "archive" | "unarchive") => {
      if (selected.size === 0) return;
      const ids = Array.from(selected);
      try {
        const res = await fetch("/api/conduit/conversations/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action }),
        });
        if (!res.ok) throw new Error("request_failed");
        const label = action === "archive" ? "archived" : "restored";
        toast.success(`${ids.length} conversation${ids.length !== 1 ? "s" : ""} ${label}.`);
        clearSelection();
        startTransition(() => { router.refresh(); });
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    },
    [selected, clearSelection, router, toast],
  );

  const selectedInArchived = selected.size > 0 &&
    Array.from(selected).every((id) => conversations.find((c) => c.id === id)?.archived);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {!selectMode ? (
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{
                color: "var(--color-text-muted)",
                borderColor: "var(--color-border)",
                background: "transparent",
              }}
            >
              <CheckSquare size={13} />
              Select
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={selectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  color: "var(--color-text-muted)",
                  borderColor: "var(--color-border)",
                  background: "transparent",
                }}
              >
                <CheckSquare size={13} />
                Select all
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  color: "var(--color-text-muted)",
                  borderColor: "var(--color-border)",
                  background: "transparent",
                }}
              >
                <X size={13} />
                Cancel
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {archived.length > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{
                color: showArchived ? "var(--color-accent-hi)" : "var(--color-text-muted)",
                borderColor: showArchived ? "var(--color-accent)" : "var(--color-border)",
                background: showArchived ? "color-mix(in srgb, var(--color-accent) 8%, transparent)" : "transparent",
              }}
            >
              <Archive size={13} />
              {showArchived ? "Hide archived" : `Show archived (${archived.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div
          className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl border"
          style={{
            background: "color-mix(in srgb, var(--color-accent) 6%, var(--color-surface-elevated))",
            borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            {selectedInArchived ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => void bulkAction("unarchive")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  background: "var(--color-accent)",
                  color: "#fff",
                }}
              >
                <ArchiveRestore size={13} />
                Restore
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={() => void bulkAction("archive")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  background: "var(--color-accent)",
                  color: "#fff",
                }}
              >
                <Archive size={13} />
                Archive
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conversations list */}
      {visible.length === 0 && !showArchived && conversations.length === 0 ? null : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: "var(--color-text-muted)" }}>
                  Pinned · {pinned.length}/{maxPinned}
                </span>
              </div>
              <div className="space-y-1">
                {pinned.map((c) => (
                  <ConversationRow
                    key={c.id}
                    c={c}
                    atLimit={atLimit}
                    allLabels={allLabels}
                    selectMode={selectMode}
                    selected={selected.has(c.id)}
                    onToggle={toggleSelect}
                    showArchived={showArchived}
                  />
                ))}
              </div>
            </div>
          )}

          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div className="mb-2">
                  <span className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: "var(--color-text-muted)" }}>
                    Recent
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {unpinned.map((c) => (
                  <ConversationRow
                    key={c.id}
                    c={c}
                    atLimit={atLimit}
                    allLabels={allLabels}
                    selectMode={selectMode}
                    selected={selected.has(c.id)}
                    onToggle={toggleSelect}
                    showArchived={showArchived}
                  />
                ))}
              </div>
            </div>
          )}

          {showArchived && archived.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Archive size={11} style={{ color: "var(--color-text-muted)" }} />
                <span className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: "var(--color-text-muted)" }}>
                  Archived · {archived.length}
                </span>
              </div>
              <div className="space-y-1">
                {archived.map((c) => (
                  <ConversationRow
                    key={c.id}
                    c={c}
                    atLimit={atLimit}
                    allLabels={allLabels}
                    selectMode={selectMode}
                    selected={selected.has(c.id)}
                    onToggle={toggleSelect}
                    showArchived={showArchived}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
