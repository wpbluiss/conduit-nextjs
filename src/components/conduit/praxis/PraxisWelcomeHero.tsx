import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { WelcomeCopy } from "@/lib/conduit/welcome-copy";
import { PraxisAvatar } from "./PraxisAvatar";

interface Props {
  copy: WelcomeCopy;
  /** "none" | "low" | "high" — drives the breath cadence on the hero. */
  activityBucket?: "none" | "low" | "high";
}

/**
 * Dashboard hero composition. Renders the eyebrow + display-1 headline +
 * optional subline + (when primaryEventEmployee is set) a click-through
 * avatar that takes the user into the relevant team's surface.
 *
 * Per contracts/primitives.md P-006. Server-safe — no hooks.
 */
export function PraxisWelcomeHero({ copy, activityBucket = "low" }: Props) {
  const hasEvent = Boolean(copy.primaryEventEmployee);

  const heroBody = (
    <>
      <p className="praxis-eyebrow">
        <span aria-hidden style={{
          width: 6, height: 6, borderRadius: 9999,
          background: "var(--color-green)",
          boxShadow: "0 0 6px color-mix(in srgb, var(--color-green) 70%, transparent)",
          display: "inline-block",
        }} />
        {copy.eyebrow}
      </p>
      <h1 className="praxis-display-1" style={{ marginTop: "var(--space-3)" }}>
        {copy.headline}
        {hasEvent && (
          <ArrowRight
            size={28}
            style={{
              marginLeft: "var(--space-3)",
              opacity: 0.5,
              verticalAlign: "middle",
              color: "var(--color-text-muted)",
              transition: "opacity 200ms var(--praxis-ease-out-quart), transform 200ms var(--praxis-ease-out-quart)",
            }}
            aria-hidden
          />
        )}
      </h1>
      {copy.subline && (
        <p className="praxis-body-lg" style={{ marginTop: "var(--space-3)", maxWidth: "48rem" }}>
          {copy.subline}
        </p>
      )}
    </>
  );

  return (
    <div
      className="praxis-welcome-hero"
      data-activity-bucket={activityBucket}
      data-dept={copy.primaryEventEmployee}
    >
      {hasEvent && copy.primaryEventHref ? (
        <Link
          href={copy.primaryEventHref}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
          aria-label={`${copy.headline} — open`}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)" }}>
            {copy.primaryEventEmployee && (
              <PraxisAvatar employee={copy.primaryEventEmployee} size="lg" pulse="ambient" />
            )}
            <div>{heroBody}</div>
          </div>
        </Link>
      ) : (
        <div>{heroBody}</div>
      )}
    </div>
  );
}
