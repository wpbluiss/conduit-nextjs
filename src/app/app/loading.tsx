/**
 * Chat loading shell. Renders inside the persistent /app layout while the
 * server component fetches the conversation. Shows message-bubble skeletons
 * so the layout matches what's about to appear rather than the workspace grid.
 *
 * Keep this lightweight: skeletons only, no data, no client hooks.
 */
export default function ChatLoading() {
  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      aria-busy
      aria-live="polite"
    >
      {/* Message thread skeleton — staggered opacity for a wave feel */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <SkeletonBubble align="left" lines={2} wide delay={0} />
          <SkeletonBubble align="right" lines={1} delay={60} />
          <SkeletonBubble align="left" lines={3} wide delay={120} />
          <SkeletonBubble align="right" lines={2} delay={180} />
          <SkeletonBubble align="left" lines={1} wide delay={240} />
        </div>
      </div>

      {/* Input bar skeleton */}
      <div
        className="px-4 md:px-8 py-3 md:py-4 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "48rem" }}>
          <div
            className="skeleton-shimmer rounded-2xl h-12 w-full"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
            }}
          />
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}

function SkeletonBubble({
  align,
  lines,
  wide = false,
  delay = 0,
}: {
  align: "left" | "right";
  lines: number;
  wide?: boolean;
  delay?: number;
}) {
  const isLeft = align === "left";
  return (
    <div
      className={`flex gap-3 ${isLeft ? "justify-start" : "justify-end"} skeleton-shimmer`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isLeft && (
        <div
          className="h-8 w-8 rounded-full shrink-0 mt-0.5"
          style={{ background: "var(--color-border-soft)", opacity: 0.7 }}
        />
      )}
      <div
        className="flex flex-col gap-1.5"
        style={{ maxWidth: wide ? "62%" : "42%" }}
      >
        {isLeft && (
          <div
            className="h-2 w-20 rounded-full mb-1"
            style={{ background: "var(--color-border-soft)", opacity: 0.6 }}
          />
        )}
        <div
          className="rounded-[20px] px-4 py-3 space-y-2.5"
          style={{
            background: isLeft
              ? "var(--color-surface-elevated)"
              : "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
            border: isLeft
              ? "1px solid var(--color-border-soft)"
              : "1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)",
            borderLeft: isLeft ? "2.5px solid var(--color-border-soft)" : undefined,
          }}
        >
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-2.5 rounded-full"
              style={{
                background: "var(--color-border-soft)",
                opacity: 0.55,
                width: i === lines - 1 ? "60%" : "100%",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
