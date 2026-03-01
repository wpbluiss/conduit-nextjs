import TrackClick from '../../../components/TrackClick';

export const metadata = {
  title: "Your Dental Practice Is Missing 30% of Patient Calls | Conduit AI",
  description: "Dental offices miss 30-50 calls per month on average. Each missed call represents $4,200-$7,000 in patient lifetime value. AI receptionists change everything.",
  keywords: "dental AI receptionist,dental practice missed calls,dental office phone,dental appointment booking AI,dental patient scheduling,dental practice revenue",
  authors: [{ name: "Conduit AI LLC" }],
  creator: "Conduit AI LLC",
  robots: "index, follow",
  openGraph: {
    title: "Your Dental Practice Is Missing 30% of Patient Calls. Here's What That Costs You.",
    description: "Dental offices miss 30-50 calls monthly. Each is $4,200+ in lifetime value. Here's the solution.",
    url: "https://conduitai.io/blog/dental-practice-missed-appointments",
    type: "article",
    publishedTime: "2026-02-26T00:00:00Z",
    authors: ["Conduit AI"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Dental Practice Is Missing 30% of Patient Calls. Here's What That Costs You.",
    description: "Dental offices miss 30-50 calls monthly. Each is $4,200+ in lifetime value. Here's the solution.",
  },
  alternates: { canonical: "https://conduitai.io/blog/dental-practice-missed-appointments" },
};

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <article className="max-w-3xl mx-auto px-6 py-32">
        <p className="text-sm font-mono tracking-widest text-[var(--cyan)] mb-4">BLOG</p>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">Your Dental Practice Is Missing 30% of Patient Calls. Here's What That Costs You.</h1>
        <p className="text-[var(--muted)] mb-2">February 26, 2026 · 7 min read</p>
        <p className="text-sm text-[var(--muted)] mb-12">By Luis Garcia, Founder of Conduit AI</p>
        <div className="space-y-8 text-[var(--muted)] leading-relaxed text-[17px]"
          dangerouslySetInnerHTML={{ __html: `<p>Your front desk handles everything. Checking patients in, processing insurance, answering billing questions, scheduling follow-ups, filing paperwork, and — somewhere in between all of that — answering the phone. When three lines ring at once while your receptionist is explaining a treatment plan to a patient standing right in front of them, something has to give.</p>
<p>Usually, it's the phone. And that phone call might be a new patient worth thousands of dollars over the next decade.</p>
<h2 class="text-2xl font-bold text-[var(--text)] pt-4">The Numbers Behind the Problem</h2>
<p>Research consistently shows that dental practices miss a significant portion of their incoming calls — estimates range from 30% to as high as 50% during peak hours. For a practice receiving 40 calls per day, that's 12-20 missed calls daily. Over a month, that's 240-400 calls that went unanswered.</p>
<p>Now consider that the average patient lifetime value at a dental practice ranges from \$4,200 to \$7,000 or more, factoring in cleanings, fillings, crowns, whitening, and referrals. If even 10% of those missed calls were new patients, a practice missing 300 calls per month is potentially losing 30 new patients — worth anywhere from <strong class="text-[var(--text)]">\$126,000 to \$210,000 in lifetime revenue</strong>.</p>
<p>That's not a rounding error. That's a second associate dentist's salary walking out the door every year.</p>
<h2 class="text-2xl font-bold text-[var(--text)] pt-4">Why Dental Is Uniquely Vulnerable</h2>
<p>Dental practices face a phone problem unlike almost any other business. The calls come in waves — Monday mornings after weekend emergencies, lunch hours when people have a break from work, and late afternoons when parents remember to schedule their kid's cleaning. These call surges overwhelm even well-staffed front desks.</p>
<p>There's also the complexity issue. Dental phone calls aren't simple. Callers ask about insurance acceptance, procedure costs, emergency availability, and specific dentist credentials. A generic answering service can't handle these questions. The caller hangs up frustrated, still needing a dentist, and moves on to the next practice on Google.</p>
<p>After-hours calls represent another massive gap. Toothaches don't wait for Monday morning. A patient with severe pain at 8 PM on a Friday is going to call three or four dentists until someone answers or at least engages them. The practice that responds — even with an AI — gets the emergency appointment, the potential crown, and a loyal patient for years.</p>
<h2 class="text-2xl font-bold text-[var(--text)] pt-4">The No-Show Multiplier</h2>
<p>Here's what makes it even worse: dental practices already lose 10-20% of scheduled appointments to no-shows and last-minute cancellations. So you're fighting a two-front war — losing potential patients on the phone AND losing confirmed patients to empty chairs. Every chair sitting empty costs the practice \$500-\$1,000 per hour in lost production.</p>
<p>When your phone system can't handle the volume, you can't even fill those canceled slots. A patient cancels at 10 AM, a new patient calls at 10:15 AM wanting to come in today, but nobody answers because the front desk is checking in the 10:30 appointment. The empty chair stays empty. The revenue is gone.</p>
<h2 class="text-2xl font-bold text-[var(--text)] pt-4">What Smart Practices Are Doing</h2>
<p>Forward-thinking dental practices are adding AI voice agents that handle overflow and after-hours calls. The AI knows the practice's accepted insurance plans, available appointment times, emergency protocols, and procedure offerings. When a patient calls about a toothache at 9 PM, the AI can schedule an emergency slot for the next morning, confirm insurance details, and send the patient a text with their appointment information.</p>
<p>The front desk arrives Monday morning to find three new patients already scheduled, insurance pre-verified, and appointment confirmations sent — all from calls that would have previously gone to voicemail and been lost forever.</p>
<p>For multi-location dental groups, AI reception becomes even more powerful. A single system can handle scheduling across all locations, route patients to the nearest office with availability, and maintain consistent service quality that human receptionists across different offices can't always deliver.</p>` }}
        />
        <div className="bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 rounded-xl p-6 mt-12">
          <p className="text-[var(--text)] font-semibold mb-2">Want to hear what it sounds like?</p>
          <p>Call our demo line right now: <a href="tel:+15617303316" className="text-[var(--cyan)] font-semibold hover:underline">(561) 730-3316</a>. No signup needed. Takes 30 seconds.</p>
          <TrackClick event="cta_click" properties={{ button: "try_conduit_free", page: "blog_post" }}><a href="https://app.conduitai.io" className="inline-block mt-4 px-6 py-3 rounded-full bg-[var(--cyan)] text-[var(--bg)] font-semibold hover:brightness-110 transition-all">Start Your Free 14-Day Trial →</a></TrackClick>
        </div>
      </article>
    </main>
  );
}
