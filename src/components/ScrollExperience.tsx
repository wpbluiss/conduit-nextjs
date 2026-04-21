"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
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
        <div className="relative w-[260px] h-[340px] sm:w-[320px] sm:h-[420px] md:w-[360px] md:h-[480px]">
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
      <div className="w-[300px] sm:w-[340px] max-w-full">
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
      <div className="w-[440px] sm:w-[520px] max-w-[94vw] rounded-2xl border border-border2 bg-[#0a0a14f0] backdrop-blur-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.4)]">
        <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-[family-name:var(--font-display)] text-sm font-bold">Command Center</div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3">CEO SUITE -- ALL DEPARTMENTS</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange status-dot" />
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-orange">LIVE</span>
          </div>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-3 gap-1.5 sm:gap-2">
          {[
            { name: "ENG", count: 47, color: "#ff6b35", load: 87 },
            { name: "SALES", count: 31, color: "#3b82f6", load: 92 },
            { name: "MKT", count: 24, color: "#f59e0b", load: 78 },
            { name: "SUP", count: 38, color: "#00c9ff", load: 95 },
            { name: "FIN", count: 19, color: "#a855f7", load: 63 },
            { name: "HR", count: 15, color: "#f59e0b", load: 54 },
            { name: "LEGAL", count: 12, color: "#ef4444", load: 71 },
            { name: "OPS", count: 28, color: "#6366f1", load: 83 },
            { name: "PROD", count: 22, color: "#3b82f6", load: 76 },
          ].map(d => (
            <div key={d.name} className="rounded-lg border border-border bg-bg2/60 p-2.5 text-center">
              <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3 mb-1">{d.name}</div>
              <div className="font-[family-name:var(--font-display)] text-lg font-bold" style={{ color: d.color }}>{d.count}</div>
              <div className="mt-1.5 h-0.5 rounded-full bg-border2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.load}%`, backgroundColor: d.color }} />
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

/* ────────────── Features / Social Proof ────────────────────────────── */
function FeaturesSection() {
  const FEATURES = [
    { icon: "⚡", title: "Instant Deployment", desc: "Go from zero to a full AI workforce in under 60 seconds. No setup, no training, no onboarding." },
    { icon: "🔒", title: "Enterprise Security", desc: "SOC 2 compliant infrastructure. End-to-end encryption. Your data never leaves your environment." },
    { icon: "🔄", title: "24/7 Operations", desc: "Your AI employees never sleep, never take breaks, and never miss a deadline. 99.97% uptime guaranteed." },
    { icon: "📊", title: "Real-Time Analytics", desc: "Monitor every department, every agent, every task from a single command center dashboard." },
    { icon: "🧠", title: "Self-Improving", desc: "Agents learn from every interaction. Performance improves continuously without manual intervention." },
    { icon: "🔌", title: "Seamless Integration", desc: "Works with your existing tools — Slack, GitHub, Salesforce, HubSpot, and 200+ more integrations." },
  ];

  return (
    <section className="relative py-20 px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-blue/[0.015] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-orange/[0.015] rounded-full blur-[150px]" />
      </div>
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border2 bg-card/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange" />
            <span className="font-[family-name:var(--font-mono)] text-xs text-text3 uppercase tracking-wider">Capabilities</span>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Everything your team needs. <span className="text-orange">Automated.</span>
          </h2>
          <p className="text-text2 max-w-xl mx-auto">Built for companies that want to operate at scale without scaling headcount.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group relative rounded-xl border border-border bg-card/30 p-6 hover:border-border2 hover:bg-card/60 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-60 transition-opacity bg-gradient-to-r from-transparent via-orange to-transparent" />
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-[family-name:var(--font-display)] font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-text3 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Social proof bar */}
        <div className="mt-16 rounded-xl border border-border bg-card/30 backdrop-blur-sm p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: "236", label: "AI Agents Deployed", color: "text-orange" },
              { value: "99.97%", label: "Uptime SLA", color: "text-blue" },
              { value: "<1.2s", label: "Avg Response Time", color: "text-purple" },
              { value: "0", label: "Human Intervention Required", color: "text-warm" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3 tracking-wider mt-1 uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════ MAIN SCROLL EXPERIENCE ═══════════════════════ */
export default function ScrollExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);

  const updatePhase = useCallback((progress: number) => {
    scrollState.progress = progress;
    let p = 0;
    if (progress < 0.10) p = 0;
    else if (progress < 0.18) p = 1;
    else if (progress < 0.28) p = 2;
    else if (progress < 0.48) p = 3;
    else if (progress < 0.60) p = 4;
    else if (progress < 0.75) p = 5;
    else if (progress < 0.88) p = 6;
    else p = 7;
    // Only trigger React re-render when phase actually changes
    if (phaseRef.current !== p) {
      phaseRef.current = p;
      setPhase(p);
    }
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
            className={`absolute inset-0 z-20 flex flex-col items-center justify-start pt-20 sm:pt-28 px-4 sm:px-6 gpu-layer${phase === 0 ? " active" : ""}`}
            style={{
              opacity: phase === 0 ? 1 : 0,
              visibility: phase === 0 ? "visible" : "hidden",
              transform: phase === 0 ? "translateY(0) scale(1) translateZ(0)" : "translateY(-30px) scale(0.97) translateZ(0)",
              transition: "opacity 0.8s ease, transform 1s cubic-bezier(0.16,1,0.3,1), visibility 0s linear " + (phase === 0 ? "0s" : "1s"),
              pointerEvents: phase === 0 ? "auto" : "none",
            }}
          >
            <div className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-border2 bg-card/50 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-orange status-dot" />
              <span className="font-[family-name:var(--font-mono)] text-xs text-text2">SYSTEM ONLINE -- 236 AGENTS ACTIVE</span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,7vw,7rem)] font-extrabold leading-[0.95] tracking-[-0.04em] mb-4 sm:mb-6 max-w-5xl text-center">
              <span className="block">Your company</span>
              <span className="block text-white">runs itself</span>
            </h1>
            <p className="text-text2 text-base sm:text-lg md:text-xl max-w-2xl mb-6 sm:mb-8 leading-relaxed text-center px-2">
              Conduit deploys autonomous AI employees across every department.
              Engineering, sales, support, finance, legal, HR, marketing, ops, and product -- all running 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#waitlist-section" onClick={(e) => { e.preventDefault(); document.getElementById("waitlist-section")?.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-3.5 rounded-full font-semibold bg-white text-black hover:bg-white/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all duration-300">Request Access</a>
              <button onClick={() => { const el = document.getElementById("departments-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} className="px-8 py-3.5 rounded-full font-semibold border border-border2 text-text2 hover:text-text hover:border-orange/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                <span className="flex items-center gap-2">Watch Deploy <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></span>
              </button>
            </div>
            <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2">
              <span className="text-text2 text-xs font-[family-name:var(--font-mono)] tracking-[0.2em] uppercase">Scroll to explore</span>
              <div className="w-[1px] h-10 bg-gradient-to-b from-orange/60 via-orange/20 to-transparent" style={{ animation: "scrollPulse 2s ease-in-out infinite" }} />
            </div>
          </div>

          {/* PHASE 1: Entering building — transition indicator */}
          <div
            className={`absolute inset-0 z-20 flex items-end justify-center pb-24 gpu-layer${phase === 1 ? " active" : ""}`}
            style={{
              opacity: phase === 1 ? 1 : 0,
              visibility: phase === 1 ? "visible" : "hidden",
              transform: phase === 1 ? "translateY(0) translateZ(0)" : "translateY(20px) translateZ(0)",
              transition: "opacity 0.6s, transform 0.7s, visibility 0s linear " + (phase === 1 ? "0s" : "0.7s"),
              pointerEvents: "none",
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border2 bg-card/60 backdrop-blur-xl">
                <span className="w-2 h-2 rounded-full bg-orange status-dot" />
                <span className="font-[family-name:var(--font-mono)] text-xs text-text2 tracking-wider">ENTERING CONDUIT HQ</span>
              </div>
              <div className="w-[1px] h-10 bg-gradient-to-b from-orange/40 to-transparent" />
            </div>
          </div>

          {/* PHASE 2: Floor label */}
          <div
            className={`absolute inset-0 z-20 flex items-end justify-center pb-20 gpu-layer${phase === 2 ? " active" : ""}`}
            style={{
              opacity: phase === 2 ? 1 : 0,
              visibility: phase === 2 ? "visible" : "hidden",
              transform: phase === 2 ? "translateY(0) translateZ(0)" : "translateY(30px) translateZ(0)",
              transition: "opacity 0.5s, transform 0.6s, visibility 0s linear " + (phase === 2 ? "0s" : "0.6s"),
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
            className={`absolute inset-0 z-20 flex items-center justify-center gpu-layer${phase === 3 ? " active" : ""}`}
            style={{
              opacity: phase === 3 ? 1 : 0,
              visibility: phase === 3 ? "visible" : "hidden",
              transition: "opacity 0.8s ease, visibility 0s linear " + (phase === 3 ? "0s" : "0.8s"),
              pointerEvents: phase === 3 ? "auto" : "none",
            }}
          >
            <HolographicProfile visible={phase === 3} />
          </div>

          {/* PHASE 4: Work view — centered */}
          <div
            className={`absolute inset-0 z-20 flex items-center justify-center gpu-layer${phase === 4 ? " active" : ""}`}
            style={{
              opacity: phase === 4 ? 1 : 0,
              visibility: phase === 4 ? "visible" : "hidden",
              transition: "opacity 0.6s, visibility 0s linear " + (phase === 4 ? "0s" : "0.6s"),
              pointerEvents: phase === 4 ? "auto" : "none",
            }}
          >
            <WorkView visible={phase === 4} />
          </div>

          {/* PHASE 5: CEO Suite — centered */}
          <div
            className={`absolute inset-0 z-20 flex items-center justify-center gpu-layer${phase === 5 ? " active" : ""}`}
            style={{
              opacity: phase === 5 ? 1 : 0,
              visibility: phase === 5 ? "visible" : "hidden",
              transition: "opacity 0.6s, visibility 0s linear " + (phase === 5 ? "0s" : "0.6s"),
              pointerEvents: phase === 5 ? "auto" : "none",
            }}
          >
            <CEOSuite visible={phase === 5} />
          </div>

          {/* PHASE 6: Terminal — centered */}
          <div
            className={`absolute inset-0 z-20 flex items-center justify-center px-6 gpu-layer${phase >= 6 ? " active" : ""}`}
            style={{
              opacity: phase >= 6 ? 1 : 0,
              visibility: phase >= 6 ? "visible" : "hidden",
              transform: phase >= 6 ? "scale(1) translateZ(0)" : "scale(0.95) translateZ(0)",
              transition: "opacity 0.6s, transform 0.6s, visibility 0s linear " + (phase >= 6 ? "0s" : "0.6s"),
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
        <div className="h-40 bg-gradient-to-b from-bg via-bg/80 to-transparent" />
      </div>

      <div id="departments-section">
        <DepartmentGrid />
      </div>

      {/* Morph bridge with subtle divider */}
      <div className="relative z-10 py-6">
        <div className="h-28 bg-gradient-to-b from-transparent via-bg2/40 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent via-border3 to-transparent opacity-60" />
      </div>

      <FounderStory />

      {/* Features / social proof section */}
      <div className="relative z-10 py-6">
        <div className="h-24 bg-gradient-to-b from-transparent via-bg2/40 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent via-border3 to-transparent opacity-60" />
      </div>

      <FeaturesSection />

      {/* Morph bridge to waitlist */}
      <div className="relative z-10 py-6">
        <div className="h-24 bg-gradient-to-b from-transparent via-bg2/30 to-transparent" />
      </div>

      <div id="waitlist-section">
        <WaitlistCTA />
      </div>
    </>
  );
}
