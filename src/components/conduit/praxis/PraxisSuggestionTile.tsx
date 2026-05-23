import Link from "next/link";
import type { EmployeeId } from "@/lib/conduit/employees";
import { PraxisAvatar } from "./PraxisAvatar";

interface Props {
  /** Dept that will handle this prompt (drives color + avatar). */
  dept: EmployeeId;
  /** Short attribution line — "Atlas will route this" / "Marketing builds the play". */
  hint: string;
  /** The prompt the operator clicks to send. */
  prompt: string;
  /** Optional pin override — null means Atlas auto-routes. */
  pin?: EmployeeId;
  onSelect?: (prompt: string, pin?: EmployeeId) => void;
}

/**
 * Replacement for the inline .conduit-suggestion rendering inside the
 * chat EmptyState. Each tile is attributed to a real department:
 * avatar + dept color + prompt text.
 *
 * If onSelect is provided, the tile invokes it (client integration with
 * Chat.tsx's send handler). Otherwise it falls back to a /app deep-link
 * with pin + prompt query params — same pattern the existing workspace
 * uses to hand off prompts into chat.
 */
export function PraxisSuggestionTile({ dept, hint, prompt, pin, onSelect }: Props) {
  const href = pin
    ? `/app?pin=${pin}&prompt=${encodeURIComponent(prompt)}`
    : `/app?prompt=${encodeURIComponent(prompt)}`;
  const inner = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <PraxisAvatar employee={dept} size="md" />
        <span className="praxis-microlabel" style={{ color: "var(--dept)" }}>
          {hint}
        </span>
      </div>
      <span className="praxis-body-sm" style={{ marginTop: "var(--space-2)", color: "var(--color-text)" }}>
        {prompt}
      </span>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className="praxis-card praxis-card-team"
        data-dept={dept}
        data-interactive="true"
        onClick={() => onSelect(prompt, pin)}
        aria-label={`Send: ${prompt}`}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          textAlign: "left",
          cursor: "pointer",
          background: "var(--color-surface-elevated)",
        }}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="praxis-card praxis-card-team"
      data-dept={dept}
      data-interactive="true"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {inner}
    </Link>
  );
}
