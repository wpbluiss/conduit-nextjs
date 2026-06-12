/**
 * Loading skeleton for /app (the Praxis chat thread).
 * Renders inside the persistent /app layout (Sidebar stays mounted).
 * Mirrors the Chat component: skeleton message bubbles above, composer below.
 * Keep lightweight — no data, no client hooks.
 */
export default function ChatLoading() {
  return (
    <div
      className="flex-1 flex flex-col min-h-0 animate-pulse"
      aria-busy
      aria-live="polite"
    >
      {/* Message thread */}
      <div className="flex-1 overflow-hidden px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* User bubble (right-aligned) */}
          <div className="flex justify-end">
            <div
              style={{
                height: 40,
                width: 220,
                borderRadius: 16,
                background: "var(--color-border)",
                opacity: 0.6,
              }}
            />
          </div>

          {/* Assistant reply */}
          <AssistantSkeleton lines={[0.75, 0.55, 0.4]} />

          {/* User bubble */}
          <div className="flex justify-end">
            <div
              style={{
                height: 32,
                width: 160,
                borderRadius: 16,
                background: "var(--color-border)",
                opacity: 0.5,
              }}
            />
          </div>

          {/* Assistant reply — longer */}
          <AssistantSkeleton lines={[0.9, 0.7, 0.5, 0.35]} />
        </div>
      </div>

      {/* Composer */}
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "var(--space-3) var(--space-4) var(--space-4)",
        }}
      >
        <div className="mx-auto max-w-2xl">
          <div
            style={{
              height: 56,
              borderRadius: 24,
              background: "var(--color-surface-elevated)",
              opacity: 0.7,
              border: "1px solid var(--color-border)",
            }}
          />
        </div>
      </div>

      <span className="sr-only">Loading conversation…</span>
    </div>
  );
}

function AssistantSkeleton({ lines }: { lines: number[] }) {
  return (
    <div className="flex gap-3">
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--color-border)",
          opacity: 0.5,
          flexShrink: 0,
          marginTop: 2,
        }}
      />
      <div className="flex-1 space-y-2 pt-1">
        {lines.map((w, i) => (
          <div
            key={i}
            style={{
              height: 8,
              width: `${Math.round(w * 100)}%`,
              borderRadius: 9999,
              background: "var(--color-border)",
              opacity: 0.55 - i * 0.07,
            }}
          />
        ))}
      </div>
    </div>
  );
}
