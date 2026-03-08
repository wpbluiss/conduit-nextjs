import TrackClick from '../../../components/TrackClick';

export const metadata = {
  title: "How to Get More Google Reviews for Your Service Business | Conduit AI",
  description: "Businesses with 50+ Google reviews get 3x more calls. Learn how to automatically request reviews after every job without awkward asks.",
  keywords: "get more google reviews service business, automated review requests, google reviews plumber, google reviews HVAC, review automation small business",
  openGraph: {
    title: "How to Get More Google Reviews for Your Service Business",
    description: "Businesses with 50+ Google reviews get 3x more calls. Learn how to collect reviews automatically after every job.",
    type: "article",
    publishedTime: "2026-03-09T00:00:00Z",
    authors: ["Luis Garcia"],
  },
};

export default function BlogPost() {
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#e0e0e0" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)", maxWidth: 1200, margin: "0 auto" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, fontWeight: 700, textDecoration: "none", color: "#fff" }}>
          <img src="/icon.svg" alt="Conduit AI" width={28} height={28} style={{ borderRadius: 8 }} />
          <span>Conduit</span>
          <span style={{ background: "linear-gradient(135deg, #00d4ff, #0066ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
        </a>
        <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
          <a href="/#features" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Features</a>
          <a href="/#pricing" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Pricing</a>
          <a href="/blog" style={{ color: "#00d4ff", textDecoration: "none" }}>Blog</a>
          <a href="https://app.conduitai.io/login" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Log In</a>
          <TrackClick event="cta_click" properties={{ button: "start_free_trial", page: "blog_reviews" }}>
            <a href="https://app.conduitai.io" style={{ background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>Start Free Trial</a>
          </TrackClick>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "60px auto 40px", padding: "0 24px", textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "rgba(0,212,255,0.1)", color: "#00d4ff", padding: "4px 14px", borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>REPUTATION</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 20 }}>
          How to Get More Google Reviews for Your Service Business (On Autopilot)
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
          Businesses with 50 or more Google reviews get 3x more phone calls than those with under 10. Here is how to collect reviews automatically after every job — without asking awkwardly in person.
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 16, padding: 28, marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffd700", marginBottom: 12 }}>Why Google Reviews Are Make-or-Break</h2>
          <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            When someone searches for a plumber, HVAC tech, or barber near them, Google shows the top 3 results in the Map Pack. The businesses that appear there are not necessarily the best — they are the ones with the most reviews and highest ratings. A business with 80 reviews and 4.7 stars will get the call over a business with 5 reviews and 5.0 stars, every single time.
          </p>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>The Problem: Nobody Asks Consistently</h2>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
          Most service business owners know they should collect Google reviews. They just never do it consistently. It feels awkward to ask in person. You forget to text after the job. Life moves fast and the next call is already coming in.
        </p>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
          The result? You do great work, customers are happy, but your Google rating stays stuck at 12 reviews while your competitor who does mediocre work has 200 reviews and ranks above you every time.
        </p>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 24 }}>5 Proven Ways to Get More Reviews</h2>
        <div style={{ marginBottom: 48 }}>
          {[
            {
              num: "01",
              title: "Automated SMS After Job Completion",
              desc: "The single most effective method. Send a text within 1 hour of completing a job while the experience is fresh. Timing is everything — the review rate drops by 80 percent after 24 hours. A simple message like: Thanks for choosing us today. If we did a great job, a quick Google review means the world to us — with a direct link — converts at 20 to 40 percent.",
            },
            {
              num: "02",
              title: "Ask During the AI Follow-Up Call",
              desc: "If your AI receptionist handles post-service follow-up, it can naturally ask at the end of the conversation whether the customer would mind leaving a quick Google review, and offer to text them the link right then. Customers say yes at a much higher rate when asked conversationally by a friendly voice.",
            },
            {
              num: "03",
              title: "Put Your Review Link Everywhere",
              desc: "Your Google review link should be on your invoices, your email signature, your truck or van signage, and your business card. Most customers who had a great experience would leave a review — they just do not know where to go. Make it a single tap from any surface you already use.",
            },
            {
              num: "04",
              title: "Respond to Every Review You Get",
              desc: "Businesses that respond to reviews get 12 percent more reviews than those that do not. Customers see that you actually read and care. Google also factors response rate into local rankings. Spend five minutes a week responding to every review — positive and negative — and watch your review velocity increase.",
            },
            {
              num: "05",
              title: "Target Your Happiest Customers First",
              desc: "Do not blast everyone with review requests. Use sentiment analysis from your call recordings to identify which customers were most satisfied. Those are your warmest leads. A targeted ask to a happy customer converts at 40 percent or more, versus 8 percent for a generic blast to your whole customer list.",
            },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 24, padding: 24, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 12, fontFamily: "monospace", color: "#00d4ff", fontWeight: 700, marginBottom: 8 }}>{item.num}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{item.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7, fontSize: 15 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>How Conduit AI Automates Review Collection</h2>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
          Every time a job is completed and logged, Conduit AI can automatically send a review request SMS to the customer. No manual action needed. It tracks who has been asked, avoids sending duplicates, and uses your business Google review link directly.
        </p>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
          Businesses using automated review requests typically see their Google review count double within 60 days. That means better rankings, more calls, and more jobs — all from a process that runs entirely on its own.
        </p>

        <div style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,102,255,0.08))", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 20, padding: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Start Collecting Reviews Automatically</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 28 }}>
            Conduit AI handles missed calls, lead capture, and automated review requests — all for $39 per month.
          </p>
          <TrackClick event="cta_click" properties={{ button: "start_free_trial", page: "blog_reviews" }}>
            <a href="https://app.conduitai.io" style={{ display: "inline-block", background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "16px 36px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
              Start Free — No Credit Card
            </a>
          </TrackClick>
        </div>
      </div>
    </div>
  );
}
