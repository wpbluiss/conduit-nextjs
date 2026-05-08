import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Buildings,
  Compass,
  Lightning,
  MicrophoneStage,
  Network,
  Rocket,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Praxis HQ — Walk through your AI headquarters",
  description:
    "A spatial workspace where each AI employee has a desk, an avatar, a presence. Step in, watch the team work, talk to a specialist. Q3 2026.",
};

const ROOMS = [
  {
    Icon: Compass,
    title: "Marketing room",
    body: "Drafts on the wall, voice samples on the desk, a live editor surface where the team revises copy in real time.",
  },
  {
    Icon: Network,
    title: "Engineering bay",
    body: "Build wall showing live deploys. Walk up to a build to inspect logs, file diffs, and the running preview URL.",
  },
  {
    Icon: Users,
    title: "Boardroom",
    body: "Roundtable mode for messy decisions. All nine employees sit at the table with spatial audio. You moderate.",
  },
  {
    Icon: MicrophoneStage,
    title: "Atlas's office",
    body: "The room where memory lives. Walk in to review what Atlas has captured about you, your business, your team.",
  },
];

const TIMELINE = [
  {
    period: "Q2 2026",
    title: "Closed alpha",
    body: "First 50 customers from the waitlist walk through the lobby. Marketing room and Atlas's office go live.",
  },
  {
    period: "Q3 2026",
    title: "Public early access",
    body: "Engineering bay + Boardroom ship. Roundtable spatial audio. Open to Pro and Enterprise tiers.",
  },
  {
    period: "Q4 2026",
    title: "Multi-user HQ",
    body: "Walk into your team's HQ together. Co-presence with humans + AI in the same room.",
  },
];

