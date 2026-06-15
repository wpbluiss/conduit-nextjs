"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";

interface Props {
  code: string;
  /** Language label shown in the header (e.g. "tsx", "python"). */
  lang?: string;
  /** Show line numbers (hidden ≤640 px by default). */
  showLineNumbers?: boolean;
  /** Forwarded to the outer wrapper for Tailwind overrides. */
  className?: string;
}

interface LineInfo {
  text: string;
  depth: number;
  foldEnd: number | null;
}

const OPENERS = new Set(["{", "[", "("]);
const CLOSERS: Record<string, string> = { "}": "{", "]": "[", ")": "(" };

function buildLineInfo(lines: string[]): LineInfo[] {
  const info: LineInfo[] = lines.map((text) => ({
    text,
    depth: text.match(/^\s*/)?.[0].length ?? 0,
    foldEnd: null,
  }));

  const stack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    for (const ch of trimmed) {
      if (OPENERS.has(ch)) {
        stack.push(i);
      } else if (CLOSERS[ch] !== undefined) {
        const opener = stack.pop();
        if (opener !== undefined && opener !== i) {
          info[opener].foldEnd = i;
        }
      }
    }
  }

  return info;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied!" : "Copy code"}
      title={copied ? "Copied!" : "Copy"}
      className="cx-icon-btn cx-focus-ring flex items-center justify-center w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
      style={{
        transitionDuration: "var(--cx-dur-fast, 120ms)",
        transitionTimingFunction: "var(--cx-ease, cubic-bezier(0.22,1,0.36,1))",
        color: copied ? "var(--cx-reward, #34D399)" : undefined,
      }}
    >
      {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
    </button>
  );
}

export function CodeBlock({
  code,
  lang,
  className = "",
  showLineNumbers = true,
}: Props) {
  const lines = useMemo(() => code.split("\n"), [code]);
  const lineInfo = useMemo(() => buildLineInfo(lines), [lines]);

  const [folded, setFolded] = useState<ReadonlySet<number>>(new Set());

  const toggle = useCallback((idx: number) => {
    setFolded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

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
    <div
      className={`group rounded-xl overflow-hidden ${className}`}
      style={{
        background: "var(--cx-surface-raised, #1C1C26)",
        border: "1px solid var(--cx-glass-border, rgba(255,255,255,0.08))",
        boxShadow: [
          "var(--cx-glass-shadow, 0 1px 3px rgba(0,0,0,.40), 0 4px 16px rgba(0,0,0,.30))",
          "var(--cx-glass-highlight, inset 0 1px 0 rgba(255,255,255,.10))",
        ].join(", "),
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          height: "36px",
          borderBottom: "1px solid var(--cx-glass-border, rgba(255,255,255,0.08))",
          background: "rgba(255, 255, 255, 0.03)",
        }}
      >
        <span
          className="cx-mono cx-type-xs uppercase tracking-[0.15em]"
          style={{ color: "var(--cx-text-faint, #6B6B7B)" }}
        >
          {lang || "code"}
        </span>
        <CopyButton text={code} />
      </div>

      {/* Code body */}
      <pre
        className="cx-code-scroll code-block-root relative overflow-x-auto cx-type-sm leading-[1.7] font-mono px-0 py-0"
        style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', 'Monaco', 'Courier New', monospace)", margin: 0 }}
      >
        <code className="block px-4 py-3">
          {lines.map((_, i) => {
            if (hidden.has(i)) return null;

            const info = lineInfo[i];
            const isFoldable = info.foldEnd !== null;
            const isFolded = folded.has(i);
            const showEllipsis = isFolded && info.foldEnd !== null;
            const ellipsisCount = showEllipsis ? (info.foldEnd! - i) : 0;

            return (
              <span key={i} className="code-block-line flex items-start">
                {showLineNumbers && (
                  <span
                    aria-hidden
                    className="code-block-lineno hidden sm:inline-block select-none text-right pr-4 shrink-0"
                    style={{
                      minWidth: `${gutterWidth + 1}ch`,
                      color: "var(--cx-text-faint, #6B6B7B)",
                      opacity: 0.5,
                    }}
                  >
                    {i + 1}
                  </span>
                )}

                <span className="code-block-gutter w-5 shrink-0 flex items-start justify-center">
                  {isFoldable ? (
                    <button
                      type="button"
                      aria-label={isFolded ? `Unfold ${ellipsisCount} lines` : "Fold block"}
                      aria-expanded={!isFolded}
                      onClick={() => toggle(i)}
                      className="transition-colors mt-[2px]"
                      style={{
                        color: "var(--cx-text-faint, #6B6B7B)",
                        transitionDuration: "var(--cx-dur-fast, 120ms)",
                      }}
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

                <span
                  className="code-block-text flex-1 whitespace-pre pl-1"
                  style={{ color: "var(--cx-text, #F4F4F7)" }}
                >
                  {info.text}
                  {showEllipsis && (
                    <span
                      className="ml-2 cx-type-xs select-none"
                      style={{ color: "var(--cx-text-faint, #6B6B7B)", opacity: 0.7 }}
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
    </div>
  );
}
