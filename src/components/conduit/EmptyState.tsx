"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface EmptyStateProps {
  icon: ReactNode;
  headline: string;
  body: string;
  cta?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, headline, body, cta, className = "" }: EmptyStateProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={`flex flex-col items-center text-center px-6 py-10 rounded-2xl ${className}`}
      style={{
        background: "var(--cx-glass-bg, rgba(255,255,255,0.04))",
        border: "1px solid var(--cx-glass-border, rgba(255,255,255,0.08))",
        backdropFilter: "var(--cx-glass-blur, blur(20px) saturate(140%))",
        WebkitBackdropFilter: "var(--cx-glass-blur, blur(20px) saturate(140%))",
        boxShadow: "var(--cx-glass-highlight, inset 0 1px 0 rgba(255,255,255,0.10))",
      }}
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
        {headline}
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
      {cta && <div className="mt-5">{cta}</div>}
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
