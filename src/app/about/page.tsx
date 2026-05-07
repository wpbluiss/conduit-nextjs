import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About — Conduit",
  description:
    "Conduit is a one-person company building Praxis — the operating system for autonomous AI workforces. Built in public from West Palm Beach.",
};

export default function AboutPage() {
  return (
    <main>
      <Navbar />

      <section className="relative px-6 pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6">About Conduit</p>
          <h1 className="serif text-[44px] md:text-[68px] leading-[1.0] tracking-[-0.02em] text-[#F5F1EA]">
            One founder. One laptop. One workforce that runs itself.
          </h1>
          <p className="mt-8 text-[17px] md:text-[20px] text-[#8C8884] leading-[1.7]">
            Conduit is a one-person company. It builds Praxis, an operating
            system for autonomous AI workforces — software that does the work
            that used to require headcount.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20 border-t border-[#1F1C19]">
        <div className="max-w-3xl mx-auto space-y-10">
          <div>
            <p className="eyebrow mb-3">Mission</p>
            <h2 className="serif text-[28px] md:text-[36px] text-[#F5F1EA] leading-[1.1]">
              Make hiring optional for the next ten million businesses.
            </h2>
            <p className="mt-5 text-[16px] md:text-[17px] text-[#8C8884] leading-[1.75]">
              Most small businesses don&apos;t need to hire. They need work
              done. Praxis ships work. Marketing posts get drafted. Leads get
              sourced. Sites get deployed. Contracts get drafted with attorney
              review notes attached. Books get reconciled. The founder steers,
              the workforce executes.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-3">Vision</p>
            <h2 className="serif text-[28px] md:text-[36px] text-[#F5F1EA] leading-[1.1]">
              The next decade doesn&apos;t belong to the people who hire
              faster. It belongs to the people who don&apos;t hire at all.
            </h2>
            <p className="mt-5 text-[16px] md:text-[17px] text-[#8C8884] leading-[1.75]">
              The default for running a small business is still a payroll
              system, a calendar of interviews, and a Slack full of people
              doing tasks software could do. Conduit thinks that&apos;s a
              transitional state, not a permanent one — and Praxis is the
              software that makes it permanent.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-3">Founder</p>
            <h2 className="serif text-[28px] md:text-[36px] text-[#F5F1EA] leading-[1.1]">
              Luis Garcia. 21. West Palm Beach.
            </h2>
            <div className="mt-5 space-y-5 text-[16px] md:text-[17px] text-[#8C8884] leading-[1.75]">
              <p>
                No engineering degree. No funding round. No co-founder. The
                whole company is one person, a laptop, and a stack of bills
                that say &quot;rent due&quot;.
              </p>
              <p>
                Praxis went from a single voice agent answering missed calls
                in February 2026 to a 9-employee virtual workforce by April,
                with real lead pipelines, real builds, and real customers
                paying real money. Every round is logged in
                CONDUIT_LOG.md, in the open, on GitHub. The whole point is
                to prove a one-person company can compete with companies
                that have hundreds of headcount — and win.
              </p>
              <p className="text-[#F5F1EA]">
                If you want to follow along: the build is public, the code
                is at conduitai.io/blog, and the founder&apos;s email is at
                the bottom of every page on this site.
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <Link href="/auth/sign-up" className="btn-primary justify-center">
              Open Praxis Console <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/products"
              className="btn-secondary justify-center"
            >
              See the product family
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
