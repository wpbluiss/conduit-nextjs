export default function AnalyticsLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-8">
          <div
            className="cx-skeleton"
            style={{ height: 10, width: 160, borderRadius: 9999, opacity: 0.4, marginBottom: 8 }}
          />
          <div
            className="cx-skeleton"
            style={{ height: 36, width: 180, borderRadius: 6, opacity: 0.55 }}
          />
          <div
            className="cx-skeleton mt-2"
            style={{ height: 12, width: 280, borderRadius: 9999, opacity: 0.3 }}
          />
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "var(--space-3, 12px)",
            marginBottom: "var(--space-10, 40px)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="conduit-card p-5 space-y-2"
              style={{ opacity: 0.48 - i * 0.04 }}
            >
              <div
                className="cx-skeleton"
                style={{ height: 9, width: 120, borderRadius: 9999 }}
              />
              <div
                className="cx-skeleton"
                style={{ height: 32, width: 72, borderRadius: 6 }}
              />
              <div
                className="cx-skeleton"
                style={{ height: 9, width: 160, borderRadius: 9999, opacity: 0.55 }}
              />
            </div>
          ))}
        </div>

        {/* "Coming soon" card */}
        <div
          className="conduit-card p-6 md:p-8 space-y-3"
          style={{ opacity: 0.3 }}
        >
          <div
            className="cx-skeleton"
            style={{ height: 10, width: 100, borderRadius: 9999 }}
          />
          <div
            className="cx-skeleton"
            style={{ height: 24, width: 260, borderRadius: 6 }}
          />
          <div className="space-y-1.5">
            {[100, 90, 70].map((w, j) => (
              <div
                key={j}
                className="cx-skeleton"
                style={{ height: 10, width: `${w}%`, borderRadius: 9999 }}
              />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading analytics…</span>
    </div>
  );
}
