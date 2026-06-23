export default function BuildsLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-4xl">
        {/* Page heading */}
        <div className="mb-6 flex items-center gap-2">
          <div
            className="cx-skeleton"
            style={{ height: 32, width: 120, borderRadius: 6, opacity: 0.55 }}
          />
        </div>
        <div
          className="cx-skeleton mb-8"
          style={{ height: 12, width: 220, borderRadius: 9999, opacity: 0.3 }}
        />

        {/* Tab bar */}
        <div className="flex gap-2 mb-6">
          {[80, 110].map((w, i) => (
            <div
              key={i}
              className="cx-skeleton"
              style={{
                height: 32,
                width: w,
                borderRadius: 8,
                opacity: i === 0 ? 0.5 : 0.25,
              }}
            />
          ))}
        </div>

        {/* Build rows */}
        <div className="space-y-3">
          {[75, 60, 85, 55, 70].map((w, i) => (
            <div
              key={i}
              className="conduit-card flex items-center gap-4 px-4 py-4 rounded-xl"
              style={{ opacity: 0.42 - i * 0.04 }}
            >
              <div
                className="cx-skeleton shrink-0"
                style={{ width: 36, height: 36, borderRadius: 8 }}
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div
                  className="cx-skeleton"
                  style={{ height: 13, width: `${w}%`, borderRadius: 9999 }}
                />
                <div
                  className="cx-skeleton"
                  style={{ height: 10, width: "40%", borderRadius: 9999, opacity: 0.55 }}
                />
              </div>
              <div
                className="cx-skeleton shrink-0"
                style={{ height: 22, width: 60, borderRadius: 9999, opacity: 0.4 }}
              />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading builds…</span>
    </div>
  );
}
