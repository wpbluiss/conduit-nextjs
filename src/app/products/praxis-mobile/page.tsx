import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Mic, Smartphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Praxis Mobile — In your pocket",
  description:
    "Native iOS and Android. Voice-first conversations with Atlas and your AI workforce. TestFlight invites going out this week.",
};

const FEATURES = [
  {
    icon: <Mic size={18} />,
    title: "Voice-first.",
    body: "Tap to talk to Atlas while you drive between meetings. Voice rooms join from a notification. The same brain as the Console — same employees, same memory, same lead pipeline.",
  },
  {
    icon: <Bell size={18} />,
    title: "Push when it matters.",
    body: "Atlas only pings when there's a decision to make or a hot lead waiting. Quiet hours respect your timezone. Roundtable invites land as actionable notifications.",
  },
  {
    icon: <Smartphone size={18} />,
    title: "Native, not a wrapper.",
    body: "Built in Expo with the system audio stack — no WebView, no laggy chat bubbles. Background recording stays on for hands-free voice mode in the car.",
  },
];

export default function PraxisMobilePage() {
  const accent = "#34D399";

  return (
    <main>
      <Navbar />

      <section
        className="relative px-6 pt-32 pb-12 md:pt-40 md:pb-16"
        style={{ ["--accent" as string]: accent }}
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 items-center">
          <div>
            <p
              className="eyebrow mb-6 inline-flex items-center"
              style={{ color: accent }}
            >
              <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full mr-2"
                style={{ background: "transparent", boxShadow: `inset 0 0 0 1px ${accent}` }}
              />
              Praxis Mobile · TestFlight this week
            </p>
            <h1 className="serif text-[44px] md:text-[68px] leading-[1.0] tracking-[-0.02em] text-[#F5F1EA]">
              Praxis in your pocket.
            </h1>
            <p className="mt-7 text-[17px] md:text-[20px] text-[#8C8884] leading-[1.7] max-w-xl">
              Voice-first iOS and Android client for Praxis. The same
              workforce, on the device you already carry. TestFlight invites
              are going out this week — drop your email and you&apos;ll be on
              the next batch.
            </p>
            <div className="mt-9">
              <WaitlistForm
                product="praxis-mobile"
                source="mobile_landing_hero"
                ctaLabel="Get on the list"
                accent={accent}
              />
            </div>
          </div>

          {/* Phone mockup placeholder — geometric, no fake screenshots. */}
          <div className="hidden md:block">
            <div
              className="mx-auto w-[280px] aspect-[9/19] rounded-[36px] border border-[#1F1C19] p-3"
              style={{
                background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 8%, #0A0908), #0A0908)`,
              }}
            >
              <div
                className="w-full h-full rounded-[28px] flex flex-col items-center justify-center gap-3 p-6"
                style={{
                  background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 4%, #14110F), #14110F)`,
                }}
              >
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full"
                  style={{
                    background: `color-mix(in srgb, ${accent} 18%, transparent)`,
                    color: accent,
                  }}
                >
                  <Mic size={22} />
                </span>
                <p className="serif text-2xl text-[#F5F1EA] text-center leading-tight">
                  Tap to talk
                </p>
                <p
                  className="text-[10px] uppercase tracking-[0.2em] text-center"
                  style={{ color: accent }}
                >
                  Praxis Mobile · screenshot soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24 border-t border-[#1F1C19]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
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
            TestFlight invites going out this week.
          </h2>
          <p className="mt-5 text-[16px] text-[#8C8884]">
            We&apos;re seeding the first batch from the waitlist. Drop your
            email and you&apos;ll be on it. The Console (web) is live now —
            you can use Praxis today while we finish polishing mobile.
          </p>
          <div className="mt-8 inline-flex flex-col items-center gap-4">
            <WaitlistForm
              product="praxis-mobile"
              source="mobile_landing_footer"
              ctaLabel="Get notified"
              accent={accent}
            />
            <Link
              href="/auth/sign-up"
              className="text-[14px] text-[#8C8884] hover:text-[#F5F1EA]"
            >
              Or open the web Console →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
