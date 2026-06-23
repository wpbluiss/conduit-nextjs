export default function ConversationsLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-4xl">
        {/* Page heading */}
        <div className="mb-6">
          <div
            className="cx-skeleton"
            style={{ height: 32, width: 180, borderRadius: 6, opacity: 0.55 }}
          />
          <div
            className="cx-skeleton mt-2"
            style={{ height: 12, width: 260, borderRadius: 9999, opacity: 0.3 }}
          />
        </div>

        {/* Search + filter bar */}
        <div className="mb-4 flex gap-2">
          <div
            className="cx-skeleton flex-1"
            style={{ height: 36, borderRadius: 8, opacity: 0.28 }}
          />
          <div
            className="cx-skeleton"
            style={{ height: 36, width: 80, borderRadius: 8, opacity: 0.22 }}
          />
        </div>

        {/* Conversation rows */}
        <div className="space-y-2">
          {[72, 60, 80, 56, 68, 62, 74].map((w, i) => (
            <div
              key={i}
              className="conduit-card flex items-start gap-3 px-4 py-3 rounded-lg"
              style={{ opacity: 0.4 - i * 0.03 }}
            >
              <div
                className="cx-skeleton shrink-0 mt-0.5"
                style={{ width: 20, height: 20, borderRadius: 6 }}
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div
                  className="cx-skeleton"
                  style={{ height: 12, width: `${w}%`, borderRadius: 9999 }}
                />
                <div
                  className="cx-skeleton"
                  style={{ height: 10, width: "50%", borderRadius: 9999, opacity: 0.55 }}
                />
              </div>
              <div
                className="cx-skeleton shrink-0"
                style={{ height: 10, width: 32, borderRadius: 9999, opacity: 0.4 }}
              />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading conversations…</span>
    </div>
  );
}
