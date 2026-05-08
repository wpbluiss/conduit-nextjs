"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  GithubLogo,
  LinkedinLogo,
  XLogo,
} from "@phosphor-icons/react";

function ConduitMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <radialGradient id="conduit-mark-fill-footer" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#F5DDC3" />
          <stop offset="55%" stopColor="#D67817" />
          <stop offset="100%" stopColor="#8F4709" />
        </radialGradient>
      </defs>
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="url(#conduit-mark-fill-footer)"
      />
      <line
        x1="16"
        y1="3"
        x2="16"
        y2="29"
        stroke="#0A0908"
        strokeOpacity="0.55"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const COLS: {
  title: string;
  items: { href: string; label: string; external?: boolean; soon?: boolean }[];
}[] = [
  {
    title: "Praxis",
    items: [
      { href: "/products/praxis-console", label: "Console" },
      { href: "/products/praxis-mobile", label: "Mobile" },
      { href: "/products/praxis-hq", label: "HQ" },
      { href: "/pricing", label: "Pricing" },
      { href: "#", label: "Status", soon: true },
      { href: "#", label: "Changelog", soon: true },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/about", label: "About" },
      { href: "/approach", label: "Approach" },
      { href: "/about#vision", label: "Vision" },
      { href: "/customers", label: "Customers" },
      { href: "#", label: "Careers", soon: true },
      { href: "#", label: "Press", soon: true },
      { href: "mailto:luis@conduitai.io", label: "Contact" },
    ],
  },
  {
    title: "Engineering",
    items: [
      { href: "/blog.html", label: "Blog" },
      { href: "/blog-ai-engineering-department.html", label: "Engineering blog" },
      {
        href: "https://github.com/wpbluiss",
        label: "Open source",
        external: true,
      },
      { href: "#", label: "API docs", soon: true },
      { href: "#", label: "System status", soon: true },
      { href: "/approach", label: "Architecture" },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/customers/lunaro", label: "Lunaro Insurance" },
      { href: "/customers", label: "Customer stories" },
      { href: "#", label: "Trust + Security", soon: true },
      { href: "#", label: "Compliance", soon: true },
      {
        href: "mailto:luis@conduitai.io?subject=Become%20a%20customer",
        label: "Become a customer",
      },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "#", label: "Help center", soon: true },
      { href: "#", label: "Community", soon: true },
      { href: "#", label: "Partner network", soon: true },
      { href: "#", label: "Brand assets", soon: true },
      { href: "/sitemap.xml", label: "Sitemap" },
      { href: "#", label: "Cookies", soon: true },
    ],
  },
];

const SOCIALS: { icon: typeof XLogo; href: string; label: string }[] = [
  { icon: XLogo, href: "https://x.com/luiswpb", label: "Conduit on X" },
  {
    icon: GithubLogo,
    href: "https://github.com/wpbluiss",
    label: "Conduit on GitHub",
  },
  {
    icon: LinkedinLogo,
    href: "https://linkedin.com/company/conduitai",
    label: "Conduit on LinkedIn",
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <footer className="conduit-bg-canvas border-t border-[var(--color-edge-subtle)] relative overflow-hidden">
      {/* Subtle ember radial in upper-right */}
      <div
        aria-hidden="true"
        className="absolute -top-20 -right-20 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(214,120,23,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-10">
        {/* Top band — wordmark + tagline + newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 pb-16 md:pb-20 border-b border-[var(--color-edge-subtle)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Conduit">
              <ConduitMark size={36} />
              <span
                className="text-[28px] tracking-tight text-[var(--color-cream)]"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                Conduit
              </span>
            </Link>
            <p className="conduit-display-lg mt-6 max-w-md">
              Intelligence at work.
            </p>
          </div>

          <div className="lg:pt-2">
            <p className="conduit-caption conduit-caption-ember mb-4">
              Newsletter
            </p>
            <p className="text-[15px] text-[var(--color-cream-soft)] leading-[1.6] mb-5 max-w-md">
              Product updates, customer stories, and the occasional thesis on
              what the next decade of AI workforces looks like.
            </p>
            {submitted ? (
              <div className="flex items-center gap-2 text-[14px] text-[var(--color-conduit-success)]">
                <CheckCircle size={18} weight="fill" />
                <span>You&rsquo;re on the list. Talk soon.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md"
              >
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Get product updates"
                  className="flex-1 px-4 py-3 bg-[var(--color-ink-surface)] border border-[var(--color-edge)] rounded-xl text-[14px] text-[var(--color-cream)] placeholder:text-[var(--color-cream-mute)] focus:border-[var(--color-ember-500)] focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="conduit-btn-primary justify-center"
                  style={{ padding: "12px 20px", fontSize: "14px" }}
                >
                  Subscribe
                  <ArrowRight size={14} weight="bold" />
                </button>
              </form>
            )}
            <p className="text-[12px] text-[var(--color-cream-mute)] mt-3">
              We respect your inbox.
            </p>
          </div>
        </div>

        {/* 5-col grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 md:gap-8 py-16 md:py-20">
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="conduit-caption text-[var(--color-cream)] mb-4">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.items.map((l) => (
                  <li key={`${col.title}-${l.label}`}>
                    {l.soon ? (
                      <span
                        className="text-[14px] text-[var(--color-cream-mute)] inline-flex items-center gap-2"
                        title="Coming soon"
                      >
                        {l.label}
                        <span className="text-[10px] text-[var(--color-cream-faint)] tracking-wider uppercase">
                          soon
                        </span>
                      </span>
                    ) : (
                      <Link
                        href={l.href}
                        target={l.external ? "_blank" : undefined}
                        rel={l.external ? "noreferrer" : undefined}
                        className="text-[14px] text-[var(--color-cream-soft)] hover:text-[var(--color-ember-500)] transition-colors"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom band */}
        <div className="pt-8 border-t border-[var(--color-edge-subtle)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-[13px] text-[var(--color-cream-mute)]">
            <span>&copy; 2026 Conduit. West Palm Beach, FL.</span>
            <div className="flex items-center gap-5">
              <Link
                href="/privacy-policy.html"
                className="hover:text-[var(--color-cream)] transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms.html"
                className="hover:text-[var(--color-cream)] transition-colors"
              >
                Terms
              </Link>
              <span
                className="cursor-default"
                title="Coming soon"
              >
                Acceptable use
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {SOCIALS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--color-edge-subtle)] text-[var(--color-cream-mute)] hover:text-[var(--color-ember-500)] hover:border-[var(--color-edge)] transition-colors"
                >
                  <Icon size={16} weight="regular" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
