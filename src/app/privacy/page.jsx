"use client";
import Link from "next/link";

export default function PrivacyPage() {
  const nav = (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff" }}>
          <img src="/icon.svg" alt="Conduit AI" width={28} height={28} style={{ borderRadius: 8 }} />
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
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, marginBottom: 8, lineHeight: 1.2, color: "#fff" }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 48 }}>Last updated: February 25, 2026</p>

        <H2>1. Introduction</H2>
        <P>Conduit AI LLC ("Conduit AI," "we," "us," or "our") operates the website conduitai.io and provides AI-powered lead recovery services for service businesses. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</P>

        <H2>2. Information We Collect</H2>
        <P><strong style={{color:"#fff"}}>Personal Information:</strong> Name, email address, phone number, business name, and business address that you voluntarily provide when signing up for our service, requesting a demo, or contacting us.</P>
        <P><strong style={{color:"#fff"}}>Call Data:</strong> When our AI voice agent answers calls on behalf of your business, we collect caller information including phone numbers, names, and the content of conversations to provide our lead capture service.</P>
        <P><strong style={{color:"#fff"}}>Usage Data:</strong> We automatically collect certain information when you visit our website, including IP address, browser type, operating system, referring URLs, and pages viewed.</P>
        <P><strong style={{color:"#fff"}}>Payment Information:</strong> Payment details are processed securely through Stripe. We do not store your full credit card number on our servers.</P>

        <H2>3. How We Use Your Information</H2>
        <P>We use the information we collect to: provide, operate, and maintain our AI lead recovery service; process transactions and send related information; send you notifications about captured leads; respond to your comments, questions, and requests; monitor and analyze usage trends to improve our service; detect, prevent, and address technical issues and fraud; and communicate with you about products, services, and events.</P>

        <H2>4. Sharing Your Information</H2>
        <P>We do not sell your personal information. We may share information with: service providers who assist in operating our platform (Twilio for telephony, Stripe for payments, Supabase for data storage); law enforcement if required by law; and business partners with your consent.</P>

        <H2>5. Data Security</H2>
        <P>We implement industry-standard security measures to protect your information. All data is encrypted in transit and at rest. However, no method of electronic transmission or storage is 100% secure.</P>

        <H2>6. Your Rights</H2>
        <P>You have the right to: access, update, or delete your personal information; opt out of marketing communications; request a copy of your data; and withdraw consent at any time. To exercise these rights, contact us at luis@conduitai.io.</P>

        <H2>7. Contact Us</H2>
        <P>If you have questions about this Privacy Policy, please contact us at <a href="mailto:luis@conduitai.io" style={{color:"#00d4ff"}}>luis@conduitai.io</a>.</P>
      </div>
      {footer}
    </div>
  );
}
