import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Footprints, Users2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Praxis HQ — Walk through your AI headquarters",
  description:
    "A 3D office where each AI employee has a desk, an avatar, a presence. Step in, watch the team work, talk to a specialist. Q3 2026.",
};

const FLOORS = [
  {
    icon: <Footprints size={18} />,
    title: "Walk in.",
    body: "Lobby first. Atlas is at the front, ready to brief you on what the team's been up to since you last logged in. Scroll the floor map; click any room to step inside.",
  },
  {
    icon: <Users2 size={18} />,
    title: "Each employee, present.",
    body: "Marketing has a content room with the most recent drafts on the wall. Sales has a pipeline view you can walk along. Engineering has a build wall showing live deployments. They speak when you approach.",
  },
  {
    icon: <Building2 size={18} />,
    title: "Same brain, spatial surface.",
    body: "Memory, leads, builds, voice — all the same backend as Console and Mobile. HQ is the surface for the moments when chat-in-a-rectangle isn't enough.",
  },
];

export default function PraxisHQPage() {
  const accent = "#A855F7";

  return (
    <main>
      <Navbar />

      <section
        className="relative px-6 pt-32 pb-12 md:pt-40 md:pb-16"
        style={{ ["--accent" as string]: accent }}
      >
        <div className="max-w-3xl mx-auto">
          <p
            className="eyebrow mb-6 inline-flex items-center"
            style={{ color: accent }}
          >
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full mr-2"
              style={{
                background: "transparent",
                boxShadow: `inset 0 0 0 1px ${accent}`,
              }}
            />
            Praxis HQ · Q3 2026
          </p>
          <h1 className="serif text-[44px] md:text-[68px] leading-[1.0] tracking-[-0.02em] text-[#F5F1EA]">
            Walk through your AI headquarters.
          </h1>
          <p className="mt-7 text-[17px] md:text-[20px] text-[#8C8884] leading-[1.7] max-w-2xl">
            A 3D office where each Praxis employee has a desk, an avatar, a
            presence. Step into the marketing room and watch a campaign get
            drafted in real time. Walk down the hall to engineering and spin
            up a new build.
          </p>
        </div>
      </section>

      {/* Visual block — 3D placeholder. Real Unity render goes here when the
          first frames land in /public. */}
      <section className="px-6 py-12 md:py-16 border-t border-[#1F1C19]">
        <div className="max-w-5xl mx-auto">
          <div
            className="aspect-[16/9] rounded-lg border border-[#1F1C19] relative overflow-hidden"
            style={{
              background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${accent} 18%, #0A0908) 0%, #0A0908 60%)`,
            }}
          >
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-30">
              {Array.from({ length: 72 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-[#1F1C19]"
                  style={{
                    background:
                      Math.random() > 0.92
                        ? `color-mix(in srgb, ${accent} 30%, transparent)`
                        : "transparent",
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center w-12 h-12 rounded-md mb-3"
                  style={{
                    background: `color-mix(in srgb, ${accent} 20%, transparent)`,
                    color: accent,
                  }}
                >
                  <Building2 size={20} />
                </span>
                <p className="serif text-[22px] text-[#F5F1EA]">
                  Praxis HQ · Q3 2026
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#5C5854] mt-2">
                  Render coming · early access opens this summer
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24 border-t border-[#1F1C19]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            {FLOORS.map((f) => (
              <div
                key={f.title}
                className="p-7 bg-[#0A0908] border border-[#1F1C19] flex flex-col gap-3"
              >
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md"
                  style={{
                    background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                    color: accent,
                  }}
                >
                  {f.icon}
                </span>
                <h3 className="serif text-[22px] text-[#F5F1EA]">{f.title}</h3>
                <p className="text-[14px] text-[#8C8884] leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-28 border-t border-[#1F1C19] bg-[#14110F]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="serif text-[32px] md:text-[44px] leading-[1.05] text-[#F5F1EA]">
            Q3 2026.
          </h2>
          <p className="mt-5 text-[16px] text-[#8C8884]">
            Early access opens this summer. Drop your email below and
            you&apos;ll get an invite the day the first floor goes live. No
            spam — only the handful of emails it takes to get you walking
            through the building.
          </p>
          <div className="mt-8 inline-flex flex-col items-center gap-4">
            <WaitlistForm
              product="praxis-hq"
              source="hq_landing_footer"
              ctaLabel="Get early access"
              accent={accent}
            />
            <Link
              href="/auth/sign-up"
              className="text-[14px] text-[#8C8884] hover:text-[#F5F1EA]"
            >
              Or open the web Console today →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
