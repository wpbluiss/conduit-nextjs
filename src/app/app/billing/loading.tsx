export default function BillingLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-4xl">
        {/* Heading */}
        <div className="mb-8">
          <div
            className="cx-skeleton"
            style={{ height: 32, width: 140, borderRadius: 6, opacity: 0.55 }}
          />
          <div
            className="cx-skeleton mt-2"
            style={{ height: 12, width: 220, borderRadius: 9999, opacity: 0.3 }}
          />
        </div>

        {/* Current plan card */}
        <div
          className="conduit-card rounded-2xl p-6 mb-6 space-y-4"
          style={{ opacity: 0.46 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div
                className="cx-skeleton"
                style={{ height: 10, width: 80, borderRadius: 9999 }}
              />
              <div
                className="cx-skeleton"
                style={{ height: 24, width: 120, borderRadius: 6 }}
              />
            </div>
            <div
              className="cx-skeleton"
              style={{ height: 36, width: 110, borderRadius: 8, opacity: 0.7 }}
            />
          </div>
          <div
            className="cx-skeleton"
            style={{ height: 8, borderRadius: 9999, opacity: 0.4 }}
          />
          <div
            className="cx-skeleton"
            style={{ height: 10, width: "55%", borderRadius: 9999, opacity: 0.35 }}
          />
        </div>

        {/* Plan tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "var(--space-4, 16px)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="conduit-card rounded-xl p-5 space-y-3"
              style={{ opacity: 0.38 - i * 0.04 }}
            >
              <div
                className="cx-skeleton"
                style={{ height: 12, width: "60%", borderRadius: 9999 }}
              />
              <div
                className="cx-skeleton"
                style={{ height: 28, width: "80%", borderRadius: 6 }}
              />
              <div className="space-y-1.5">
                {[90, 75, 80].map((w, j) => (
                  <div
                    key={j}
                    className="cx-skeleton"
                    style={{ height: 9, width: `${w}%`, borderRadius: 9999, opacity: 0.3 }}
                  />
                ))}
              </div>
              <div
                className="cx-skeleton"
                style={{ height: 36, width: "100%", borderRadius: 8, opacity: 0.45 }}
              />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading billing…</span>
    </div>
  );
}
