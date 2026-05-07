import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Tile {
  name: string;
  status: "live" | "coming-soon" | "q3";
  statusLabel: string;
  tagline: string;
  body: string;
  cta: { label: string; href: string };
  accent: string;
  accentSoft: string;
}

const TILES: Tile[] = [
  {
    name: "Praxis Console",
    status: "live",
    statusLabel: "Live",
    tagline: "Your AI workforce, in one place.",
    body: "Talk to Atlas, your Chief of Staff, or any of nine specialist employees — Marketing, Sales, Engineering, Finance, Compliance, HR, Ops, Legal. Voice mode, real lead pipelines, real builds. The web app that ships work today.",
    cta: { label: "Open the Console", href: "/auth/sign-up" },
    accent: "#FF8A3D",
    accentSoft: "rgba(255, 138, 61, 0.14)",
  },
  {
    name: "Praxis Mobile",
    status: "coming-soon",
    statusLabel: "TestFlight this week",
    tagline: "Praxis in your pocket.",
    body: "Native iOS and Android. Voice-first conversations with your team while you drive between meetings. Push notifications when Atlas needs a decision or a lead heats up. TestFlight invites going out this week.",
    cta: { label: "Join the waitlist", href: "/products/praxis-mobile" },
    accent: "#34D399",
    accentSoft: "rgba(52, 211, 153, 0.14)",
  },
  {
    name: "Praxis HQ",
    status: "q3",
    statusLabel: "Q3 2026",
    tagline: "Walk through your AI headquarters.",
    body: "A 3D office where each employee has a desk, an avatar, and a presence. Step into the marketing room, watch a campaign get drafted in real time, then walk to engineering to spin up a new build. Spatial collaboration with the team you can&apos;t see.",
    cta: { label: "Early access", href: "/products/praxis-hq" },
    accent: "#A855F7",
    accentSoft: "rgba(168, 85, 247, 0.14)",
  },
];

export default function ProductTiles() {
  return (
    <section
      id="products"
      className="relative px-6 py-20 md:py-28 border-t border-[#1F1C19]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="eyebrow mb-4">What we&apos;re building</p>
          <h2 className="serif text-[36px] md:text-[52px] leading-[1.05] tracking-[-0.02em] text-[#F5F1EA]">
            Three surfaces. One workforce.
          </h2>
          <p className="mt-5 text-[16px] md:text-[18px] text-[#8C8884] leading-relaxed">
            The Praxis product family runs on the same brain. Pick the
            surface that fits your moment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-stretch">
          {TILES.map((t) => (
            <article
              key={t.name}
              className="relative p-7 md:p-8 bg-[#0A0908] border border-[#1F1C19] flex flex-col gap-4 hover:border-[var(--accent)]/60 transition-colors"
              style={{ ["--accent" as string]: t.accent }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: t.accent }}
                >
                  <span
                    aria-hidden
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        t.status === "live"
                          ? t.accent
                          : "transparent",
                      boxShadow: `inset 0 0 0 1px ${t.accent}`,
                    }}
                  />
                  {t.statusLabel}
                </span>
              </div>
              <h3 className="serif text-[28px] md:text-[34px] text-[#F5F1EA] leading-[1.05]">
                {t.name}
              </h3>
              <p
                className="text-[15px] md:text-[16px]"
                style={{ color: t.accent }}
              >
                {t.tagline}
              </p>
              <p className="text-[14px] text-[#8C8884] leading-relaxed flex-1">
                {t.body}
              </p>
              <Link
                href={t.cta.href}
                className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: t.accent }}
              >
                {t.cta.label}
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
