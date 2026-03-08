import TrackClick from "../../../components/TrackClick";

export const metadata = {
  title: "How Nail Salons Lose $2,000 Per Month to Missed Calls | Conduit AI",
  description: "Nail salons miss 40 percent of booking calls while doing nails. See how much revenue that costs and how an AI receptionist fixes it for $39 per month.",
  keywords: "nail salon missed calls, nail salon phone system, AI receptionist nail salon, nail salon booking automation, nail salon appointment calls",
  openGraph: {
    title: "How Nail Salons Lose $2,000 Per Month to Missed Calls | Conduit AI",
    description: "Nail salons miss 40 percent of booking calls while doing nails. See how much revenue that costs and how an AI receptionist fixes it for $39 per month.",
    url: "https://conduitai.io/blog/nail-salon-missed-calls",
    siteName: "Conduit AI",
    type: "article",
  },
};

export default function NailSalonMissedCalls() {
  return (
    <div style={{ backgroundColor: "#0a0a0a", minHeight: "100vh", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1200px", margin: "0 auto" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>Conduit</span>
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#7c3aed" }}>AI</span>
        </a>
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <a href="/blog" style={{ color: "#a1a1aa", textDecoration: "none", fontSize: "14px" }}>Blog</a>
          <a href="/#pricing" style={{ color: "#a1a1aa", textDecoration: "none", fontSize: "14px" }}>Pricing</a>
          <TrackClick eventName="nav_cta_click" properties={{ page: "nail-salon-missed-calls" }}>
            <a href="https://app.conduitai.io" style={{ backgroundColor: "#7c3aed", color: "#ffffff", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>Get Started</a>
          </TrackClick>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: "800px", margin: "0 auto", padding: "80px 24px 48px" }}>
        <div style={{ display: "inline-block", backgroundColor: "#1a0a2e", border: "1px solid #7c3aed", borderRadius: "6px", padding: "4px 12px", marginBottom: "24px" }}>
          <span style={{ color: "#a78bfa", fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>Nail Salons</span>
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "800", lineHeight: "1.15", margin: "0 0 24px", letterSpacing: "-0.02em" }}>
          How Nail Salons Lose{" "}
          <span style={{ color: "#7c3aed" }}>$2,000 Per Month</span>{" "}
          to Missed Calls
        </h1>
        <p style={{ fontSize: "20px", color: "#a1a1aa", lineHeight: "1.6", margin: "0 0 32px" }}>
          Your hands are full — literally. While you are perfecting a set of acrylics, your phone rings, nobody picks up, and a new client books somewhere else. It happens dozens of times a month, and the math is brutal.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "16px", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#1a0a2e", border: "1px solid #7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "16px" }}>🤖</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>Conduit AI</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#71717a" }}>March 9, 2026 &middot; 6 min read</p>
          </div>
        </div>
      </section>

      {/* ARTICLE BODY */}
      <article style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px 80px" }}>

        {/* SECTION 1 */}
        <section style={{ marginBottom: "64px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px", letterSpacing: "-0.01em" }}>
            The Nail Salon Phone Problem Nobody Talks About
          </h2>
          <p style={{ fontSize: "17px", color: "#a1a1aa", lineHeight: "1.8", marginBottom: "20px" }}>
            Nail salons operate in one of the most hands-on service environments that exists. Technicians cannot stop mid-service to answer a call. Front desk staff — if they even exist — are checking in clients, processing payments, and managing walk-ins all at once. The phone gets ignored.
          </p>
          <p style={{ fontSize: "17px", color: "#a1a1aa", lineHeight: "1.8", marginBottom: "20px" }}>
            Industry data from call-tracking platforms consistently shows that small beauty salons miss between 35 and 45 percent of inbound calls during business hours. That is not an edge case. That is standard operating reality for a busy nail salon.
          </p>

          {/* STAT CARD */}
          <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderLeft: "4px solid #7c3aed", borderRadius: "12px", padding: "28px 32px", margin: "32px 0", display: "flex", flexWrap: "wrap", gap: "32px", justifyContent: "space-between" }}>
            {[
              { stat: "40%", label: "of nail salon calls go unanswered" },
              { stat: "73%", label: "of callers hang up and never call back" },
              { stat: "$50", label: "average lifetime value of one new client visit" },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: "center", flex: "1", minWidth: "140px" }}>
                <p style={{ fontSize: "42px", fontWeight: "800", color: "#7c3aed", margin: "0 0 8px" }}>{item.stat}</p>
                <p style={{ fontSize: "14px", color: "#71717a", margin: 0, lineHeight: "1.4" }}>{item.label}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "17px", color: "#a1a1aa", lineHeight: "1.8" }}>
            When nearly three out of four callers who hit voicemail simply move on, every unanswered ring is a permanent lost opportunity — not just a delayed one.
          </p>
        </section>

        {/* SECTION 2 */}
        <section style={{ marginBottom: "64px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px", letterSpacing: "-0.01em" }}>
            The $2,000 Revenue Leak: Running the Real Numbers
          </h2>
          <p style={{ fontSize: "17px", color: "#a1a1aa", lineHeight: "1.8", marginBottom: "28px" }}>
            This is not a dramatic headline. The math is straightforward, and it applies to the average busy nail salon.
          </p>

          <div style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: "12px", overflow: "hidden", marginBottom: "32px" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a", backgroundColor: "#0d0d0d" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly Revenue Leak Calculator</p>
            </div>
            {[
              { label: "Inbound booking calls per day", value: "15 calls" },
              { label: "Calls missed (40% rate)", value: "6 calls/day" },
              { label: "Missed calls per month", value: "~180 calls" },
              { label: "Callers who never rebook (73%)", value: "~131 lost leads" },
              { label: "Typical new client booking value", value: "$55" },
              { label: "Revenue lost per month", value: "$2,054" },
            ].map((row, i) => (
              <div key={row.label} style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < 5 ? "1px solid #1a1a1a" : "none", backgroundColor: row.label === "Revenue lost per month" ? "#1a0a2e" : "transparent" }}>
                <span style={{ fontSize: "15px", color: "#a1a1aa" }}>{row.label}</span>
                <span style={{ fontSize: "15px", fontWeight: "700", color: row.label === "Revenue lost per month" ? "#a78bfa" : "#ffffff" }}>{row.value}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "17px", color: "#a1a1aa", lineHeight: "1.8" }}>
            Over twelve months, that single leak costs a nail salon over $24,000 in revenue that was already walking through the door — clients who wanted to book, picked up the phone, and got nothing. They did not cancel on you. You just were not there.
          </p>
        </section>

        {/* SECTION 3 */}
        <section style={{ marginBottom: "64px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px", letterSpacing: "-0.01em" }}>
            Why Traditional Solutions Do Not Work for Nail Salons
          </h2>
          <p style={{ fontSize: "17px", color: "#a1a1aa", lineHeight: "1.8", marginBottom: "28px" }}>
            Salon owners have tried everything. None of it solves the core problem cleanly.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
            {[
              {
                title: "Hiring a Receptionist",
                problem: "Costs $2,500 to $3,500 per month in wages. Needs training, sick days, benefits. Still cannot answer two calls simultaneously. The cure costs more than the disease.",
              },
              {
                title: "Voicemail",
                problem: "Only 20 percent of callers leave a voicemail at a business. The other 80 percent hang up. Of those who do leave a message, callbacks often come too late and the client has already booked elsewhere.",
              },
              {
                title: "Online Booking Apps",
                problem: "Great for digital-first clients. But a large segment of nail salon customers — especially older and first-time clients — still prefer to call. An app does not help when the phone rings and no one answers.",
              },
              {
                title: "Call Forwarding to Your Personal Phone",
                problem: "Unsustainable. You did not open a business to be on-call 24 hours a day. Boundaries disappear, burnout follows, and you still miss calls when you are with a client.",
              },
            ].map((item) => (
              <div key={item.title} style={{ backgroundColor: "#111111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#2d1b1b", border: "1px solid #7f1d1d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <span style={{ fontSize: "12px", color: "#f87171" }}>✕</span>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: "15px", color: "#71717a", lineHeight: "1.6" }}>{item.problem}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 */}
        <section style={{ marginBottom: "64px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px", letterSpacing: "-0.01em" }}>
            How an AI Receptionist Plugs the Leak for $39/Month
          </h2>
          <p style={{ fontSize: "17px", color: "#a1a1aa", lineHeight: "1.8", marginBottom: "28px" }}>
            Conduit AI answers every call your team cannot get to — instantly, in a natural conversational voice, around the clock. No hold music. No voicemail box. A real answer, every time.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            {[
              { icon: "📞", title: "Answers in under 2 seconds", body: "No ringing into the void. Your AI agent picks up immediately and greets the caller by your salon name." },
              { icon: "📅", title: "Collects booking details", body: "Asks for name, service, preferred date, and contact info — then texts or emails you a clean summary." },
              { icon: "🌙", title: "Works after hours", body: "Clients call at 10pm when they remember they need their nails done Friday. Your AI is ready." },
              { icon: "💬", title: "Handles FAQs automatically", body: "Prices, hours, parking, service menu — your AI answers common questions so you never have to repeat yourself." },
            ].map((card) => (
              <div key={card.title} style={{ backgroundColor: "#111111", border