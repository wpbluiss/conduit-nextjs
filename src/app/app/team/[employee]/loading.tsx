export default function ChatLoading() {
  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      aria-busy
      aria-live="polite"
    >
      <div className="animate-pulse">
        <div className="px-4 md:px-8 py-4 flex items-center gap-3 border-b border-[var(--color-border)]">
          <div className="w-9 h-9 rounded-full bg-[var(--color-border)] opacity-60 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-28 rounded-full bg-[var(--color-border)] opacity-70" />
            <div className="h-2 w-20 rounded-full bg-[var(--color-border)] opacity-50" />
          </div>
        </div>
        <div className="flex-1 px-4 md:px-8 py-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-border)] opacity-40 flex-shrink-0 mt-1" />
              <div className="space-y-2 flex-1 max-w-xs">
                <div className="h-2.5 w-3/4 rounded-full bg-[var(--color-border)] opacity-50" />
                <div className="h-2.5 w-1/2 rounded-full bg-[var(--color-border)] opacity-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading conversation…</span>
    </div>
  );
}
