"use client";

import { useEffect, useState } from "react";

const WORDS = [
  "company",
  "sales team",
  "support team",
  "marketing",
  "operations",
  "finance",
  "back office",
];

export default function HeadlineCycler() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = setInterval(() => setI((p) => (p + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <h1 className="serif text-[56px] md:text-[96px] leading-[1.02] text-[#F5F1EA] text-center tracking-[-0.025em]">
      Your{" "}
      <span className="relative inline-block align-baseline">
        <span
          key={i}
          className="inline-block word-in italic text-[#F5F1EA]"
          style={{ minWidth: "4ch", fontWeight: 400 }}
        >
          {WORDS[i]}
        </span>
        <span key={`u-${i}`} className="underline-draw" aria-hidden="true" />
      </span>
      <br />
      runs itself.
    </h1>
  );
}
