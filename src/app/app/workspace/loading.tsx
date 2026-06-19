/**
 * Loading skeleton for /app/workspace (the main dashboard).
 * Mirrors the workspace page structure: welcome hero + live strip + team
 * roster tiles. Renders inside the persistent /app layout.
 */
export default function WorkspaceDashboardLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto"
      aria-busy
      aria-live="polite"
    >
      {/* Welcome hero area */}
      <div
        style={{
          padding: "var(--space-10) var(--space-4) var(--space-8)",
          borderBottom: "1px solid var(--cx-border, #262630)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "64rem" }}>
          <div
            className="cx-skeleton"
            style={{
              height: 8,
              width: 80,
              borderRadius: 9999,
              opacity: 0.45,
            }}
          />
          <div
            className="cx-skeleton"
            style={{
              height: 40,
              width: 320,
              marginTop: "var(--space-3)",
              borderRadius: 6,
              opacity: 0.6,
            }}
          />
          <div
            className="cx-skeleton"
            style={{
              height: 10,
              width: 220,
              marginTop: "var(--space-3)",
              borderRadius: 9999,
              opacity: 0.35,
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
          className="cx-skeleton"
          style={{
            height: 52,
            borderRadius: 8,
            opacity: 0.3,
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
          className="cx-skeleton"
          style={{
            height: 8,
            width: 72,
            borderRadius: 9999,
            opacity: 0.45,
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
              className="conduit-card cx-skeleton"
              style={{ height: 100, opacity: 0.38 }}
            />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
