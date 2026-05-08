import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  ChatsCircle,
  Hammer,
  Lightning,
  MicrophoneStage,
  Network,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";

export const metadata: Metadata = {
  title: "Praxis Console — Your AI workforce, in one place",
  description:
    "The web app where you talk to Atlas, your Chief of Staff, and eight specialist employees. Voice mode, real lead pipelines, real builds. Live today.",
};

type Employee = {
  name: string;
  role: string;
  desc: string;
  color: string;
};

const TEAM: Employee[] = [
  {
    name: "Atlas",
    role: "Chief of Staff",
    desc: "Routes the room. Holds memory across every conversation.",
    color: "#C8C5BD",
  },
  {
    name: "Marketing",
    role: "Specialist",
    desc: "Drafts campaigns, posts, and copy. Knows your voice.",
    color: "#FF8A3D",
  },
  {
    name: "Sales",
    role: "Specialist",
    desc: "Real lead pipelines. OSM, Reddit, Maps — no Apollo.",
    color: "#34D399",
  },
  {
    name: "Engineering",
    role: "Specialist",
    desc: "Ships real GitHub repos and Vercel deploys. Within minutes.",
    color: "#60A5FA",
  },
  {
    name: "Finance",
    role: "Specialist",
    desc: "Bookkeeping, forecasts, runway. Reads the receipts.",
    color: "#EAB308",
  },
  {
    name: "Compliance",
    role: "Specialist",
    desc: "Privacy, terms, regulatory. Reviews before you ship.",
    color: "#A855F7",
  },
  {
    name: "HR",
    role: "Specialist",
    desc: "Hiring docs, onboarding, performance frameworks.",
    color: "#EC4899",
  },
  {
    name: "Ops",
    role: "Specialist",
    desc: "Vendor reviews, process design, calendar shape.",
    color: "#14B8A6",
  },
  {
    name: "Legal",
    role: "Specialist",
    desc: "Contracts, NDAs, IP. Drafts with attorney-review notes.",
    color: "#3B82F6",
  },
];

const CAPABILITIES = [
  {
    Icon: ChatsCircle,
    title: "Talk",
    body: "Voice or text, solo or roundtable. Atlas takes the first call and routes to the specialist with context. No menu trees.",
  },
  {
    Icon: Hammer,
    title: "Build",
    body: "Engineering ships real Next.js sites, real Vercel deploys, real public URLs in minutes. Marketing briefs the copy fields automatically.",
  },
  {
    Icon: Network,
    title: "Coordinate",
    body: "Sales hands a hot lead to Marketing for a follow-up draft, then to Atlas for tracking. Cross-employee handoffs are first-class.",
  },
];

const STACK = [
  "Anthropic",
  "Vercel",
  "Supabase",
  "ElevenLabs",
  "LiveKit",
  "GitHub",
];

