"use client";

// pdl — Modal
// Contract: specs/praxis-design-language/contracts/foundations.md §2.8
//
// Glassmorphic centered dialog. Reserved for true confirm-or-cancel
// moments (destructive actions, sign-out). For most "this is a form"
// flows, prefer Drawer or Popover.

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Modal({
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
        className={`pdl-modal pdl-glass${className ? ` ${className}` : ""}`}
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
                  fontFamily: "var(--font-sans, system-ui, sans-serif)",
                  fontSize: "var(--cx-type-lg)",
                  lineHeight: "var(--cx-lh-heading)",
                  letterSpacing: "var(--cx-ls-tight)",
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
                  fontSize: "var(--cx-type-sm)",
                  color: "var(--pdl-text-muted)",
                  lineHeight: "var(--cx-lh-body)",
                }}
              >
                {description}
              </p>
            )}
          </header>
        )}
        <div style={{ padding: "var(--pdl-space-lg)" }}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
