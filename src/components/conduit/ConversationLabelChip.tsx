"use client";

export interface Label {
  id: string;
  name: string;
  color: string;
}

export function ConversationLabelChip({ label }: { label: Label }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        paddingLeft: "6px",
        paddingRight: "8px",
        paddingTop: "2px",
        paddingBottom: "2px",
        borderRadius: "9999px",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "0.04em",
        background: `color-mix(in srgb, ${label.color} 14%, var(--color-surface-elevated))`,
        color: label.color,
        border: `1px solid color-mix(in srgb, ${label.color} 30%, transparent)`,
        whiteSpace: "nowrap",
        maxWidth: "120px",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      title={label.name}
    >
      <span
        aria-hidden
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: label.color,
          flexShrink: 0,
        }}
      />
      {label.name}
    </span>
  );
}
