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

/* ══════════════ HOLOGRAPHIC AI PROFILE — photorealistic portrait ═════════════ */
function HolographicProfile({ visible }: { visible: boolean }) {
  return (
    <div
      className="gpu-layer flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 w-full max-w-5xl mx-auto px-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateZ(0)" : "scale(0.92) translateZ(0)",
        transition: "opacity 0.8s ease, transform 1s cubic-bezier(0.16,1,0.3,1)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* ─── Left: photorealistic holographic portrait ─── */}
      <div className="relative flex-shrink-0">
        <div className="relative w-[320px] h-[420px] md:w-[360px] md:h-[480px]">
          {/* Outer ambient glow */}
          <div className="absolute -inset-12 rounded-3xl bg-orange/[0.1] blur-3xl" />
          <div className="absolute -inset-10 rounded-3xl bg-blue/[0.05] blur-2xl" />

          {/* Pulsing border ring */}
          <div
            className="absolute -inset-[2px] rounded-2xl"
            style={{
              background: visible
                ? "linear-gradient(135deg, #ff6b35 0%, #3b82f6 35%, #a855f7 65%, #ff6b35 100%)"
                : "transparent",
              backgroundSize: "300% 300%",
              animation: visible ? "holoShift 4s ease infinite" : "none",
              opacity: 0.85,
            }}
          />

          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#060610]" style={{ boxShadow: "0 0 40px 8px rgba(255,107,53,0.12), 0 0 80px 20px rgba(255,107,53,0.06)" }}>
            {/* Real portrait photo */}
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=85&auto=format&fit=crop&crop=face&facepad=2.5"
              alt="AI Agent ENG-014"
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{
                filter: "saturate(0.35) contrast(1.15) brightness(0.7)",
                mixBlendMode: "luminosity",
              }}
              loading="eager"
            />

            {/* Holographic color tint overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(160deg, rgba(255,107,53,0.15) 0%, rgba(59,130,246,0.12) 50%, rgba(168,85,247,0.1) 100%)",
                mixBlendMode: "color",
              }}
            />

            {/* Additive glow layer — warm highlights */}
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at 50% 30%, rgba(255,107,53,0.12) 0%, transparent 60%)",
              }}
            />

            {/* Scan line sweep */}
            <div
              className="absolute left-0 right-0 h-[3px] z-20"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,107,53,0.5) 20%, rgba(59,130,246,0.6) 50%, rgba(255,107,53,0.5) 80%, transparent 100%)",
                boxShadow: "0 0 20px 4px rgba(255,107,53,0.15)",
                animation: visible ? "holoScan 3s ease-in-out infinite" : "none",
              }}
            />

            {/* Secondary slower scan */}
            <div
              className="absolute left-0 right-0 h-[1px] z-20 opacity-50"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)",
                animation: visible ? "holoScan 5s ease-in-out infinite reverse" : "none",
              }}
            />

            {/* Horizontal interference lines */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)",
              }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 z-10" style={{ boxShadow: "inset 0 0 80px 20px rgba(5,5,8,0.8)" }} />

            {/* Bottom fade to data */}
            <div className="absolute bottom-0 left-0 right-0 h-24 z-10 bg-gradient-to-t from-[#060610] via-[#060610cc] to-transparent" />

            {/* Corner targeting brackets */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-orange/50 z-20" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-orange/50 z-20" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue/40 z-20" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue/40 z-20" />

            {/* Glitch / flicker */}
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{ animation: visible ? "holoFlicker 0.1s steps(3) infinite" : "none" }}
            />

            {/* Classification label at top */}
            <div className="absolute top-4 left-0 right-0 z-20 flex justify-center">
              <div className="px-3 py-1 rounded bg-black/40 backdrop-blur-sm border border-orange/20">
                <span className="font-[family-name:var(--font-mono)] text-[9px] text-orange tracking-[0.2em]">
                  BIOMETRIC SCAN -- ACTIVE
                </span>
              </div>
            </div>

            {/* Bottom ID overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="font-[family-name:var(--font-mono)] text-[9px] text-text3 flex justify-between">
                <span>ID: ENG-014-A3F8</span>
                <span>CLEARANCE: ALPHA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right: data panel ─── */}
      <div className="w-[340px] max-w-full">
        <div className="rounded-2xl border border-border2 bg-[#08080ef0] backdrop-blur-2xl overflow-hidden shadow-[0_0_60px_rgba(255,107,53,0.06)]">
          {/* Header */}
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange status-dot" />
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-orange tracking-[0.12em]">AGENT PROFILE</span>
            </div>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-text3">LVL-9 // CLASSIFIED</span>
          </div>

          {/* Identity */}
          <div className="p-5 pb-4">
            <div className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">Agent ENG-014</div>
            <div className="font-[family-name:var(--font-mono)] text-xs text-orange mt-0.5">Senior Code Reviewer</div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3 mt-1">ENGINEERING DEPT / FLOOR 9</div>

            {/* Efficiency ring */}
            <div className="flex items-center gap-4 mt-4">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 56 56" className="w-full h-full">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#1a1a2e" strokeWidth="3" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#ff6b35" strokeWidth="3"
                    strokeDasharray="151" strokeDashoffset="41" strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 6px rgba(255,107,53,0.5))" }} />
                  <text x="28" y="31" textAnchor="middle" fill="#ff6b35" fontSize="14" fontFamily="var(--font-mono)" fontWeight="700">73</text>
                </svg>
              </div>
              <div>
                <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3">EFFICIENCY SCORE</div>
                <div className="font-[family-name:var(--font-mono)] text-sm text-orange font-bold">EXCEPTIONAL</div>
              </div>
            </div>
          </div>

          {/* Active operation */}
          <div className="mx-5 mb-4 rounded-lg border border-orange/10 bg-orange/[0.02] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange status-dot" />
              <span className="font-[family-name:var(--font-mono)] text-[9px] text-orange tracking-[0.12em]">ACTIVE OPERATION</span>
            </div>
            <div className="font-[family-name:var(--font-display)] text-sm font-medium">PR #847 -- Auth middleware refactor</div>
          </div>

          {/* Telemetry */}
          <div className="grid grid-cols-2 gap-[1px] bg-white/[0.03] mx-5 mb-5 rounded-lg overflow-hidden">
            {[
              { label: "FILES", value: "23", color: "" },
              { label: "CRITICAL", value: "3", color: "text-orange" },
              { label: "LINES", value: "4,218", color: "" },
              { label: "UPTIME", value: "14d 7h", color: "" },
              { label: "COMPLETED", value: "1,847", color: "text-blue" },
              { label: "RESPONSE", value: "0.8s", color: "text-purple" },
            ].map(item => (
              <div key={item.label} className="bg-[#0a0a12] px-3 py-2.5">
                <div className="font-[family-name:var(--font-mono)] text-[8px] text-text3 tracking-[0.08em] mb-0.5">{item.label}</div>
                <span className={`font-[family-name:var(--font-display)] text-lg font-bold tabular-nums ${item.color || "text-text"}`}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-text3">HASH 0xA3F8..E014</span>
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-text3">CLEARANCE ALPHA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Work view (code review output) ───────────────────────────── */
function WorkView({ visible }: { visible: boolean }) {
  return (
    <div
      className="gpu-layer"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateZ(0)" : "scale(0.95) translateZ(0)",
        transition: "opacity 0.7s, transform 0.7s",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div className="w-[520px] max-w-[92vw] rounded-2xl border border-border2 bg-[#08080ef0] shadow-[0_0_80px_rgba(0,0,0,0.6),0_0_40px_rgba(255,107,53,0.04)] overflow-hidden backdrop-blur-2xl">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-[#0a0a12]">
          <div className="w-2.5 h-2.5 rounded-full bg-red/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warm/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue/60" />
          <span className="ml-2 font-[family-name:var(--font-mono)] text-[10px] text-text3">agent-eng-014 / pr-847-review.md</span>
        </div>
        <div className="p-4 font-[family-name:var(--font-mono)] text-[11px] leading-5 space-y-2 max-h-[300px] overflow-hidden">
          <div className="text-text3">// PR #847 -- Auth Middleware Refactor</div>
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

/* ────────────── CEO Suite / Command Center ──────────────────────────── */
function CEOSuite({ visible }: { visible: boolean }) {
  return (
    <div
      className="gpu-layer"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) translateZ(0)" : "translateY(20px) translateZ(0)",
        transition: "opacity 0.7s, transform 0.7s",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div className="w-[520px] max-w-[92vw] rounded-2xl border border-border2 bg-[#0a0a14f0] backdrop-blur-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.4)]">
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

  const updatePhase = useCallback((progress: number) => {
    scrollState.progress = progress;
    let p = 0;
    if (progress < 0.12) p = 0;
    else if (progress < 0.25) p = 1;
    else if (progress < 0.35) p = 2;
    else if (progress < 0.55) p = 3;
    else if (progress < 0.65) p = 4;
    else if (progress < 0.78) p = 5;
    else if (progress < 0.88) p = 6;
    else p = 7;
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
      <div ref={containerRef} style={{ height: "700vh" }} className="relative">
        <div ref={pinnedRef} className="h-screen w-full overflow-hidden relative">
          {/* 3D Canvas — z-0, always behind overlays */}
          <div className="absolute inset-0 z-0">
            <ScrollScene />
          </div>

          {/* Scanlines */}
          <div className="scanlines absolute inset-0 z-[1] pointer-events-none" />

          {/* Dot grid — fades during close-up phases */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-500"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              opacity: phase <= 1 ? 1 : 0.3,
            }}
          />

          {/* Ambient orbs behind everything */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[15%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-orange/[0.05] blur-[140px] gpu-layer" />
            <div className="absolute -bottom-[10%] -left-[8%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-blue/[0.04] blur-[140px] gpu-layer" />
            <div className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-purple/[0.03] blur-[140px] gpu-layer" />
          </div>

          {/* ━━━━━━━━━━━━━ Phase overlays — all z-20, above canvas ━━━━━━━━━━━━━ */}

          {/* PHASE 0: Hero text */}
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-28 px-6 gpu-layer"
            style={{
              opacity: phase === 0 ? 1 : 0,
              transform: phase === 0 ? "translateY(0) translateZ(0)" : "translateY(-60px) translateZ(0)",
              transition: "opacity 0.6s ease, transform 0.8s ease",
              pointerEvents: phase === 0 ? "auto" : "none",
            }}
          >
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

          {/* PHASE 2: Floor label */}
          <div
            className="absolute inset-0 z-20 flex items-end justify-center pb-20 gpu-layer"
            style={{
              opacity: phase === 2 ? 1 : 0,
              transform: phase === 2 ? "translateY(0) translateZ(0)" : "translateY(30px) translateZ(0)",
              transition: "opacity 0.5s, transform 0.6s",
              pointerEvents: "none",
            }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-border2 bg-card/80 backdrop-blur-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-orange status-dot" />
              <div>
                <div className="font-[family-name:var(--font-display)] font-bold text-sm">Engineering Department</div>
                <div className="font-[family-name:var(--font-mono)] text-[11px] text-text3">FLOOR 9 -- 47 AGENTS -- ENTERING</div>
              </div>
            </div>
          </div>

          {/* PHASE 3: Holographic AI Profile — centered, full attention */}
          <div
            className="absolute inset-0 z-20 flex items-center justify-center gpu-layer"
            style={{
              opacity: phase === 3 ? 1 : 0,
              transition: "opacity 0.8s ease",
              pointerEvents: phase === 3 ? "auto" : "none",
            }}
          >
            <HolographicProfile visible={phase === 3} />
          </div>

          {/* PHASE 4: Work view — centered */}
          <div
            className="absolute inset-0 z-20 flex items-center justify-center gpu-layer"
            style={{
              opacity: phase === 4 ? 1 : 0,
              transition: "opacity 0.6s",
              pointerEvents: phase === 4 ? "auto" : "none",
            }}
          >
            <WorkView visible={phase === 4} />
          </div>

          {/* PHASE 5: CEO Suite — centered */}
          <div
            className="absolute inset-0 z-20 flex items-center justify-center gpu-layer"
            style={{
              opacity: phase === 5 ? 1 : 0,
              transition: "opacity 0.6s",
              pointerEvents: phase === 5 ? "auto" : "none",
            }}
          >
            <CEOSuite visible={phase === 5} />
          </div>

          {/* PHASE 6: Terminal — centered */}
          <div
            className="absolute inset-0 z-20 flex items-center justify-center px-6 gpu-layer"
            style={{
              opacity: phase >= 6 ? 1 : 0,
              transform: phase >= 6 ? "scale(1) translateZ(0)" : "scale(0.95) translateZ(0)",
              transition: "opacity 0.6s, transform 0.6s",
              pointerEvents: phase >= 6 ? "auto" : "none",
            }}
          >
            <TerminalContent active={phase >= 6} />
          </div>
        </div>
      </div>

      {/* ─── Flowing sections after pinned experience ─── */}
      {/* Morph bridge: gradient fade from pinned section */}
      <div className="relative z-10 -mt-1">
        <div className="h-40 bg-gradient-to-b from-bg via-bg to-bg2" />
      </div>

      <div id="departments-section">
        <DepartmentGrid />
      </div>

      {/* Morph bridge */}
      <div className="h-24 bg-gradient-to-b from-bg to-bg2 relative z-10" />

      <FounderStory />

      {/* Morph bridge */}
      <div className="h-20 bg-gradient-to-b from-bg to-bg relative z-10" />

      <div id="waitlist-section">
        <WaitlistCTA />
      </div>
    </>
  );
}