export default function PraxisConsolePage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden conduit-hero-section">
        <div className="conduit-mesh" aria-hidden />
        <div className="conduit-ember-radial" aria-hidden />
        <div className="relative conduit-container">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-12 lg:gap-16 items-center">
            <div className="max-w-[600px]">
              <p className="conduit-caption conduit-caption-ember">
                Praxis Console · Live
              </p>
              <h1 className="conduit-display-hero mt-6">
                Your AI workforce,{" "}
                <span className="conduit-ember-text">in one place.</span>
              </h1>
              <p className="conduit-body-lg mt-6 max-w-[540px]">
                The web app for Praxis. Atlas plus eight specialist employees,
                voice mode, real lead pipelines, real builds. Open it in a
                tab. Keep it next to your work.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-9">
                <Link href="/auth/sign-up" className="conduit-btn-primary">
                  Open the Console
                  <ArrowRight size={14} weight="bold" />
                </Link>
                <Link href="/pricing" className="conduit-btn-secondary">
                  See pricing
                </Link>
              </div>
            </div>

            {/* Console preview (similar to homepage hero, slightly smaller) */}
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-12 rounded-[40px] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(214,120,23,0.22) 0%, transparent 65%)",
                  filter: "blur(40px)",
                }}
              />
              <div
                className="relative aspect-[4/3] bg-[var(--color-ink-surface)] border border-[var(--color-edge)] rounded-2xl overflow-hidden"
                style={{
                  boxShadow:
                    "inset 0 0 0 1px rgba(214,120,23,0.12), 0 0 60px rgba(214,120,23,0.18), 0 24px 64px rgba(0,0,0,0.55)",
                }}
              >
                <div className="px-4 py-3 border-b border-[var(--color-edge-subtle)] flex items-center gap-3 bg-[var(--color-ink-surface-elevated)]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6058]/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28C940]/60" />
                  </div>
                  <span
                    className="text-[11px] text-[var(--color-cream-mute)] truncate"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    conduitai.io/app/workspace
                  </span>
                </div>
                <div className="absolute inset-x-0 top-12 bottom-0 flex items-center justify-center">
                  <div className="text-center">
                    <Users
                      size={56}
                      weight="duotone"
                      color="#D67817"
                      className="mx-auto"
                    />
                    <p className="mt-4 conduit-caption conduit-caption-ember">
                      Workspace · Live
                    </p>
                    <p className="mt-2 text-[13px] text-[var(--color-cream-mute)] max-w-[260px] mx-auto">
                      Sign in to see Atlas and the team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-14 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">What it does</p>
            <h2 className="conduit-display-2xl mt-5">
              Three things, well.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="conduit-card p-7 md:p-8">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge-subtle)] mb-6">
                  <c.Icon size={22} weight="regular" color="#D67817" />
                </div>
                <h3
                  className="text-[24px] leading-[1.1] tracking-[-0.02em] text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {c.title}
                </h3>
                <p className="text-[15px] mt-3 text-[var(--color-cream-soft)] leading-[1.65]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the team */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-14 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">Meet the team</p>
            <h2 className="conduit-display-2xl mt-5">
              Nine employees.{" "}
              <span className="conduit-ember-text">One brain.</span>
            </h2>
            <p className="conduit-body-lg mt-5 max-w-[600px]">
              Each has a domain, a voice, a real-time presence. Atlas writes
              memory; everyone else reads. They speak to each other across
              handoffs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEAM.map((e) => (
              <div
                key={e.name}
                className="conduit-card p-6 group flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: e.color,
                        boxShadow: `0 0 8px ${e.color}`,
                      }}
                    />
                    <span
                      className="text-[20px] tracking-tight text-[var(--color-cream)]"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontWeight: 500,
                      }}
                    >
                      {e.name}
                    </span>
                  </div>
                  <span className="conduit-caption text-[var(--color-cream-mute)]">
                    {e.role}
                  </span>
                </div>
                <p className="text-[14px] text-[var(--color-cream-soft)] leading-[1.6]">
                  {e.desc}
                </p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[var(--color-cream-mute)] hover:text-[var(--color-ember-500)] transition-colors w-fit"
                >
                  <MicrophoneStage size={12} weight="regular" />
                  Voice sample · soon
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Behind the scenes */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-14 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">
              Behind the scenes
            </p>
            <h2 className="conduit-display-2xl mt-5">
              Voice. Memory. Execution.
            </h2>
            <p className="conduit-body-lg mt-5 max-w-[600px]">
              The three systems that make Praxis feel like a workforce, not
              a chat product.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SubsystemCard
              Icon={MicrophoneStage}
              title="Voice"
              body="LiveKit + ElevenLabs. Per-employee voices, voice activity detection, soft interrupts. Roundtable mode pins 2-8 employees in the same room."
              metrics={[
                ["9", "voices"],
                ["~280ms", "first audio"],
              ]}
            />
            <SubsystemCard
              Icon={Brain}
              title="Memory"
              body="Atlas writes durable memory across conversations: facts, preferences, decisions, goals, context. Every employee reads the memory block."
              metrics={[
                ["1k", "active rows"],
                ["∞", "history"],
              ]}
            />
            <SubsystemCard
              Icon={Lightning}
              title="Execution"
              body="Engineering opens a sandbox, writes code, runs the build, pushes the deploy. Real Next.js apps, real Vercel deploys, real public URLs."
              metrics={[
                ["~7m", "build → deploy"],
                ["100%", "real commits"],
              ]}
            />
          </div>
        </div>
      </section>

      {/* Built on */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="text-center max-w-[640px] mx-auto mb-14">
            <p className="conduit-caption conduit-caption-ember">Built on</p>
            <h2 className="conduit-display-xl mt-5">
              Real infrastructure.
            </h2>
            <p className="conduit-body-lg mt-5">
              No homegrown half-implementations. The infrastructure stack we
              ship on is the same stack you&rsquo;d pick if you started today.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {STACK.map((s) => (
              <span
                key={s}
                className="text-[18px] md:text-[20px] tracking-tight text-[var(--color-cream-soft)]"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing inline */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="text-center max-w-[640px] mx-auto mb-12">
            <p className="conduit-caption conduit-caption-ember">Pricing</p>
            <h2 className="conduit-display-xl mt-5">
              Free to start.
            </h2>
            <p className="conduit-body-lg mt-5">
              Free tier ships Atlas + Marketing on Praxis Flow with a 50k
              monthly token allowance. Pro at $29/mo unlocks the full team,
              voice, and real builds.
            </p>
          </div>
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/sign-up" className="conduit-btn-primary">
                Open the Console
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link href="/pricing" className="conduit-btn-secondary">
                Compare tiers
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
  );
}

function SubsystemCard({
  Icon,
  title,
  body,
  metrics,
}: {
  Icon: typeof Brain;
  title: string;
  body: string;
  metrics: [string, string][];
}) {
  return (
    <div className="conduit-card p-7 md:p-8">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge-subtle)] mb-6">
        <Icon size={22} weight="regular" color="#D67817" />
      </div>
      <h3
        className="text-[24px] leading-[1.1] tracking-[-0.02em] text-[var(--color-cream)]"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
      >
        {title}
      </h3>
      <p className="text-[14px] mt-3 text-[var(--color-cream-soft)] leading-[1.65]">
        {body}
      </p>
      <div className="mt-6 flex items-baseline gap-x-5 gap-y-3 flex-wrap pt-5 border-t border-[var(--color-edge-subtle)]">
        {metrics.map(([n, label]) => (
          <div key={`${n}-${label}`}>
            <span
              className="block text-[22px] leading-[1.0] text-[var(--color-cream)] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
            >
              {n}
            </span>
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)] mt-1 block">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
