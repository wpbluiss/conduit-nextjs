"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { scrollState } from "./ScrollScene";
import TerminalContent from "./TerminalContent";
import DepartmentGrid from "./DepartmentGrid";
import FounderStory from "./FounderStory";
import WaitlistCTA from "./WaitlistCTA";

const ScrollScene = dynamic(() => import("./ScrollScene"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

/* ── Holographic AI Profile Scan (Westworld / Blade Runner style) ──── */
function HolographicProfile({ visible }: { visible: boolean }) {
  return (
    <div
      className={`gpu-layer transition-all duration-1000 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="relative w-[420px] max-w-[92vw]">
        {/* Outer holo border with animated glow */}
        <div
          className="absolute -inset-[1px] rounded-2xl opacity-60"
          style={{
            background: "linear-gradient(135deg, #ff6b35 0%, #3b82f6 40%, #a855f7 70%, #ff6b35 100%)",
            backgroundSize: "300% 300%",
            animation: visible ? "holoShift 4s ease infinite" : "none",
          }}
        />

        <div className="relative rounded-2xl bg-[#08080eee] backdrop-blur-3xl overflow-hidden">
          {/* Scan line sweep */}
          <div
            className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <div
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange/60 to-transparent"
              style={{
                animation: visible ? "holoScan 3s ease-in-out infinite" : "none",
                top: 0,
              }}
            />
          </div>

          {/* Flicker overlay */}
          <div
            className="absolute inset-0 z-10 pointer-events-none bg-white/[0.01]"
            style={{ animation: visible ? "holoFlicker 0.15s steps(2) infinite" : "none" }}
          />

          {/* Header bar */}
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange status-dot" />
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-orange tracking-[0.15em]">AGENT PROFILE SCAN</span>
            </div>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-text3">CLASSIFIED // LVL-9</span>
          </div>

          {/* Portrait + Identity section */}
          <div className="flex items-start gap-5 p-5 pb-4">
            {/* Holographic portrait */}
            <div className="relative w-[100px] h-[120px] flex-shrink-0">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-xl border border-orange/20" />
              {/* Inner gradient bg */}
              <div className="absolute inset-[1px] rounded-xl overflow-hidden bg-gradient-to-b from-[#0e0e18] to-[#0a0a14]">
                {/* Blueprint-style head/shoulders silhouette */}
                <svg viewBox="0 0 100 120" fill="none" className="w-full h-full">
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#ff6b35" strokeWidth="0.3" opacity="0.15" />
                  <line x1="0" y1="60" x2="100" y2="60" stroke="#ff6b35" strokeWidth="0.3" opacity="0.15" />
                  <line x1="0" y1="90" x2="100" y2="90" stroke="#ff6b35" strokeWidth="0.3" opacity="0.15" />
                  <line x1="25" y1="0" x2="25" y2="120" stroke="#ff6b35" strokeWidth="0.3" opacity="0.15" />
                  <line x1="50" y1="0" x2="50" y2="120" stroke="#ff6b35" strokeWidth="0.3" opacity="0.15" />
                  <line x1="75" y1="0" x2="75" y2="120" stroke="#ff6b35" strokeWidth="0.3" opacity="0.15" />

                  {/* Head - geometric oval */}
                  <ellipse cx="50" cy="35" rx="18" ry="22" fill="none" stroke="#ff6b35" strokeWidth="1" opacity="0.7" />
                  <ellipse cx="50" cy="35" rx="18" ry="22" fill="#ff6b35" opacity="0.04" />
                  {/* Eye line / visor */}
                  <rect x="36" y="30" width="28" height="4" rx="2" fill="#ff6b35" opacity="0.5" />
                  <rect x="36" y="30" width="28" height="4" rx="2" fill="none" stroke="#ff6b35" strokeWidth="0.5" opacity="0.8" />
                  {/* Neural connection dots on head */}
                  <circle cx="38" cy="25" r="1.5" fill="#3b82f6" opacity="0.6" />
                  <circle cx="62" cy="25" r="1.5" fill="#3b82f6" opacity="0.6" />
                  <circle cx="50" cy="18" r="1.5" fill="#a855f7" opacity="0.6" />
                  {/* Connection lines */}
                  <line x1="38" y1="25" x2="50" y2="18" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
                  <line x1="62" y1="25" x2="50" y2="18" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />

                  {/* Neck */}
                  <rect x="44" y="55" width="12" height="8" fill="none" stroke="#ff6b35" strokeWidth="0.7" opacity="0.4" />

                  {/* Shoulders + torso */}
                  <path d="M20 75 L44 63 L56 63 L80 75 L80 120 L20 120 Z" fill="none" stroke="#ff6b35" strokeWidth="1" opacity="0.5" />
                  <path d="M20 75 L44 63 L56 63 L80 75 L80 120 L20 120 Z" fill="#ff6b35" opacity="0.03" />

                  {/* Circuit pattern on torso */}
                  <line x1="50" y1="70" x2="50" y2="100" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
                  <line x1="35" y1="80" x2="65" y2="80" stroke="#a855f7" strokeWidth="0.5" opacity="0.2" />
                  <circle cx="50" cy="80" r="3" fill="none" stroke="#ff6b35" strokeWidth="0.5" opacity="0.4" />
                  <circle cx="50" cy="80" r="1" fill="#ff6b35" opacity="0.5" />
                  <line x1="35" y1="90" x2="65" y2="90" stroke="#3b82f6" strokeWidth="0.3" opacity="0.2" />
                  <circle cx="40" cy="90" r="1.5" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
                  <circle cx="60" cy="90" r="1.5" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />

                  {/* Data readout lines */}
                  <rect x="5" y="105" width="20" height="1" fill="#ff6b35" opacity="0.3" />
                  <rect x="5" y="109" width="14" height="1" fill="#3b82f6" opacity="0.2" />
                  <rect x="5" y="113" width="18" height="1" fill="#a855f7" opacity="0.2" />
                </svg>

                {/* Glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange/[0.06] via-transparent to-transparent" />
              </div>

              {/* Pulsing corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-orange/50" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-orange/50" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-orange/50" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-orange/50" />
            </div>

            {/* Identity data */}
            <div className="flex-1 pt-1">
              <div className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">Agent ENG-014</div>
              <div className="font-[family-name:var(--font-mono)] text-[11px] text-orange mt-0.5">Senior Code Reviewer</div>
              <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3 mt-1">ENGINEERING / FLOOR 9</div>

              {/* Status ring */}
              <div className="flex items-center gap-3 mt-3">
                <div className="relative w-10 h-10">
                  <svg viewBox="0 0 40 40" className="w-full h-full">
                    <circle cx="20" cy="20" r="17" fill="none" stroke="#1a1a2e" strokeWidth="2" />
                    <circle cx="20" cy="20" r="17" fill="none" stroke="#ff6b35" strokeWidth="2"
                      strokeDasharray="107" strokeDashoffset="29" strokeLinecap="round"
                      style={{ filter: "drop-shadow(0 0 4px rgba(255,107,53,0.5))" }} />
                    <text x="20" y="22" textAnchor="middle" fill="#ff6b35" fontSize="9"
                      fontFamily="var(--font-mono)" fontWeight="700">73</text>
                  </svg>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3">EFFICIENCY</div>
                  <div className="font-[family-name:var(--font-mono)] text-[10px] text-orange">EXCEPTIONAL</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current operation */}
          <div className="mx-5 mb-4 rounded-lg border border-orange/10 bg-orange/[0.02] px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange status-dot" />
              <span className="font-[family-name:var(--font-mono)] text-[9px] text-orange tracking-[0.15em]">ACTIVE OPERATION</span>
            </div>
            <div className="font-[family-name:var(--font-display)] text-sm font-medium">PR #847 -- Auth middleware refactor</div>
          </div>

          {/* Telemetry grid */}
          <div className="grid grid-cols-2 gap-[1px] bg-white/[0.03] mx-5 mb-5 rounded-lg overflow-hidden">
            {[
              { label: "FILES ANALYZED", value: "23", unit: "files" },
              { label: "ISSUES FOUND", value: "3", unit: "critical", color: "text-orange" },
              { label: "LINES REVIEWED", value: "4,218", unit: "lines" },
              { label: "CONTINUOUS UPTIME", value: "14d 7h", unit: "23m" },
              { label: "TASKS COMPLETED", value: "1,847", unit: "total", color: "text-blue" },
              { label: "RESPONSE TIME", value: "0.8s", unit: "avg", color: "text-purple" },
            ].map((item) => (
              <div key={item.label} className="bg-[#0a0a12] px-3 py-2.5">
                <div className="font-[family-name:var(--font-mono)] text-[8px] text-text3 tracking-[0.1em] mb-1">{item.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className={`font-[family-name:var(--font-display)] text-base font-bold tabular-nums ${item.color || "text-text"}`}>{item.value}</span>
                  <span className="font-[family-name:var(--font-mono)] text-[9px] text-text3">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom status bar */}
          <div className="px-5 py-2.5 border-t border-white/[0.04] flex items-center justify-between">
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-text3">BIOMETRIC HASH: 0xA3F8..E014</span>
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-text3">CLEARANCE: ALPHA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Work view card (code on screen — zoomed into monitor) ───── */
function WorkView({ visible }: { visible: boolean }) {
  return (
    <div
      className={`gpu-layer transition-all duration-700 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="w-[480px] max-w-[90vw] rounded-2xl border border-border2 bg-[#08080e] shadow-[0_0_80px_rgba(0,0,0,0.6),0_0_40px_rgba(255,107,53,0.05)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-[#0a0a12]">
          <div className="w-2.5 h-2.5 rounded-full bg-red/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warm/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue/60" />
          <span className="ml-2 font-[family-name:var(--font-mono)] text-[10px] text-text3">agent-eng-014 / pr-847-review.md</span>
        </div>
        <div className="p-4 font-[family-name:var(--font-mono)] text-[11px] leading-5 space-y-2 max-h-[280px] overflow-hidden">
          <div className="text-text3">// PR #847 — Auth Middleware Refactor</div>
          <div className="text-text3">// Automated review by Agent ENG-014</div>
          <div className="text-text3">//</div>
          <div><span className="text-red">CRITICAL</span> <span className="text-text2">src/middleware/auth.ts:47</span></div>
          <div className="text-text2 pl-4">Session token stored in localStorage.</div>
          <div className="text-text2 pl-4">Recommendation: migrate to httpOnly cookie.</div>
          <div className="mt-2"><span className="text-red">CRITICAL</span> <span className="text-text2">src/middleware/auth.ts:89</span></div>
          <div className="text-text2 pl-4">Missing CSRF validation on POST /api/auth/refresh.</div>
          <div className="mt-2"><span className="text-red">CRITICAL</span> <span className="text-text2">src/utils/token.ts:12</span></div>
          <div className="text-text2 pl-4">JWT expiry set to 30d. Recommend 1h with refresh.</div>
          <div className="mt-2"><span className="text-warm">SUGGESTION</span> <span className="text-text2">src/middleware/auth.ts:23</span></div>
          <div className="text-text2 pl-4">Extract rate-limiter config to env variables.</div>
          <div className="mt-2 text-text3">---</div>
          <div className="text-blue">SUMMARY: 3 critical / 7 suggestions / 13 approved</div>
          <div className="text-text3">Auto-approved 13 files with no issues detected.</div>
        </div>
      </div>
    </div>
  );
}

/* ────────────── CEO Suite / Command Center overlay ──────────────────── */
function CEOSuite({ visible }: { visible: boolean }) {
  return (
    <div
      className={`gpu-layer transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="w-[520px] max-w-[92vw] rounded-2xl border border-border2 bg-card/90 backdrop-blur-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.4)]">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-[family-name:var(--font-display)] text-sm font-bold">Command Center</div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3">CEO SUITE -- ALL DEPARTMENTS</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange status-dot" />
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-orange">LIVE</span>
          </div>
        </div>
        <div className="p-4 grid grid-cols-3 gap-2">
          {[
            { name: "ENG", count: 47, color: "#ff6b35" },
            { name: "SALES", count: 31, color: "#3b82f6" },
            { name: "MKT", count: 24, color: "#f59e0b" },
            { name: "SUP", count: 38, color: "#00c9ff" },
            { name: "FIN", count: 19, color: "#a855f7" },
            { name: "HR", count: 15, color: "#f59e0b" },
            { name: "LEGAL", count: 12, color: "#ef4444" },
            { name: "OPS", count: 28, color: "#6366f1" },
            { name: "PROD", count: 22, color: "#3b82f6" },
          ].map(d => (
            <div key={d.name} className="rounded-lg border border-border bg-bg2/60 p-2.5 text-center">
              <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3 mb-1">{d.name}</div>
              <div className="font-[family-name:var(--font-display)] text-lg font-bold" style={{ color: d.color }}>{d.count}</div>
              <div className="mt-1.5 h-0.5 rounded-full bg-border2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${60 + Math.random() * 35}%`, backgroundColor: d.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border flex justify-between font-[family-name:var(--font-mono)] text-[10px] text-text3">
          <span>236 AGENTS ACTIVE</span>
          <span>14,208 TASKS/HR</span>
          <span>99.97% UPTIME</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN SCROLL EXPERIENCE ═══════════════════════ */
export default function ScrollExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);

  // Throttled scroll handler for phase detection
  const updatePhase = useCallback((progress: number) => {
    scrollState.progress = progress;
    let p = 0;
    if (progress < 0.12) p = 0;       // hero text
    else if (progress < 0.25) p = 1;   // push into building
    else if (progress < 0.35) p = 2;   // zoom to floor
    else if (progress < 0.55) p = 3;   // AI employee
    else if (progress < 0.65) p = 4;   // work view
    else if (progress < 0.78) p = 5;   // CEO suite
    else if (progress < 0.88) p = 6;   // terminal
    else p = 7;                         // transition out
    setPhase(p);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !pinnedRef.current) return;

    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      pin: pinnedRef.current,
      scrub: 0.5,
      onUpdate: (self) => updatePhase(self.progress),
    });

    return () => { st.kill(); };
  }, [updatePhase]);

  return (
    <>
      {/* Scroll track — determines how long the pinned section holds */}
      <div ref={containerRef} style={{ height: "700vh" }} className="relative">
        {/* Pinned viewport */}
        <div ref={pinnedRef} className="h-screen w-full overflow-hidden relative">
          {/* 3D Canvas — always present, camera moves */}
          <div className="absolute inset-0 z-0">
            <ScrollScene />
          </div>

          {/* Scanline overlay */}
          <div className="scanlines absolute inset-0 z-[1]" />

          {/* Dot grid */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              opacity: Math.max(0, 1 - (phase > 2 ? 0.5 : 0)),
            }}
          />

          {/* ──── PHASE 0: Hero text ──── */}
          <div className={`phase-overlay z-10 flex-col pt-28 px-6 ${phase === 0 ? "active" : ""}`}
            style={{ opacity: phase === 0 ? 1 : 0, transform: `translateY(${phase > 0 ? "-60px" : "0"}) translateZ(0)`, transition: "opacity 0.6s, transform 0.8s" }}>
            <div className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-border2 bg-card/50 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-orange status-dot" />
              <span className="font-[family-name:var(--font-mono)] text-xs text-text2">SYSTEM ONLINE -- 236 AGENTS ACTIVE</span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,7rem)] font-extrabold leading-[0.95] tracking-[-0.04em] mb-6 max-w-5xl text-center">
              <span className="block">Your company</span>
              <span className="block text-white">runs itself</span>
            </h1>
            <p className="text-text2 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed text-center">
              Conduit deploys autonomous AI employees across every department.
              Engineering, sales, support, finance, legal, HR, marketing, ops, and product -- all running 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#waitlist-section" className="px-8 py-3.5 rounded-full font-semibold bg-white text-black hover:bg-white/90 transition-all">Request Access</a>
              <a href="#" className="px-8 py-3.5 rounded-full font-semibold border border-border2 text-text2 hover:text-text transition-all">Watch Deploy</a>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <span className="text-text3 text-xs font-[family-name:var(--font-mono)] tracking-widest uppercase">Scroll</span>
              <div className="w-[1px] h-8 bg-gradient-to-b from-orange/50 to-transparent" />
            </div>
          </div>

          {/* ──── PHASE 2: Floor label ──── */}
          <div className={`phase-overlay z-10 items-end pb-20 ${phase === 2 ? "active" : ""}`}
            style={{ opacity: phase === 2 ? 1 : 0, transform: `translateY(${phase === 2 ? "0" : "30px"}) translateZ(0)`, transition: "opacity 0.5s, transform 0.6s" }}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-border2 bg-card/80 backdrop-blur-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-orange status-dot" />
              <div>
                <div className="font-[family-name:var(--font-display)] font-bold text-sm">Engineering Department</div>
                <div className="font-[family-name:var(--font-mono)] text-[11px] text-text3">FLOOR 9 -- 47 AGENTS -- ENTERING</div>
              </div>
            </div>
          </div>

          {/* ──── PHASE 3: Holographic AI Profile Scan ──── */}
          <div className={`phase-overlay z-10 items-center justify-end pr-8 md:pr-16 ${phase === 3 ? "active" : ""}`}
            style={{ opacity: phase === 3 ? 1 : 0, transition: "opacity 0.8s" }}>
            <HolographicProfile visible={phase === 3} />
          </div>

          {/* ──── PHASE 4: Work view ──── */}
          <div className={`phase-overlay z-10 ${phase === 4 ? "active" : ""}`}
            style={{ opacity: phase === 4 ? 1 : 0, transition: "opacity 0.6s" }}>
            <WorkView visible={phase === 4} />
          </div>

          {/* ──── PHASE 5: CEO Suite ──── */}
          <div className={`phase-overlay z-10 ${phase === 5 ? "active" : ""}`}
            style={{ opacity: phase === 5 ? 1 : 0, transition: "opacity 0.6s" }}>
            <CEOSuite visible={phase === 5} />
          </div>

          {/* ──── PHASE 6: Terminal ──── */}
          <div className={`phase-overlay z-10 px-6 ${phase >= 6 ? "active" : ""}`}
            style={{ opacity: phase >= 6 ? 1 : 0, transform: `scale(${phase >= 6 ? 1 : 0.95}) translateZ(0)`, transition: "opacity 0.6s, transform 0.6s" }}>
            <TerminalContent active={phase >= 6} />
          </div>

          {/* Ambient orbs */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[15%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-orange/[0.05] blur-[140px] gpu-layer" />
            <div className="absolute -bottom-[10%] -left-[8%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-blue/[0.04] blur-[140px] gpu-layer" />
            <div className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-purple/[0.03] blur-[140px] gpu-layer" />
          </div>
        </div>
      </div>

      {/* ──── Flowing sections after pinned experience ──── */}
      <div id="departments-section" className="relative">
        {/* Gradient morph bridge from pinned to grid */}
        <div className="h-32 bg-gradient-to-b from-bg via-bg to-bg2 relative z-10" />
        <DepartmentGrid />
      </div>
      <FounderStory />
      <div id="waitlist-section">
        <WaitlistCTA />
      </div>
    </>
  );
}
