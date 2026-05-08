import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  DeviceMobile,
  MicrophoneStage,
  Waveform,
} from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Praxis Mobile — In your pocket",
  description:
    "Native iOS and Android. Voice-first conversations with Atlas and your AI workforce. TestFlight invites going out this week.",
};

const FEATURES = [
  {
    Icon: MicrophoneStage,
    title: "Voice-first",
    body: "Tap-to-talk to Atlas while you drive between meetings. Voice rooms join from a notification. Same brain as Console — same employees, same memory, same lead pipeline.",
  },
  {
    Icon: Bell,
    title: "Smart push",
    body: "Atlas only pings when there's a decision to make or a hot lead waiting. Quiet hours respect your timezone. Roundtable invites land as actionable notifications.",
  },
  {
    Icon: DeviceMobile,
    title: "Native, not a wrapper",
    body: "Built in Expo with the system audio stack — no WebView, no laggy chat bubbles. Background recording stays on for hands-free voice mode in the car.",
  },
];

export default function PraxisMobilePage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden conduit-hero-section">
        <div className="conduit-mesh" aria-hidden />
        <div className="conduit-ember-radial" aria-hidden />
        <div className="relative conduit-container">
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
            <div className="max-w-[600px]">
              <p className="conduit-caption conduit-caption-ember">
                Praxis Mobile · TestFlight this week
              </p>
              <h1 className="conduit-display-hero mt-6">
                Praxis in your{" "}
                <span className="conduit-ember-text">pocket.</span>
              </h1>
              <p className="conduit-body-lg mt-6 max-w-[540px]">
                Voice-first iOS and Android client for Praxis. The same
                workforce, on the device you already carry. TestFlight invites
                are going out this week.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-9">
                <Link href="#waitlist" className="conduit-btn-primary">
                  Join the waitlist
                  <ArrowRight size={14} weight="bold" />
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="conduit-btn-secondary"
                >
                  Use the web Console
                </Link>
              </div>
            </div>

            {/* Phone mockup */}
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
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Voice-first */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
            <div className="max-w-[540px]">
              <p className="conduit-caption conduit-caption-ember">
                Voice-first
              </p>
              <h2 className="conduit-display-2xl mt-5">
                Hands on the wheel.
              </h2>
              <p className="conduit-body-lg mt-5">
                The same Atlas, the same nine specialists, but you don&rsquo;t
                need to look at a screen. Tap, talk, get an answer. Or open a
                roundtable for the messy decisions.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Tap-to-talk + always-listening modes",
                  "Voice activity detection, no awkward pauses",
                  "Per-employee ElevenLabs voices, real-time",
                  "Background recording stays on in the car",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-[14px] text-[var(--color-cream)] leading-[1.55]"
                  >
                    <span
                      aria-hidden
                      className="w-1 h-1 mt-[10px] rounded-full bg-[var(--color-indigo-500)] shrink-0"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <WaveformIllustration />
          </div>
        </div>
      </section>

      {/* Push to your team */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
            <NotificationIllustration />
            <div className="max-w-[540px] lg:order-1">
              <p className="conduit-caption conduit-caption-ember">
                Push when it matters
              </p>
              <h2 className="conduit-display-2xl mt-5">
                Quiet by default.
              </h2>
              <p className="conduit-body-lg mt-5">
                Push notifications fire when Atlas needs a decision or a lead
                heats up. They respect your quiet hours, your timezone, and
                your patience.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Atlas escalates only what you'd want escalated",
                  "Roundtable invites land as actionable notifications",
                  "Hot lead alerts include the why, not just the what",
                  "Quiet hours, snooze, and Do Not Disturb integration",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-[14px] text-[var(--color-cream)] leading-[1.55]"
                  >
                    <span
                      aria-hidden
                      className="w-1 h-1 mt-[10px] rounded-full bg-[var(--color-indigo-500)] shrink-0"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="conduit-card p-7 md:p-8">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge-subtle)] mb-6">
                  <f.Icon size={22} weight="regular" color="#5B63E8" />
                </div>
                <h3
                  className="text-[22px] leading-[1.1] tracking-[-0.02em] text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {f.title}
                </h3>
                <p className="text-[14px] mt-3 text-[var(--color-cream-soft)] leading-[1.65]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist form */}
      <section
        id="waitlist"
        className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]"
      >
        <div className="conduit-container">
          <div className="max-w-[540px] mx-auto text-center">
            <p className="conduit-caption conduit-caption-ember">
              TestFlight invite
            </p>
            <h2 className="conduit-display-xl mt-5">
              First batch goes out this week.
            </h2>
            <p className="conduit-body-lg mt-5">
              Drop your email and a quick note about you and you&rsquo;ll be on
              the next batch of TestFlight invites. The web Console is live
              now if you don&rsquo;t want to wait.
            </p>
          </div>
          <div className="mt-10 flex justify-center">
            <WaitlistForm
              product="praxis-mobile"
              source="mobile_landing_form"
              ctaLabel="Get on the list"
              extraFields={[
                {
                  kind: "text",
                  name: "name",
                  label: "Name",
                  placeholder: "First name",
                },
                {
                  kind: "select",
                  name: "role",
                  label: "Role",
                  options: [
                    { value: "founder", label: "Founder" },
                    { value: "operator", label: "Operator" },
                    { value: "engineer", label: "Engineer" },
                    { value: "investor", label: "Investor" },
                    { value: "other", label: "Other" },
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

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px]">
      <div
        className="aspect-[9/19] rounded-[44px] p-2.5 bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge)]"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(91, 99, 232,0.1), 0 0 60px rgba(91, 99, 232,0.16), 0 24px 48px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="relative w-full h-full rounded-[36px] overflow-hidden flex flex-col"
          style={{ background: "var(--color-ink-canvas)" }}
        >
          {/* Notch */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[88px] h-[20px] rounded-full bg-black z-10" />

          {/* Status bar */}
          <div className="px-6 pt-2 pb-1 flex items-center justify-between text-[10px] text-[var(--color-cream)] z-0">
            <span>9:41</span>
            <span>· · ·</span>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 pb-8">
            {/* Avatar pulse */}
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(91, 99, 232,0.35) 0%, transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, #DDE0FE, #5B63E8 60%, #3D44C2)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
                }}
              >
                <MicrophoneStage size={28} weight="fill" color="#0A0908" />
              </div>
            </div>

            <div className="text-center">
              <p
                className="text-[22px] text-[var(--color-cream)] tracking-[-0.02em] leading-[1.1]"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                Atlas is listening
              </p>
              <p className="text-[12px] text-[var(--color-cream-mute)] mt-2">
                Tap to interrupt
              </p>
            </div>

            {/* Live transcript */}
            <div className="w-full">
              <div className="px-3 py-2 rounded-xl bg-[var(--color-ink-surface)] border border-[var(--color-edge-subtle)]">
                <p className="text-[11px] text-[var(--color-cream-soft)] leading-[1.4]">
                  Engineering says the build deploys at 9:48. Want me to send
                  you a link when it&rsquo;s up?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaveformIllustration() {
  // CSS-driven faux waveform — 32 bars, ember tinted, animated subtly
  const bars = Array.from({ length: 36 }, (_, i) => {
    const t = i / 36;
    const h = 18 + 60 * Math.sin(t * 7) ** 2 + 16 * Math.sin(t * 19);
    return { id: i, height: Math.abs(h) };
  });
  return (
    <div className="relative aspect-[4/3] rounded-2xl bg-[var(--color-ink-surface)] border border-[var(--color-edge)] overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(91, 99, 232,0.18), transparent 65%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center gap-[2px] px-8">
        {bars.map((b) => (
          <span
            key={b.id}
            className="block rounded-full"
            style={{
              width: 3,
              height: `${b.height}px`,
              background: "var(--color-indigo-500)",
              opacity: 0.85,
              boxShadow: "0 0 4px rgba(91, 99, 232,0.3)",
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 conduit-caption conduit-caption-ember">
        <Waveform size={14} weight="regular" />
        Live · Atlas
      </div>
    </div>
  );
}

function NotificationIllustration() {
  return (
    <div className="relative aspect-[4/3] rounded-2xl bg-[var(--color-ink-surface)] border border-[var(--color-edge)] overflow-hidden flex items-center justify-center px-8">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(91, 99, 232,0.12), transparent 65%)",
        }}
      />
      <div className="relative w-full max-w-[360px] space-y-3">
        <NotificationCard
          time="9:42 AM"
          name="Atlas"
          body="Engineering finished lunaro-v3. Want me to push to staging?"
          highlight
        />
        <NotificationCard
          time="9:18 AM"
          name="Sales"
          body="Hot lead in Boca: 4-location med-spa, replying to Reddit DM."
        />
        <NotificationCard
          time="8:30 AM"
          name="Marketing"
          body="3 drafts staged for review. The newsletter one is fire."
        />
      </div>
    </div>
  );
}

function NotificationCard({
  name,
  time,
  body,
  highlight,
}: {
  name: string;
  time: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="px-4 py-3 rounded-xl"
      style={{
        background: highlight
          ? "rgba(91, 99, 232,0.1)"
          : "var(--color-ink-canvas)",
        border: highlight
          ? "1px solid rgba(91, 99, 232,0.4)"
          : "1px solid var(--color-edge-subtle)",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--color-indigo-500)] flex items-center justify-center text-[9px] font-semibold text-[var(--color-ink-canvas)]">
            {name[0]}
          </span>
          <span className="text-[12px] font-semibold text-[var(--color-cream)]">
            {name}
          </span>
        </div>
        <span className="text-[11px] text-[var(--color-cream-mute)]">
          {time}
        </span>
      </div>
      <p className="text-[12px] text-[var(--color-cream-soft)] leading-[1.5]">
        {body}
      </p>
    </div>
  );
}
