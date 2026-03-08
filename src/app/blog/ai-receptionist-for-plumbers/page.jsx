import TrackClick from "../../../components/TrackClick";

export const metadata = {
  title: "AI Receptionist for Plumbers: Never Miss an Emergency Call Again | Conduit AI",
  description: "Plumbers lose $3,000+ per month to missed calls on job sites. An AI receptionist answers 24/7, captures emergency leads, and texts you instantly.",
  keywords: "AI receptionist for plumbers, plumber answering service, plumbing emergency calls, missed calls plumber, plumber phone system",
  openGraph: {
    title: "AI Receptionist for Plumbers: Never Miss an Emergency Call Again",
    description: "Plumbers lose $3,000+ per month to missed calls on job sites. An AI receptionist answers 24/7, captures emergency leads, and texts you instantly.",
    url: "https://conduitai.io/blog/ai-receptionist-for-plumbers",
    siteName: "Conduit AI",
    type: "article",
  },
};

export default function AIReceptionistForPlumbers() {
  return (
    <div style={{ backgroundColor: "#0a0a0a", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#ffffff" }}>

      {/* NAV */}
      <nav style={{ borderBottom: "1px solid #1f1f1f", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1100px", margin: "0 auto" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#ffffff" }}>Conduit</span>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#a78bfa" }}>AI</span>
        </a>
        <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
          <a href="/blog" style={{ color: "#a0a0a0", textDecoration: "none", fontSize: "14px" }}>Blog</a>
          <a href="/#pricing" style={{ color: "#a0a0a0", textDecoration: "none", fontSize: "14px" }}>Pricing</a>
          <TrackClick eventName="nav_cta_click" properties={{ page: "ai-receptionist-for-plumbers" }}>
            <a href="https://app.conduitai.io" style={{ backgroundColor: "#a78bfa", color: "#0a0a0a", padding: "8px 18px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>Get Started</a>
          </TrackClick>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ maxWidth: "760px", margin: "0 auto", padding: "72px 24px 48px" }}>
        <div style={{ display: "inline-block", backgroundColor: "#1e1533", border: "1px solid #a78bfa", borderRadius: "999px", padding: "4px 14px", marginBottom: "20px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>Plumbers</span>
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 20px", color: "#ffffff" }}>
          AI Receptionist for Plumbers: Never Miss an Emergency Call Again
        </h1>
        <p style={{ fontSize: "18px", color: "#a0a0a0", lineHeight: 1.7, margin: "0 0 24px" }}>
          You are elbow-deep in a crawl space when your phone rings. You cannot answer. The caller hangs up and dials your competitor. That job was worth $400 — gone in 30 seconds. An AI receptionist fixes this permanently.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", color: "#606060" }}>March 9, 2026</span>
          <span style={{ fontSize: "13px", color: "#606060" }}>•</span>
          <span style={{ fontSize: "13px", color: "#606060" }}>7 min read</span>
        </div>
      </header>

      {/* ARTICLE BODY */}
      <article style={{ maxWidth: "760px", margin: "0 auto", padding: "0 24px 80px" }}>

        {/* SECTION 1 */}
        <section style={{ marginBottom: "56px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
            The $3,000-a-Month Problem Every Plumber Ignores
          </h2>
          <p style={{ fontSize: "16px", color: "#b0b0b0", lineHeight: 1.8, marginBottom: "16px" }}>
            Independent plumbers and small plumbing crews miss between 30% and 62% of inbound calls on any given workday, according to industry research from Service Titan and Angi. For a solo operator charging an average ticket of $285, missing just one call per day adds up to roughly $2,080 in lost revenue every single month — and that does not count the emergency jobs that bill $600 or more.
          </p>
          <p style={{ fontSize: "16px", color: "#b0b0b0", lineHeight: 1.8, marginBottom: "16px" }}>
            The math is brutal. A burst pipe at 11 PM is worth $800 to $1,500. The homeowner calls three plumbers. The first one to answer gets the job. If your phone rings to voicemail, you will never know what you lost.
          </p>

          {/* STAT BOX */}
          <div style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f", borderLeft: "4px solid #a78bfa", borderRadius: "10px", padding: "24px 28px", margin: "28px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "24px" }}>
              <div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#a78bfa" }}>62%</div>
                <div style={{ fontSize: "13px", color: "#707070", marginTop: "4px" }}>of plumbing calls go unanswered during work hours</div>
              </div>
              <div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#a78bfa" }}>$285</div>
                <div style={{ fontSize: "13px", color: "#707070", marginTop: "4px" }}>average ticket for a routine plumbing visit</div>
              </div>
              <div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#a78bfa" }}>27 sec</div>
                <div style={{ fontSize: "13px", color: "#707070", marginTop: "4px" }}>average time before a caller hangs up and calls a competitor</div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: "16px", color: "#b0b0b0", lineHeight: 1.8 }}>
            Hiring a human receptionist costs $2,500 to $4,000 per month in South Florida and most metro markets. A traditional answering service runs $150 to $400 per month but reads from a script, cannot answer real questions, and delivers message slips that are useless when the lead is already gone. There is a third option now, and it costs less than a tank of gas.
          </p>
        </section>

        {/* SECTION 2 */}
        <section style={{ marginBottom: "56px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
            How an AI Receptionist Works for a Plumbing Business
          </h2>
          <p style={{ fontSize: "16px", color: "#b0b0b0", lineHeight: 1.8, marginBottom: "16px" }}>
            Conduit AI routes your business number — or a new number — through a conversational AI voice agent. When you are on a job and a call comes in, the agent answers in under two seconds, speaks naturally, and handles the conversation the way a trained dispatcher would.
          </p>
          <p style={{ fontSize: "16px", color: "#b0b0b0", lineHeight: 1.8, marginBottom: "24px" }}>
            Here is what a typical interaction looks like for a plumbing business:
          </p>

          <div style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f", borderRadius: "10px", padding: "28px", marginBottom: "24px" }}>
            <div style={{ fontSize: "13px", color: "#a78bfa", fontWeight: 600, marginBottom: "16px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Example Call Transcript</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa", minWidth: "60px" }}>AI:</span>
                <span style={{ fontSize: "14px", color: "#c0c0c0", lineHeight: 1.6 }}>Thank you for calling Garcia Plumbing. This is the after-hours line. Are you dealing with an emergency, or would you like to schedule a visit?</span>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#60a5fa", minWidth: "60px" }}>Caller:</span>
                <span style={{ fontSize: "14px", color: "#c0c0c0", lineHeight: 1.6 }}>Yeah, my kitchen pipe just burst and water is everywhere.</span>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa", minWidth: "60px" }}>AI:</span>
                <span style={{ fontSize: "14px", color: "#c0c0c0", lineHeight: 1.6 }}>I am so sorry to hear that. First, shut off the water valve under the sink or at your main shutoff. Can I get your name and address so we can get a plumber to you as fast as possible?</span>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#60a5fa", minWidth: "60px" }}>Caller:</span>
                <span style={{ fontSize: "14px", color: "#c0c0c0", lineHeight: 1.6 }}>It is Maria Hernandez, 1428 Palmetto Drive, Boca Raton.</span>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa", minWidth: "60px" }}>AI:</span>
                <span style={{ fontSize: "14px", color: "#c0c0c0", lineHeight: 1.6 }}>Got it, Maria. I am alerting Luis right now and you will get a text with his ETA within the next few minutes. Stay safe.</span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: "16px", color: "#b0b0b0", lineHeight: 1.8, marginBottom: "16px" }}>
            The moment the call ends, you receive a text message with the caller name, address, problem description, and a phone number to call back. You decide whether to roll immediately or return the call. The lead is captured, the customer feels heard, and you never lost the job.
          </p>
          <p style={{ fontSize: "16px", color: "#b0b0b0", lineHeight: 1.8 }}>
            For non-emergency scheduling calls, the AI collects the same information and can let the caller know your typical availability window — reducing back-and-forth and setting expectations before you ever pick up the phone.
          </p>
        </section>

        {/* SECTION 3 */}
        <section style={{ marginBottom: "56px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#ffffff", marginBottom: "16px" }}>
            What Makes This Different from a Standard Answering Service
          </h2>
          <p style={{ fontSize: "16px", color: "#b0b0b0", lineHeight: 1.8, marginBottom: "24px" }}>
            Traditional answering services hire human agents who work from a script. They are trained to take a name and number and nothing more. They cannot answer questions about pricing, handle a panicked caller, or triage an emergency from a routine booking request. AI voice agents can do all three — consistently, at 3 AM, on holidays, without a sick day.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {[
              { label: "Human receptionist", cost: "$2,500 - $4,000/mo", available: "8 hrs/day, 5 days/wk", quality: "Inconsistent" },
              { label: "Answering service", cost: "$150 - $400/mo", available: "24/7 (shared agents)", quality: "Script-only" },
              { label: "Conduit AI", cost: "$39 - $199/mo", available: "24/7 always on", quality: "Conversational AI" },
            ].map((row) => (
              <div key={row.label} style={{ backgroundColor: row.label === "Conduit AI" ? "#1e1533" : "#111111", border: `1px solid ${row.label === "Conduit AI" ? "#a78bfa" : "#1f1f1f"}`, borderRadius: "10px", padding: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: row.label === "Conduit AI" ? "#a78bfa" : "#ffffff", marginBottom: "12px" }}>{row.label}</div>
                <div style={{ fontSize: "13px", color: "#707070", marginBottom: "6px" }}>Cost: <span style={{ color: "#c0c0c0" }}>{row.cost}</span></div>
                <div style={{ fontSize: "13px", color: "#707070", marginBottom: "6px" }}>Availability: <span style={{ color: "#c0c0c0" }}>{row.available}</span></div>
                <div style={{ fontSize: "13px", color: "#707070" }}>Quality: <span style={{ color: "#c0c0c0" }}>{row.quality}</span></div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "16px", color: "#b0b0b0", lineHeight: 1.8, marginBottom: "16px" }}>
            Beyond cost, the speed advantage is decisive.