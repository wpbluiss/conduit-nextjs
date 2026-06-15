"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Props {
  code: string;
  /** Forwarded to the outer element for Tailwind overrides. */
  className?: string;
  /** Show line numbers (hidden ≤640 px by default). */
  showLineNumbers?: boolean;
}

interface LineInfo {
  text: string;
  /** Indent depth — used to keep fold arrow aligned. */
  depth: number;
  /** Index of the line that closes this fold block, inclusive. */
  foldEnd: number | null;
}

const OPENERS = new Set(["{", "[", "("]);
const CLOSERS: Record<string, string> = { "}": "{", "]": "[", ")": "(" };

/** Scan lines and return per-line metadata including foldEnd. */
function buildLineInfo(lines: string[]): LineInfo[] {
  const info: LineInfo[] = lines.map((text) => ({
    text,
    depth: text.match(/^\s*/)?.[0].length ?? 0,
    foldEnd: null,
  }));

  // Stack of open-brace line indices.
  const stack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    for (const ch of trimmed) {
      if (OPENERS.has(ch)) {
        stack.push(i);
      } else if (CLOSERS[ch] !== undefined) {
        const opener = stack.pop();
        if (opener !== undefined && opener !== i) {
          // Only fold if block spans > 1 line.
          info[opener].foldEnd = i;
        }
      }
    }
  }

  return info;
}

export function CodeBlock({ code, className = "", showLineNumbers = true }: Props) {
  const lines = useMemo(() => code.split("\n"), [code]);
  const lineInfo = useMemo(() => buildLineInfo(lines), [lines]);

  // Set of line indices that are currently folded.
  const [folded, setFolded] = useState<ReadonlySet<number>>(new Set());

  const toggle = useCallback((idx: number) => {
    setFolded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  /** Given fold state, compute which line indices are hidden. */
  const hidden = useMemo<ReadonlySet<number>>(() => {
    const s = new Set<number>();
    for (const start of folded) {
      const end = lineInfo[start]?.foldEnd;
      if (end == null) continue;
      for (let i = start + 1; i <= end; i++) s.add(i);
    }
    return s;
  }, [folded, lineInfo]);

  const lineCount = lines.length;
  const gutterWidth = String(lineCount).length;

  return (
    <pre
      className={`code-block-root relative overflow-x-auto rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] cx-type-sm leading-[1.7] font-mono ${className}`}
      style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', 'Monaco', 'Courier New', monospace)" }}
    >
      <code className="block">
        {lines.map((_, i) => {
          if (hidden.has(i)) return null;

          const info = lineInfo[i];
          const isFoldable = info.foldEnd !== null;
          const isFolded = folded.has(i);
          const showEllipsis = isFolded && info.foldEnd !== null;
          const ellipsisCount = showEllipsis ? (info.foldEnd! - i) : 0;

          return (
            <span key={i} className="code-block-line flex items-start">
              {/* Line number — hidden on mobile */}
              {showLineNumbers && (
                <span
                  aria-hidden
                  className="code-block-lineno hidden sm:inline-block select-none text-right pr-4 text-[var(--color-text-muted)] shrink-0 opacity-40"
                  style={{ minWidth: `${gutterWidth + 1}ch` }}
                >
                  {i + 1}
                </span>
              )}

              {/* Fold gutter — always shown */}
              <span className="code-block-gutter w-5 shrink-0 flex items-start justify-center">
                {isFoldable ? (
                  <button
                    type="button"
                    aria-label={isFolded ? `Unfold ${ellipsisCount} lines` : "Fold block"}
                    aria-expanded={!isFolded}
                    onClick={() => toggle(i)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mt-[2px]"
                  >
                    {isFolded ? (
                      <ChevronRight size={12} aria-hidden />
                    ) : (
                      <ChevronDown size={12} aria-hidden />
                    )}
                  </button>
                ) : (
                  <span className="w-3" aria-hidden />
                )}
              </span>

              {/* Code content */}
              <span className="code-block-text flex-1 whitespace-pre text-[var(--color-text)] pl-1">
                {info.text}
                {showEllipsis && (
                  <span
                    className="ml-2 text-[var(--color-text-muted)] opacity-60 cx-type-xs select-none"
                    aria-label={`${ellipsisCount} lines hidden`}
                  >
                    … {ellipsisCount} {ellipsisCount === 1 ? "line" : "lines"}
                  </span>
                )}
              </span>
            </span>
          );
        })}
      </code>
    </pre>
  );
}
