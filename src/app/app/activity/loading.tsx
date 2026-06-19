export default function ActivityLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-0" aria-busy aria-live="polite">
      {/* Header */}
      <div
        className="px-6 py-5 shrink-0"
        style={{ borderBottom: "1px solid var(--cx-border, #262630)" }}
      >
        <div
          className="cx-skeleton"
          style={{ height: 26, width: 120, borderRadius: 6, opacity: 0.55 }}
        />
        <div
          className="cx-skeleton mt-2"
          style={{ height: 11, width: 200, borderRadius: 9999, opacity: 0.3 }}
        />
      </div>

      {/* Activity feed rows */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3 rounded-lg"
            style={{ opacity: 0.44 - i * 0.035 }}
          >
            <div
              className="cx-skeleton shrink-0 mt-0.5"
              style={{ width: 28, height: 28, borderRadius: 8 }}
            />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-baseline gap-2">
                <div
                  className="cx-skeleton"
                  style={{ height: 9, width: 60, borderRadius: 9999 }}
                />
              </div>
              <div
                className="cx-skeleton"
                style={{ height: 12, width: `${55 + ((i * 13) % 30)}%`, borderRadius: 9999 }}
              />
              <div
                className="cx-skeleton"
                style={{ height: 9, width: 40, borderRadius: 9999, opacity: 0.5 }}
              />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading activity…</span>
    </div>
  );
}
