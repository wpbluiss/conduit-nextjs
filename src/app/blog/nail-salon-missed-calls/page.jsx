import TrackClick from '../../../components/TrackClick';

export const metadata = {
  title: "How Nail Salons Lose $2,000/Month to Missed Calls | Conduit AI",
  description: "Nail salons miss 40% of booking calls while doing nails. See exactly how much revenue that costs and how an AI receptionist fixes it for $39/month.",
  keywords: "nail salon missed calls, nail salon phone system, AI receptionist nail salon, nail salon booking automation, nail salon appointment calls",
  openGraph: {
    title: "How Nail Salons Lose $2,000/Month to Missed Calls (And How to Stop It)",
    description: "Nail salons miss 40% of booking calls while doing nails. An AI receptionist answers every call and captures every booking.",
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
          <TrackClick event="cta_click" properties={{ button: "start_free_trial", page: "blog_nailsalon" }}>
            <a href="https://app.conduitai.io" style={{ background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>Start Free Trial</a>
          </TrackClick>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "60px auto 40px", padding: "0 24px", textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "rgba(0,212,255,0.1)", color: "#00d4ff", padding: "4px 14px", borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>NAIL SALONS</span>
        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.2, color: "#fff", marginBottom: 20 }}>
          How Nail Salons Lose $2,000/Month to Missed Calls (And How to Stop It)
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 }}>
          You are in the middle of a full set. The phone rings. Your hands are covered in acrylic. You let it go to voicemail. That caller books somewhere else. It happens 15 to 20 times a week at the average nail salon.
        </p>
        <TrackClick event="cta_click" properties={{ button: "hear_it_live", page: "blog_nailsalon" }}>
          <a href="tel:+15617303316" style={{ display: "inline-block", background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "14px 32px", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>
            Hear It Live — Call (561) 730-3316
          </a>
        </TrackClick>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>

        <div style={{ background: "rgba(255,20,147,0.08)", border: "1px solid rgba(255,20,147,0.25)", borderRadius: 16, padding: 28, marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ff69b4", marginBottom: 12 }}>The Nail Salon Missed Call Problem by the Numbers</h2>
          <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
            The average nail salon receives 40 to 60 phone calls per day. During busy periods — afternoons, weekends, and before major holidays — technicians are occupied with clients and physically cannot answer. Studies show that 35 to 45 percent of these calls go unanswered. At an average booking value of $55 to $120, missing even 10 calls per day adds up to $550 to $1,200 in lost bookings — every single day.
          </p>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Why Nail Salons Miss More Calls Than Any Other Business</h2>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
          Unlike a plumber or contractor who is out in the field, nail techs are physically present in the salon — they just cannot stop mid-service to answer the phone. Putting down a nail brush mid-acrylic to take a booking call is not just inconvenient, it can ruin the work in progress.
        </p>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
          The busiest times at nail salons — Friday afternoons, Saturdays, days before holidays — are also the times when the phone rings most and everyone is the most slammed. It is a compounding problem with no easy human solution.
        </p>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 24 }}>What Callers Actually Want When They Call a Nail Salon</h2>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
          Most nail salon calls fall into four categories, and all four can be handled completely by an AI receptionist:
        </p>
        <div style={{ marginBottom: 48 }}>
          {[
            { pct: "48%", title: "Appointment Booking", desc: "Wants to book a specific service for a specific time. AI captures their name, service, preferred date and time, and logs the request for your confirmation." },
            { pct: "22%", title: "Pricing Questions", desc: "Wants to know how much a full set, gel fill, or pedicure costs. AI answers immediately with your current prices." },
            { pct: "18%", title: "Hours and Location", desc: "Wants to know when you are open, where you are located, or whether you have parking. AI answers instantly, 24 hours a day." },
            { pct: "12%", title: "Availability Check", desc: "Wants to know if you have a slot open today or this weekend. AI can check your booking calendar integration or capture their request for a callback." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 20, marginBottom: 16, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#ff69b4", minWidth: 60, textAlign: "center", paddingTop: 4 }}>{item.pct}</div>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6, fontSize: 15 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>The Real Revenue Impact</h2>
        <div style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 16, padding: 28, marginBottom: 40 }}>
          {[
            ["Missed calls per week", "15 to 20"],
            ["Callers who book elsewhere (est.)", "70%"],
            ["Average booking value", "$65"],
            ["Lost bookings per week", "10 to 14"],
            ["Lost revenue per month", "$1,950 to $3,640"],
            ["Cost of Conduit AI", "$39/mo"],
          ].map(([label, val], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
              <span style={{ color: "#00d4ff", fontWeight: 700 }}>{val}</span>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 16 }}>How It Works for Nail Salons</h2>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
          Conduit AI answers every call that you cannot get to — instantly, with your salon name, your services, and your prices. It captures booking requests and sends you a notification so you can confirm when you finish with your current client. It never puts anyone on hold. It never misses a call.
        </p>
        <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
          Setup takes under 10 minutes. You tell the AI your salon name, services, prices, and hours. It handles everything else — including after-hours calls from customers trying to book for the next morning before your doors open.
        </p>

        <div style={{ background: "linear-gradient(135deg, rgba(255,20,147,0.08), rgba(0,102,255,0.08))", border: "1px solid rgba(255,105,180,0.2)", borderRadius: 20, padding: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Stop Losing Bookings to Missed Calls</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 28 }}>
            14-day free trial. No credit card. Set up in 10 minutes.
          </p>
          <TrackClick event="cta_click" properties={{ button: "start_free_trial", page: "blog_nailsalon" }}>
            <a href="https://app.conduitai.io" style={{ display: "inline-block", background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "16px 36px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
              Start Free at app.conduitai.io
            </a>
          </TrackClick>
        </div>
      </div>
    </div>
  );
}
