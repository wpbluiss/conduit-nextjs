export default function SettingsLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-5xl">
        {/* Page title + subtitle */}
        <div className="mb-8">
          <div
            className="cx-skeleton"
            style={{
              height: 32,
              width: 120,
              marginBottom: 8,
              borderRadius: 6,
              opacity: 0.55,
            }}
          />
          <div
            className="cx-skeleton"
            style={{
              height: 14,
              width: 240,
              borderRadius: 9999,
              opacity: 0.3,
            }}
          />
        </div>

        {/* Two-column layout skeleton */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar nav skeleton (desktop only) */}
          <div className="hidden md:flex flex-col gap-2 w-44 shrink-0 pt-1">
            {[56, 72, 52, 64, 60].map((w, i) => (
              <div
                key={i}
                className="cx-skeleton"
                style={{
                  height: 32,
                  width: w,
                  borderRadius: 6,
                  opacity: i === 0 ? 0.5 : 0.28,
                }}
              />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {[160, 200, 180].map((w, i) => (
              <div key={i}>
                <div
                  className="cx-skeleton"
                  style={{
                    height: 8,
                    width: w,
                    borderRadius: 9999,
                    opacity: 0.45,
                    marginBottom: 8,
                  }}
                />
                <div
                  className="cx-skeleton"
                  style={{
                    height: 44,
                    borderRadius: 8,
                    opacity: 0.22,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
