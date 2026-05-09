"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, List, X } from "@phosphor-icons/react";
import Logo from "@/components/Logo";

// ─── Product marks (small geometric SVGs for mega-menu) ──────────────

function ConsoleMark() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="7"
        width="28"
        height="20"
        rx="2"
        stroke="#5B63E8"
        strokeWidth="1.5"
      />
      <line
        x1="4"
        y1="12"
        x2="32"
        y2="12"
        stroke="#5B63E8"
        strokeWidth="1"
        strokeOpacity="0.6"
      />
      <circle cx="7" cy="9.5" r="0.8" fill="#5B63E8" />
      <line
        x1="14"
        y1="32"
        x2="22"
        y2="32"
        stroke="#5B63E8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MobileMark() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="11"
        y="4"
        width="14"
        height="28"
        rx="2.5"
        stroke="#5B63E8"
        strokeWidth="1.5"
      />
      <line
        x1="15"
        y1="29"
        x2="21"
        y2="29"
        stroke="#5B63E8"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 27 14 Q 30 18 27 22"
        stroke="#5B63E8"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 30 11 Q 34 18 30 25"
        stroke="#5B63E8"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}

function HqMark() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 6 30 L 6 14 L 18 8 L 30 14 L 30 30 Z"
        stroke="#5B63E8"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line
        x1="6"
        y1="14"
        x2="30"
        y2="14"
        stroke="#5B63E8"
        strokeWidth="1"
        strokeOpacity="0.6"
      />
      <line
        x1="18"
        y1="8"
        x2="18"
        y2="30"
        stroke="#5B63E8"
        strokeWidth="1"
        strokeOpacity="0.6"
      />
      <rect x="9" y="18" width="3" height="3" fill="#5B63E8" opacity="0.85" />
      <rect x="14" y="18" width="3" height="3" fill="#5B63E8" opacity="0.5" />
      <rect x="19" y="18" width="3" height="3" fill="#5B63E8" opacity="0.85" />
      <rect x="24" y="18" width="3" height="3" fill="#5B63E8" opacity="0.5" />
    </svg>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────

function StatusBadge({ kind }: { kind: "live" | "beta" | "soon" }) {
  const text =
    kind === "live" ? "Live" : kind === "beta" ? "Beta · TestFlight" : "Q3 2026";
  const klass =
    kind === "live"
      ? "conduit-badge-live"
      : kind === "beta"
        ? "conduit-badge-beta"
        : "conduit-badge-soon";
  return (
    <span className={`conduit-badge ${klass}`}>
      {kind === "live" ? <span className="conduit-badge-dot" /> : null}
      {text}
    </span>
  );
}

// ─── Mega-menu data ───────────────────────────────────────────────────

type ProductCard = {
  title: string;
  href: string;
  desc: string;
  status: "live" | "beta" | "soon";
  Mark: () => React.ReactElement;
};

const PRODUCTS: ProductCard[] = [
  {
    title: "Praxis Console",
    href: "/products/praxis-console",
    desc: "Your AI workforce, in one place.",
    status: "live",
    Mark: ConsoleMark,
  },
  {
    title: "Praxis Mobile",
    href: "/products/praxis-mobile",
    desc: "Praxis in your pocket.",
    status: "beta",
    Mark: MobileMark,
  },
  {
    title: "Praxis HQ",
    href: "/products/praxis-hq",
    desc: "Walk through your AI HQ.",
    status: "soon",
    Mark: HqMark,
  },
];

type LinkColumn = {
  title: string;
  items: { href: string; label: string; external?: boolean }[];
};

const COMPANY_COLS: LinkColumn[] = [
  {
    title: "About",
    items: [
      { href: "/about", label: "Mission" },
      { href: "/approach", label: "Approach" },
      { href: "/about#vision", label: "Vision" },
    ],
  },
  {
    title: "Engineering",
    items: [
      { href: "/blog.html", label: "Blog" },
      { href: "https://github.com/wpbluiss", label: "Open source", external: true },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/customers", label: "Stories" },
      { href: "/customers/lunaro", label: "Lunaro" },
      {
        href: "mailto:luis@conduitai.io?subject=Become%20a%20customer",
        label: "Become a customer",
      },
    ],
  },
];

