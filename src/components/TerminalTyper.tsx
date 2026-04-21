"use client";

import { useEffect, useRef, useState } from "react";

type Token = { t: string; c?: string };
type Line = { tokens: Token[]; underline?: boolean };

const C = {
  orange: "#FF6B35",
  cyan: "#22D3EE",
  purple: "#A855F7",
  green: "#34D399",
  pink: "#F472B6",
  amber: "#FBBF24",
} as const;

const LINES: Line[] = [
  {
    tokens: [
      { t: "$ ", c: C.orange },
      { t: "conduit " },
      { t: "deploy ", c: C.cyan },
      { t: "--department=sales", c: C.purple },
    ],
  },
  { tokens: [{ t: "✓ ", c: C.green }, { t: "Hunter agent ", c: C.amber }, { t: "online", c: C.green }] },
  { tokens: [{ t: "✓ ", c: C.green }, { t: "Closer agent ", c: C.pink }, { t: "online", c: C.green }] },
  { tokens: [{ t: "✓ ", c: C.green }, { t: "Quoter agent ", c: C.cyan }, { t: "online", c: C.green }] },
  { tokens: [{ t: "✓ ", c: C.green }, { t: "Pipeline Manager ", c: C.amber }, { t: "active", c: C.green }] },
  { tokens: [{ t: "✓ ", c: C.green }, { t: "CRM ", c: C.pink }, { t: "connected", c: C.green }] },
  { tokens: [{ t: "✓ ", c: C.green }, { t: "4 AI employees ", c: C.cyan }, { t: "ready", c: C.green }] },
  {
    tokens: [
      { t: "Sales department live. Total cost: " },
      { t: "$0.04/hour", c: C.amber },
      { t: "." },
    ],
    underline: true,
  },
];

const CHAR_MS = 32;
const LINE_PAUSE = 520;
const RESTART_PAUSE = 4000;

function lineLength(l: Line) {
  return l.tokens.reduce((n, t) => n + t.t.length, 0);
}

function renderTokens(tokens: Token[], maxLen?: number) {
  if (maxLen === undefined) {
    return tokens.map((tok, i) => (
      <span key={i} style={tok.c ? { color: tok.c } : undefined}>
        {tok.t}
      </span>
    ));
  }
  let used = 0;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (used >= maxLen) break;
    const remaining = maxLen - used;
    const slice = tokens[i].t.slice(0, remaining);
    out.push(
      <span key={i} style={tokens[i].c ? { color: tokens[i].c } : undefined}>
        {slice}
      </span>,
    );
    used += tokens[i].t.length;
  }
  return out;
}

export default function TerminalTyper() {
  const [rendered, setRendered] = useState<Line[]>([]);
  const [activeLen, setActiveLen] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [done, setDone] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setRendered(LINES);
      setDone(true);
      return;
    }

    let lineIdx = 0;
    let charIdx = 0;
    let output: Line[] = [];

    const step = () => {
      if (lineIdx >= LINES.length) {
        setDone(true);
        timeoutRef.current = setTimeout(() => {
          output = [];
          lineIdx = 0;
          charIdx = 0;
          setRendered([]);
          setActiveLen(0);
          setActiveIdx(0);
          setDone(false);
          timeoutRef.current = setTimeout(step, 300);
        }, RESTART_PAUSE);
        return;
      }

      const line = LINES[lineIdx];
      const total = lineLength(line);
      if (charIdx < total) {
        setActiveLen(charIdx + 1);
        setActiveIdx(lineIdx);
        charIdx += 1;
        timeoutRef.current = setTimeout(step, CHAR_MS);
      } else {
        output = [...output, line];
        setRendered(output);
        setActiveLen(0);
        lineIdx += 1;
        charIdx = 0;
        timeoutRef.current = setTimeout(step, LINE_PAUSE);
      }
    };

    timeoutRef.current = setTimeout(step, 400);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const active = LINES[activeIdx];

  return (
    <div className="terminal-frame max-w-2xl mx-auto">
      <div className="bg-[#14110F]">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1F1C19]">
          <span className="w-[10px] h-[10px] rounded-full bg-[#ff5f56]" />
          <span className="w-[10px] h-[10px] rounded-full bg-[#ffbd2e]" />
          <span className="w-[10px] h-[10px] rounded-full bg-[#27c93f]" />
          <span className="ml-3 text-[11px] text-[#8C8884] tracking-wide">
            conduit — zsh
          </span>
        </div>

        <div className="font-mono text-[11px] md:text-[14px] px-4 md:px-5 py-5 md:py-6 leading-[1.7] md:leading-[1.8] min-h-[260px] md:min-h-[280px] text-[#F5F1EA] break-words">
          {rendered.map((l, i) => (
            <div key={`r-${i}`}>
              {l.underline ? (
                <span className="inline-block border-b border-[#FBBF24]/50 pb-[1px]">
                  {renderTokens(l.tokens)}
                </span>
              ) : (
                renderTokens(l.tokens)
              )}
            </div>
          ))}
          {!done && active && activeLen > 0 && (
            <div>
              {renderTokens(active.tokens, activeLen)}
              <span className="caret" style={{ color: "#FFA478" }}>▊</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
