"use client";

// R18 Slice 1 — MemoryCanvas
//
// Top-level orchestrator for /app/memory. Replaces the R17 dossier
// (MemoryDesk + sections + cards) with a node-graph on a dotted-grid
// canvas. Reuses the VALIDATED pdl Canvas + Node + Edge primitives
// from the /app/pdl-scratch preview Luis approved.
//
// State held client-side: memories[], composer open/anchor/editing,
// freshly-added id (for mount pulse). Auto-layout runs every render
// (deterministic + cheap; bounded by tier memory cap).
//
// Contract: specs/praxis-design-language/contracts/memory-canvas.md §3

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Search, X } from "lucide-react";
import { PraxisButton } from "@/components/conduit/ui/Button";
import type { MemoryRecord, MemoryKind } from "@/lib/ai/memory";
import { Canvas } from "@/components/conduit/pdl/Canvas";
import { Edge } from "@/components/conduit/pdl/Edge";
import { autoLayout } from "./auto-layout";
import { MemoryNode } from "./MemoryNode";
import { MemoryNodeComposer } from "./MemoryNodeComposer";
import { EmptyState, MemoryEmptySVG } from "@/components/conduit/EmptyState";
import { EMPLOYEES, EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";

const ALL_KINDS: MemoryKind[] = ["fact", "preference", "decision", "goal", "context"];
const KIND_LABEL: Record<MemoryKind, string> = {
  fact: "Fact",
  preference: "Preference",
  decision: "Decision",
  goal: "Goal",
  context: "Context",
};

interface Props {
  initial: MemoryRecord[];
  cap: number;
  initialQ?: string;
  initialDept?: string;
  initialKinds?: string[];
}

interface ComposerState {
  open: boolean;
  anchor: { x: number; y: number } | null;
  editingId: string | null;
}

const CLOSED: ComposerState = { open: false, anchor: null, editingId: null };

export function MemoryCanvas({ initial, cap, initialQ = "", initialDept = "all", initialKinds = [] }: Props) {
  const [memories, setMemories] = useState<MemoryRecord[]>(initial);
  const [composer, setComposer] = useState<ComposerState>(CLOSED);
  const [freshId, setFreshId] = useState<string | null>(null);
  const router = useRouter();

  // Filter state
  const [query, setQuery] = useState(initialQ);
  const [deptFilter, setDeptFilter] = useState(initialDept);
  const [kindFilter, setKindFilter] = useState<Set<MemoryKind>>(
    () => new Set(initialKinds.filter((k): k is MemoryKind => ALL_KINDS.includes(k as MemoryKind))),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncUrl = useCallback(
    (q: string, dept: string, kinds: Set<MemoryKind>) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (dept !== "all") params.set("dept", dept);
      if (kinds.size > 0) params.set("kind", [...kinds].join(","));
      const search = params.toString();
      router.replace(`/app/memory${search ? `?${search}` : ""}`, { scroll: false });
    },
    [router],
  );

  const handleQueryChange = useCallback(
    (val: string) => {
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => syncUrl(val, deptFilter, kindFilter), 100);
    },
    [deptFilter, kindFilter, syncUrl],
  );

  const handleDeptChange = useCallback(
    (dept: string) => {
      setDeptFilter(dept);
      syncUrl(query, dept, kindFilter);
    },
    [query, kindFilter, syncUrl],
  );

  const handleKindToggle = useCallback(
    (kind: MemoryKind) => {
      setKindFilter((prev) => {
        const next = new Set(prev);
        if (next.has(kind)) next.delete(kind);
        else next.add(kind);
        syncUrl(query, deptFilter, next);
        return next;
      });
    },
    [query, deptFilter, syncUrl],
  );

  const clearFilters = useCallback(() => {
    setQuery("");
    setDeptFilter("all");
    setKindFilter(new Set());
    router.replace("/app/memory", { scroll: false });
  }, [router]);

  const hasFilters = query.trim() !== "" || deptFilter !== "all" || kindFilter.size > 0;

  const [exportingMemories, setExportingMemories] = useState(false);
  const exportMemories = useCallback(() => {
    if (exportingMemories || memories.length === 0) return;
    setExportingMemories(true);
    try {
      const rows = memories.map(({ kind, scope, content, tags, created_at }) => ({
        kind,
        dept: scope.length > 0 ? scope[0] : "global",
        content,
        tags,
        created_at,
      }));
      const json = JSON.stringify(rows, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `praxis-memory-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExportingMemories(false);
    }
  }, [memories, exportingMemories]);

  // Compute matching IDs for dimming
  const matchingIds = useMemo<Set<string> | null>(() => {
    if (!hasFilters) return null;
    const q = query.trim().toLowerCase();
    return new Set(
      memories
        .filter((m) => {
          if (q) {
            const matches =
              m.content.toLowerCase().includes(q) ||
              m.tags.some((t) => t.toLowerCase().includes(q));
            if (!matches) return false;
          }
          if (deptFilter !== "all") {
            const isGlobal = m.scope.length === 0;
            const inScope = m.scope.includes(deptFilter as EmployeeId);
            if (!isGlobal && !inScope) return false;
          }
          if (kindFilter.size > 0 && !kindFilter.has(m.kind)) return false;
          return true;
        })
        .map((m) => m.id),
    );
  }, [memories, query, deptFilter, kindFilter, hasFilters]);

  // Measure the canvas shell so auto-layout has real dimensions.
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 1024, height: 720 });

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewport({ width: rect.width, height: rect.height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const layout = useMemo(
    () => autoLayout(memories, viewport),
    [memories, viewport],
  );

  useEffect(() => {
    if (!freshId) return;
    const t = setTimeout(() => setFreshId(null), 700);
    return () => clearTimeout(t);
  }, [freshId]);

  const onCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setComposer({ open: true, anchor: { x, y }, editingId: null });
    },
    [],
  );

  const closeComposer = useCallback(() => setComposer(CLOSED), []);

  const onPatched = useCallback(
    (next: Partial<MemoryRecord> & { id: string }) => {
      setMemories((prev) =>
        prev.map((m) => (m.id === next.id ? { ...m, ...next } : m)),
      );
    },
    [],
  );

  const onArchived = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const onComposerSubmit = useCallback(
    (memory: MemoryRecord) => {
      const editing = !!composer.editingId;
      if (editing) {
        setMemories((prev) =>
          prev.map((m) => (m.id === memory.id ? memory : m)),
        );
      } else {
        setMemories((prev) => [memory, ...prev]);
        setFreshId(memory.id);
      }
      setComposer(CLOSED);
    },
    [composer.editingId],
  );

  const onNodeEdit = useCallback(
    (id: string, position: { x: number; y: number }) => {
      setComposer({ open: true, anchor: position, editingId: id });
    },
    [],
  );

  const editingMemory = composer.editingId
    ? memories.find((m) => m.id === composer.editingId)
    : undefined;

  const searchQuery = query.trim();

  return (
    <div className="mem-canvas-page">
      {/* Filter toolbar */}
      <div
        className="cx-glass relative z-20 border-b border-[var(--cx-glass-border,rgba(255,255,255,0.08))]"
      >
        {/* Search row */}
        <div className="flex items-center gap-2 px-4 py-2">
          <div
            className="flex items-center gap-2 flex-1 max-w-sm rounded-lg px-3 py-1.5"
            style={{
              background: "var(--pdl-canvas, var(--color-surface))",
              border: "1px solid var(--pdl-border-hairline, var(--color-border))",
            }}
          >
            <Search size={13} strokeWidth={1.75} style={{ color: "var(--pdl-text-muted, var(--color-text-muted))", flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search memories…"
              aria-label="Search memories"
              className="flex-1 bg-transparent outline-none cx-type-sm placeholder:text-[var(--pdl-text-muted,var(--color-text-muted))]"
              style={{ color: "var(--pdl-text, var(--color-text))", minWidth: 0 }}
            />
            {query && (
              <PraxisButton
                variant="ghost"
                size="icon-sm"
                onClick={() => handleQueryChange("")}
                aria-label="Clear search"
                className="shrink-0"
              >
                <X size={12} />
              </PraxisButton>
            )}
          </div>
          {hasFilters && (
            <PraxisButton
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear
            </PraxisButton>
          )}
          {memories.length > 0 && (
            <PraxisButton
              variant="ghost"
              size="sm"
              onClick={exportMemories}
              disabled={exportingMemories}
              title={`Export all ${memories.length} memories as JSON`}
              aria-label="Export memories as JSON"
              className="ml-auto shrink-0"
            >
              <Download size={12} strokeWidth={1.75} />
              <span className="hidden sm:inline">Export</span>
            </PraxisButton>
          )}
        </div>

        {/* Dept + Kind chips row */}
        <div
          className="flex items-center gap-1.5 px-4 pb-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Dept chips */}
          <button
            type="button"
            onClick={() => handleDeptChange("all")}
            className="shrink-0 cx-type-xs uppercase tracking-[0.12em] px-2.5 py-1 rounded-full transition-colors"
            style={{
              background: deptFilter === "all"
                ? "color-mix(in srgb, var(--pdl-accent, var(--color-accent)) 15%, transparent)"
                : "var(--pdl-surface, var(--color-surface))",
              border: deptFilter === "all"
                ? "1px solid color-mix(in srgb, var(--pdl-accent, var(--color-accent)) 40%, transparent)"
                : "1px solid var(--pdl-border-hairline, var(--color-border))",
              color: deptFilter === "all"
                ? "var(--pdl-accent, var(--color-accent))"
                : "var(--pdl-text-muted, var(--color-text-muted))",
              fontWeight: deptFilter === "all" ? 600 : 400,
            }}
          >
            All
          </button>
          {(EMPLOYEE_ORDER as EmployeeId[]).map((empId) => {
            const emp = EMPLOYEES[empId];
            const active = deptFilter === empId;
            return (
              <button
                key={empId}
                type="button"
                onClick={() => handleDeptChange(active ? "all" : empId)}
                className="shrink-0 cx-type-xs uppercase tracking-[0.12em] px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: active
                    ? `color-mix(in srgb, ${emp.color} 15%, transparent)`
                    : "var(--pdl-surface, var(--color-surface))",
                  border: active
                    ? `1px solid color-mix(in srgb, ${emp.color} 40%, transparent)`
                    : "1px solid var(--pdl-border-hairline, var(--color-border))",
                  color: active ? emp.color : "var(--pdl-text-muted, var(--color-text-muted))",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {emp.name}
              </button>
            );
          })}

          {/* Divider */}
          <span
            className="shrink-0 w-px h-4 mx-1"
            style={{ background: "var(--pdl-border-hairline, var(--color-border))" }}
            aria-hidden
          />

          {/* Kind pills */}
          {ALL_KINDS.map((kind) => {
            const active = kindFilter.has(kind);
            return (
              <button
                key={kind}
                type="button"
                onClick={() => handleKindToggle(kind)}
                className="shrink-0 cx-type-xs uppercase tracking-[0.12em] px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: active
                    ? "color-mix(in srgb, var(--pdl-accent, var(--color-accent)) 12%, transparent)"
                    : "transparent",
                  border: active
                    ? "1px solid color-mix(in srgb, var(--pdl-accent, var(--color-accent)) 35%, transparent)"
                    : "1px solid var(--pdl-border-hairline, var(--color-border))",
                  color: active
                    ? "var(--pdl-accent, var(--color-accent))"
                    : "var(--pdl-text-muted, var(--color-text-muted))",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {KIND_LABEL[kind]}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={shellRef}
        className="mem-canvas-shell pdl-canvas-grid"
        onClick={onCanvasClick}
      >
        <header className="mem-canvas-header">
          <h1 className="mem-canvas-title">What Praxis knows</h1>
          <span className="mem-canvas-count">
            {matchingIds !== null ? `${matchingIds.size} / ${memories.length}` : `${memories.length} / ${cap}`}
          </span>
        </header>

        {/* Edges layer — non-interactive SVG overlay */}
        <svg
          className="mem-edge-layer"
          width={viewport.width}
          height={viewport.height}
        >
          {layout.edges.map((e, i) => (
            <Edge
              key={i}
              from={{ x: e.fromX, y: e.fromY }}
              to={{ x: e.toX, y: e.toY }}
              dashed={e.isInter}
            />
          ))}
        </svg>

        {/* Nodes layer */}
        {layout.nodes.map((n) => (
          <MemoryNode
            key={n.id}
            memory={n}
            position={{ x: n.layoutX, y: n.layoutY }}
            fresh={n.id === freshId}
            dimmed={matchingIds !== null && !matchingIds.has(n.id)}
            searchQuery={searchQuery}
            onPatched={onPatched}
            onArchived={onArchived}
            onEdit={() => onNodeEdit(n.id, { x: n.layoutX, y: n.layoutY })}
          />
        ))}

        {/* Composer — ADD or EDIT mode */}
        {composer.open && composer.anchor && (
          <MemoryNodeComposer
            anchor={composer.anchor}
            onClose={closeComposer}
            onSubmit={onComposerSubmit}
            existingMemory={editingMemory}
          />
        )}

        {/* Empty canvas hint */}
        {memories.length === 0 && !composer.open && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <EmptyState
              icon={<MemoryEmptySVG />}
              headline="Praxis learns as you work"
              body="Memory nodes appear here as your specialists accumulate context about your business — goals, preferences, and decisions. Click anywhere on the canvas to add a node manually."
              className="max-w-sm pointer-events-auto cx-glass cx-glass-border"
            />
          </div>
        )}
      </div>
    </div>
  );
}
