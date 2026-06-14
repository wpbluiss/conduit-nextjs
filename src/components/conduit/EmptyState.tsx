import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  headline: string;
  body: string;
  cta?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, headline, body, cta, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center text-center px-6 py-10 rounded-2xl border border-dashed border-[var(--color-border)] ${className}`}
    >
      <div className="mb-4 text-[var(--color-text-muted)] opacity-60">{icon}</div>
      <p className="text-sm font-medium text-[var(--color-text)] mb-1">{headline}</p>
      <p className="text-xs text-[var(--color-text-muted)] max-w-[22rem]">{body}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </div>
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
