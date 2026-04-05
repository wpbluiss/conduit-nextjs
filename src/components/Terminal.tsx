"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const TERMINAL_LINES = [
  { type: "input", text: "$ conduit deploy --org acme-corp --env production" },
  { type: "output", text: "Initializing Conduit runtime v4.2.1..." },
  { type: "output", text: "Scanning organization structure... 9 departments detected" },
  { type: "system", text: "[DEPLOY] Provisioning AI workforce..." },
  { type: "output", text: "" },
  { type: "agent", text: "Engineering  >> 47 agents online", color: "#00e5a0" },
  { type: "agent", text: "Sales        >> 31 agents online", color: "#3b82f6" },
  { type: "agent", text: "Marketing    >> 24 agents online", color: "#ff6b35" },
  { type: "agent", text: "Support      >> 38 agents online", color: "#00c9ff" },
  { type: "agent", text: "Finance      >> 19 agents online", color: "#a855f7" },
  { type: "agent", text: "HR           >> 15 agents online", color: "#f59e0b" },
  { type: "agent", text: "Legal        >> 12 agents online", color: "#ef4444" },
  { type: "agent", text: "Operations   >> 28 agents online", color: "#10b981" },
  { type: "agent", text: "Product      >> 22 agents online", color: "#6366f1" },
  { type: "output", text: "" },
  { type: "system", text: "[READY] 236 agents deployed. All departments operational." },
  { type: "system", text: "[STATUS] Your company is now running itself." },
];

function TypingLine({
  line,
  onDone,
  startDelay,
}: {
  line: (typeof TERMINAL_LINES)[0];
  onDone: () => void;
  startDelay: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timeout);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    if (line.text === "") {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
      return;
    }

    let i = 0;
    const speed = line.type === "input" ? 30 : 12;
    const interval = setInterval(() => {
      i++;
      setDisplayed(line.text.slice(0, i));
      if (i >= line.text.length) {
        clearInterval(interval);
        if (!doneRef.current) {
          doneRef.current = true;
          setTimeout(onDone, line.type === "input" ? 400 : 80);
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, line, onDone]);

  if (!started) return null;

  const colorClass =
    line.type === "input"
      ? "text-accent"
      : line.type === "system"
        ? "text-orange"
        : line.type === "agent"
          ? ""
          : "text-text2";

  return (
    <div
      className={`font-[family-name:var(--font-mono)] text-[13px] leading-6 ${colorClass}`}
      style={line.type === "agent" ? { color: (line as { color?: string }).color } : undefined}
    >
      {displayed}
      {displayed.length < line.text.length && (
        <span className="terminal-cursor text-accent">|</span>
      )}
    </div>
  );
}

export default function Terminal() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [currentLine, setCurrentLine] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentLine]);

  return (
    <section
      id="terminal"
      ref={ref}
      className="relative py-32 px-6 flex flex-col items-center"
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border2 bg-card/50 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-orange" />
          <span className="font-[family-name:var(--font-mono)] text-xs text-text3 uppercase tracking-wider">
            Deployment
          </span>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight mb-4">
          One command.{" "}
          <span className="text-accent">Entire workforce.</span>
        </h2>
        <p className="text-text2 max-w-xl mx-auto">
          Deploy an autonomous AI team across every department in under 60
          seconds. No configuration. No onboarding. Just deploy.
        </p>
      </motion.div>

      {/* Terminal window */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-3xl"
      >
        <div className="rounded-xl border border-border2 bg-[#08080e] shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-[#0a0a12]">
            <div className="w-3 h-3 rounded-full bg-red/60" />
            <div className="w-3 h-3 rounded-full bg-orange/60" />
            <div className="w-3 h-3 rounded-full bg-accent/60" />
            <span className="ml-3 font-[family-name:var(--font-mono)] text-xs text-text3">
              conduit-cli -- production
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent status-dot" />
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-accent/70">
                CONNECTED
              </span>
            </div>
          </div>

          {/* Terminal body */}
          <div
            ref={scrollRef}
            className="p-5 h-[380px] overflow-y-auto"
          >
            {isInView &&
              TERMINAL_LINES.slice(0, currentLine + 1).map((line, i) => (
                <TypingLine
                  key={i}
                  line={line}
                  startDelay={0}
                  onDone={() => {
                    if (i === currentLine && currentLine < TERMINAL_LINES.length - 1) {
                      setCurrentLine((prev) => prev + 1);
                    }
                  }}
                />
              ))}
            {currentLine >= TERMINAL_LINES.length - 1 && isInView && (
              <div className="mt-2 font-[family-name:var(--font-mono)] text-[13px] text-accent">
                $ <span className="terminal-cursor">|</span>
              </div>
            )}
          </div>
        </div>

        {/* Glow underneath */}
        <div className="h-20 -mt-10 bg-gradient-to-b from-accent/5 to-transparent rounded-b-3xl blur-2xl" />
      </motion.div>
    </section>
  );
}
