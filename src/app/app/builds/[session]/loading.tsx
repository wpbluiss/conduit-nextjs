export default function CinemaLoading() {
  return (
    <div className="eng-cinema" data-dept="engineering" aria-busy aria-live="polite">
      {/* Cinema header skeleton */}
      <section
        className="eng-cinema-summary"
        style={{ opacity: 0.5 }}
      >
        <div>
          <div
            className="cx-skeleton"
            style={{ height: 9, width: 180, borderRadius: 9999, marginBottom: 12 }}
          />
          <div
            className="cx-skeleton"
            style={{ height: 32, width: 280, borderRadius: 6, marginBottom: 10 }}
          />
          <div className="space-y-1.5">
            <div
              className="cx-skeleton"
              style={{ height: 10, width: "90%", borderRadius: 9999 }}
            />
            <div
              className="cx-skeleton"
              style={{ height: 10, width: "70%", borderRadius: 9999 }}
            />
          </div>
        </div>
        <div className="eng-cinema-summary-actions" style={{ opacity: 0.6 }}>
          <div
            className="cx-skeleton"
            style={{ height: 36, width: 140, borderRadius: 8 }}
          />
        </div>
      </section>

      {/* Log panel skeleton */}
      <section style={{ padding: "var(--space-4, 16px)", opacity: 0.35 }}>
        <div
          className="cx-skeleton"
          style={{ height: 9, width: 80, borderRadius: 9999, marginBottom: 12 }}
        />
        <div className="space-y-1.5">
          {[100, 80, 95, 72, 88, 65, 90].map((w, i) => (
            <div
              key={i}
              className="cx-skeleton"
              style={{ height: 10, width: `${w}%`, borderRadius: 9999, opacity: 0.35 - i * 0.02 }}
            />
          ))}
        </div>
      </section>

      <span className="sr-only">Loading build cinema…</span>
    </div>
  );
}
