"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Tiny top-edge progress strip — renders a 2px accent bar that wipes left to
 * right whenever the pathname changes, then fades out. No external lib.
 *
 * For perceived snappiness on slow API routes, the bar shows for 280ms minimum
 * even if the new page renders instantly.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setVisible(true);
    setProgress(20);
    // Quick reveal then settle near 80% — the route render itself completes
    // the loop by triggering the cleanup below.
    const t1 = setTimeout(() => setProgress(80), 80);
    const t2 = setTimeout(() => {
      setProgress(100);
    }, 280);
    const t3 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 480);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] pointer-events-none"
      style={{ height: 2 }}
    >
      <div
        className="h-full bg-[var(--color-accent)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          boxShadow: "0 0 12px var(--color-accent)",
        }}
      />
    </div>
  );
}
