import TrackClick from '../../../components/TrackClick';

export const metadata = {
  title: "HVAC After-Hours Answering Service: Capture Every Emergency Call | Conduit AI",
  description: "HVAC emergencies happen at 2am on weekends. Learn how AI-powered after-hours answering captures every lead and routes emergencies to your on-call tech.",
  keywords: "HVAC answering service after hours, HVAC emergency calls, after hours HVAC service, HVAC on call system, HVAC lead capture nights weekends",
  openGraph: {
    title: "HVAC After-Hours Answering Service: Capture Every Emergency Call",
    description: "HVAC emergencies happen at 2am on weekends. AI after-hours answering captures every lead and routes real emergencies immediately.",
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
          <TrackClick event="cta_click" properties={{ button: "start_free_trial", page: "blog_hvac" }}>
            <a href="https://app.conduitai.io" style={{ background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>Start Free Trial</a>
          </TrackClick>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "60px auto 40px", padding: "0 24px", textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "rgba(0,212,255,0.1)", color: "#00d4ff", padding: "4px 14px", borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>HVAC</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 20 }}>
          HVAC After-Hours Answering Service: Capture Every Emergency Call
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 }}>
          It is 2am in July and someone's AC just died. They need help now. If your phone goes to voicemail, they call the next HVAC company on Google. That emergency job — worth $800 to $3,000 — belongs to your competitor.
        </p>
        <TrackClick event="cta_click" properties={{ button: "hear_it_live", page: "blog_hvac" }}>
          <a href="tel:+15617303316" style={{ display: "inline-block", background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "14px 32px", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>
            Hear It Live — Call (561) 730-3316
          </a>
        </TrackClick>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>

        <div style={{ background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: 16, padding: 28, marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ff8c00", marginBottom: 12 }}>HVAC Emergency Calls Are Your Highest-Value Leads</h2>
          <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            Emergency HVAC calls — no cooling in summer, no heat in winter — command a premium. Customers in these situations are not price shopping. They will pay your rate to get someone out fast. These calls are also the ones most likely to happen at night and on weekends, exactly when your phone is least likely to be answered.
          </p>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>When HVAC Calls Actually Come In</h2>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
          Industry data shows that 43 percent of HVAC emergency calls come in outside normal business hours — evenings, nights, and weekends. Another 31 percent come in during peak summer and winter days when your techs are already slammed on other jobs and nobody is available to answer the office phone.
        </p>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
          That means nearly three out of every four HVAC emergency calls come in at exactly the wrong time for a small operation to pick up. Every one of those missed calls is a high-value job you are handing to your competition.
        </p>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 24 }}>What an AI After-Hours System Does for HVAC</h2>
        <div style={{ marginBottom: 48 }}>
          {[
            { icon: "🌡️", title: "Emergency vs. Non-Emergency Triage", desc: "Immediately identifies whether the call is a true emergency — no cooling above 90 degrees, no heat below freezing, elderly or infant in the home — versus a routine service request that can wait until morning. Routes each appropriately." },
            { icon: "📞", title: "Instant On-Call Routing", desc: "For true emergencies, the AI can immediately transfer the call or send an urgent text to your on-call tech. For everything else, it captures the lead and schedules a morning callback automatically." },
            { icon: "📋", title: "Complete Lead Capture", desc: "Gets the system type, age, symptoms, address, and preferred callback window. By the time you call back, you already know whether you need parts in the truck before you leave the shop." },
            { icon: "💰", title: "Flat-Rate Predictable Cost", desc: "Traditional live answering services charge per minute plus holiday and after-hours surcharges. Your AI costs the same $39 per month whether it answers 10 calls or 1,000 — nights, weekends, and holidays included." },
            { icon: "📊", title: "Every Call Logged and Transcribed", desc: "You wake up to a complete log of every call that came in overnight — full transcript, caller info, issue description, and your AI's assessment of urgency. No surprises, no missed leads." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6, fontSize: 15 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>The Revenue Math for HVAC After-Hours</h2>
        <div style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 16, padding: 28, marginBottom: 40 }}>
          {[
            ["After-hours calls per month", "25 to 40"],
            ["Previously missed (no answer)", "60 to 80%"],
            ["Average emergency job value", "$800 to $1,800"],
            ["Jobs recovered monthly (est.)", "4 to 8"],
            ["Additional revenue per month", "$3,200 to $14,400"],
            ["Cost of Conduit AI", "$39/mo"],
          ].map(([label, val], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
              <span style={{ color: "#00d4ff", fontWeight: 700 }}>{val}</span>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Setup Takes Under 10 Minutes</h2>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
          You connect your existing business number, tell the AI your service area, the systems you work on, your emergency criteria, and your on-call tech's number. That is it. From that point on, every call that comes in after hours — or any time you cannot answer — is handled, captured, and sent to you as a notification before the customer even hangs up.
        </p>

        <div style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,102,255,0.08))", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 20, padding: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Stop Missing After-Hours HVAC Calls</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 28 }}>
            14-day free trial. No credit card. Works with your existing number.
          </p>
          <TrackClick event="cta_click" properties={{ button: "start_free_trial", page: "blog_hvac" }}>
            <a href="https://app.conduitai.io" style={{ display: "inline-block", background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "16px 36px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
              Start Free at app.conduitai.io
            </a>
          </TrackClick>
        </div>
      </div>
    </div>
  );
}
