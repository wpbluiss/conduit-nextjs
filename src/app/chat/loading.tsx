/**
 * Loading skeleton for /chat (the LiveChat ember interface).
 * Full-viewport layout mirroring the LiveChat shell:
 * left rail (conversations sidebar) + main column (header, employee bar,
 * message thread, composer).
 * Uses .wm-rebrand to pull in the dark ember palette.
 */
export default function LiveChatLoading() {
  return (
    <div className="wm-rebrand flex h-[100dvh] w-full overflow-hidden">
      {/* Rail — desktop only */}
      <aside className="hidden w-72 shrink-0 border-r border-white/8 bg-card/40 lg:block">
        <div className="animate-pulse p-3 space-y-2">
          {/* Brand row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 px-1">
              <div className="size-8 rounded-lg bg-secondary" />
              <div className="h-4 w-14 rounded bg-secondary opacity-70" />
            </div>
            <div className="size-9 rounded-lg bg-secondary" />
          </div>
          {/* Search bar */}
          <div className="h-9 w-full rounded-lg bg-secondary/50 mb-3" />
          {/* Conversation list */}
          <div className="px-1 space-y-1">
            <div className="h-3 w-12 rounded-full bg-secondary opacity-50 mb-2" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-1 py-2">
                <div className="size-8 shrink-0 rounded-lg bg-secondary opacity-60" />
                <div
                  className="h-3 rounded-full bg-secondary"
                  style={{ flex: 1, opacity: 0.5 - i * 0.04 }}
                />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col animate-pulse">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
          <div className="size-9 rounded-lg bg-secondary lg:hidden" />
          <div className="size-9 rounded-xl bg-secondary" />
          <div>
            <div className="h-4 w-28 rounded bg-secondary mb-1" />
            <div className="h-3 w-20 rounded-full bg-secondary opacity-60" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-7 w-16 rounded-full bg-secondary" />
          </div>
        </header>

        {/* Employee selector bar */}
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5 overflow-hidden">
          <div className="h-3 w-14 shrink-0 rounded-full bg-secondary opacity-50" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-7 shrink-0 rounded-full bg-secondary"
              style={{ width: 64 + i * 10, opacity: 0.55 - i * 0.05 }}
            />
          ))}
        </div>

        {/* Thread */}
        <div className="min-h-0 flex-1 overflow-hidden px-4 py-7">
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="h-10 w-56 rounded-2xl rounded-br-md bg-secondary opacity-65" />
            </div>
            {/* Assistant reply */}
            <LiveChatAssistantSkeleton lines={[0.72, 0.5, 0.38]} />
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="h-8 w-40 rounded-2xl rounded-br-md bg-secondary opacity-55" />
            </div>
            {/* Assistant reply — longer */}
            <LiveChatAssistantSkeleton lines={[0.9, 0.68, 0.48, 0.3]} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-white/8 px-4 pt-3 pb-3">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-secondary/60 p-2">
              <div className="size-9 shrink-0 rounded-xl bg-muted opacity-60" />
              <div className="h-8 flex-1 rounded bg-muted opacity-40" />
              <div className="size-9 shrink-0 rounded-xl bg-muted opacity-60" />
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading conversation…</span>
    </div>
  );
}

function LiveChatAssistantSkeleton({ lines }: { lines: number[] }) {
  return (
    <div className="flex gap-3">
      <div className="size-8 shrink-0 mt-0.5 rounded-lg bg-secondary opacity-55" />
      <div className="flex-1 pt-1 space-y-2">
        <div className="h-3 w-16 rounded bg-secondary opacity-55 mb-1" />
        {lines.map((w, i) => (
          <div
            key={i}
            className="h-2.5 rounded-full bg-secondary"
            style={{ width: `${Math.round(w * 100)}%`, opacity: 0.5 - i * 0.07 }}
          />
        ))}
      </div>
    </div>
  );
}
