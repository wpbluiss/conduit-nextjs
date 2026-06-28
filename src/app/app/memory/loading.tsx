export default function MemoryLoading() {
  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      aria-busy
      aria-live="polite"
    >
      {/* Toolbar skeleton */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--cx-border, #262630)" }}
      >
        <div
          className="cx-skeleton"
          style={{ height: 28, width: 180, borderRadius: 8, opacity: 0.45 }}
        />
        <div className="flex gap-1.5 ml-auto">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="cx-skeleton"
              style={{ height: 28, width: 80, borderRadius: 8, opacity: 0.3 - i * 0.03 }}
            />
          ))}
        </div>
      </div>

      {/* Canvas area — dotted grid feel */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ background: "var(--cx-canvas, #0B0B0F)" }}
      >
        {/* Scattered node placeholders */}
        {[
          { top: "18%", left: "15%", w: 160, h: 72 },
          { top: "12%", left: "42%", w: 200, h: 88 },
          { top: "15%", left: "70%", w: 144, h: 64 },
          { top: "45%", left: "8%", w: 176, h: 80 },
          { top: "42%", left: "35%", w: 220, h: 96 },
          { top: "40%", left: "65%", w: 160, h: 72 },
          { top: "68%", left: "22%", w: 192, h: 84 },
          { top: "66%", left: "52%", w: 168, h: 76 },
        ].map((node, i) => (
          <div
            key={i}
            className="cx-skeleton absolute"
            style={{
              top: node.top,
              left: node.left,
              width: node.w,
              height: node.h,
              borderRadius: 12,
              opacity: 0.22 - i * 0.01,
            }}
          />
        ))}
      </div>
      <span className="sr-only">Loading memory…</span>
    </div>
  );
}
