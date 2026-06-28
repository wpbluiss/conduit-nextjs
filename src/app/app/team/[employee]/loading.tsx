export default function EmployeeLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <div
          className="cx-skeleton mb-8"
          style={{ height: 9, width: 80, borderRadius: 9999, opacity: 0.35 }}
        />

        {/* Employee hero card */}
        <div
          className="conduit-card rounded-2xl p-6 md:p-8 mb-8"
          style={{ opacity: 0.5 }}
        >
          <div className="flex items-start gap-5">
            <div
              className="cx-skeleton shrink-0"
              style={{ width: 56, height: 56, borderRadius: 9999 }}
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div
                className="cx-skeleton"
                style={{ height: 24, width: 180, borderRadius: 6 }}
              />
              <div
                className="cx-skeleton"
                style={{ height: 12, width: 260, borderRadius: 9999, opacity: 0.6 }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div
            className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div
                  className="cx-skeleton"
                  style={{ height: 9, width: 80, borderRadius: 9999, opacity: 0.55 }}
                />
                <div
                  className="cx-skeleton"
                  style={{ height: 22, width: 100, borderRadius: 6 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity section */}
        <div>
          <div
            className="cx-skeleton mb-3"
            style={{ height: 9, width: 120, borderRadius: 9999, opacity: 0.45 }}
          />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="conduit-card flex items-start gap-3 px-4 py-4 rounded-xl"
                style={{ opacity: 0.42 - i * 0.04 }}
              >
                <div
                  className="cx-skeleton shrink-0"
                  style={{ width: 32, height: 32, borderRadius: 8 }}
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div
                    className="cx-skeleton"
                    style={{ height: 12, width: "60%", borderRadius: 9999 }}
                  />
                  <div
                    className="cx-skeleton"
                    style={{ height: 10, width: "40%", borderRadius: 9999, opacity: 0.55 }}
                  />
                </div>
                <div
                  className="cx-skeleton shrink-0"
                  style={{ height: 10, width: 36, borderRadius: 9999, opacity: 0.4 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading employee profile…</span>
    </div>
  );
}
