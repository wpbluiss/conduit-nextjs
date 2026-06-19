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
      {/* Message thread skeleton */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5">
        <SkeletonBubble align="left" lines={2} wide />
        <SkeletonBubble align="right" lines={1} />
        <SkeletonBubble align="left" lines={3} wide />
        <SkeletonBubble align="right" lines={2} />
        <SkeletonBubble align="left" lines={1} wide />
      </div>

      {/* Input bar skeleton */}
      <div
        className="px-4 md:px-6 py-4 border-t"
        style={{ borderColor: "var(--cx-border, #262630)" }}
      >
        <div
          className="cx-skeleton rounded-xl h-12 w-full"
          style={{ opacity: 0.5 }}
        />
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}

function SkeletonBubble({
  align,
  lines,
  wide = false,
}: {
  align: "left" | "right";
  lines: number;
  wide?: boolean;
}) {
  const isLeft = align === "left";
  return (
    <div
      className={`flex gap-3 ${isLeft ? "justify-start" : "justify-end"}`}
    >
      {isLeft && (
        <div
          className="cx-skeleton h-8 w-8 rounded-[8px] shrink-0 mt-0.5"
          style={{ opacity: 0.5 }}
        />
      )}
      <div
        className="flex flex-col gap-1.5"
        style={{ maxWidth: wide ? "60%" : "40%" }}
      >
        {isLeft && (
          <div
            className="cx-skeleton h-2 w-16 rounded-full mb-1"
            style={{ opacity: 0.4 }}
          />
        )}
        <div
          className="rounded-2xl px-4 py-3 space-y-2"
          style={{
            background: isLeft
              ? "var(--cx-surface-raised, #1C1C26)"
              : "color-mix(in srgb, var(--cx-accent, #7C6CFF) 10%, var(--cx-surface-raised, #1C1C26))",
            border: "1px solid var(--cx-border, #262630)",
          }}
        >
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="cx-skeleton h-2.5 rounded-full"
              style={{
                opacity: 0.5,
                width: i === lines - 1 ? "65%" : "100%",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
