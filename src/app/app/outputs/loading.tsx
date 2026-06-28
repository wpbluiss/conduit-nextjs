export default function OutputsLoading() {
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
            style={{ height: 12, width: 260, borderRadius: 9999, opacity: 0.3 }}
          />
        </div>

        {/* Output cards */}
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="conduit-card rounded-xl p-5 space-y-3"
              style={{ opacity: 0.44 - i * 0.04 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div
                    className="cx-skeleton"
                    style={{ height: 14, width: "60%", borderRadius: 9999 }}
                  />
                  <div
                    className="cx-skeleton"
                    style={{ height: 10, width: "35%", borderRadius: 9999, opacity: 0.55 }}
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <div
                    className="cx-skeleton"
                    style={{ height: 28, width: 60, borderRadius: 8, opacity: 0.4 }}
                  />
                  <div
                    className="cx-skeleton"
                    style={{ height: 28, width: 72, borderRadius: 8, opacity: 0.35 }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                {[100, 90, 75].map((w, j) => (
                  <div
                    key={j}
                    className="cx-skeleton"
                    style={{ height: 10, width: `${w}%`, borderRadius: 9999, opacity: 0.3 - j * 0.04 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading saved outputs…</span>
    </div>
  );
}
