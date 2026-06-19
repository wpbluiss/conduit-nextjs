"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileCode } from "lucide-react";
import type { FileTouch } from "@/lib/engineering/step-taxonomy";

interface Props {
  files: FileTouch[];
}

/**
 * Middle stage — horizontally-scrolling chips, most-recent pulse,
 * spark-bar sweep on new file event. CSS-only animations (gated
 * by reduced-motion in engineering-cinema.css).
 */
export function BuildCraftStrip({ files }: Props) {
  // Distinct paths in append order — most-recent kind wins.
  const chips = useMemo(() => {
    const map = new Map<string, "write" | "edit">();
    for (const t of files) {
      // EDIT overrides WRITE in display kind; preserves "this file was touched again"
      map.set(t.path, t.kind === "edit" || map.get(t.path) === "edit" ? "edit" : "write");
    }
    return [...map.entries()].map(([path, kind]) => ({ path, kind }));
  }, [files]);

  const recentPath = chips.length > 0 ? chips[chips.length - 1].path : null;

  // Spark counter increments on each new chip; data-spark drives the CSS keyframe.
  const [sparkSeq, setSparkSeq] = useState(0);
  const lastCountRef = useRef(chips.length);
  useEffect(() => {
    if (chips.length > lastCountRef.current) {
      setSparkSeq((n) => (n + 1) % 3); // cycle 0→1→2→0 so data-spark always changes value
    }
    lastCountRef.current = chips.length;
  }, [chips.length]);

  // Auto-scroll the strip to the latest chip on each new file.
  const stripRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    // Use scrollWidth - clientWidth so we don't fight a user-initiated mid-scroll.
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [chips.length]);

  return (
    <section
      className="eng-cinema-craft"
      data-spark={sparkSeq}
      aria-label="Files Engineering has touched"
    >
      <div className="eng-cinema-craft-head">
        <span className="eng-cinema-craft-title">Files touched</span>
        <span className="eng-cinema-craft-count">
          {chips.length === 0 ? "—" : `${chips.length} ${chips.length === 1 ? "file" : "files"}`}
        </span>
      </div>
      {chips.length === 0 ? (
        <p className="eng-cinema-craft-empty">
          Files Engineering writes will appear here.
        </p>
      ) : (
        <div className="eng-cinema-craft-strip" ref={stripRef}>
          {chips.map(({ path, kind }) => (
            <span
              key={path}
              className="eng-cinema-chip"
              data-kind={kind}
              data-recent={path === recentPath ? "true" : undefined}
              title={path}
            >
              <FileCode size={11} strokeWidth={1.75} aria-hidden />
              <span>{path}</span>
            </span>
          ))}
        </div>
      )}
      <span className="eng-cinema-spark" aria-hidden />
    </section>
  );
}
