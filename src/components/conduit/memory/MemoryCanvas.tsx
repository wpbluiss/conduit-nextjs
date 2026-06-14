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
import type { MemoryRecord } from "@/lib/ai/memory";
import { Canvas } from "@/components/conduit/pdl/Canvas";
import { Edge } from "@/components/conduit/pdl/Edge";
import { autoLayout } from "./auto-layout";
import { MemoryNode } from "./MemoryNode";
import { MemoryNodeComposer } from "./MemoryNodeComposer";
import { EmptyState, MemoryEmptySVG } from "@/components/conduit/EmptyState";

interface Props {
  initial: MemoryRecord[];
  cap: number;
}

interface ComposerState {
  open: boolean;
  anchor: { x: number; y: number } | null;
  editingId: string | null;
}

const CLOSED: ComposerState = { open: false, anchor: null, editingId: null };

export function MemoryCanvas({ initial, cap }: Props) {
  const [memories, setMemories] = useState<MemoryRecord[]>(initial);
  const [composer, setComposer] = useState<ComposerState>(CLOSED);
  const [freshId, setFreshId] = useState<string | null>(null);

  // Measure the canvas shell so auto-layout has real dimensions.
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 1024, height: 720 });

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      // Fallback for SSR / pre-paint: keep prior values if rect collapses.
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

  // Run auto-layout each render. Deterministic; bounded by tier cap.
  const layout = useMemo(
    () => autoLayout(memories, viewport),
    [memories, viewport],
  );

  // Fresh-id pulse: clear after one render cycle.
  useEffect(() => {
    if (!freshId) return;
    const t = setTimeout(() => setFreshId(null), 700);
    return () => clearTimeout(t);
  }, [freshId]);

  // Canvas click → open composer at the clicked point (in canvas coords).
  const onCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only open composer when clicking the canvas surface itself, not
      // a child node / tooltip / composer.
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

  return (
    <div className="mem-canvas-page">
      <header className="mem-canvas-header">
        <h1 className="mem-canvas-title">What Praxis knows</h1>
        <span className="mem-canvas-count">
          {memories.length} / {cap}
        </span>
      </header>

      <div
        ref={shellRef}
        className="mem-canvas-shell pdl-canvas-grid"
        onClick={onCanvasClick}
      >
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
              className="max-w-sm pointer-events-auto bg-[var(--color-surface-elevated)]/80 backdrop-blur-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
