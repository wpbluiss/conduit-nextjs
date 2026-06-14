"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.25, 1, 0.5, 1] as const;

export type NavSection = {
  n: string;
  title: string;
};

export function ApproachProgressNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.n ?? "");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ n }) => {
      const el = document.getElementById(`approach-${n}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(n);
        },
        { rootMargin: "-18% 0px -62% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  return (
    <div className="hidden xl:block">
      <div className="sticky top-32">
        <AnimatePresence>
          {visible && (
            <motion.nav
              key="approach-nav"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.55, ease: EASE }}
              aria-label="Article sections"
            >
              <ol className="space-y-[2px]">
                {sections.map(({ n, title }) => {
                  const isActive = active === n;
                  return (
                    <li key={n}>
                      <a
                        href={`#approach-${n}`}
                        className="group flex items-start gap-2.5 py-2 pr-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ember-500)]"
                        onClick={(e) => {
                          e.preventDefault();
                          document
                            .getElementById(`approach-${n}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                      >
                        {/* Track indicator */}
                        <span
                          aria-hidden
                          className="mt-[5px] shrink-0 w-[2px] rounded-full transition-all duration-300"
                          style={{
                            height: "14px",
                            background: isActive
                              ? "var(--color-ember-500)"
                              : "var(--color-border-default)",
                            opacity: isActive ? 1 : 0.55,
                          }}
                        />
                        {/* Number */}
                        <span
                          className="shrink-0 text-[10px] tracking-[0.14em] uppercase font-semibold tabular-nums pt-px transition-colors duration-300"
                          style={{
                            color: isActive
                              ? "var(--color-ember-500)"
                              : "var(--color-ink-tertiary)",
                          }}
                        >
                          {n}
                        </span>
                        {/* Title */}
                        <span
                          className="text-[12px] leading-[1.45] transition-colors duration-300"
                          style={{
                            color: isActive
                              ? "var(--color-ink-primary)"
                              : "var(--color-ink-tertiary)",
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          {title}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
