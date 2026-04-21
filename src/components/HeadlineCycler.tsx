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
    <h1 className="serif text-[48px] md:text-[80px] leading-[1.05] text-[#F5F1EA] text-center">
      Your{" "}
      <span className="relative inline-block align-baseline">
        <span
          key={i}
          className="inline-block word-in text-[#FFB347]"
          style={{ minWidth: "4ch" }}
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
