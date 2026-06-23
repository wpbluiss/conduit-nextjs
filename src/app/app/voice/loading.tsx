export default function VoiceLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Hero card skeleton */}
        <div
          className="conduit-card rounded-2xl p-8"
          style={{ opacity: 0.5 }}
        >
          <div className="space-y-3">
            <div
              className="cx-skeleton"
              style={{ height: 36, width: 220, borderRadius: 6 }}
            />
            <div
              className="cx-skeleton"
              style={{ height: 12, width: 300, borderRadius: 9999, opacity: 0.55 }}
            />
          </div>
          {/* Participant avatars */}
          <div className="flex gap-2 mt-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="cx-skeleton"
                style={{ width: 40, height: 40, borderRadius: 9999, opacity: 0.5 - i * 0.05 }}
              />
            ))}
          </div>
          <div
            className="cx-skeleton mt-6"
            style={{ height: 44, width: 160, borderRadius: 8, opacity: 0.45 }}
          />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="conduit-card rounded-xl p-4 space-y-2"
              style={{ opacity: 0.38 - i * 0.03 }}
            >
              <div
                className="cx-skeleton"
                style={{ height: 9, width: 64, borderRadius: 9999 }}
              />
              <div
                className="cx-skeleton"
                style={{ height: 24, width: 80, borderRadius: 6 }}
              />
            </div>
          ))}
        </div>

        {/* Employee list */}
        <div className="space-y-2">
          <div
            className="cx-skeleton mb-3"
            style={{ height: 9, width: 100, borderRadius: 9999, opacity: 0.45 }}
          />
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="conduit-card flex items-center gap-3 p-4 rounded-xl"
              style={{ opacity: 0.42 - i * 0.04 }}
            >
              <div
                className="cx-skeleton shrink-0"
                style={{ width: 32, height: 32, borderRadius: 9999 }}
              />
              <div className="flex-1 space-y-1.5">
                <div
                  className="cx-skeleton"
                  style={{ height: 12, width: "50%", borderRadius: 9999 }}
                />
                <div
                  className="cx-skeleton"
                  style={{ height: 10, width: "35%", borderRadius: 9999, opacity: 0.55 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading voice…</span>
    </div>
  );
}
