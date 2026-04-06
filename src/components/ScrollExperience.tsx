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

/* ─────────────────── AI Employee info card (2D overlay) ─────────────── */
function EmployeeCard({ visible }: { visible: boolean }) {
  return (
    <div
      className={`gpu-layer transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="w-[380px] rounded-2xl border border-border2 bg-card/90 backdrop-blur-2xl overflow-hidden shadow-[0_0_80px_rgba(255,107,53,0.08)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-4">
          {/* Premium avatar */}
          <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-orange via-warm to-purple" />
            <div className="absolute inset-[2px] rounded-[10px] bg-[#0e0e18] flex items-center justify-content">
              <svg viewBox="0 0 48 48" className="w-full h-full p-2" fill="none">
                {/* Stylised robot face */}
                <rect x="10" y="8" width="28" height="32" rx="6" fill="#1a1a2e" stroke="#ff6b35" strokeWidth="1.5"/>
                <rect x="16" y="16" width="6" height="3" rx="1" fill="#ff6b35"/>
                <rect x="26" y="16" width="6" height="3" rx="1" fill="#3b82f6"/>
                <rect x="18" y="26" width="12" height="2" rx="1" fill="#a855f7" opacity="0.7"/>
                <circle cx="24" cy="4" r="2" fill="#ff6b35"/>
                <line x1="24" y1="6" x2="24" y2="8" stroke="#ff6b35" strokeWidth="1.5"/>
                <rect x="6" y="20" width="4" height="8" rx="2" fill="#1a1a2e" stroke="#3b82f6" strokeWidth="1"/>
                <rect x="38" y="20" width="4" height="8" rx="2" fill="#1a1a2e" stroke="#3b82f6" strokeWidth="1"/>
              </svg>
            </div>
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_15px_rgba(255,107,53,0.3)]" />
          </div>
          <div className="flex-1">
            <div className="font-[family-name:var(--font-display)] text-base font-bold">Agent ENG-014</div>
            <div className="font-[family-name:var(--font-mono)] text-[11px] text-orange">Senior Code Reviewer</div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3 mt-0.5">Engineering / Floor 9</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange status-dot" />
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-orange">LIVE</span>
          </div>
        </div>

        {/* Current task */}
        <div className="px-5 py-3 bg-orange/[0.03] border-b border-border">
          <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3 mb-1.5">CURRENT TASK</div>
          <div className="font-[family-name:var(--font-display)] text-sm font-medium">Reviewing PR #847 -- auth middleware refactor</div>
        </div>

        {/* Stats */}
        <div className="p-5 space-y-3 font-[family-name:var(--font-mono)] text-xs">
          <div className="flex justify-between"><span className="text-text3">Files analyzed</span><span className="text-text">23 files</span></div>
          <div className="flex justify-between"><span className="text-text3">Issues found</span><span className="text-orange">3 critical, 7 suggestions</span></div>
          <div className="flex justify-between"><span className="text-text3">Lines reviewed</span><span className="text-text">4,218 lines</span></div>
          <div className="flex justify-between"><span className="text-text3">Continuous uptime</span><span className="text-text">14d 7h 23m</span></div>
          <div className="flex justify-between"><span className="text-text3">Tasks completed</span><span className="text-blue">1,847 total</span></div>
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-text3">Task progress</span>
              <span className="text-orange">73%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border2 overflow-hidden">
              <div className="h-full w-[73%] rounded-full bg-gradient-to-r from-orange to-warm" />
            </div>
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

          {/* ──── PHASE 3: AI Employee card ──── */}
          <div className={`phase-overlay z-10 items-center justify-end pr-8 md:pr-20 ${phase === 3 ? "active" : ""}`}
            style={{ opacity: phase === 3 ? 1 : 0, transition: "opacity 0.6s" }}>
            <EmployeeCard visible={phase === 3} />
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
