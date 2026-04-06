"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-[1000] flex h-[60px] items-center justify-between px-6 transition-all duration-500 ${
          scrolled
            ? "bg-bg/90 shadow-[0_4px_30px_rgba(0,0,0,0.4)] border-b border-border2 backdrop-blur-xl"
            : "bg-transparent border-b border-transparent backdrop-blur-sm"
        }`}
      >
        <a href="#" className="flex items-center gap-2 group">
          <span className="font-[family-name:var(--font-display)] font-bold text-[1.15rem] tracking-[-0.03em]">
            Conduit
          </span>
          <span className="font-[family-name:var(--font-display)] font-light text-[1.15rem] tracking-[-0.03em] text-text2">
            AI
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#departments" className="text-text2 text-sm font-medium hover:text-text transition-colors">
            Departments
          </a>
          <a href="#terminal" className="text-text2 text-sm font-medium hover:text-text transition-colors">
            Deploy
          </a>
          <a href="#founder" className="text-text2 text-sm font-medium hover:text-text transition-colors">
            Story
          </a>
          <a
            href="#waitlist"
            className="relative px-5 py-2 rounded-full font-semibold text-sm bg-white text-black hover:bg-white/90 hover:-translate-y-0.5 transition-all"
          >
            Join Waitlist
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1 p-1"
          aria-label="Menu"
        >
          <span className={`block w-5 h-0.5 bg-text rounded transition-all ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`block w-5 h-0.5 bg-text rounded transition-all ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-text rounded transition-all ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[60px] left-0 right-0 z-[999] bg-bg/95 backdrop-blur-xl border-b border-border2 p-6 flex flex-col gap-4 md:hidden"
          >
            <a href="#departments" onClick={() => setMobileOpen(false)} className="text-text2 font-medium py-2 border-b border-border hover:text-text transition-colors">Departments</a>
            <a href="#terminal" onClick={() => setMobileOpen(false)} className="text-text2 font-medium py-2 border-b border-border hover:text-text transition-colors">Deploy</a>
            <a href="#founder" onClick={() => setMobileOpen(false)} className="text-text2 font-medium py-2 border-b border-border hover:text-text transition-colors">Story</a>
            <a href="#waitlist" onClick={() => setMobileOpen(false)} className="px-5 py-2.5 rounded-full font-semibold text-center bg-white text-black">Join Waitlist</a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
