/**
 * Loading skeleton for /app/settings. Mirrors the settings page structure:
 * header + tab bar + form rows. Renders inside the persistent /app layout.
 */
export default function SettingsLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8 animate-pulse"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl">
        {/* Page title */}
        <div
          style={{
            height: 32,
            width: 120,
            marginBottom: "var(--space-8)",
            borderRadius: 6,
            background: "var(--color-border)",
            opacity: 0.6,
          }}
        />

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            marginBottom: "var(--space-8)",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "var(--space-3)",
          }}
        >
          {[80, 64, 96].map((w, i) => (
            <div
              key={i}
              style={{
                height: 28,
                width: w,
                borderRadius: 6,
                background: "var(--color-border)",
                opacity: i === 0 ? 0.6 : 0.35,
              }}
            />
          ))}
        </div>

        {/* Form rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {[160, 200, 180].map((w, i) => (
            <div key={i}>
              <div
                style={{
                  height: 8,
                  width: w,
                  borderRadius: 9999,
                  background: "var(--color-border)",
                  opacity: 0.5,
                  marginBottom: "var(--space-2)",
                }}
              />
              <div
                style={{
                  height: 44,
                  borderRadius: 6,
                  background: "var(--color-border)",
                  opacity: 0.3,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