export default function PraxisHQPage() {
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
              Praxis HQ · Q3 2026
            </p>
            <h1 className="conduit-display-hero mt-6">
              Walk into a company you{" "}
              <span className="conduit-ember-text">don&rsquo;t have to staff.</span>
            </h1>
            <p className="conduit-body-lg mt-6 max-w-[640px]">
              A spatial workspace where each Praxis employee has a desk, a
              presence, a voice. Step into the marketing room and watch a
              campaign drafted in real time. Walk to the engineering bay and
              spin up a build.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <Link href="#early-access" className="conduit-btn-primary">
                Reserve early access
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link href="/products/praxis-console" className="conduit-btn-secondary">
                Use Praxis Console today
              </Link>
            </div>
          </div>
        </div>

        {/* Cinematic preview frame */}
        <div className="relative conduit-container mt-16 md:mt-20">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-12 rounded-[40px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(91, 99, 232,0.22) 0%, transparent 65%)",
                filter: "blur(40px)",
              }}
            />
            <div
              className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-[var(--color-ink-surface)]"
              style={{
                boxShadow:
                  "inset 0 0 0 1px rgba(91, 99, 232,0.18), 0 0 80px rgba(91, 99, 232,0.18), 0 32px 80px rgba(0,0,0,0.6)",
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-ink-canvas)]">
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div
                    className="w-[420px] h-[420px] rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(91, 99, 232,0.25) 0%, transparent 60%)",
                      filter: "blur(20px)",
                    }}
                  />
                </div>
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #F5EFE6 1px, transparent 1px), linear-gradient(to bottom, #F5EFE6 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                    maskImage:
                      "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                    WebkitMaskImage:
                      "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                  }}
                />
                <div className="relative flex flex-col items-center gap-5">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "var(--color-ink-surface-elevated)",
                      border: "1px solid rgba(91, 99, 232,0.3)",
                      boxShadow:
                        "inset 0 0 0 1px rgba(91, 99, 232,0.15), 0 0 40px rgba(91, 99, 232,0.25)",
                    }}
                  >
                    <Buildings size={42} weight="duotone" color="#5B63E8" />
                  </div>
                  <p className="conduit-caption conduit-caption-ember">
                    Cinematic walkthrough · Q3 2026
                  </p>
                  <p className="text-[14px] text-[var(--color-cream-mute)] max-w-[400px] text-center">
                    Render in production. The first frames drop in /public/videos
                    when alpha customers start walking through the lobby.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you'll walk into */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-14 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">
              What you&rsquo;ll walk into
            </p>
            <h2 className="conduit-display-2xl mt-5">
              Four rooms.{" "}
              <span className="conduit-ember-text">All nine employees.</span>
            </h2>
            <p className="conduit-body-lg mt-5 max-w-[600px]">
              Each room is a different surface for a different mode of work.
              Walk in, look around, listen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ROOMS.map((r) => (
              <div key={r.title} className="conduit-card p-7 md:p-8 group">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge-subtle)] shrink-0 group-hover:border-[rgba(91, 99, 232,0.4)] transition-colors">
                    <r.Icon size={26} weight="duotone" color="#5B63E8" />
                  </div>
                  <div>
                    <h3
                      className="text-[24px] leading-[1.1] tracking-[-0.02em] text-[var(--color-cream)]"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontWeight: 500,
                      }}
                    >
                      {r.title}
                    </h3>
                    <p className="text-[14px] mt-2.5 text-[var(--color-cream-soft)] leading-[1.65]">
                      {r.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-14 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">How it works</p>
            <h2 className="conduit-display-2xl mt-5">
              Same brain.{" "}
              <span className="conduit-ember-text">Spatial surface.</span>
            </h2>
            <p className="conduit-body-lg mt-5 max-w-[600px]">
              HQ shares Console&rsquo;s memory, voice, lead pipeline, and
              build pipeline. The difference is presence.
            </p>
          </div>

          <SpatialDiagram />
        </div>
      </section>

      {/* Timeline */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-14 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">Timeline</p>
            <h2 className="conduit-display-2xl mt-5">
              From lobby to multi-user.
            </h2>
          </div>

          <ol className="space-y-3 max-w-[760px]">
            {TIMELINE.map((t, i) => (
              <li
                key={t.title}
                className="conduit-card p-6 md:p-7 flex items-start gap-5"
              >
                <span
                  className="text-[44px] tracking-[-0.04em] text-[var(--color-indigo-500)] leading-[0.85] shrink-0"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  0{i + 1}
                </span>
                <div>
                  <p className="conduit-caption text-[var(--color-cream-mute)]">
                    {t.period}
                  </p>
                  <h3
                    className="text-[22px] mt-1 tracking-[-0.015em] text-[var(--color-cream)]"
                    style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                  >
                    {t.title}
                  </h3>
                  <p className="text-[14px] mt-2 text-[var(--color-cream-soft)] leading-[1.6]">
                    {t.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Early access form */}
      <section
        id="early-access"
        className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]"
      >
        <div className="conduit-container">
          <div className="max-w-[600px] mx-auto text-center">
            <p className="conduit-caption conduit-caption-ember">
              Reserve early access
            </p>
            <h2 className="conduit-display-xl mt-5">
              Be among the first 50.
            </h2>
            <p className="conduit-body-lg mt-5">
              The closed alpha opens this summer. We&rsquo;re hand-picking 50
              customers from the waitlist to walk through the lobby first. Tell
              us a bit about you and how you&rsquo;d use HQ.
            </p>
          </div>
          <div className="mt-10 flex justify-center">
            <WaitlistForm
              product="praxis-hq"
              source="hq_landing_form"
              ctaLabel="Request early access"
              extraFields={[
                {
                  kind: "text",
                  name: "agency",
                  label: "Agency or company",
                  placeholder: "Acme Insurance",
                },
                {
                  kind: "select",
                  name: "use_case",
                  label: "Primary use case",
                  options: [
                    { value: "sales-floor", label: "Sales floor" },
                    { value: "marketing-studio", label: "Marketing studio" },
                    {
                      value: "engineering-bay",
                      label: "Engineering bay",
                    },
                    {
                      value: "executive-roundtable",
                      label: "Executive roundtable",
                    },
                    { value: "exploring", label: "Just curious" },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </main>
  );
}

function SpatialDiagram() {
  // Hub-and-spoke diagram: shared brain center, four rooms around it.
  return (
    <div className="relative max-w-[1100px] mx-auto">
      <div className="aspect-[16/8] rounded-2xl bg-[var(--color-ink-surface)] border border-[var(--color-edge)] overflow-hidden relative">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(91, 99, 232,0.14), transparent 65%)",
          }}
        />
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 400"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Connection lines from center to nodes */}
          {[
            [200, 90],
            [600, 90],
            [200, 310],
            [600, 310],
          ].map(([x, y], i) => (
            <line
              key={i}
              x1="400"
              y1="200"
              x2={x}
              y2={y}
              stroke="#5B63E8"
              strokeWidth="1"
              strokeOpacity="0.35"
              strokeDasharray="4 4"
            />
          ))}

          {/* Center brain node */}
          <circle
            cx="400"
            cy="200"
            r="56"
            fill="rgba(91, 99, 232,0.08)"
            stroke="#5B63E8"
            strokeWidth="1.5"
          />
          <text
            x="400"
            y="195"
            textAnchor="middle"
            className="fill-[#F5EFE6]"
            style={{ font: "500 14px var(--font-sans)" }}
          >
            Praxis brain
          </text>
          <text
            x="400"
            y="215"
            textAnchor="middle"
            className="fill-[#847A6E]"
            style={{ font: "500 11px var(--font-sans)" }}
          >
            memory · voice · execution
          </text>
        </svg>

        {/* Room nodes — absolutely positioned text + frame */}
        {[
          { left: "20%", top: "10%", label: "Marketing room", Icon: Compass },
          {
            left: "70%",
            top: "10%",
            label: "Engineering bay",
            Icon: Network,
          },
          {
            left: "20%",
            top: "65%",
            label: "Boardroom",
            Icon: Users,
          },
          {
            left: "70%",
            top: "65%",
            label: "Atlas's office",
            Icon: Lightning,
          },
        ].map((n) => (
          <div
            key={n.label}
            className="absolute"
            style={{ left: n.left, top: n.top }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge)]">
              <n.Icon size={14} weight="regular" color="#5B63E8" />
              <span className="text-[12px] text-[var(--color-cream)] tracking-tight">
                {n.label}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="conduit-caption text-[var(--color-cream-mute)] text-center mt-6">
        <Rocket
          size={14}
          weight="regular"
          className="inline-block mr-1.5 -mt-0.5"
          color="#847A6E"
        />
        One brain. Four rooms. Every employee, present.
      </p>
    </div>
  );
}
