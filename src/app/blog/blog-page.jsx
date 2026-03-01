import TrackClick from '../../components/TrackClick';

export const metadata = {
  title: "Blog — Conduit AI | Insights for Service Businesses",
  description: "Tips, strategies, and data to help service businesses capture more leads, answer every call, and grow revenue with AI voice agents.",
  keywords: "AI receptionist blog,service business tips,missed call recovery,lead capture strategies,HVAC leads,salon booking,plumber marketing",
  alternates: { canonical: "https://conduitai.io/blog" },
};

const posts = [
  {
    slug: "roofing-leads-after-storm-season",
    title: "Storm Season Is Coming: How Roofers Lose $50K+ in Leads Every Hurricane Season",
    description: "Storm events spike roofing call volume 10x overnight. Most go unanswered. Here's how smart roofing companies capture every emergency lead automatically.",
    date: "February 27, 2026",
    readTime: "7 min read",
  },
  {
    slug: "plumber-answering-phone-on-job-site",
    title: "You're Under a Sink Right Now. Who's Answering Your Phone?",
    description: "Plumbers can't answer the phone while soldering pipes. But every missed call is a $500–$1,200 lost job. Here's how solo plumbers capture every lead.",
    date: "February 27, 2026",
    readTime: "6 min read",
  },
  {
    slug: "dental-practice-missed-appointments",
    title: "Your Dental Practice Is Missing 30% of Patient Calls. Here's What That Costs You.",
    description: "Dental offices miss 30–50 calls per month on average. Each missed call represents $4,200–$7,000 in patient lifetime value.",
    date: "February 26, 2026",
    readTime: "7 min read",
  },
  {
    slug: "hvac-summer-call-volume",
    title: "Your AC Breaks in July. You Call 3 HVAC Companies. Only 1 Answers. Who Gets the Job?",
    description: "HVAC call volume triples in summer. The company that answers first wins the job. Here's why speed-to-lead separates $500K companies from $2M companies.",
    date: "February 26, 2026",
    readTime: "6 min read",
  },
  {
    slug: "salon-no-show-rate-fix",
    title: "Your Salon's 20% No-Show Rate Is Costing You $3,000/Month. Here's the Fix.",
    description: "Salons lose 15–20% of appointments to no-shows. Combined with missed booking calls, the average salon leaves $5,000+/month on the table.",
    date: "February 26, 2026",
    readTime: "5 min read",
  },
  {
    slug: "missed-call-cost-small-business",
    title: "How Much Do Missed Calls Actually Cost Your Business?",
    description: "Service businesses lose $2K–$10K per month to missed calls. We break down the real numbers for plumbers, HVAC companies, salons, and contractors.",
    date: "February 26, 2026",
    readTime: "6 min read",
  },
  {
    slug: "electrician-emergency-calls-after-hours",
    title: "The $800 Emergency Call That Went to Your Voicemail at 11 PM",
    description: "Electrical emergencies happen at night. 85% of callers won't leave a voicemail. Here's how electricians capture after-hours emergency leads.",
    date: "February 25, 2026",
    readTime: "6 min read",
  },
  {
    slug: "google-reviews-automated-after-service",
    title: "How to Get 5x More Google Reviews Without Asking a Single Customer",
    description: "Businesses that ask for reviews within 2 hours of service get 5x more responses. Here's how to automate it with a single text message.",
    date: "February 25, 2026",
    readTime: "5 min read",
  },
  {
    slug: "bilingual-answering-service-spanish",
    title: "40 Million Potential Customers Are Calling You in Spanish. Can Your Phone System Handle It?",
    description: "40M+ Spanish speakers in the US need service businesses too. If your phone can't handle Spanish calls, you're losing an entire market.",
    date: "February 25, 2026",
    readTime: "6 min read",
  },
  {
    slug: "lead-scoring-service-business",
    title: "Not All Leads Are Equal: How Lead Scoring Turns Phone Calls Into Revenue",
    description: "A tire-kicker and a $5,000 emergency job both call your phone. Without lead scoring, they look identical. Here's how to prioritize automatically.",
    date: "February 24, 2026",
    readTime: "7 min read",
  },
  {
    slug: "answering-service-vs-ai-receptionist-cost",
    title: "Answering Service vs. AI Receptionist: The Real Cost Comparison Nobody Shows You",
    description: "Traditional answering services cost $1–2/minute. AI receptionists cost $199–349/month flat. Here's the full comparison including hidden costs.",
    date: "February 24, 2026",
    readTime: "8 min read",
  },
  {
    slug: "first-response-wins-lead-response-time",
    title: "78% of Customers Buy From Whoever Responds First. Is That You?",
    description: "Research shows the first business to respond gets the sale 78% of the time. Every minute of delay costs you conversions.",
    date: "February 24, 2026",
    readTime: "6 min read",
  },
  {
    slug: "why-service-businesses-miss-calls",
    title: "Why Service Businesses Miss 62% of Calls (And How to Fix It)",
    description: "Every missed call is a missed opportunity. Here's why it happens and what you can do about it today.",
    date: "February 18, 2026",
    readTime: "7 min read",
  },
  {
    slug: "ai-receptionist-vs-answering-service",
    title: "AI Receptionist vs. Answering Service: Which Is Right for You?",
    description: "Compare costs, quality, and ROI between traditional answering services and AI-powered alternatives.",
    date: "February 15, 2026",
    readTime: "6 min read",
  },
  {
    slug: "salon-booking-automation",
    title: "Salon Booking Automation: Stop Losing Clients to Voicemail",
    description: "Your clients won't wait on hold. Here's how smart salons capture every booking request automatically.",
    date: "February 10, 2026",
    readTime: "4 min read",
  },
  {
    slug: "phone-statistics-small-business",
    title: "10 Phone Statistics Every Small Business Owner Needs to Know",
    description: "The data is clear: your phone is your most important sales tool.",
    date: "February 8, 2026",
    readTime: "6 min read",
  },
];

