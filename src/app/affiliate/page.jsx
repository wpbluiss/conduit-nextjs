"use client";
import { useState } from "react";

export default function AffiliatePage() {
  const [form, setForm] = useState({ name: "", email: "", plan: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent("Affiliate Program Application");
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPromotion Plan: ${form.plan}`
    );
    window.location.href = `mailto:luis@conduitai.io?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div style={s.page}>
      {/* ─── NAV ─── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <a href="/" style={s.logo}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={s.logoText}>Conduit</span>
            <span style={s.logoAi}>AI</span>
          </a>
          <div style={s.navLinks}>
            <a href="/#features" style={s.navLink}>Features</a>
            <a href="/#pricing" style={s.navLink}>Pricing</a>
            <a href="/blog" style={s.navLink}>Blog</a>
            <a href="https://app.conduitai.io/login" style={s.navLink}>Log In</a>
            <a href="https://app.conduitai.io" style={s.navCta}>Start Free Trial</a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={s.hero}>
        <div style={s.glowOrb1} />
        <div style={s.glowOrb2} />
        <div style={s.heroContent}>
          <span style={s.badge}>Partner Program</span>
          <h1 style={s.heroH1}>Earn Money Referring Businesses to Conduit AI</h1>
          <p style={s.heroSub}>
            Join our affiliate program and earn 20% recurring commission on every business you refer — for as long as they stay a customer. No cap, no limits.
          </p>
          <a href="#apply" style={s.btnPrimary}>Apply Now →</a>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>HOW IT WORKS</div>
          <h2 style={s.sectionH2}>Three steps to recurring income</h2>
          <div style={s.stepsGrid}>
            {[
              { num: "01", title: "Sign Up", desc: "Fill out the application below. We'll review it and send you a unique referral link within 24 hours." },
              { num: "02", title: "Share Your Link", desc: "Share your unique link with businesses in your network — via email, social media, your website, or in person." },
              { num: "03", title: "Earn 20% Recurring", desc: "Every time someone signs up through your link and becomes a paying customer, you earn 20% of their subscription — every month, forever." },
            ].map((step) => (
              <div key={step.num} style={s.stepCard}>
                <div style={s.stepNum}>{step.num}</div>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT YOU EARN ─── */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>WHAT YOU EARN</div>
          <h2 style={s.sectionH2}>The math is simple</h2>
          <p style={s.sectionSub}>You earn 20% of each referral's monthly subscription, every month they stay a customer.</p>
          <div style={s.earningsGrid}>
            {[
              { referrals: "3", plan: "$199/mo", yours: "$119/mo" },
              { referrals: "5", plan: "$349/mo", yours: "$349/mo" },
              { referrals: "10", plan: "$349/mo", yours: "$698/mo" },
            ].map((ex, i) => (
              <div key={i} style={s.earningsCard}>
                <div style={s.earningsLabel}>Refer {ex.referrals} businesses</div>
                <div style={s.earningsDetail}>at {ex.plan} each</div>
                <div style={s.earningsAmount}>{ex.yours}</div>
                <div style={s.earningsTag}>your passive income</div>
              </div>
            ))}
          </div>
          <p style={{ ...s.sectionSub, marginTop: 24 }}>
            Refer 5 Home Services businesses at $349/mo and you're earning <span style={{ color: "#00d4ff", fontWeight: 700 }}>$349/mo in passive income</span> — that's $4,188/year from a single afternoon of outreach.
          </p>
        </div>
      </section>

      {/* ─── WHO IT'S FOR ─── */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>WHO IT'S FOR</div>
          <h2 style={s.sectionH2}>Perfect for people who work with service businesses</h2>
          <div style={s.audienceGrid}>
            {[
              { icon: "📈", title: "Digital Marketers", desc: "Add Conduit AI to your client stack and earn recurring commissions alongside your retainers." },
              { icon: "💼", title: "Business Consultants", desc: "Recommend the tool your clients actually need — and get paid when they sign up." },
              { icon: "🎨", title: "Web Designers", desc: "Building a site for a service business? Complete the package with an AI receptionist." },
              { icon: "🖥️", title: "IT Professionals", desc: "Setting up phone systems or VoIP? Conduit AI is the missing piece your clients need." },
              { icon: "🤝", title: "Networking Groups & BNI Members", desc: "Share with your referral network and earn on every conversion." },
              { icon: "🔧", title: "Anyone in the Trades", desc: "Know other contractors who miss calls? Refer them and earn monthly income." },
            ].map((item, i) => (
              <div key={i} style={s.audienceCard}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={s.audienceTitle}>{item.title}</h3>
                <p style={s.audienceDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SIGNUP FORM ─── */}
      <section id="apply" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>APPLY</div>
          <h2 style={s.sectionH2}>Join the Conduit AI Partner Program</h2>
          <p style={s.sectionSub}>Fill out the form and we'll send you your unique referral link within 24 hours.</p>
          <div style={s.formWrap}>
            {submitted ? (
              <div style={s.successMsg}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Application Sent</h3>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>Your email client should have opened with the details. We'll review and get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={s.form}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    style={s.input}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                    style={s.input}
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>How do you plan to promote Conduit AI?</label>
                  <textarea
                    required
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    placeholder="e.g. I run a digital marketing agency serving HVAC companies and would include Conduit AI in my service packages..."
                    rows={4}
                    style={{ ...s.input, resize: "vertical", minHeight: 100 }}
                  />
                </div>
                <button type="submit" style={s.submitBtn}>Submit Application →</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>FAQ</div>
          <h2 style={s.sectionH2}>Frequently asked questions</h2>
          <div style={s.faqList}>
            {[
              {
                q: "How do I track my referrals?",
                a: "After approval, you'll get a unique referral link (e.g., conduitai.io/?ref=yourname). Every signup through that link is tracked automatically. You'll get access to a partner dashboard showing clicks, signups, active customers, and your earnings in real time.",
              },
              {
                q: "When do I get paid?",
                a: "Commissions are paid out monthly, 30 days after the referred customer's payment clears. Payments are sent via PayPal or direct bank transfer — your choice.",
              },
              {
                q: "Is there a minimum payout?",
                a: "Yes, the minimum payout threshold is $50. If your balance is below $50 in a given month, it rolls over to the next month. Most active affiliates clear this threshold easily.",
              },
              {
                q: "How long do I earn commissions?",
                a: "Forever. As long as the customer you referred stays subscribed, you earn 20% of their monthly payment. There is no time limit or cap on earnings.",
              },
              {
                q: "Can I refer myself or my own business?",
                a: "The affiliate program is designed for referring other businesses. If you want to use Conduit AI yourself, sign up directly at conduitai.io — you'll get the 14-day free trial.",
              },
              {
                q: "What if someone I refer upgrades their plan?",
                a: "Your commission increases automatically. If a referral upgrades from the $199/mo Beauty plan to the $349/mo Home Services plan, your monthly commission goes from $39.80 to $69.80.",
              },
            ].map((item, i) => (
              <div key={i} style={s.faqItem}>
                <h3 style={s.faqQ}>{item.q}</h3>
                <p style={s.faqA}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={s.section}>
        <div style={{ ...s.sectionInner, textAlign: "center" }}>
          <h2 style={s.sectionH2}>Start earning recurring income today</h2>
          <p style={{ ...s.sectionSub, maxWidth: 500, margin: "0 auto 32px" }}>
            It takes 2 minutes to apply. There's zero cost to join. And every referral earns you money month after month.
          </p>
          <a href="#apply" style={s.btnPrimary}>Apply Now →</a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <a href="/" style={s.footerLogo}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={s.logoText}>Conduit</span>
            <span style={s.logoAi}>AI</span>
          </a>
          <div style={s.footerLinks}>
            <a href="/#pricing" style={s.footerLink}>Pricing</a>
            <a href="/#faq" style={s.footerLink}>FAQ</a>
            <a href="/blog" style={s.footerLink}>Blog</a>
            <a href="/privacy" style={s.footerLink}>Privacy</a>
            <a href="/terms" style={s.footerLink}>Terms</a>
            <a href="mailto:luis@conduitai.io" style={s.footerLink}>Contact</a>
          </div>
          <div style={s.footerCopy}>© 2026 Conduit AI LLC. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

// ─── STYLES ───
const s = {
  page: {
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
    overflowX: "hidden",
  },

  // Nav
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(10,10,10,0.85)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  navInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff" },
  logoText: { fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20 },
  logoAi: {
    fontFamily: "'Sora', sans-serif",
    fontWeight: 700,
    fontSize: 20,
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  navLinks: { display: "flex", alignItems: "center", gap: 24, fontSize: 14 },
  navLink: { color: "rgba(255,255,255,0.5)", textDecoration: "none" },
  navCta: {
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    color: "#fff",
    padding: "8px 20px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 600,
  },

  // Hero
  hero: {
    position: "relative",
    padding: "160px 24px 100px",
    textAlign: "center",
    overflow: "hidden",
  },
  glowOrb1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,212,255,0.12), transparent 70%)",
    top: -100,
    left: -100,
    filter: "blur(120px)",
  },
  glowOrb2: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,100,255,0.1), transparent 70%)",
    bottom: -50,
    right: -50,
    filter: "blur(120px)",
  },
  heroContent: { position: "relative", zIndex: 2, maxWidth: 800, margin: "0 auto" },
  badge: {
    display: "inline-block",
    background: "rgba(0,212,255,0.1)",
    color: "#00d4ff",
    padding: "6px 16px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 24,
    border: "1px solid rgba(0,212,255,0.2)",
  },
  heroH1: {
    fontSize: "clamp(32px, 5vw, 52px)",
    fontWeight: 800,
    lineHeight: 1.15,
    fontFamily: "'Sora', sans-serif",
    marginBottom: 20,
  },
  heroSub: {
    fontSize: 18,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.7,
    maxWidth: 600,
    margin: "0 auto 36px",
  },
  btnPrimary: {
    display: "inline-block",
    padding: "16px 36px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 16,
  },

  // Sections
  section: { padding: "80px 0", borderTop: "1px solid rgba(255,255,255,0.05)" },
  sectionInner: { maxWidth: 1000, margin: "0 auto", padding: "0 24px" },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 3,
    color: "#00d4ff",
    fontWeight: 600,
    marginBottom: 16,
    textAlign: "center",
  },
  sectionH2: {
    fontFamily: "'Sora', sans-serif",
    fontSize: "clamp(24px, 3.5vw, 36px)",
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 1.25,
  },
  sectionSub: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: 600,
    margin: "0 auto 48px",
  },

  // Steps
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 48 },
  stepCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "32px 28px",
  },
  stepNum: {
    fontSize: 14,
    fontWeight: 700,
    color: "#00d4ff",
    fontFamily: "'Sora', sans-serif",
    marginBottom: 16,
  },
  stepTitle: { fontSize: 20, fontWeight: 700, marginBottom: 10, fontFamily: "'Sora', sans-serif" },
  stepDesc: { fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 },

  // Earnings
  earningsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginTop: 48 },
  earningsCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "32px 28px",
    textAlign: "center",
  },
  earningsLabel: { fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 4 },
  earningsDetail: { fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 20 },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 800,
    fontFamily: "'Sora', sans-serif",
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: 4,
  },
  earningsTag: { fontSize: 13, color: "rgba(255,255,255,0.35)" },

  // Audience
  audienceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 48 },
  audienceCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "28px 24px",
  },
  audienceTitle: { fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: "'Sora', sans-serif" },
  audienceDesc: { fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 },

  // Form
  formWrap: { maxWidth: 520, margin: "0 auto" },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "14px 16px",
    fontSize: 15,
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  submitBtn: {
    padding: "16px 36px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    border: "none",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    marginTop: 8,
  },
  successMsg: {
    textAlign: "center",
    padding: "48px 24px",
    background: "rgba(0,212,255,0.06)",
    border: "1px solid rgba(0,212,255,0.15)",
    borderRadius: 16,
  },

  // FAQ
  faqList: { maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, marginTop: 48 },
  faqItem: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "24px 28px",
  },
  faqQ: { fontSize: 17, fontWeight: 700, marginBottom: 10, fontFamily: "'Sora', sans-serif" },
  faqA: { fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 },

  // Footer
  footer: { borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 24px" },
  footerInner: { maxWidth: 1000, margin: "0 auto", textAlign: "center" },
  footerLogo: { display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff", marginBottom: 20 },
  footerLinks: { display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", marginBottom: 20 },
  footerLink: { color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13 },
  footerCopy: { fontSize: 12, color: "rgba(255,255,255,0.2)" },
};
