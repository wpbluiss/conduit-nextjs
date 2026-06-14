import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ScrollRevealCards, ScrollRevealItem } from "@/components/marketing/ScrollRevealCards";
import { ApproachSections } from "@/components/ApproachSections";
import type { ApproachSection } from "@/components/ApproachSections";
import { ApproachProgressNav } from "@/components/marketing/ApproachProgressNav";

export const metadata: Metadata = {
  title: "Approach — How we think about workforces",
  description:
    "Praxis isn't an AI product. It's a position on what work looks like next. The full thesis on specialization, memory, voice, execution.",
  openGraph: {
    title: "Approach — How we think about workforces",
    description:
      "Praxis isn't an AI product. It's a position on what work looks like next. The full thesis on specialization, memory, voice, execution.",
    url: "https://conduitai.io/approach",
    siteName: "Conduit AI",
    type: "website",
    images: [{ url: "/praxis-mark.png", width: 632, height: 961, alt: "Praxis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Approach — How we think about workforces",
    description:
      "The full thesis on specialization, memory, voice, and execution. Why generality is a recipe for shallowness.",
    images: ["/praxis-mark.png"],
  },
};

const SECTIONS: ApproachSection[] = [
  {
    n: "01",
    title: "On specialization",
    body: [
      "The most common shape of an AI product right now is a single chat surface that tries to do everything: write a poem, debug a function, draft a contract, summarize a meeting. The premise is that one general agent will handle it all if it's smart enough. We don't believe that.",
      "A workforce works because each person has a domain — not because each person is omniscient. Marketing knows how marketing speaks. Sales knows what a hot lead looks like. Engineering knows when a build needs a refactor versus a rewrite. Generality is shallow by definition.",
      "Praxis is nine specialists. Atlas, the Chief of Staff, routes the room and holds the memory. The other eight have real domains — Marketing has briefs and voice samples, Sales has pipelines and intent signals, Engineering has a sandbox and a deploy pipeline. The depth is what makes them useful.",
    ],
    quote:
      "A team of generalists is a contradiction. Either it's a team or it's a generalist.",
  },
  {
    n: "02",
    title: "On memory",
    body: [
      "The second most common shape of an AI product is one that resets every conversation. You explain who you are, what you're working on, what you've already tried, and tomorrow you do it again. The product gets smarter; you get tired.",
      "We think a workforce that doesn't remember isn't a workforce. It's a tool. And tools have a ceiling.",
      "Atlas writes durable memory across every conversation: the facts about your business, the preferences you've expressed, the decisions you've made, the goals you're working toward. Every other employee reads that block. The result is that the team gets sharper week-over-week, not the same.",
    ],
    quote:
      "Three weeks ago you said something that matters today. We expect Atlas to know what it was.",
  },
  {
    n: "03",
    title: "On voice",
    body: [
      "Typing is a high-bandwidth way to convey nuance, but a low-bandwidth way to feel like you're with someone. When you talk to a colleague, you're tracking inflection, hesitation, where they pause, when they pick up. Voice carries information text doesn't.",
      "The first generation of AI voice products was a workaround for typing. The second generation should be the inversion — voice as the primary surface, text as the artifact.",
      "Praxis has a Voice Room. You walk in and Atlas is already there. Open a roundtable and the whole team weighs in, each in their own ElevenLabs voice. Driving back from a meeting you tap a button and start talking. The chat history is the receipt; the conversation is the work.",
    ],
    quote: "The cognitive cost of typing to your team should be zero.",
  },
  {
    n: "04",
    title: "On execution",
    body: [
      "Most AI products advise. They list things you should consider, summarize things you should do, draft outlines of what you might say. The output is text, but the work is still yours.",
      "We think the bar should be that the work happens. Not that the work is described.",
      "Praxis Engineering opens a sandbox, writes the code, runs the build, pushes the deploy. The output is a public URL, not a plan. Sales doesn't summarize what to say to a lead — it sends the message. Marketing doesn't outline a campaign — it posts the draft. The line between advice and output is the line between a tool and a workforce.",
    ],
    quote: "Real workforces ship. Everything else is a Slack thread.",
  },
  {
    n: "05",
    title: "On the next decade",
    body: [
      "The default shape of running a business is still a payroll system, an HR vendor, a calendar of interviews, and a Slack full of people doing tasks software could do. The rituals — standups, sync meetings, weekly all-hands — are infrastructure for coordinating humans, not infrastructure for getting work done.",
      "We think that shape is transitional. The next decade of business will not be defined by the founders who hire faster. It will be defined by the founders who deploy software workforces and treat headcount as the exception, not the rule.",
      "Conduit AI is being built solo today. That isn't permanent — it's a proof point. The thesis is that the kind of leverage Praxis provides will compound until a small group of operators can run companies that previously required dozens or hundreds of people. We want to be the operating system that group runs on.",
    ],
    quote:
      "The next decade doesn't belong to companies that hire faster. It belongs to companies that don't hire at all.",
  },
];

export default function ApproachPage() {
  return (
    <main className="conduit-bg-canvas">
      <Navbar />

      <PageHeader
        caption="The Conduit AI approach"
        title={
          <>
            How we think about{" "}
            <span className="conduit-ember-text">workforces.</span>
          </>
        }
        subtitle="Praxis isn't an AI product. It's a position on what work looks like next."
      />

      {/* Sections — 2-column on xl: sticky nav rail + prose */}
      <article className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="flex gap-10 xl:gap-16">
            {/* Left rail — sticky progress nav, xl+ only */}
            <ApproachProgressNav
              sections={SECTIONS.map((s) => ({ n: s.n, title: s.title }))}
            />
            {/* Right — prose */}
            <div className="min-w-0 flex-1">
              <ApproachSections sections={SECTIONS} hasRail />
            </div>
          </div>
        </div>
      </article>

      {/* Closing CTA */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <ScrollRevealCards className="conduit-prose text-center">
            <ScrollRevealItem>
              <h2 className="conduit-display-2xl">
                Praxis is the operating system for that workforce.
              </h2>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <p className="conduit-body-lg mt-6">
                Free to start. The Console is the door.
              </p>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <Link
                  href="/auth/sign-up"
                  className="conduit-btn-primary justify-center"
                >
                  Open Praxis Console
                  <ArrowRight size={16} weight="bold" />
                </Link>
                <Link href="/products" className="conduit-btn-secondary justify-center">
                  See the product family
                </Link>
              </div>
            </ScrollRevealItem>
          </ScrollRevealCards>
        </div>
      </section>

      <Footer />
    </main>
  );
}
