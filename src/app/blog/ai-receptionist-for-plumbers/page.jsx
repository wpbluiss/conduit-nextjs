import TrackClick from '../../../components/TrackClick';

export const metadata = {
  title: "AI Receptionist for Plumbers: Never Miss an Emergency Call | Conduit AI",
  description: "Plumbers lose $3,000+ per month to missed calls on job sites. An AI receptionist answers 24/7, captures emergency leads, and texts you instantly.",
  keywords: "AI receptionist for plumbers, plumber answering service, plumbing emergency calls, missed calls plumber, plumber phone system",
  openGraph: {
    title: "AI Receptionist for Plumbers: Never Miss an Emergency Call Again",
    description: "Plumbers lose $3,000+ per month to missed calls on job sites. An AI receptionist answers 24/7 and texts you every lead.",
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
          <TrackClick event="cta_click" properties={{ button: "start_free_trial", page: "blog_plumber" }}>
            <a href="https://app.conduitai.io" style={{ background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>Start Free Trial</a>
          </TrackClick>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "60px auto 40px", padding: "0 24px", textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "rgba(0,212,255,0.1)", color: "#00d4ff", padding: "4px 14px", borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>PLUMBERS</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 20 }}>
          AI Receptionist for Plumbers: Never Miss an Emergency Call Again
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 }}>
          You are under a sink fixing a burst pipe. Your phone rings. You cannot answer. That caller hangs up and calls the next plumber. That is a $400 to $1,200 job gone in 30 seconds.
        </p>
        <TrackClick event="cta_click" properties={{ button: "hear_it_live", page: "blog_plumber" }}>
          <a href="tel:+15617303316" style={{ display: "inline-block", background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "14px 32px", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>
            Hear It Live — Call (561) 730-3316
          </a>
        </TrackClick>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: 16, padding: 28, marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ff4757", marginBottom: 12 }}>The Real Cost of Missed Calls</h2>
          <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            The average plumber misses 8 to 12 calls per week while on job sites. At an average ticket of $350, that is $2,800 to $4,200 in lost revenue every single week. Over a year, that is more than $150,000 walking out the door because you were physically unable to answer your phone while doing your job.
          </p>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Why Plumbers Miss So Many Calls</h2>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
          Plumbing is physical, hands-on work. You are crawling under houses, cutting pipe, working in tight spaces with loud tools running. Answering the phone is not just inconvenient — it is often impossible mid-job.
        </p>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
          And the customers who cannot reach you do not wait. They call the next plumber on Google. If that plumber answers, you lost the job permanently.
        </p>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 24 }}>What an AI Receptionist Does for Plumbers</h2>
        <div style={{ marginBottom: 40 }}>
          {[
            { icon: "🚨", title: "Emergency Triage", desc: "Identifies burst pipes, flooding, and no-heat emergencies. Captures full details and texts you immediately so you can decide whether to respond right away." },
            { icon: "📋", title: "Lead Capture", desc: "Gets the caller's name, address, problem description, and best callback time. Everything saved and sent to you as a notification within seconds of the call ending." },
            { icon: "💬", title: "Pricing Questions", desc: "Answers common questions about service call fees, typical repair costs, and whether you service their zip code — so you only call back qualified leads." },
            { icon: "🌙", title: "After-Hours Coverage", desc: "Most plumbing emergencies happen nights and weekends. Your AI never sleeps — every call answered, every lead captured, 24 hours a day, 7 days a week." },
            { icon: "📅", title: "Callback Scheduling", desc: "Books a time for you to call back or routes true emergencies to your on-call number. Customers feel taken care of, not ignored." },
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

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>The Numbers for a Typical Plumber</h2>
        <div style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 16, padding: 28, marginBottom: 40 }}>
          {[
            ["Missed calls per week", "10"],
            ["Average job value", "$350"],
            ["Jobs recovered per week", "3 to 4"],
            ["Monthly revenue recovered", "$4,200 to $5,600"],
            ["Cost of Conduit AI", "$39/mo"],
            ["Return on investment", "100x+"],
          ].map(([label, val], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
              <span style={{ color: "#00d4ff", fontWeight: 700 }}>{val}</span>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>How It Works in 3 Steps</h2>
        <div style={{ marginBottom: 48 }}>
          {[
            { step: "1", title: "Customer calls your number", desc: "When you cannot answer, the call automatically routes to your Conduit AI agent. No new number needed — works with your existing line via simple call forwarding." },
            { step: "2", title: "AI handles the full conversation", desc: "It greets callers with your business name, asks what they need, captures their information, and answers common questions about your services and service area." },
            { step: "3", title: "You get an instant text notification", desc: "Within seconds of the call ending, you receive a text with the caller's name, number, issue description, and a full call transcript. You call back when you are ready." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 20, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #00d4ff, #0066ff)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#fff", flexShrink: 0 }}>{item.step}</div>
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6 }}>{item.title}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Why Voicemail Does Not Work</h2>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
          Research shows that 87 percent of callers do not leave voicemails for service businesses — especially for urgent problems like leaks or broken pipes. When someone has water spraying in their kitchen, they need to talk to someone now. An AI that actually responds keeps them engaged and captures the lead before they call your competitor.
        </p>

        <div style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,102,255,0.08))", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 20, padding: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Hear It Yourself — Call Right Now</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 28, fontSize: 16 }}>
            Call our live demo line and hear exactly what your customers will experience. Takes 2 minutes.
          </p>
          <TrackClick event="cta_click" properties={{ button: "demo_call", page: "blog_plumber" }}>
            <a href="tel:+15617303316" style={{ display: "inline-block", background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "16px 36px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
              Call (561) 730-3316
            </a>
          </TrackClick>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 16 }}>Or start free at app.conduitai.io — no credit card required</p>
        </div>
      </div>
    </div>
  );
}
