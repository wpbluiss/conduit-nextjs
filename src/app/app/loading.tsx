/**
 * Console-wide loading shell for the chat page (/app).
 * Renders inside the persistent /app layout (Sidebar stays mounted).
 * Shape mirrors the chat thread: message bubbles + fixed-bottom input bar.
 */
export default function ChatLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden" aria-busy aria-live="polite">
      {/* Message thread area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
          {/* Assistant message — wide */}
          <SkeletonBubble side="left" lines={3} width="85%" />
          {/* User message */}
          <SkeletonBubble side="right" lines={1} width="52%" />
          {/* Assistant message — medium */}
          <SkeletonBubble side="left" lines={2} width="70%" />
          {/* User message */}
          <SkeletonBubble side="right" lines={1} width="38%" />
          {/* Assistant message — longer */}
          <SkeletonBubble side="left" lines={4} width="90%" />
        </div>
      </div>

      {/* Input bar */}
      <div
        className="px-4 md:px-8 py-3 md:py-4 animate-pulse"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "48rem" }}>
          <div
            style={{
              height: 52,
              borderRadius: 12,
              background: "var(--color-border)",
              opacity: 0.5,
            }}
          />
        </div>
      </div>

      <span className="sr-only">Loading chat…</span>
    </div>
  );
}

function SkeletonBubble({
  side,
  lines,
  width,
}: {
  side: "left" | "right";
  lines: number;
  width: string;
}) {
  const isRight = side === "right";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isRight ? "flex-end" : "flex-start",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      {/* Avatar dot for assistant messages */}
      {!isRight && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--color-border)",
            opacity: 0.55,
            flexShrink: 0,
            marginTop: 4,
          }}
        />
      )}

      <div style={{ maxWidth: width, width: "100%" }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 14,
              borderRadius: 6,
              background: "var(--color-border)",
              opacity: isRight ? 0.45 : 0.6,
              marginBottom: i < lines - 1 ? 8 : 0,
              width: i === lines - 1 && lines > 1 ? "65%" : "100%",
            }}
          />
        ))}
      </div>
    </div>
  );
}
