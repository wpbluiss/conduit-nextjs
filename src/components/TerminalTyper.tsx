"use client";

import { useEffect, useRef, useState } from "react";

type Line = { text: string; className?: string };

const LINES: Line[] = [
  { text: "$ conduit deploy --department=sales", className: "text-[#FFB347]" },
  { text: "✓ Hunter agent online", className: "text-[#D97706]" },
  { text: "✓ Closer agent online", className: "text-[#D97706]" },
  { text: "✓ Quoter agent online", className: "text-[#D97706]" },
  { text: "✓ Pipeline Manager active", className: "text-[#D97706]" },
  { text: "✓ CRM connected", className: "text-[#D97706]" },
  { text: "✓ 4 AI employees ready", className: "text-[#D97706]" },
  { text: "Sales department live. Total cost: $0.04/hour.", className: "text-[#F5F1EA]" },
];

const CHAR_MS = 35;
const LINE_PAUSE = 600;
const RESTART_PAUSE = 4000;

export default function TerminalTyper() {
  const [rendered, setRendered] = useState<Line[]>([]);
  const [activeText, setActiveText] = useState("");
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
          setActiveText("");
          setActiveIdx(0);
          setDone(false);
          timeoutRef.current = setTimeout(step, 300);
        }, RESTART_PAUSE);
        return;
      }

      const line = LINES[lineIdx];
      if (charIdx < line.text.length) {
        setActiveText(line.text.slice(0, charIdx + 1));
        setActiveIdx(lineIdx);
        charIdx += 1;
        timeoutRef.current = setTimeout(step, CHAR_MS);
      } else {
        output = [...output, line];
        setRendered(output);
        setActiveText("");
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

  return (
    <div className="max-w-2xl mx-auto bg-[#14110F] border border-[#1F1C19]">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1F1C19]">
        <span className="w-[10px] h-[10px] rounded-full bg-[#ff5f56]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#ffbd2e]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#27c93f]" />
        <span className="ml-3 text-[11px] text-[#8C8884] tracking-wide">
          conduit — zsh
        </span>
      </div>

      <div className="font-mono text-[13px] md:text-[14px] px-5 py-6 leading-[1.8] min-h-[280px] text-[#F5F1EA]">
        {rendered.map((l, i) => {
          const isLast = l.text.startsWith("Sales department live");
          return (
            <div key={`r-${i}`} className={l.className}>
              {isLast ? (
                <span className="inline-block border-b border-[#D97706]/50 pb-[1px]">
                  {l.text}
                </span>
              ) : (
                l.text
              )}
            </div>
          );
        })}
        {!done && activeText && (
          <div className={LINES[activeIdx]?.className}>
            {activeText}
            <span className="caret text-[#FFB347]">▊</span>
          </div>
        )}
      </div>
    </div>
  );
}
