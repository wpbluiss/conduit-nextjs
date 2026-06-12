export default function SettingsLoading() {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-8"
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="h-8 w-32 rounded-md mb-8 bg-[var(--color-border)] opacity-60" />
        <div className="flex gap-2 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-[var(--color-border)] opacity-50" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} wide={i % 3 === 0} />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}

function SkeletonRow({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className="conduit-card p-5 flex flex-col gap-3"
      style={{ borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: "var(--color-border)" }}
    >
      <div className="h-2 w-24 rounded-full bg-[var(--color-border)] opacity-60" />
      <div className={`h-9 rounded-md bg-[var(--color-border)] opacity-50 ${wide ? "w-full" : "w-2/3"}`} />
    </div>
  );
}
