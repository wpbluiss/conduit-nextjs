"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";

const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });
const IsometricBuilding = dynamic(() => import("./IsometricBuilding"), { ssr: false });

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Track scroll for building zoom
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setScrollProgress(v);
    });
  }, [scrollYProgress]);

  const headlineY = useTransform(scrollYProgress, [0, 0.3], [0, -150]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const badgeOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const subtextOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Zoom overlay text that appears as building zooms in
  const zoomLabelOpacity = useTransform(scrollYProgress, [0.4, 0.55, 0.75, 0.9], [0, 1, 1, 0]);
  const zoomLabelY = useTransform(scrollYProgress, [0.4, 0.55], [40, 0]);

  const employeeOpacity = useTransform(scrollYProgress, [0.65, 0.8, 0.9, 1], [0, 1, 1, 0]);
  const employeeY = useTransform(scrollYProgress, [0.65, 0.8], [60, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: "350vh" }}
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden scanline-overlay">
        {/* Ambient orbs - warm tones */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[15%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-orange/[0.06] blur-[140px]" />
          <div className="absolute -bottom-[10%] -left-[8%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-blue/[0.04] blur-[140px]" />
          <div className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-purple/[0.03] blur-[140px]" />
        </div>

        {/* Dot grid */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black, transparent)",
          }}
        />

        <ParticleField />

        {/* Hero text - fades out on scroll */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-28 px-6 pointer-events-none">
          <motion.div
            style={{ opacity: badgeOpacity }}
            className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-border2 bg-card/50 backdrop-blur-sm pointer-events-auto"
          >
            <span className="w-2 h-2 rounded-full bg-orange status-dot" />
            <span className="font-[family-name:var(--font-mono)] text-xs text-text2">
              SYSTEM ONLINE -- 236 AGENTS ACTIVE
            </span>
          </motion.div>

          <motion.h1
            style={{ y: headlineY, opacity: headlineOpacity }}
            className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,7rem)] font-extrabold leading-[0.95] tracking-[-0.04em] mb-6 max-w-5xl text-center"
          >
            <span className="block">Your company</span>
            <span className="block text-white">
              runs itself
            </span>
          </motion.h1>

          <motion.p
            style={{ opacity: subtextOpacity }}
            className="text-text2 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed text-center"
          >
            Conduit deploys autonomous AI employees across every department of
            your organization. Engineering, sales, support, finance, legal, HR,
            marketing, ops, and product -- all running 24/7.
          </motion.p>

          <motion.div
            style={{ opacity: ctaOpacity }}
            className="flex flex-col sm:flex-row gap-4 pointer-events-auto"
          >
            <a
              href="#waitlist"
              className="px-8 py-3.5 rounded-full font-semibold bg-white text-black hover:bg-white/90 hover:-translate-y-0.5 transition-all"
            >
              Request Access
            </a>
            <a
              href="#terminal"
              className="px-8 py-3.5 rounded-full font-semibold border border-border2 text-text2 hover:text-text hover:border-border3 hover:bg-card/50 transition-all"
            >
              Watch Deploy
            </a>
          </motion.div>
        </div>

        {/* Building - takes over as text fades */}
        <div className="absolute inset-0 z-5">
          <IsometricBuilding scrollProgress={scrollProgress} />
        </div>

        {/* Zoom-in overlay: department label */}
        <motion.div
          style={{ opacity: zoomLabelOpacity, y: zoomLabelY }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-border2 bg-card/80 backdrop-blur-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-orange status-dot" />
            <div>
              <div className="font-[family-name:var(--font-display)] font-bold text-sm">
                Engineering Department
              </div>
              <div className="font-[family-name:var(--font-mono)] text-[11px] text-text3">
                FLOOR 9 -- 47 AGENTS OPERATIONAL
              </div>
            </div>
          </div>
        </motion.div>

        {/* Zoom-in overlay: employee card */}
        <motion.div
          style={{ opacity: employeeOpacity, y: employeeY }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div className="w-[340px] rounded-xl border border-border2 bg-card/90 backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange to-warm flex items-center justify-center text-xs font-bold text-black">
                  AI
                </div>
                <div>
                  <div className="font-[family-name:var(--font-display)] text-sm font-semibold">Agent ENG-014</div>
                  <div className="font-[family-name:var(--font-mono)] text-[10px] text-orange">ACTIVE -- Code Review</div>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-orange status-dot" />
            </div>
            <div className="p-4 font-[family-name:var(--font-mono)] text-xs text-text2 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text3">Task</span>
                <span>PR #847 review</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text3">Files analyzed</span>
                <span>23 files</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text3">Issues found</span>
                <span className="text-orange">3 suggestions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text3">Uptime</span>
                <span>14d 7h 23m</span>
              </div>
              <div className="mt-3 h-1 rounded-full bg-border2 overflow-hidden">
                <div className="h-full w-[73%] rounded-full bg-gradient-to-r from-orange to-warm" />
              </div>
              <div className="text-[10px] text-text3 text-right">73% task progress</div>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator - only visible at start */}
        <motion.div
          style={{ opacity: badgeOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-text3 text-xs font-[family-name:var(--font-mono)] tracking-widest uppercase">
            Scroll
          </span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-orange/50 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
