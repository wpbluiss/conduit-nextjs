"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface EmptyStateProps {
  icon: ReactNode;
  /** Primary prop — preferred over `headline`. */
  title?: string;
  /** Alias for `title` — kept for backward compat with existing callers. */
  headline?: string;
  body: string;
  /** Primary prop — preferred over `cta`. */
  action?: ReactNode;
  /** Alias for `action` — kept for backward compat with existing callers. */
  cta?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, headline, body, action, cta, className = "" }: EmptyStateProps) {
  const reduced = useReducedMotion();
  const label = title ?? headline ?? "";
  const slot = action ?? cta;

  return (
    <motion.div
      className={`flex flex-col items-center text-center px-6 py-10 rounded-2xl cx-glass cx-glass-border ${className}`}
      initial={reduced ? undefined : { opacity: 0, y: 8 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="mb-4"
        style={{ color: "var(--cx-text-muted, #A0A0B0)", opacity: 0.7 }}
      >
        {icon}
      </div>
      <p
        className="cx-type-sm font-medium mb-1.5"
        style={{ color: "var(--cx-text, #F4F4F7)" }}
      >
        {label}
      </p>
      <p
        className="cx-type-xs max-w-[22rem]"
        style={{
          color: "var(--cx-text-muted, #A0A0B0)",
          lineHeight: "var(--cx-lh-body, 1.60)",
        }}
      >
        {body}
      </p>
      {slot && <div className="mt-5">{slot}</div>}
    </motion.div>
  );
}

// --- Inline SVG illustrations ---

export function ChatEmptySVG() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="8" width="36" height="26" rx="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 40 L6 48 L18 42" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="17" cy="21" r="2" fill="currentColor" />
      <circle cx="24" cy="21" r="2" fill="currentColor" />
      <circle cx="31" cy="21" r="2" fill="currentColor" />
      <rect x="30" y="20" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M44 36 L47 43 L35 38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="33" y1="25" x2="43" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="33" y1="29" x2="40" y2="29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ArtifactsEmptySVG() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="6" width="28" height="36" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 6 L38 14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 6 L30 14 L38 14" stroke="currentColor" strokeWidth="1.5" />
      <line x1="15" y1="20" x2="33" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="26" x2="33" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="32" x2="26" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="28" y="32" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <line x1="31" y1="37" x2="43" y2="37" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="31" y1="41" x2="39" y2="41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MemoryEmptySVG() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central node */}
      <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      {/* Satellite nodes */}
      <circle cx="10" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="46" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="40" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="46" cy="40" r="4" stroke="currentColor" strokeWidth="1.5" />
      {/* Edges */}
      <line x1="14" y1="19" x2="23" y2="24" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="42" y1="19" x2="33" y2="24" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="14" y1="37" x2="23" y2="32" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="42" y1="37" x2="33" y2="32" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}

export function OutputsEmptySVG() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bookmark shape */}
      <path d="M14 8 L42 8 L42 48 L28 38 L14 48 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Lines suggesting content */}
      <line x1="20" y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="30" x2="30" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ConversationsEmptySVG() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Primary bubble */}
      <rect x="6" y="10" width="32" height="22" rx="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 32 L8 42 L20 36" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      <circle cx="16" cy="21" r="2" fill="currentColor" />
      <circle cx="22" cy="21" r="2" fill="currentColor" />
      <circle cx="28" cy="21" r="2" fill="currentColor" />
      {/* Secondary bubble */}
      <rect x="24" y="26" width="26" height="16" rx="6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="30" y1="32" x2="44" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="36" x2="40" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ActivityEmptySVG() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Activity pulse line */}
      <polyline
        points="4,24 12,24 16,12 20,36 24,18 28,30 32,24 44,24"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NotificationsEmptySVG() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bell shape */}
      <path d="M24 6 C18 6 12 12 12 20 L12 30 L8 34 L40 34 L36 30 L36 20 C36 12 30 6 24 6 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Clapper */}
      <path d="M20 34 C20 36.2 21.8 38 24 38 C26.2 38 28 36.2 28 34" stroke="currentColor" strokeWidth="1.5" />
      {/* Silent indicator — small dash */}
      <line x1="38" y1="8" x2="42" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
