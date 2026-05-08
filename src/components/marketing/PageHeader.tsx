/**
 * PageHeader — shared institutional hero header for deep pages.
 * Used by /engineering, /changelog, /trust, /careers.
 */

import { ReactNode } from "react";

export function PageHeader({
  caption,
  title,
  subtitle,
  children,
}: {
  caption: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden conduit-hero-section">
      <div className="conduit-mesh" aria-hidden />
      <div className="conduit-indigo-radial" aria-hidden />
      <div className="relative conduit-container">
        <div className="max-w-[820px]">
          <p className="conduit-caption conduit-caption-ember">{caption}</p>
          <h1 className="conduit-display-hero mt-6">{title}</h1>
          {subtitle && (
            <p className="conduit-body-lg mt-6 max-w-[640px]">{subtitle}</p>
          )}
          {children && <div className="mt-10">{children}</div>}
        </div>
      </div>
    </section>
  );
}
