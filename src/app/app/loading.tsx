/**
 * Console-wide loading shell. Renders inside the persistent /app layout
 * (Sidebar + workspace canvas stay mounted), so when the user clicks a
 * sidebar link this fallback appears *instantly* while the destination
 * server-renders.
 *
 * Two important Next.js 16 implications:
 *  - Dynamic pages get prefetched up to the first loading boundary, so the
 *    shell is in the router cache before the user even clicks.
 *  - Shared layouts remain interactive — the sidebar stays clickable even
 *    while a slow tab is rendering, so a mis-click is recoverable.
 *
 * Keep this lightweight: skeletons only, no data, no client hooks.
 */
export default function ConsoleLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-8">
          <div className="h-2.5 w-32 rounded-full bg-[var(--color-border)] opacity-60" />
          <div className="h-10 md:h-12 w-72 mt-3 rounded-md bg-[var(--color-border)] opacity-70" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        <div className="h-3 w-24 mb-3 rounded-full bg-[var(--color-border)] opacity-60" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} short />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function SkeletonCard({ short = false }: { short?: boolean }) {
  return (
    <div
      className="conduit-card p-5 flex flex-col gap-2"
      style={{
        minHeight: short ? 110 : 140,
        borderLeftWidth: 3,
        borderLeftStyle: "solid",
        borderLeftColor: "var(--color-border)",
      }}
    >
      <div className="h-2 w-20 rounded-full bg-[var(--color-border)] opacity-60" />
      <div className="h-6 w-3/4 mt-2 rounded-md bg-[var(--color-border)] opacity-70" />
      {!short && (
        <div className="h-2 w-1/2 mt-2 rounded-full bg-[var(--color-border)] opacity-50" />
      )}
    </div>
  );
}
