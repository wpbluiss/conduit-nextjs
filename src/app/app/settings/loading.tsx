export default function SettingsLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="h-9 w-28 rounded-md bg-[var(--color-border)] opacity-70 mb-8" />
        <div className="flex gap-2 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 rounded-full bg-[var(--color-border)] opacity-60"
            />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="conduit-card p-5 space-y-3">
              <div className="h-2.5 w-32 rounded-full bg-[var(--color-border)] opacity-60" />
              <div className="h-10 w-full rounded-md bg-[var(--color-border)] opacity-50" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
