"use client";
import Link from "next/link";

const posts = [
  { slug: "missed-call-cost-small-business", title: "How HVAC Companies Lose $120K/Year to Missed Calls", excerpt: "The math behind missed calls in the HVAC industry — and how one company recovered 40% of lost leads.", date: "February 12, 2026", readTime: "5 min read" },
  { slug: "salon-booking-automation", title: "Salon Booking Automation: Stop Losing Clients to Voicemail", excerpt: "Your clients won't wait on hold. Here's how smart salons capture every booking request automatically.", date: "February 10, 2026", readTime: "4 min read" },
  { slug: "phone-statistics-small-business", title: "10 Phone Statistics Every Small Business Owner Needs to Know", excerpt: "The data is clear: your phone is your most important sales tool.", date: "February 8, 2026", readTime: "6 min read" },
  { slug: "ai-receptionist-vs-answering-service", title: "AI Receptionist vs. Answering Service: Which Is Right for You?", excerpt: "Compare costs, quality, and ROI between traditional answering services and AI-powered alternatives.", date: "February 15, 2026", readTime: "6 min read" },
  { slug: "why-service-businesses-miss-calls", title: "Why Service Businesses Miss 62% of Calls (And How to Fix It)", excerpt: "Every missed call is a missed opportunity. Here's why it happens and what you can do about it today.", date: "February 18, 2026", readTime: "7 min read" },
  { slug: "ai-receptionist-vs-voicemail", title: "AI Receptionist vs. Voicemail: Why 80% of Callers Hang Up", excerpt: "80% of callers sent to voicemail never leave a message. Here's what happens to those leads — and the voicemail alternative that captures them.", date: "February 28, 2026", readTime: "6 min read" },
  { slug: "solo-contractor-ai-receptionist", title: "The Solo Contractor's Secret Weapon: How One-Person Businesses Answer Every Call", excerpt: "Solo contractors lose 40-60% of incoming calls while on job sites. Here's how one-person operations answer every call without hiring.", date: "February 28, 2026", readTime: "7 min read" },
  { slug: "call-forwarding-setup-ai-receptionist", title: "How to Set Up Call Forwarding for Your AI Receptionist in 2 Minutes", excerpt: "Step-by-step guide to setting up call forwarding on iPhone, Android, and business phone systems so your AI receptionist catches every missed call.", date: "February 28, 2026", readTime: "5 min read" },
];

export default function BlogPage() {
  return (
    <div style={{ background: "#0a0a0a", color: "#fff", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff" }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18 }}>Conduit</span>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, background: "linear-gradient(135deg, #00d4ff, #0066ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          </Link>
          <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 14 }}>← Back to Home</Link>
        </div>
      </nav>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px 48px" }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#00d4ff", fontWeight: 600, marginBottom: 16 }}>BLOG</div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>Insights for service businesses</h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 500 }}>Tips, strategies, and data to help you capture more leads and grow your business.</p>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px", display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map((post, i) => (
          <Link key={i} href={"/blog/" + post.slug} style={{ display: "block", padding: "28px 32px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", color: "#fff" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>{post.date} · {post.readTime}</div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>{post.title}</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 12 }}>{post.excerpt}</p>
            <span style={{ fontSize: 13, color: "#00d4ff", fontWeight: 600 }}>Read article →</span>
          </Link>
        ))}
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Never miss a lead again.</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>Start your 14-day free trial today. No setup fee. No contracts.</p>
        <Link href="https://app.conduitai.io" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>Start Free Trial →</Link>
      </div>
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", marginBottom: 16 }}>
          {["Pricing:/#pricing","FAQ:/#faq","Blog:/blog","Privacy:/privacy","Terms:/terms","Contact:mailto:luis@conduitai.io"].map((l,i) => { const [t,h] = l.split(":"); return <Link key={i} href={h} style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13 }}>{t}</Link>; })}
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2026 Conduit AI LLC · All rights reserved.</div>
      </footer>
    </div>
  );
}
