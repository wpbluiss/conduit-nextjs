"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function FounderStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [0.94, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  return (
    <section id="founder" ref={ref} className="relative py-20 px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange/[0.02] rounded-full blur-[150px]" />
      </div>
      <div className="relative max-w-4xl mx-auto">
        <motion.div style={{ opacity }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border2 bg-card/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange" />
            <span className="font-[family-name:var(--font-mono)] text-xs text-text3 uppercase tracking-wider">Origin</span>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight">
            Built by <span className="text-orange">one person.</span>
          </h2>
        </motion.div>

        <motion.div style={{ y, scale, opacity }} className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden gpu-layer">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange to-transparent opacity-50" />
          <div className="p-8 md:p-12">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange/20 to-warm/20 border border-border2 flex items-center justify-center">
                  <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-orange">LG</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold mb-1">Luis Garcia</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-text2">Founder & CEO</span>
                  <span className="text-text3">|</span>
                  <span className="text-orange font-[family-name:var(--font-mono)] text-xs">AGE 21</span>
                  <span className="text-text3">|</span>
                  <span className="text-text3 font-[family-name:var(--font-mono)] text-xs">NO CS DEGREE</span>
                </div>
              </div>
            </div>
            <div className="space-y-5 text-text2 leading-relaxed">
              <p>Six weeks. That is all it took to go from zero to a fully autonomous AI workforce platform. No venture capital. No engineering team. No computer science degree. Just relentless execution and an obsession with building something that actually works.</p>
              <p>Most companies spend months debating what AI could do for them. Conduit was built in the time it takes most startups to finish their pitch deck. Every line of code, every system architecture decision, every deployment pipeline -- built solo from the ground up.</p>
              <p className="text-text font-medium">The future of work is not about replacing people. It is about giving every company -- regardless of size -- the operational capacity of a Fortune 500. Conduit makes that possible on day one.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-border">
              {[
                { value: "6", label: "WEEKS TO BUILD" },
                { value: "1", label: "ENGINEER" },
                { value: "9", label: "DEPARTMENTS" },
                { value: "236+", label: "AI AGENTS" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="font-[family-name:var(--font-display)] text-3xl font-bold text-text">{s.value}</div>
                  <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3 tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      <div className="h-16 bg-gradient-to-b from-transparent to-bg mt-12" />
    </section>
  );
}
