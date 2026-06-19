export default function SettingsLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8 animate-pulse"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-5xl">
        {/* Page title + subtitle */}
        <div className="mb-8">
          <div
            style={{
              height: 32,
              width: 120,
              marginBottom: 8,
              borderRadius: 6,
              background: "var(--cx-border)",
              opacity: 0.6,
            }}
          />
          <div
            style={{
              height: 14,
              width: 240,
              borderRadius: 9999,
              background: "var(--cx-border)",
              opacity: 0.35,
            }}
          />
        </div>

        {/* Two-column layout skeleton */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar nav skeleton (desktop only) — matches cx-glass glass panel */}
          <div
            className="hidden md:flex flex-col gap-2 w-48 shrink-0 p-3 rounded-xl"
            style={{
              background: "var(--cx-glass-bg)",
              border: "1px solid var(--cx-glass-border)",
            }}
          >
            {[56, 72, 52, 64, 60].map((w, i) => (
              <div
                key={i}
                style={{
                  height: 28,
                  width: w,
                  borderRadius: 6,
                  background: "var(--cx-border)",
                  opacity: i === 0 ? 0.55 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {[160, 200, 180].map((w, i) => (
              <div key={i}>
                <div
                  style={{
                    height: 8,
                    width: w,
                    borderRadius: 9999,
                    background: "var(--cx-border)",
                    opacity: 0.5,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    height: 44,
                    borderRadius: 8,
                    background: "var(--cx-border)",
                    opacity: 0.25,
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
