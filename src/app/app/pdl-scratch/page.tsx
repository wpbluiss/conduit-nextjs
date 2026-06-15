/**
 * R18 Slice 0 — pdl gallery verification surface.
 *
 * Visit: http://localhost:3000/app/pdl-scratch
 *
 * Renders every Slice 0 primitive + the 10 brand marks against both
 * themes (toggle via Settings → Profile → Theme). Lives at a stable
 * URL so the foundations can be sanity-checked before Slice 1 (Memory
 * canvas) consumes them.
 *
 * No surface in the live app consumes pdl primitives yet — this is
 * the only surface where they render. Existing routes are unchanged.
 */

"use client";

import { useState } from "react";
import { BRAND_MARKS, BRAND_LABELS, type BrandKind } from "@/components/conduit/brand-marks";
import { BrandChip } from "@/components/conduit/pdl/BrandChip";
import { DeptIcon } from "@/components/conduit/pdl/DeptIcon";
import { Avatar } from "@/components/conduit/pdl/Avatar";
import { HoverReveal } from "@/components/conduit/pdl/HoverReveal";
import { Tooltip } from "@/components/conduit/pdl/Tooltip";
import { Popover } from "@/components/conduit/pdl/Popover";
import { Drawer } from "@/components/conduit/pdl/Drawer";
import { Modal } from "@/components/conduit/pdl/Modal";
import { Canvas } from "@/components/conduit/pdl/Canvas";
import { Node } from "@/components/conduit/pdl/Node";
import { Edge } from "@/components/conduit/pdl/Edge";
import { PillTabBar } from "@/components/conduit/pdl/PillTabBar";
import { Composer } from "@/components/conduit/pdl/Composer";
import { EMPLOYEE_ORDER, EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";

export default function PdlScratchPage() {
  const [tab, setTab] = useState<"all" | "primitives" | "canvas">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [composerValue, setComposerValue] = useState("");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--pdl-canvas)",
        color: "var(--pdl-text)",
        padding: "var(--pdl-space-2xl)",
        fontFamily: "var(--font-sans, system-ui)",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--pdl-space-2xl)" }}>
        {/* Page header */}
        <header style={{ display: "flex", flexDirection: "column", gap: "var(--pdl-space-sm)" }}>
          <p style={{
            fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "var(--pdl-text-muted)", margin: 0,
          }}>
            Praxis Design Language · Slice 0 verification
          </p>
          <h1 style={{
            fontFamily: "var(--font-serif, serif)",
            fontSize: 32, lineHeight: 1.1, color: "var(--pdl-text)", margin: 0,
          }}>
            pdl gallery
          </h1>
          <p style={{ color: "var(--pdl-text-muted)", fontSize: 14, margin: 0 }}>
            Toggle light/dark via Settings → Profile → Theme. Hover the cards to
            see hover-reveal + glassmorphic tooltips.
          </p>
        </header>

        {/* Pill tab bar (using PillTabBar primitive itself) */}
        <PillTabBar
          tabs={[
            { id: "all", label: "All" },
            { id: "primitives", label: "Primitives" },
            { id: "canvas", label: "Canvas" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {(tab === "all" || tab === "primitives") && (
          <>
            {/* Brand marks gallery */}
            <Section title="Top-10 brand marks">
              <p style={{ color: "var(--pdl-text-muted)", fontSize: 12, marginBottom: 16 }}>
                Simplified placeholder marks (swap to licensed/official assets
                before public release). Each renders inside a circular surface chip.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--pdl-space-md)" }}>
                {(Object.keys(BRAND_MARKS) as BrandKind[]).map((kind) => (
                  <div key={kind} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <BrandChip kind={kind} size="lg" />
                    <span style={{ fontSize: 11, color: "var(--pdl-text-muted)" }}>
                      {BRAND_LABELS[kind]}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Dept avatars */}
            <Section title="Employee avatars (DeptIcon)">
              <p style={{ color: "var(--pdl-text-muted)", fontSize: 12, marginBottom: 16 }}>
                Semantic Lucide icons — never letter-initials. Dept identity comes
                through icon shape, not color.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--pdl-space-md)" }}>
                {EMPLOYEE_ORDER.map((emp) => (
                  <div key={emp} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <Avatar variant="employee" employee={emp} size="lg" />
                    <span style={{ fontSize: 11, color: "var(--pdl-text-muted)" }}>
                      {EMPLOYEES[emp].name}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Hover-reveal */}
            <Section title="HoverReveal">
              <p style={{ color: "var(--pdl-text-muted)", fontSize: 12, marginBottom: 16 }}>
                Hover any card; affordances fade in with glassmorphic surface.
              </p>
              <div style={{ display: "flex", gap: "var(--pdl-space-md)" }}>
                {(["github", "gmail", "stripe"] as BrandKind[]).map((kind) => (
                  <div
                    key={kind}
                    style={{
                      position: "relative",
                      width: 200,
                      padding: "var(--pdl-space-md)",
                      background: "var(--pdl-surface)",
                      border: "1px solid var(--pdl-border-default)",
                      borderRadius: "var(--pdl-radius-soft)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--pdl-space-md)",
                    }}
                  >
                    <BrandChip kind={kind} size="md" />
                    <span style={{ fontSize: 14, color: "var(--pdl-text)" }}>
                      {BRAND_LABELS[kind]}
                    </span>
                    <HoverReveal style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
                      <button
                        type="button"
                        style={{
                          padding: "4px 10px",
                          background: "var(--pdl-surface-glass)",
                          backdropFilter: "var(--cx-glass-blur, blur(20px) saturate(140%))",
                          border: "1px solid var(--pdl-border-hairline)",
                          borderRadius: "var(--pdl-radius-round)",
                          color: "var(--pdl-text)",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Connect
                      </button>
                    </HoverReveal>
                  </div>
                ))}
              </div>
            </Section>

            {/* Tooltip + Popover */}
            <Section title="Tooltip + Popover (glassmorphic)">
              <div style={{ display: "flex", gap: "var(--pdl-space-lg)", alignItems: "center" }}>
                <Tooltip
                  trigger={
                    <button
                      type="button"
                      style={{
                        padding: "8px 16px",
                        background: "var(--pdl-accent)",
                        color: "white",
                        border: 0,
                        borderRadius: "var(--pdl-radius-default)",
                        cursor: "pointer",
                      }}
                    >
                      Hover me (tooltip)
                    </button>
                  }
                  side="top"
                >
                  Glassmorphic tooltip with hairline border + soft shadow.
                </Tooltip>
                <Popover
                  trigger={
                    <button
                      type="button"
                      style={{
                        padding: "8px 16px",
                        background: "var(--pdl-surface)",
                        border: "1px solid var(--pdl-border-default)",
                        borderRadius: "var(--pdl-radius-default)",
                        color: "var(--pdl-text)",
                        cursor: "pointer",
                      }}
                    >
                      Click me (popover)
                    </button>
                  }
                  side="bottom"
                  align="start"
                >
                  {(close) => (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 14 }}>
                        Popover surface — click outside or press Escape to close.
                      </p>
                      <button
                        type="button"
                        onClick={close}
                        style={{
                          alignSelf: "flex-start",
                          padding: "4px 10px",
                          background: "var(--pdl-accent)",
                          color: "white",
                          border: 0,
                          borderRadius: "var(--pdl-radius-default)",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </Popover>
              </div>
            </Section>

            {/* Drawer + Modal */}
            <Section title="Drawer + Modal">
              <div style={{ display: "flex", gap: "var(--pdl-space-md)" }}>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  style={{
                    padding: "8px 16px",
                    background: "var(--pdl-surface)",
                    border: "1px solid var(--pdl-border-default)",
                    borderRadius: "var(--pdl-radius-default)",
                    color: "var(--pdl-text)",
                    cursor: "pointer",
                  }}
                >
                  Open drawer
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  style={{
                    padding: "8px 16px",
                    background: "var(--pdl-surface)",
                    border: "1px solid var(--pdl-border-default)",
                    borderRadius: "var(--pdl-radius-default)",
                    color: "var(--pdl-text)",
                    cursor: "pointer",
                  }}
                >
                  Open modal
                </button>
              </div>
            </Section>

            {/* Composer */}
            <Section title="Composer (glassmorphic input shell)">
              <Composer
                value={composerValue}
                onChange={setComposerValue}
                placeholder="Write a memory in Fraunces italic…"
                footer={
                  <>
                    <span style={{ fontSize: 11, color: "var(--pdl-text-muted)" }}>
                      ⌘+Enter to save
                    </span>
                    <button
                      type="button"
                      style={{
                        padding: "6px 14px",
                        background: "var(--pdl-accent)",
                        color: "white",
                        border: 0,
                        borderRadius: "var(--pdl-radius-default)",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Save
                    </button>
                  </>
                }
              />
            </Section>
          </>
        )}

        {(tab === "all" || tab === "canvas") && (
          <Section title="Canvas + Node + Edge (Memory canvas preview)">
            <p style={{ color: "var(--pdl-text-muted)", fontSize: 12, marginBottom: 16 }}>
              Dotted-grid canvas with 7 nodes in a cluster + 1 edge demo. The
              Memory canvas (Slice 1) will consume these primitives.
            </p>
            <div style={{ height: 420, border: "1px solid var(--pdl-border-hairline)", borderRadius: "var(--pdl-radius-soft)", overflow: "hidden" }}>
              <Canvas>
                <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  <Edge from={{ x: 400, y: 210 }} to={{ x: 240, y: 120 }} dashed tone="var(--pdl-accent)" />
                  <Edge from={{ x: 400, y: 210 }} to={{ x: 560, y: 120 }} dashed tone="var(--pdl-accent)" />
                  <Edge from={{ x: 400, y: 210 }} to={{ x: 240, y: 300 }} dashed tone="var(--pdl-accent)" />
                  <Edge from={{ x: 400, y: 210 }} to={{ x: 560, y: 300 }} dashed tone="var(--pdl-accent)" />
                </svg>
                <Node position={{ x: 400, y: 210 }} size={56} tone="var(--pdl-accent)" ariaLabel="Center node">
                  <span style={{ fontSize: 10, color: "var(--pdl-text-muted)" }}>Global</span>
                </Node>
                {(["marketing", "sales", "engineering", "finance"] as EmployeeId[]).map((emp, i) => {
                  const angle = (i / 4) * Math.PI * 2;
                  const x = 400 + Math.cos(angle) * 160;
                  const y = 210 + Math.sin(angle) * 90;
                  return (
                    <Node
                      key={emp}
                      position={{ x, y }}
                      size={48}
                      tone={EMPLOYEES[emp].color}
                      ariaLabel={EMPLOYEES[emp].name}
                    >
                      <DeptIcon employee={emp} size={20} />
                    </Node>
                  );
                })}
              </Canvas>
            </div>
          </Section>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Connect GitHub"
        description="Paste a Personal Access Token. We encrypt at rest and never show it back."
      >
        <p style={{ color: "var(--pdl-text-muted)", fontSize: 13 }}>
          (Drawer body content goes here. Token paste form lands with R17 Slice 2.)
        </p>
      </Drawer>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Disconnect this connector?"
        description="Your stored token will be destroyed and Engineering will lose access."
      >
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: 0,
              color: "var(--pdl-text-muted)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            style={{
              padding: "8px 16px",
              background: "var(--pdl-accent)",
              color: "white",
              border: 0,
              borderRadius: "var(--pdl-radius-default)",
              cursor: "pointer",
            }}
          >
            Disconnect
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--pdl-space-md)",
        padding: "var(--pdl-space-lg)",
        background: "var(--pdl-surface)",
        border: "1px solid var(--pdl-border-hairline)",
        borderRadius: "var(--pdl-radius-soft)",
      }}
    >
      <h2 style={{
        fontFamily: "var(--font-serif, serif)",
        fontSize: 18, lineHeight: 1.2, color: "var(--pdl-text)", margin: 0,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
