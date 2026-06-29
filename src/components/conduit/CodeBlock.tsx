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

// ---------------------------------------------------------------------------
// Syntax highlighting — token-based, matches MarkdownRenderer's palette
// ---------------------------------------------------------------------------

type TokenKind = "keyword" | "string" | "comment" | "number" | "operator" | "plain";

interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS = new Set([
  "abstract","as","async","await","break","case","catch","class","const","continue",
  "debugger","declare","default","delete","do","else","enum","export","extends",
  "false","finally","for","from","function","get","if","implements","import","in",
  "instanceof","interface","let","module","namespace","new","null","of","override",
  "package","private","protected","public","readonly","require","return","set",
  "static","super","switch","this","throw","true","try","type","typeof","undefined",
  "var","void","while","with","yield",
  "and","del","elif","except","exec","global","lambda","nonlocal","not","or","pass",
  "print","raise",
  "echo","fi","then","done","do","esac","select","until","elif","function",
  "SELECT","FROM","WHERE","INSERT","UPDATE","DELETE","CREATE","DROP","TABLE",
  "JOIN","LEFT","RIGHT","INNER","OUTER","ON","AND","OR","NOT","NULL","INTO",
  "VALUES","SET","ORDER","BY","GROUP","HAVING","LIMIT","AS","DISTINCT","COUNT",
  "SUM","AVG","MAX","MIN",
]);

const TOKEN_COLOR: Record<TokenKind, string> = {
  keyword:  "var(--cx-accent-bright, #9B8CFF)",
  string:   "var(--cx-reward, #34D399)",
  comment:  "var(--cx-text-faint, #6B6B7B)",
  number:   "var(--cx-warn, #FBBF24)",
  operator: "var(--cx-text-muted, #A0A0B0)",
  plain:    "var(--cx-text, #F4F4F7)",
};

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    if (
      (line[i] === "/" && line[i + 1] === "/") ||
      (line[i] === "#" && line[i + 1] !== "{")
    ) {
      tokens.push({ kind: "comment", text: line.slice(i) });
      break;
    }

    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      const q = line[i];
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\" && j + 1 < line.length) { j += 2; continue; }
        if (line[j] === q) { j++; break; }
        j++;
      }
      tokens.push({ kind: "string", text: line.slice(i, j) });
      i = j;
      continue;
    }

    if (/[0-9]/.test(line[i]) && (i === 0 || /[^a-zA-Z_$]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[0-9._xXa-fA-FbBoO]/.test(line[j])) j++;
      tokens.push({ kind: "number", text: line.slice(i, j) });
      i = j;
      continue;
    }

    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({ kind: KEYWORDS.has(word) ? "keyword" : "plain", text: word });
      i = j;
      continue;
    }

    tokens.push({ kind: "operator", text: line[i] });
    i++;
  }

  return tokens;
}

function SyntaxLine({ line }: { line: string }) {
  const tokens = tokenizeLine(line);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: TOKEN_COLOR[t.kind] }}>
          {t.text}
        </span>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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
        color: copied ? "var(--cx-reward)" : undefined,
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
    <div className={`group cx-glass cx-glass-border rounded-xl overflow-hidden ${className}`}>
      {/* Accent top bar — 2px electric violet strip */}
      <div
        aria-hidden
        style={{ height: "2px", background: "var(--cx-accent, #7C6CFF)" }}
      />

      {/* Header bar — cx-glass-nested: tinted fill without extra backdrop-filter (already inside cx-glass) */}
      <div
        className="flex items-center justify-between px-4 cx-glass-border-b cx-glass-nested"
        style={{ height: "34px" }}
      >
        <span
          className="cx-mono cx-type-xs uppercase tracking-[0.15em]"
          style={{ color: "var(--cx-text-faint)" }}
        >
          {lang || "code"}
        </span>
        <CopyButton text={code} />
      </div>

      {/* Code body */}
      <pre
        className="cx-code-scroll code-block-root relative overflow-x-auto cx-type-sm leading-[1.7] cx-mono px-0 py-0"
        style={{ margin: 0 }}
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
                      color: "var(--cx-text-faint)",
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
                        color: "var(--cx-text-faint)",
                        transitionDuration: "var(--cx-dur-fast, 120ms)",
                      }}
                    >
                      {isFolded ? (
                        <ChevronRight size={12} strokeWidth={1.75} aria-hidden />
                      ) : (
                        <ChevronDown size={12} strokeWidth={1.75} aria-hidden />
                      )}
                    </button>
                  ) : (
                    <span className="w-3" aria-hidden />
                  )}
                </span>

                <span className="code-block-text flex-1 whitespace-pre pl-1">
                  {showEllipsis ? (
                    <span style={{ color: "var(--cx-text)" }}>
                      <SyntaxLine line={info.text} />
                      <span
                        className="ml-2 cx-type-xs select-none"
                        style={{ color: "var(--cx-text-faint)", opacity: 0.7 }}
                        aria-label={`${ellipsisCount} lines hidden`}
                      >
                        … {ellipsisCount} {ellipsisCount === 1 ? "line" : "lines"}
                      </span>
                    </span>
                  ) : (
                    <SyntaxLine line={info.text} />
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
