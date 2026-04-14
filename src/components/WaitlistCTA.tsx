"use client";

import { useState, useRef, type FormEvent } from "react";
import { motion } from "framer-motion";

export default function WaitlistCTA() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const ref = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    await new Promise(r => setTimeout(r, 1200));
    setState("success");
    setEmail("");
  }

  return (
    <section id="waitlist" ref={ref} className="relative py-28 px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-orange/[0.03] rounded-full blur-[150px]" />
      </div>
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        whileInView={{ y: 0, opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative max-w-2xl mx-auto text-center gpu-layer">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border2 bg-card/50 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-orange status-dot" />
          <span className="font-[family-name:var(--font-mono)] text-xs text-text3 uppercase tracking-wider">Early Access</span>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Ready to deploy your <span className="text-white">AI workforce?</span>
        </h2>
        <p className="text-text2 max-w-lg mx-auto mb-10">Join the waitlist. Limited spots for the first cohort of companies running entirely on Conduit.</p>

        {state === "success" ? (
          <div className="rounded-xl border border-orange/30 bg-orange/5 p-8">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-2">You are on the list.</h3>
            <p className="text-text2 text-sm">We will reach out when your slot opens.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
              className="flex-1 px-4 py-3.5 rounded-full bg-card border border-border2 text-text font-[family-name:var(--font-mono)] text-sm placeholder:text-text3 focus:outline-none focus:border-white/20 transition-all" />
            <button type="submit" disabled={state === "loading"}
              className="px-8 py-3.5 rounded-full font-semibold text-sm bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 whitespace-nowrap">
              {state === "loading" ? "Deploying..." : "Join Waitlist"}
            </button>
          </form>
        )}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {["No credit card required", "Early access priority", "Cancel anytime"].map(item => (
            <div key={item} className="flex items-center gap-2 text-text3 text-xs font-[family-name:var(--font-mono)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-text2"><polyline points="20 6 9 17 4 12" /></svg>
              {item}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
