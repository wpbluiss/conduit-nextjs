import TrackClick from '../../../components/TrackClick';

export const metadata = {
  title: "You're Under a Sink Right Now. Who's Answering Your Phone? | Conduit AI",
  description: "Plumbers can't answer the phone while soldering pipes. But every missed call is a $500-$1,200 lost job. Here's how solo plumbers and small crews capture every lead without hiring.",
  keywords: "plumber answering service,plumbing missed calls,plumber AI receptionist,plumbing lead capture,solo plumber phone,plumbing business growth",
  authors: [{ name: "Conduit AI LLC" }],
  creator: "Conduit AI LLC",
  robots: "index, follow",
  openGraph: {
    title: "You're Under a Sink Right Now. Who's Answering Your Phone?",
    description: "Plumbers can't answer while working. Every missed call is $500-$1,200 lost. Here's the fix.",
    url: "https://conduitai.io/blog/plumber-answering-phone-on-job-site",
    type: "article",
    publishedTime: "2026-02-27T00:00:00Z",
    authors: ["Conduit AI"],
  },
  twitter: {
    card: "summary_large_image",
    title: "You're Under a Sink Right Now. Who's Answering Your Phone?",
    description: "Plumbers can't answer while working. Every missed call is $500-$1,200 lost. Here's the fix.",
  },
  alternates: { canonical: "https://conduitai.io/blog/plumber-answering-phone-on-job-site" },
};

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <article className="max-w-3xl mx-auto px-6 py-32">
        <p className="text-sm font-mono tracking-widest text-[var(--cyan)] mb-4">BLOG</p>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">You're Under a Sink Right Now. Who's Answering Your Phone?</h1>
        <p className="text-[var(--muted)] mb-2">February 27, 2026 · 6 min read</p>
        <p className="text-sm text-[var(--muted)] mb-12">By Luis Garcia, Founder of Conduit AI</p>
        <div className="space-y-8 text-[var(--muted)] leading-relaxed text-[17px]"
          dangerouslySetInnerHTML={{ __html: `<p>You know the moment. You're elbow-deep under a kitchen sink, torch in one hand, fitting in the other, and your phone starts buzzing in your back pocket. You can hear it vibrating against the cabinet. It might be your wife. It might be a supply house calling back about that part you need. Or it might be a \$1,200 emergency water heater replacement.</p>
<p>You can't answer it. Obviously. You're soldering a copper joint and if you stop now, you're starting over. So it rings. And rings. And goes to voicemail.</p>
<p>By the time you finish the job, wash your hands, and check your phone, there's no voicemail. Just a missed call from an unknown number. They've already called someone else.</p>
<h2 class="text-2xl font-bold text-[var(--text)] pt-4">This Happens 5-10 Times Per Day</h2>
<p>For solo plumbers and small crews, this isn't an occasional inconvenience — it's a daily reality. Industry research shows that home service companies miss a staggering percentage of their incoming calls, with some estimates suggesting it's well above half. For plumbers specifically, the situation is worse because the work physically prevents you from answering.</p>
<p>You can't answer while snaking a drain. You can't answer during a gas line pressure test. You can't answer while you're in a crawl space. And you definitely can't answer while you're cutting into a wall to find a leak.</p>
<p>The cruelest irony? The busiest plumbers miss the most calls. Success breeds more missed opportunities. The better you are at your job, the more time you spend doing the work and the less time you have to answer the phone that keeps your pipeline full.</p>
<h2 class="text-2xl font-bold text-[var(--text)] pt-4">The Emergency Call Problem</h2>
<p>Plumbing is one of the few trades where true emergencies happen regularly. A burst pipe at midnight. A sewage backup on Thanksgiving. A water heater that gives out on the coldest night of the year. These callers aren't shopping around casually — they need someone now.</p>
<p>Emergency calls are also the highest-value calls. A standard service call might be \$200-\$400. An emergency call with overtime rates? That's \$800-\$1,500. And the customer who calls with a flood at 2 AM becomes a customer for life if you save their home. They'll call you for every future plumbing need and tell every neighbor on their street.</p>
<p>But if that 2 AM call goes to voicemail? They're already Googling "emergency plumber near me" and calling the next number. You won't even know you lost them.</p>
<h2 class="text-2xl font-bold text-[var(--text)] pt-4">Why Hiring Doesn't Solve It</h2>
<p>The obvious answer is "hire someone to answer the phone." But for a solo plumber or a two-person crew, the math doesn't work. A full-time receptionist costs \$35,000-\$45,000 per year with benefits. That's a massive overhead for a business doing \$150,000-\$300,000 annually. And even with a full-time phone person, they can't work 24/7. They take lunch breaks. They go home at 5 PM. They call in sick.</p>
<p>Traditional answering services are another option, but they typically cost \$200-\$500 per month and the quality is hit-or-miss. The person answering doesn't know your service area, your pricing, or whether you do residential or commercial work. Callers can tell they're talking to a generic call center, and it doesn't inspire confidence.</p>
<h2 class="text-2xl font-bold text-[var(--text)] pt-4">What Actually Works</h2>
<p>An AI voice agent trained on your specific plumbing business answers every call you can't get to. It knows your services, your service area, and your hours. When someone calls about a burst pipe, it captures their name, address, the nature of the problem, and the urgency level — then texts you immediately.</p>
<p>You finish the joint you're soldering, check your phone, and see: "Emergency: Burst pipe at 142 Oak St, water flooding kitchen, homeowner Sarah M., insurance: State Farm, called at 2:47 PM." That's a qualified lead with every detail you need to call back and close the job in under a minute.</p>
<p>No more lost calls. No more checking voicemail to find it empty. No more wondering how many jobs you missed today because you were too busy doing the jobs you already had.</p>` }}
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
