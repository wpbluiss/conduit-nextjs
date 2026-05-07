import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brain, Hammer, ListTodo, Mic, Users2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Praxis Console — Your AI workforce, in one place",
  description:
    "The web app where you talk to Atlas, your Chief of Staff, and eight specialist employees. Voice mode, real lead pipelines, real builds. Live today.",
};

interface Feature {
  eyebrow: string;
  title: string;
  body: string;
  highlights?: string[];
  accent: string;
  icon: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    eyebrow: "Voice mode",
    title: "Talk to your team like a Zoom call.",
    body: "Voice Room is a real-time conversational mode with the team. Solo or roundtable. Live interrupts, voice activity detection, per-employee voices. Atlas moderates roundtable; specialists weigh in.",
    highlights: [
      "Per-employee ElevenLabs voice picks",
      "Daily voice cap with soft warning at the threshold",
      "Roundtable: pin in 2-8 employees on Pro/Enterprise",
    ],
    accent: "#FF8A3D",
    icon: <Mic size={18} />,
  },
  {
    eyebrow: "Real leads",
    title: "Real pipelines. No Apollo. No Bright Data.",
    body: "Sales runs on free + open sources — OpenStreetMap Overpass for discovery, Reddit for intent signals, Google Maps via Playwright for ratings + reviews. Pre-seeded with real West Palm Beach + Boca + Delray + Jupiter med-spa leads on day one.",
    highlights: [
      "Discovery from OSM Overpass (no API key)",
      "Intent scored from Reddit posts mentioning the vertical",
      "Map-grade enrichment: ratings, hours, photos",
    ],
    accent: "#34D399",
    icon: <ListTodo size={18} />,
  },
  {
    eyebrow: "Memory",
    title: "Your AI remembers.",
    body: "Atlas writes durable memory across conversations: facts, preferences, decisions, goals, context. Every employee reads the memory block; only Atlas writes. You can edit or archive anything in /app/settings/memory.",
    highlights: [
      "Tag-based [REMEMBER] / [SUPERSEDE] tools",
      "Voice sessions append summary memory at end-of-call",
      "Up to 1000 active rows on Enterprise",
    ],
    accent: "#A855F7",
    icon: <Brain size={18} />,
  },
  {
    eyebrow: "Atlas",
    title: "A Chief of Staff who actually shows up.",
    body: "Atlas takes the first call. He routes to a specialist with a [HANDOFF] tag and a brief, or handles it himself for strategic asks. Roundtable mode lets him moderate the rest of the team weighing in on a question. No menu trees.",
    highlights: [
      "Adaptive model routing (Sonnet on reasoning, Haiku on routing)",
      "Tier-aware: never routes to a locked employee",
      "Time-aware system prompt — knows your timezone",
    ],
    accent: "#C8C5BD",
    icon: <Users2 size={18} />,
  },
  {
    eyebrow: "Engineering",
    title: "Engineering that actually ships.",
    body: "Match a request to a template — landing page, basic CRM, blog, lead capture, contact form — and Engineering builds it: real GitHub repo, real Vercel deployment, real public URL within minutes. No mocks.",
    highlights: [
      "Live URLs from GitHub + Vercel (your account or ours)",
      "Marketing employee briefed on copy fields automatically",
      "R15 will open this up to arbitrary builds via Claude Code",
    ],
    accent: "#60A5FA",
    icon: <Hammer size={18} />,
  },
];

export default function PraxisConsolePage() {
  return (
    <main>
      <Navbar />

      <section className="relative px-6 pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6 inline-flex items-center">
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full mr-2"
              style={{ background: "#FF8A3D" }}
            />
            Praxis Console · Live
          </p>
          <h1 className="serif text-[44px] md:text-[68px] leading-[1.0] tracking-[-0.02em] text-[#F5F1EA]">
            Your AI workforce, in one place.
          </h1>
          <p className="mt-7 text-[17px] md:text-[20px] text-[#8C8884] leading-[1.7] max-w-2xl">
            The web app for Praxis. Atlas plus eight specialist employees,
            voice mode, real lead pipelines, real builds. Open it in a tab,
            keep it next to your work.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link href="/auth/sign-up" className="btn-primary justify-center">
              Open the Console <ArrowRight size={14} />
            </Link>
            <Link href="/#pricing" className="btn-secondary justify-center">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {FEATURES.map((f, idx) => (
        <section
          key={f.title}
          className="px-6 py-16 md:py-24 border-t border-[#1F1C19]"
          style={{ ["--accent" as string]: f.accent }}
        >
          <div
            className={`max-w-5xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-start ${
              idx % 2 === 1 ? "md:[direction:rtl]" : ""
            }`}
          >
            <div className="md:[direction:ltr]">
              <p
                className="eyebrow mb-4 inline-flex items-center gap-2"
                style={{ color: f.accent }}
              >
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                  style={{
                    background: `color-mix(in srgb, ${f.accent} 16%, transparent)`,
                  }}
                >
                  {f.icon}
                </span>
                {f.eyebrow}
              </p>
              <h2 className="serif text-[32px] md:text-[44px] leading-[1.05] text-[#F5F1EA]">
                {f.title}
              </h2>
              <p className="mt-5 text-[16px] md:text-[17px] text-[#8C8884] leading-[1.75]">
                {f.body}
              </p>
              {f.highlights && (
                <ul className="mt-6 space-y-2.5">
                  {f.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-3 text-[14px] text-[#F5F1EA] leading-relaxed"
                    >
                      <span
                        aria-hidden
                        className="inline-block w-1 h-1 mt-2.5 rounded-full shrink-0"
                        style={{ background: f.accent }}
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="md:[direction:ltr]">
              {/* Visual placeholder block — will be filled with real
                  screenshots/loops in a future polish round. Geometric
                  card keeps the page feeling done without lying about
                  having a hero shot. */}
              <div
                className="aspect-[4/3] rounded-lg border border-[#1F1C19] relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, ${f.accent} 10%, #0A0908), #0A0908)`,
                }}
              >
                <div className="absolute inset-6 border border-[#1F1C19] rounded-md flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span
                      aria-hidden
                      className="inline-flex items-center justify-center w-10 h-10 rounded-md"
                      style={{
                        background: `color-mix(in srgb, ${f.accent} 20%, transparent)`,
                        color: f.accent,
                      }}
                    >
                      {f.icon}
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: f.accent }}
                    >
                      {f.eyebrow}
                    </span>
                    <span className="text-[11px] text-[#5C5854] mt-1">
                      Visual coming · feature is live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="px-6 py-20 md:py-28 border-t border-[#1F1C19] bg-[#14110F]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="serif text-[36px] md:text-[52px] leading-[1.05] text-[#F5F1EA]">
            Praxis Console is live, free to start.
          </h2>
          <p className="mt-5 text-[16px] md:text-[18px] text-[#8C8884]">
            Free tier ships Atlas + Marketing on Praxis Flow with a 50k
            monthly token allowance. Pro at $29/mo unlocks the full team,
            voice, and real builds.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/sign-up" className="btn-primary justify-center">
              Open the Console <ArrowRight size={14} />
            </Link>
            <Link href="/#pricing" className="btn-secondary justify-center">
              Compare tiers
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
