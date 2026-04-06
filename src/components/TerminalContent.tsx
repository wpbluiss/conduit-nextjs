"use client";

import { useEffect, useRef, useState } from "react";

const LINES = [
  { type: "input" as const, text: "$ conduit deploy --org acme-corp --env production" },
  { type: "output" as const, text: "Initializing Conduit runtime v4.2.1..." },
  { type: "output" as const, text: "Scanning organization structure... 9 departments detected" },
  { type: "system" as const, text: "[DEPLOY] Provisioning AI workforce..." },
  { type: "output" as const, text: "" },
  { type: "agent" as const, text: "Engineering  >> 47 agents online", color: "#ff6b35" },
  { type: "agent" as const, text: "Sales        >> 31 agents online", color: "#3b82f6" },
  { type: "agent" as const, text: "Marketing    >> 24 agents online", color: "#f59e0b" },
  { type: "agent" as const, text: "Support      >> 38 agents online", color: "#00c9ff" },
  { type: "agent" as const, text: "Finance      >> 19 agents online", color: "#a855f7" },
  { type: "agent" as const, text: "HR           >> 15 agents online", color: "#f59e0b" },
  { type: "agent" as const, text: "Legal        >> 12 agents online", color: "#ef4444" },
  { type: "agent" as const, text: "Operations   >> 28 agents online", color: "#6366f1" },
  { type: "agent" as const, text: "Product      >> 22 agents online", color: "#3b82f6" },
  { type: "output" as const, text: "" },
  { type: "system" as const, text: "[READY] 236 agents deployed. All departments operational." },
  { type: "system" as const, text: "[STATUS] Your company is now running itself." },
];

function TypeLine({ line, onDone }: { line: typeof LINES[0]; onDone: () => void }) {
  const [text, setText] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (line.text === "") { if (!done.current) { done.current = true; onDone(); } return; }
    let i = 0;
    const speed = line.type === "input" ? 25 : 10;
    const iv = setInterval(() => {
      i++;
      setText(line.text.slice(0, i));
      if (i >= line.text.length) {
        clearInterval(iv);
        if (!done.current) { done.current = true; setTimeout(onDone, line.type === "input" ? 300 : 50); }
      }
    }, speed);
    return () => clearInterval(iv);
  }, [line, onDone]);

  const cls = line.type === "input" ? "text-orange" : line.type === "system" ? "text-warm" : "text-text2";

  return (
    <div className={`font-[family-name:var(--font-mono)] text-[12px] leading-5 ${line.type === "agent" ? "" : cls}`}
      style={line.type === "agent" ? { color: (line as { color?: string }).color } : undefined}>
      {text}
      {text.length < line.text.length && <span className="terminal-cursor text-orange">|</span>}
    </div>
  );
}

export default function TerminalContent({ active }: { active: boolean }) {
  const [line, setLine] = useState(0);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && !started) setStarted(true);
  }, [active, started]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [line]);

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-4xl font-bold tracking-tight">
          One command. <span className="text-white">Entire workforce.</span>
        </h2>
      </div>
      <div className="rounded-xl border border-border2 bg-[#08080e] shadow-[0_0_80px_rgba(0,0,0,0.6),0_0_30px_rgba(255,107,53,0.05)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-[#0a0a12]">
          <div className="w-2.5 h-2.5 rounded-full bg-red/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warm/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue/60" />
          <span className="ml-2 font-[family-name:var(--font-mono)] text-[10px] text-text3">conduit-cli -- production</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange status-dot" />
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-orange/70">CONNECTED</span>
          </div>
        </div>
        <div ref={scrollRef} className="p-4 h-[300px] overflow-y-auto">
          {started && LINES.slice(0, line + 1).map((l, i) => (
            <TypeLine key={i} line={l} onDone={() => {
              if (i === line && line < LINES.length - 1) setLine(p => p + 1);
            }} />
          ))}
          {line >= LINES.length - 1 && started && (
            <div className="mt-2 font-[family-name:var(--font-mono)] text-[12px] text-orange">
              $ <span className="terminal-cursor">|</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
