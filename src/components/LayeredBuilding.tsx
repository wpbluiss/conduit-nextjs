"use client";

import { useEffect, useState } from "react";

const FLOORS = [
  "PRODUCT",
  "HR",
  "LEGAL",
  "FINANCE",
  "OPERATIONS",
  "MARKETING",
  "SUPPORT",
  "SALES",
  "ENGINEERING",
];

export default function LayeredBuilding() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="building-scene" aria-hidden="true">
      <div className="building">
        {FLOORS.map((label, idx) => (
          <div
            key={label}
            className="floor"
            style={{
              transitionDelay: `${(FLOORS.length - idx) * 80}ms`,
              transform: mounted ? "translateY(0)" : "translateY(24px)",
              opacity: mounted ? 1 : 0,
            }}
          >
            <span className="floor-label">{label}</span>
            <span className="floor-dot" />
          </div>
        ))}
      </div>
    </div>
  );
}