export default function BlogPage() {
  return (
    <div style={{ background: "#0a0a0a", color: "#fff", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff" }} href="/">
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18 }}>Conduit</span>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, background: "linear-gradient(135deg, #00d4ff, #0066ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          </a>
          <a style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 14 }} href="/">← Back to Home</a>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px 48px" }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#00d4ff", fontWeight: 600, marginBottom: 16 }}>BLOG</div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>Insights for service businesses</h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 500 }}>Tips, strategies, and data to help you capture more leads and grow your business.</p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px", display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map((post) => (
          <a key={post.slug} style={{ display: "block", padding: "28px 32px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", color: "#fff" }} href={`/blog/${post.slug}`}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>{post.date} · {post.readTime}</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>{post.title}</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 12 }}>{post.description}</p>
            <span style={{ fontSize: 13, color: "#00d4ff", fontWeight: 600 }}>Read article →</span>
          </a>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Never miss a lead again.</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>Start your 14-day free trial today. No setup fee. No contracts.</p>
        <TrackClick event="cta_click" properties={{ button: 'start_free_trial', page: 'blog_listing_alt' }}>
          <a style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none" }} href="https://app.conduitai.io">Start Free Trial →</a>
        </TrackClick>
      </div>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", marginBottom: 16 }}>
          <a style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13 }} href="/#pricing">Pricing</a>
          <a style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13 }} href="/#faq">FAQ</a>
          <a style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13 }} href="/blog">Blog</a>
          <a style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13 }} href="/privacy">Privacy</a>
          <a style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13 }} href="/terms">Terms</a>
          <a style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13 }} href="mailto:luis@conduitai.io">Contact</a>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2026 Conduit AI LLC · All rights reserved.</div>
      </footer>
    </div>
  );
}