const RESOURCES_COLS: LinkColumn[] = [
  {
    title: "Learn",
    items: [
      { href: "/blog.html", label: "Blog" },
      { href: "/approach", label: "Approach" },
      { href: "/customers/lunaro", label: "Case studies" },
    ],
  },
  {
    title: "Build",
    items: [
      { href: "/auth/sign-up", label: "Get started" },
      { href: "/products/praxis-console", label: "Console" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Help",
    items: [
      { href: "mailto:luis@conduitai.io", label: "Contact" },
      { href: "/privacy-policy.html", label: "Privacy" },
      { href: "/terms.html", label: "Terms" },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────

type MenuKey = "products" | "company" | "resources" | null;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function handleMenuEnter(key: MenuKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  }
  function handleMenuLeave() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-[background,backdrop-filter,border-color] duration-300 ${
          scrolled || openMenu
            ? "conduit-nav-glass"
            : "bg-transparent border-b border-transparent"
        }`}
        onMouseLeave={handleMenuLeave}
      >
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
          {/* Wordmark — institutional indigo rails + Fraunces wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="Conduit"
          >
            <span className="hidden md:block">
              <Logo size={scrolled ? 28 : 32} />
            </span>
            <span className="md:hidden">
              <Logo size={36} />
            </span>
            <span
              className={`text-[20px] tracking-tight text-[var(--color-ink-primary)] transition-[font-size] duration-300 ${
                scrolled ? "md:text-[17px]" : "md:text-[19px]"
              }`}
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 500,
              }}
            >
              Conduit
            </span>
          </Link>

          {/* Desktop center links */}
          <ul className="hidden md:flex items-center gap-1">
            <NavMegaTrigger
              label="Products"
              active={openMenu === "products"}
              onEnter={() => handleMenuEnter("products")}
            />
            <NavMegaTrigger
              label="Company"
              active={openMenu === "company"}
              onEnter={() => handleMenuEnter("company")}
            />
            <NavLink href="/customers" onEnter={handleMenuLeave}>
              Customers
            </NavLink>
            <NavMegaTrigger
              label="Resources"
              active={openMenu === "resources"}
              onEnter={() => handleMenuEnter("resources")}
            />
            <NavLink href="/pricing" onEnter={handleMenuLeave}>
              Pricing
            </NavLink>
          </ul>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/auth/sign-in"
              className="text-[14px] text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="conduit-btn-primary text-[14px]"
              style={{ padding: "10px 20px" }}
            >
              Open Praxis
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 text-[var(--color-cream)]"
            aria-label="Open menu"
          >
            <List size={22} weight="regular" />
          </button>
        </div>

        {/* Mega-menu drawer */}
        <AnimatePresence mode="wait">
          {openMenu && (
            <motion.div
              key={openMenu}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="absolute left-0 right-0 top-full hidden md:block"
              onMouseEnter={() => {
                if (closeTimer.current) clearTimeout(closeTimer.current);
              }}
            >
              <div className="conduit-nav-glass border-t border-[var(--color-edge-subtle)]">
                <div className="max-w-[1280px] mx-auto px-10 py-10">
                  {openMenu === "products" && <ProductsMenu />}
                  {openMenu === "company" && (
                    <ColumnsMenu cols={COMPANY_COLS} />
                  )}
                  {openMenu === "resources" && (
                    <ColumnsMenu cols={RESOURCES_COLS} />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="md:hidden fixed inset-0 z-[60]"
          >
            <div
              className="absolute inset-0"
              style={{
                background: "rgba(250, 250, 247, 0.92)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
              }}
            />
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1], delay: 0.05 }}
              className="absolute inset-0 conduit-bg-canvas overflow-y-auto"
            >
              <div className="px-6 pt-6 pb-12">
                <div className="flex items-center justify-between h-12 mb-10">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5"
                    aria-label="Conduit"
                  >
                    <Logo size={32} />
                    <span
                      className="text-[19px] text-[var(--color-ink-primary)]"
                      style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                    >
                      Conduit
                    </span>
                  </Link>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-cream)]"
                    aria-label="Close menu"
                  >
                    <X size={22} weight="regular" />
                  </button>
                </div>

                <div className="space-y-8">
                  <MobileSection title="Products">
                    {PRODUCTS.map((p) => (
                      <Link
                        key={p.href}
                        href={p.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-start gap-3 py-2"
                      >
                        <p.Mark />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[17px] text-[var(--color-cream)]"
                              style={{
                                fontFamily: "var(--font-serif)",
                                fontWeight: 500,
                              }}
                            >
                              {p.title}
                            </span>
                            <StatusBadge kind={p.status} />
                          </div>
                          <p className="text-[13px] text-[var(--color-cream-mute)] mt-0.5">
                            {p.desc}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </MobileSection>

                  <MobileSection title="Company">
                    {COMPANY_COLS.flatMap((c) => c.items).map((l) => (
                      <Link
                        key={`${l.label}-${l.href}`}
                        href={l.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-2 text-[17px] text-[var(--color-cream)]"
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontWeight: 400,
                        }}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </MobileSection>

                  <MobileSection title="Resources">
                    {RESOURCES_COLS.flatMap((c) => c.items).map((l) => (
                      <Link
                        key={`${l.label}-${l.href}`}
                        href={l.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-2 text-[17px] text-[var(--color-cream)]"
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontWeight: 400,
                        }}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </MobileSection>
                </div>

                <div className="mt-12 pt-8 border-t border-[var(--color-edge-subtle)] space-y-4">
                  <Link
                    href="/auth/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="block text-[15px] text-[var(--color-cream-soft)]"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className="conduit-btn-primary justify-center w-full"
                  >
                    Open Praxis Console
                    <ArrowRight size={16} weight="bold" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function NavLink({
  href,
  children,
  onEnter,
}: {
  href: string;
  children: React.ReactNode;
  onEnter?: () => void;
}) {
  return (
    <li onMouseEnter={onEnter}>
      <Link
        href={href}
        className="block text-[14px] text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] px-4 py-2 rounded-lg transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

function NavMegaTrigger({
  label,
  active,
  onEnter,
}: {
  label: string;
  active: boolean;
  onEnter: () => void;
}) {
  return (
    <li onMouseEnter={onEnter}>
      <button
        type="button"
        className={`text-[14px] px-4 py-2 rounded-lg transition-colors ${
          active
            ? "text-[var(--color-cream)]"
            : "text-[var(--color-cream-mute)] hover:text-[var(--color-cream)]"
        }`}
      >
        {label}
      </button>
    </li>
  );
}

function ProductsMenu() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {PRODUCTS.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className="group flex items-start gap-4 p-4 rounded-xl border border-transparent hover:border-[var(--color-edge)] hover:bg-[var(--color-ink-surface)] transition-all duration-300"
        >
          <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge-subtle)]">
            <p.Mark />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[16px] text-[var(--color-cream)]"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                {p.title}
              </span>
              <StatusBadge kind={p.status} />
            </div>
            <p className="text-[13px] leading-[1.5] text-[var(--color-cream-mute)] group-hover:text-[var(--color-cream-soft)] transition-colors">
              {p.desc}
            </p>
            <span className="text-[12px] text-[var(--color-indigo-500)] inline-flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Learn more
              <ArrowRight size={12} weight="bold" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ColumnsMenu({ cols }: { cols: LinkColumn[] }) {
  return (
    <div className="grid grid-cols-3 gap-10">
      {cols.map((c) => (
        <div key={c.title}>
          <p className="conduit-caption text-[var(--color-cream-mute)] mb-4">
            {c.title}
          </p>
          <ul className="space-y-2">
            {c.items.map((l) => (
              <li key={`${l.label}-${l.href}`}>
                <Link
                  href={l.href}
                  target={l.external ? "_blank" : undefined}
                  rel={l.external ? "noreferrer" : undefined}
                  className="text-[14px] text-[var(--color-ink-primary)] hover:text-[var(--color-indigo-500)] transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function MobileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="conduit-caption conduit-caption-ember mb-3">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
