"use client";
import Link from "next/link";

export default function TermsPage() {
  const nav = (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff" }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18 }}>Conduit</span>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, background: "linear-gradient(135deg, #00d4ff, #0066ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
        </Link>
        <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 14 }}>← Back to Home</Link>
      </div>
    </nav>
  );
  const footer = (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", marginBottom: 16 }}>
        {[["Pricing","/#pricing"],["FAQ","/#faq"],["Blog","/blog"],["Privacy","/privacy"],["Terms","/terms"],["Contact","mailto:luis@conduitai.io"]].map(([t,h],i) => <Link key={i} href={h} style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 13 }}>{t}</Link>)}
      </div>
      <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© 2026 Conduit AI LLC · All rights reserved.</div>
    </footer>
  );
  const H2 = ({children}) => <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12, color: "#fff" }}>{children}</h2>;
  const P = ({children}) => <p style={{ marginBottom: 16 }}>{children}</p>;

  return (
    <div style={{ background: "#0a0a0a", color: "rgba(255,255,255,0.65)", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", fontSize: 15, lineHeight: 1.8 }}>
      {nav}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 80px" }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#00d4ff", fontWeight: 600, marginBottom: 16 }}>LEGAL</div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, marginBottom: 8, lineHeight: 1.2, color: "#fff" }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 48 }}>Last updated: February 25, 2026</p>

        <H2>1. Agreement to Terms</H2>
        <P>By accessing or using the services provided by Conduit AI LLC ("Conduit AI," "we," "us," or "our"), including our website at conduitai.io and our AI-powered lead recovery platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our services.</P>

        <H2>2. Description of Service</H2>
        <P>Conduit AI provides an AI-powered voice agent that answers missed calls on behalf of service businesses, captures lead information, and delivers real-time notifications to business owners. Our service includes call answering, lead capture, SMS/email notifications, and a client dashboard for managing leads.</P>

        <H2>3. Account Registration</H2>
        <P>To use our services, you must create an account and provide accurate, complete information about yourself and your business. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</P>

        <H2>4. Subscription and Payment</H2>
        <P>Our services are offered on a subscription basis. By subscribing, you agree to pay the applicable fees as described on our pricing page. All subscriptions include a 14-day free trial period. After the trial period, your payment method will be charged automatically unless you cancel before the trial ends.</P>
        <P>Subscription fees are billed monthly and are non-refundable except as required by law. We reserve the right to change our pricing with 30 days notice. All payments are processed securely through Stripe.</P>

        <H2>5. Acceptable Use</H2>
        <P>You agree not to use our services for any unlawful purpose, to harass or harm others, to send spam or unsolicited communications, to interfere with the operation of our platform, or to attempt to gain unauthorized access to our systems.</P>

        <H2>6. Intellectual Property</H2>
        <P>All content, features, and functionality of our platform are owned by Conduit AI LLC and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.</P>

        <H2>7. Limitation of Liability</H2>
        <P>Conduit AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</P>

        <H2>8. Termination</H2>
        <P>Either party may terminate the subscription at any time. Upon termination, your access to the platform will be revoked and your data will be retained for 30 days before deletion. We reserve the right to suspend or terminate accounts that violate these terms.</P>

        <H2>9. Changes to Terms</H2>
        <P>We may update these Terms of Service from time to time. We will notify you of any material changes via email or through our platform. Continued use of our services after changes constitutes acceptance of the updated terms.</P>

        <H2>10. Contact Us</H2>
        <P>If you have questions about these Terms of Service, please contact us at <a href="mailto:luis@conduitai.io" style={{color:"#00d4ff"}}>luis@conduitai.io</a>.</P>
      </div>
      {footer}
    </div>
  );
}
