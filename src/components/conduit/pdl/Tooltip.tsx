"use client";

// pdl — Tooltip
// Contract: specs/praxis-design-language/contracts/foundations.md §2.5
//
// Glassmorphic floating tooltip. Hover-triggered with 200ms delay;
// dismisses on mouseleave. Positioned absolutely via React Portal so
// the tooltip can escape the trigger's overflow ancestor.

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Side = "top" | "right" | "bottom" | "left";

interface Props {
  trigger: ReactNode;
  children: ReactNode;
  side?: Side;
  /** Allow the tooltip itself to receive pointer events (for actions inside). */
  interactive?: boolean;
  maxWidth?: number;
  /** Open delay in ms; default 200. */
  delay?: number;
  className?: string;
}

interface Anchor {
  top: number;
  left: number;
  width: number;
  height: number;
}

const OFFSET = 8;

export function Tooltip({
  trigger,
  children,
  side = "top",
  interactive,
  maxWidth = 280,
  delay = 200,
  className,
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [mounted, setMounted] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => setMounted(true), []);

  const computeAnchor = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setAnchor({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  const onMouseEnter = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      computeAnchor();
      setOpen(true);
    }, delay);
  }, [computeAnchor, delay]);

  const onMouseLeave = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    // Small grace period for moving into the tooltip when interactive.
    openTimer.current = setTimeout(() => setOpen(false), interactive ? 120 : 0);
  }, [interactive]);

  const cancelClose = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
  }, []);

  // Reposition on scroll/resize while open.
  useEffect(() => {
    if (!open) return;
    const onUpdate = () => computeAnchor();
    window.addEventListener("scroll", onUpdate, true);
    window.addEventListener("resize", onUpdate);
    return () => {
      window.removeEventListener("scroll", onUpdate, true);
      window.removeEventListener("resize", onUpdate);
    };
  }, [open, computeAnchor]);

  let style: React.CSSProperties = { position: "fixed", maxWidth };
  if (anchor) {
    switch (side) {
      case "top":
        style.top = anchor.top - OFFSET;
        style.left = anchor.left + anchor.width / 2;
        style.transform = "translate(-50%, -100%)";
        break;
      case "bottom":
        style.top = anchor.top + anchor.height + OFFSET;
        style.left = anchor.left + anchor.width / 2;
        style.transform = "translate(-50%, 0)";
        break;
      case "left":
        style.top = anchor.top + anchor.height / 2;
        style.left = anchor.left - OFFSET;
        style.transform = "translate(-100%, -50%)";
        break;
      case "right":
        style.top = anchor.top + anchor.height / 2;
        style.left = anchor.left + anchor.width + OFFSET;
        style.transform = "translate(0, -50%)";
        break;
    }
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onMouseEnter}
        onBlur={onMouseLeave}
        aria-describedby={open ? id : undefined}
      >
        {trigger}
      </span>
      {open &&
        mounted &&
        anchor &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className={`praxis-root pdl-tooltip pdl-glass${className ? ` ${className}` : ""}`}
            data-interactive={interactive || undefined}
            style={style}
            onMouseEnter={interactive ? cancelClose : undefined}
            onMouseLeave={interactive ? onMouseLeave : undefined}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
