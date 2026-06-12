/**
 * Loading skeleton for /app/workspace (the main dashboard).
 * Mirrors the workspace page structure: welcome hero + live strip + team
 * roster tiles. Renders inside the persistent /app layout.
 */
export default function WorkspaceDashboardLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto animate-pulse"
      aria-busy
      aria-live="polite"
    >
      {/* Welcome hero area */}
      <div
        style={{
          padding: "var(--space-10) var(--space-4) var(--space-8)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "64rem" }}>
          <div
            style={{
              height: 8,
              width: 80,
              borderRadius: 9999,
              background: "var(--color-border)",
              opacity: 0.5,
            }}
          />
          <div
            style={{
              height: 40,
              width: 320,
              marginTop: "var(--space-3)",
              borderRadius: 6,
              background: "var(--color-border)",
              opacity: 0.7,
            }}
          />
          <div
            style={{
              height: 10,
              width: 220,
              marginTop: "var(--space-3)",
              borderRadius: 9999,
              background: "var(--color-border)",
              opacity: 0.4,
            }}
          />
        </div>
      </div>

      {/* Live strip */}
      <div
        className="mx-auto"
        style={{
          maxWidth: "64rem",
          padding: "var(--space-6) var(--space-4)",
        }}
      >
        <div
          style={{
            height: 52,
            borderRadius: 8,
            background: "var(--color-border)",
            opacity: 0.35,
          }}
        />
      </div>

      {/* Team roster grid */}
      <div
        className="mx-auto"
        style={{
          maxWidth: "64rem",
          padding: "0 var(--space-4) var(--space-10)",
        }}
      >
        <div
          style={{
            height: 8,
            width: 72,
            borderRadius: 9999,
            background: "var(--color-border)",
            opacity: 0.5,
            marginBottom: "var(--space-3)",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="conduit-card"
              style={{ height: 100, opacity: 0.45 }}
            />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
