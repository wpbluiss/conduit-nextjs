/**
 * Loading skeleton for /app/team/[employee] (the Praxis workspace page).
 * Renders inside the persistent /app layout.
 * Mirrors the page structure: employee header band + quick-start grid + stats row.
 */
export default function EmployeeWorkspaceLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto animate-pulse"
      aria-busy
      aria-live="polite"
    >
      {/* Header band */}
      <div
        style={{
          padding: "var(--space-10) var(--space-4) var(--space-8)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: "64rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--space-6)",
          }}
        >
          {/* Avatar placeholder */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--color-border)",
              opacity: 0.45,
            }}
          />
          <div>
            <div
              style={{
                height: 8,
                width: 80,
                borderRadius: 9999,
                background: "var(--color-border)",
                opacity: 0.5,
                marginBottom: "var(--space-2)",
              }}
            />
            <div
              style={{
                height: 36,
                width: 200,
                borderRadius: 6,
                background: "var(--color-border)",
                opacity: 0.6,
              }}
            />
            <div
              style={{
                height: 8,
                width: 280,
                borderRadius: 9999,
                background: "var(--color-border)",
                opacity: 0.35,
                marginTop: "var(--space-2)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Content: quick-start + stats */}
      <div
        className="mx-auto max-w-4xl"
        style={{
          padding: "var(--space-8) var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-10)",
        }}
      >
        {/* Quick-start prompt grid */}
        <div>
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
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "var(--space-3)",
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="conduit-card"
                style={{ height: 56, opacity: 0.4 }}
              />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div>
          <div
            style={{
              height: 8,
              width: 64,
              borderRadius: 9999,
              background: "var(--color-border)",
              opacity: 0.5,
              marginBottom: "var(--space-3)",
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "var(--space-3)",
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="conduit-card"
                style={{ height: 72, opacity: 0.4 }}
              />
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
