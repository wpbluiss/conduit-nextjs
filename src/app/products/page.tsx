import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Buildings, DeviceMobile, Monitor } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";

export const metadata: Metadata = {
  title: "Products — The Praxis family",
  description:
    "Praxis Console (live), Praxis Mobile (TestFlight), and Praxis HQ (Q3 2026). Three surfaces, one autonomous workforce.",
};

type Status = "live" | "beta" | "soon";

type Product = {
  slug: string;
  name: string;
  status: Status;
  statusLabel: string;
  tagline: string;
  body: string[];
  features: string[];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

const PRODUCTS: Product[] = [
  {
    slug: "praxis-console",
    name: "Praxis Console",
    status: "live",
    statusLabel: "Live",
    tagline: "Your AI workforce, in one place.",
    body: [
      "The web app where you talk to Atlas, your Chief of Staff, and eight specialist employees. Voice mode, real lead pipelines, real builds.",
      "Open it in a tab next to your work. The team is already there — Marketing, Sales, Engineering, Finance, Compliance, HR, Ops, Legal — picking up tasks the moment you ask.",
    ],
    features: [
      "Atlas Chief of Staff with cross-conversation memory",
      "Voice Room with real-time roundtable",
      "Lead pipelines built on free, open data sources",
      "Engineering ships real GitHub + Vercel deploys",
    ],
    primary: { label: "Open the Console", href: "/auth/sign-up" },
    secondary: { label: "Tour Console", href: "/products/praxis-console" },
  },
  {
    slug: "praxis-mobile",
    name: "Praxis Mobile",
    status: "beta",
    statusLabel: "TestFlight",
    tagline: "Praxis in your pocket.",
    body: [
      "Native iOS and Android. Voice-first conversations with your team between meetings, in the car, on a walk.",
      "Push notifications when Atlas needs a decision or a lead heats up. Voice rooms joinable from a notification. Same brain as Console — different surface.",
    ],
    features: [
      "Native Expo build, not a WebView wrapper",
      "Background voice rooms for hands-free use",
      "Smart push — only when a decision is needed",
      "Quiet hours respect your timezone",
    ],
    primary: { label: "Join the waitlist", href: "/products/praxis-mobile" },
    secondary: { label: "Tour Mobile", href: "/products/praxis-mobile" },
  },
  {
    slug: "praxis-hq",
    name: "Praxis HQ",
    status: "soon",
    statusLabel: "Q3 2026",
    tagline: "Walk through your AI headquarters.",
    body: [
      "A spatial workspace where each employee has a desk, a presence, a voice. Step into the marketing room and watch a campaign get drafted in real time.",
      "Walk down the hall to engineering and spin up a build. Roundtable in the boardroom. Same brain as Console and Mobile — cinematic surface for the moments that deserve it.",
    ],
    features: [
      "Cinematic 3D office with rendered employees",
      "Roundtable rooms with spatial audio",
      "Live build wall, live deal floor",
      "Headphones on, walk into your company",
    ],
    primary: { label: "Reserve early access", href: "/products/praxis-hq" },
    secondary: { label: "Tour HQ", href: "/products/praxis-hq" },
  },
];

function StatusBadge({ status, label }: { status: Status; label: string }) {
  const klass =
    status === "live"
      ? "conduit-badge-live"
      : status === "beta"
        ? "conduit-badge-beta"
        : "conduit-badge-soon";
  return (
    <span className={`conduit-badge ${klass}`}>
      {status === "live" ? <span className="conduit-badge-dot" /> : null}
      {label}
    </span>
  );
}

function ProductPreview({ slug }: { slug: string }) {
  if (slug === "praxis-console") {
    return (
      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[var(--color-ink-canvas)] border border-[var(--color-edge)] relative">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 70% 20%, rgba(214,120,23,0.16), transparent 60%)",
          }}
        />
        <div className="px-4 py-3 border-b border-[var(--color-edge-subtle)] flex items-center gap-2 bg-[var(--color-ink-surface-elevated)] relative">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF6058]/60" />
            <span className="w-2 h-2 rounded-full bg-[#FFBD2E]/60" />
            <span className="w-2 h-2 rounded-full bg-[#28C940]/60" />
          </div>
          <span
            className="text-[10px] text-[var(--color-cream-mute)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            conduitai.io/app
          </span>
        </div>
        <div className="absolute inset-x-8 top-16 bottom-8 flex items-center justify-center">
          <Monitor size={88} weight="duotone" color="#D67817" />
        </div>
      </div>
    );
  }
  if (slug === "praxis-mobile") {
    return (
      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[var(--color-ink-canvas)] border border-[var(--color-edge)] relative flex items-center justify-center">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(214,120,23,0.18), transparent 65%)",
          }}
        />
        <DeviceMobile size={108} weight="duotone" color="#D67817" />
      </div>
    );
  }
  return (
    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[var(--color-ink-canvas)] border border-[var(--color-edge)] relative flex items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(214,120,23,0.14), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #F5EFE6 1px, transparent 1px), linear-gradient(to bottom, #F5EFE6 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <Buildings size={108} weight="duotone" color="#D67817" />
    </div>
  );
}

export default function ProductsIndex() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden conduit-hero-section">
        <div className="conduit-mesh" aria-hidden />
        <div className="conduit-ember-radial" aria-hidden />
        <div className="relative conduit-container">
          <div className="max-w-[820px]">
            <p className="conduit-caption conduit-caption-ember">
              The Praxis product family
            </p>
            <h1 className="conduit-display-hero mt-6">
              Three surfaces.{" "}
              <span className="conduit-ember-text">One workforce.</span>
            </h1>
            <p className="conduit-body-lg mt-6 max-w-[640px]">
              The Praxis product family runs on the same brain — Atlas plus
              eight specialists, one shared memory. Pick the surface that fits
              the moment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <Link href="/auth/sign-up" className="conduit-btn-primary">
                Open Praxis Console
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link href="/pricing" className="conduit-btn-secondary">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed product cards */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container space-y-6 lg:space-y-8">
          {PRODUCTS.map((p, idx) => (
            <article
              key={p.slug}
              className="conduit-card p-6 md:p-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8 lg:gap-12"
            >
              <div
                className={`flex flex-col ${idx % 2 === 1 ? "lg:order-2" : ""}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <StatusBadge status={p.status} label={p.statusLabel} />
                </div>
                <h2
                  className="text-[36px] md:text-[44px] leading-[1.05] tracking-[-0.025em] text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {p.name}
                </h2>
                <p className="text-[18px] mt-3 text-[var(--color-ember-300)]">
                  {p.tagline}
                </p>
                <div className="mt-6 space-y-4 text-[15px] md:text-[16px] text-[var(--color-cream-soft)] leading-[1.65]">
                  {p.body.map((b, i) => (
                    <p key={i}>{b}</p>
                  ))}
                </div>
                <ul className="mt-7 space-y-2.5">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-[14px] text-[var(--color-cream)] leading-[1.55]"
                    >
                      <span
                        aria-hidden
                        className="w-1 h-1 mt-[10px] rounded-full bg-[var(--color-ember-500)] shrink-0"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <Link href={p.primary.href} className="conduit-btn-primary">
                    {p.primary.label}
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                  <Link
                    href={p.secondary.href}
                    className="conduit-btn-secondary"
                  >
                    {p.secondary.label}
                  </Link>
                </div>
              </div>
              <div
                className={`relative ${idx % 2 === 1 ? "lg:order-1" : ""}`}
              >
                <ProductPreview slug={p.slug} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
  );
}
