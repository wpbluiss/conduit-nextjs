export default function ArtifactsLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-4xl">
        {/* Page heading */}
        <div className="mb-8">
          <div
            className="cx-skeleton"
            style={{ height: 32, width: 140, borderRadius: 6, opacity: 0.55 }}
          />
          <div
            className="cx-skeleton mt-2"
            style={{ height: 12, width: 240, borderRadius: 9999, opacity: 0.3 }}
          />
        </div>

        {/* Artifact cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "var(--space-4, 16px)",
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="conduit-card rounded-xl p-4 space-y-3"
              style={{ opacity: 0.42 - i * 0.03 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div
                    className="cx-skeleton"
                    style={{ height: 12, width: "70%", borderRadius: 9999 }}
                  />
                  <div
                    className="cx-skeleton"
                    style={{ height: 10, width: "45%", borderRadius: 9999, opacity: 0.6 }}
                  />
                </div>
                <div
                  className="cx-skeleton shrink-0"
                  style={{ width: 28, height: 28, borderRadius: 6 }}
                />
              </div>
              <div className="space-y-1">
                <div
                  className="cx-skeleton"
                  style={{ height: 10, width: "100%", borderRadius: 9999, opacity: 0.4 }}
                />
                <div
                  className="cx-skeleton"
                  style={{ height: 10, width: "80%", borderRadius: 9999, opacity: 0.3 }}
                />
              </div>
              <div
                className="cx-skeleton"
                style={{ height: 10, width: 72, borderRadius: 9999, opacity: 0.35 }}
              />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading artifacts…</span>
    </div>
  );
}
