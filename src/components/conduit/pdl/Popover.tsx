"use client";

// pdl — Popover
// Contract: specs/praxis-design-language/contracts/foundations.md §2.6
//
// Glassmorphic click-triggered surface. Dismisses on outside-click or
// Escape. Positioned absolutely via React Portal.

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
type Align = "start" | "center" | "end";

interface Props {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  side?: Side;
  align?: Align;
  className?: string;
}

const OFFSET = 8;

export function Popover({
  trigger,
  children,
  side = "bottom",
  align = "center",
  className,
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  const computeAnchor = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    setAnchor(el.getBoundingClientRect());
  }, []);

  const toggle = useCallback(() => {
    if (!open) computeAnchor();
    setOpen((v) => !v);
  }, [open, computeAnchor]);

  // Outside-click + Escape close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Reposition on scroll/resize while open
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

  let style: React.CSSProperties = { position: "fixed" };
  if (anchor) {
    switch (side) {
      case "bottom":
        style.top = anchor.top + anchor.height + OFFSET;
        style.left =
          align === "start"
            ? anchor.left
            : align === "end"
              ? anchor.right
              : anchor.left + anchor.width / 2;
        style.transform =
          align === "start"
            ? "translate(0, 0)"
            : align === "end"
              ? "translate(-100%, 0)"
              : "translate(-50%, 0)";
        break;
      case "top":
        style.top = anchor.top - OFFSET;
        style.left =
          align === "start"
            ? anchor.left
            : align === "end"
              ? anchor.right
              : anchor.left + anchor.width / 2;
        style.transform =
          align === "start"
            ? "translate(0, -100%)"
            : align === "end"
              ? "translate(-100%, -100%)"
              : "translate(-50%, -100%)";
        break;
      case "left":
        style.top = anchor.top + anchor.height / 2;
        style.left = anchor.left - OFFSET;
        style.transform = "translate(-100%, -50%)";
        break;
      case "right":
        style.top = anchor.top + anchor.height / 2;
        style.left = anchor.right + OFFSET;
        style.transform = "translate(0, -50%)";
        break;
    }
  }

  return (
    <>
      <span ref={triggerRef} onClick={toggle} aria-expanded={open} aria-controls={open ? id : undefined}>
        {trigger}
      </span>
      {open &&
        mounted &&
        anchor &&
        createPortal(
          <div
            ref={popRef}
            id={id}
            role="dialog"
            className={`praxis-root pdl-popover pdl-glass${className ? ` ${className}` : ""}`}
            style={style}
          >
            {typeof children === "function" ? children(close) : children}
          </div>,
          document.body,
        )}
    </>
  );
}
