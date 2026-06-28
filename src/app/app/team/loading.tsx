export default function TeamLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto"
      aria-busy
      aria-live="polite"
    >
      {/* Hero header */}
      <div
        style={{
          padding: "var(--space-10, 40px) var(--space-4, 16px) var(--space-8, 32px)",
          borderBottom: "1px solid var(--cx-border, #262630)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "64rem" }}>
          <div
            className="cx-skeleton"
            style={{ height: 9, width: 140, borderRadius: 9999, opacity: 0.4 }}
          />
          <div
            className="cx-skeleton mt-3"
            style={{ height: 44, width: 260, borderRadius: 6, opacity: 0.6 }}
          />
          <div
            className="cx-skeleton mt-3"
            style={{ height: 12, width: 320, borderRadius: 9999, opacity: 0.3 }}
          />
        </div>
      </div>

      {/* Team roster grid */}
      <div
        className="mx-auto"
        style={{ maxWidth: "64rem", padding: "var(--space-8, 32px) var(--space-4, 16px)" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "var(--space-4, 16px)",
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="conduit-card rounded-xl p-5 space-y-3"
              style={{ opacity: 0.42 - i * 0.02 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="cx-skeleton shrink-0"
                  style={{ width: 36, height: 36, borderRadius: 9999 }}
                />
                <div className="flex-1 space-y-1.5">
                  <div
                    className="cx-skeleton"
                    style={{ height: 12, width: "70%", borderRadius: 9999 }}
                  />
                  <div
                    className="cx-skeleton"
                    style={{ height: 9, width: "50%", borderRadius: 9999, opacity: 0.6 }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div
                  className="cx-skeleton"
                  style={{ height: 9, width: "90%", borderRadius: 9999, opacity: 0.3 }}
                />
                <div
                  className="cx-skeleton"
                  style={{ height: 9, width: "70%", borderRadius: 9999, opacity: 0.25 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading your team…</span>
    </div>
  );
}
