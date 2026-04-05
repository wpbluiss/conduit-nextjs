"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });
const IsometricBuilding = dynamic(() => import("./IsometricBuilding"), {
  ssr: false,
});

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden scanline-overlay">
      {/* Ambient orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-accent/[0.06] blur-[140px] animate-[ambFloat_30s_ease-in-out_infinite]" />
        <div className="absolute -bottom-[10%] -left-[8%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-blue/[0.04] blur-[140px] animate-[ambFloat_30s_ease-in-out_infinite_-10s]" />
        <div className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-orange/[0.03] blur-[140px] animate-[ambFloat_30s_ease-in-out_infinite_-20s]" />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 70% 50% at 50% 30%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 50% at 50% 30%, black, transparent)",
        }}
      />

      <ParticleField />

      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-8">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-border2 bg-card/50 backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-accent status-dot" />
          <span className="font-[family-name:var(--font-mono)] text-xs text-text2">
            SYSTEM ONLINE -- 236 AGENTS ACTIVE
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,7rem)] font-extrabold leading-[0.95] tracking-[-0.04em] mb-6 max-w-5xl"
        >
          <span className="block">Your company</span>
          <span className="block bg-gradient-to-r from-accent via-accent2 to-blue bg-clip-text text-transparent">
            runs itself
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-text2 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed"
        >
          Conduit deploys autonomous AI employees across every department of
          your organization. Engineering, sales, support, finance, legal, HR,
          marketing, ops, and product -- all running 24/7.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <a
            href="#waitlist"
            className="relative px-8 py-3.5 rounded-lg font-semibold text-bg bg-accent shadow-[0_0_20px_var(--color-glow-green)] hover:shadow-[0_0_40px_var(--color-glow-green)] hover:-translate-y-0.5 transition-all group"
          >
            <span className="relative z-10">Request Access</span>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent to-accent2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          <a
            href="#terminal"
            className="px-8 py-3.5 rounded-lg font-semibold border border-border2 text-text2 hover:text-text hover:border-border3 hover:bg-card/50 transition-all"
          >
            Watch Deploy
          </a>
        </motion.div>
      </div>

      {/* 3D Building */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 1 }}
        className="relative z-10 w-full max-w-4xl mx-auto"
      >
        <IsometricBuilding />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-text3 text-xs font-[family-name:var(--font-mono)] tracking-widest uppercase">
          Scroll
        </span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-accent/50 to-transparent" />
      </motion.div>
    </section>
  );
}
