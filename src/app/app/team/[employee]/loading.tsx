/**
 * Loading skeleton for /app/team/[employee].
 * Mirrors the workspace page layout: header band + quick-start grid +
 * stats row + recent-activity list. Renders inside the persistent /app
 * layout so the Sidebar stays interactive while the server component fetches.
 */
export default function WorkspaceLoading() {
  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto animate-pulse">
        {/* Header band */}
        <div
          style={{
            paddingLeft: "var(--space-4)",
            paddingRight: "var(--space-4)",
            paddingTop: "var(--space-10)",
            paddingBottom: "var(--space-8)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            className="mx-auto"
            style={{
              maxWidth: "64rem",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-6)",
            }}
          >
            {/* Avatar placeholder */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 9999,
                background: "var(--color-border)",
                opacity: 0.6,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  height: 10,
                  width: 80,
                  borderRadius: 9999,
                  background: "var(--color-border)",
                  opacity: 0.5,
                }}
              />
              <div
                style={{
                  height: 32,
                  width: 160,
                  marginTop: "var(--space-2)",
                  borderRadius: 6,
                  background: "var(--color-border)",
                  opacity: 0.7,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: 280,
                  marginTop: "var(--space-3)",
                  borderRadius: 9999,
                  background: "var(--color-border)",
                  opacity: 0.4,
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="mx-auto"
          style={{
            maxWidth: "56rem",
            padding:
              "var(--space-8) var(--space-4) var(--space-8) var(--space-4)",
          }}
        >
          {/* Section label */}
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

          {/* Quick-start cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3)",
              marginBottom: "var(--space-10)",
            }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                className="conduit-card"
                style={{ height: 52, opacity: 0.5 }}
              />
            ))}
          </div>

          {/* Section label */}
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

          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--space-3)",
              marginBottom: "var(--space-10)",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="conduit-card"
                style={{ height: 72, padding: "var(--space-3)", opacity: 0.5 }}
              >
                <div
                  style={{
                    height: 8,
                    width: 60,
                    borderRadius: 9999,
                    background: "var(--color-border)",
                  }}
                />
                <div
                  style={{
                    height: 24,
                    width: 48,
                    marginTop: "var(--space-2)",
                    borderRadius: 4,
                    background: "var(--color-border)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Section label */}
          <div
            style={{
              height: 8,
              width: 96,
              borderRadius: 9999,
              background: "var(--color-border)",
              opacity: 0.5,
              marginBottom: "var(--space-3)",
            }}
          />

          {/* Activity rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="conduit-card"
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  borderLeftWidth: 3,
                  borderLeftStyle: "solid",
                  borderLeftColor: "var(--color-border)",
                  opacity: 0.5,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--color-border)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      height: 8,
                      width: 120,
                      borderRadius: 9999,
                      background: "var(--color-border)",
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      width: "75%",
                      marginTop: "var(--space-1)",
                      borderRadius: 4,
                      background: "var(--color-border)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
