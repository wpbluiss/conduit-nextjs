"use client";

// pdl — Drawer
// Contract: specs/praxis-design-language/contracts/foundations.md §2.7
//
// Glassmorphic right-slide drawer (desktop) / bottom-sheet (mobile).
// Used for sensitive flows like PAT-paste (R17 Slice 2). Dismisses on
// outside-click + Escape.

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
  /** Desktop side; ignored on mobile (always bottom). */
  side?: "right";
  className?: string;
}

export function Drawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    // Lock body scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="praxis-root">
      <div
        className="pdl-scrim"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        ref={dialogRef}
        className={`pdl-drawer pdl-glass${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
      >
        {(title || description) && (
          <header
            style={{
              padding: "var(--pdl-space-lg)",
              borderBottom: "1px solid var(--pdl-border-hairline)",
            }}
          >
            {title && (
              <h2
                id={titleId}
                style={{
                  fontFamily: "var(--font-serif, serif)",
                  fontSize: 20,
                  lineHeight: 1.2,
                  color: "var(--pdl-text)",
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id={descId}
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: "var(--pdl-text-muted)",
                  lineHeight: 1.45,
                }}
              >
                {description}
              </p>
            )}
          </header>
        )}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--pdl-space-lg)",
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
