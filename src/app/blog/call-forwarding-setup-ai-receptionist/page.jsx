import TrackClick from '../../../components/TrackClick';

export const metadata = {
  title: "How to Set Up Call Forwarding for Your AI Receptionist in 2 Minutes | Conduit AI Blog",
  description: "Step-by-step guide to setting up call forwarding on iPhone, Android, and business phone systems so your AI receptionist catches every missed call.",
  keywords: "how to set up call forwarding business, call forwarding AI receptionist, conditional call forwarding setup, forward calls to AI, business call forwarding guide",
  openGraph: {
    title: "How to Set Up Call Forwarding for Your AI Receptionist in 2 Minutes",
    description: "Step-by-step call forwarding setup for iPhone, Android, and business phones. Connect your AI receptionist in under 2 minutes.",
    url: "https://conduitai.io/blog/call-forwarding-setup-ai-receptionist",
    type: "article",
    publishedTime: "2026-02-28T00:00:00Z",
    authors: ["Luis Garcia"],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Set Up Call Forwarding for Your AI Receptionist in 2 Minutes",
    description: "Step-by-step call forwarding setup for iPhone, Android, and business phones.",
  },
  alternates: { canonical: "https://conduitai.io/blog/call-forwarding-setup-ai-receptionist" },
};

export default function BlogPost() {
  return (
    <div style={ { background: "#0a0a0a", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#e0e0e0" } }>
      {/* Nav */}
      <nav style={ { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)", maxWidth: 1200, margin: "0 auto" } }>
        <a href="/" style={ { display: "flex", alignItems: "center", gap: 10, fontSize: 22, fontWeight: 700, textDecoration: "none", color: "#fff" } }>
          <img src="/icon.svg" alt="Conduit AI" width={28} height={28} style={{ borderRadius: 8 }} />
          <span>Conduit</span>
          <span style={ { background: "linear-gradient(135deg, #00d4ff, #0066ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } }>AI</span>
        </a>
        <div style={ { display: "flex", gap: 24, fontSize: 14 } }>
          <a href="/#features" style={ { color: "rgba(255,255,255,0.5)", textDecoration: "none" } }>Features</a>
          <a href="/#pricing" style={ { color: "rgba(255,255,255,0.5)", textDecoration: "none" } }>Pricing</a>
          <a href="/blog" style={ { color: "#00d4ff", textDecoration: "none" } }>Blog</a>
          <a href="https://app.conduitai.io/login" style={ { color: "rgba(255,255,255,0.7)", textDecoration: "none" } }>Log In</a>
          <TrackClick event="cta_click" properties={{ button: "start_free_trial", page: "blog_post" }}><a href="https://app.conduitai.io" style={ { background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 600 } }>Start Free Trial</a></TrackClick>
        </div>
      </nav>

      {/* Hero */}
      <div style={ { maxWidth: 800, margin: "60px auto 40px", padding: "0 24px", textAlign: "center" } }>
        <span style={ { display: "inline-block", background: "rgba(0,212,255,0.1)", color: "#00d4ff", padding: "4px 14px", borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 16 } }>How-To Guide</span>
        <h1 style={ { fontSize: 38, fontWeight: 800, lineHeight: 1.2, color: "#fff", fontFamily: "'Sora', sans-serif" } }>How to Set Up Call Forwarding for Your AI Receptionist in 2 Minutes</h1>
        <p style={ { color: "rgba(255,255,255,0.4)", marginTop: 16, fontSize: 14 } }>By Luis Garcia, Founder of Conduit AI · February 28, 2026 · 5 min read</p>
      </div>

      {/* Content */}
      <article
        style={ { maxWidth: 720, margin: "0 auto", padding: "0 24px 60px", lineHeight: 1.85, fontSize: 17, color: "rgba(255,255,255,0.75)" } }
        dangerouslySetInnerHTML={ { __html: `<p>The number one question we get from new Conduit AI users is: "How do I actually connect this to my phone?" The answer is call forwarding — the same feature that's been built into every phone since the 1990s. You don't need new hardware, a new phone number, or an IT department. You just tell your phone "when I can't answer, send the call here instead."</p>

<p>The entire process takes about two minutes. Here's exactly how to do it on every major platform.</p>

<h2>Understanding Call Forwarding Types</h2>

<p>Before you start, it helps to know that there are two types of call forwarding, and you almost certainly want the second one.</p>

<p><strong>Unconditional forwarding</strong> sends every call to your AI receptionist immediately. Your phone never rings. This is useful if you're going on vacation or want the AI to handle 100% of calls, but most business owners don't want this for everyday use.</p>

<p><strong>Conditional forwarding</strong> only forwards calls when you don't answer. Your phone rings normally — if you pick up, great. If you don't answer after a set number of rings (usually 15 to 25 seconds), the call forwards to the AI instead of going to voicemail. This is what most Conduit AI customers use because it gives you the option to answer when you can while ensuring every missed call still gets handled.</p>

<p>Conditional forwarding is sometimes called "forward when unanswered" or "forward when busy." Some phones break it into separate settings: forward when no answer, forward when busy, and forward when unreachable. For complete coverage, you'll want to enable all three.</p>

<h2>iPhone Setup</h2>

<p>Apple makes conditional call forwarding available through your carrier's settings, not through the Settings app directly. Here's the approach that works for every carrier.</p>

<p>Open your Phone app and dial <strong>*61*[your Conduit AI number]#</strong> then press call. You'll hear a confirmation tone or see a message that forwarding has been activated. This activates forward-when-no-answer — calls that ring and you don't pick up will go to your AI receptionist instead of voicemail.</p>

<p>To also forward calls when you're on another call, dial <strong>*67*[your Conduit AI number]#</strong> and press call. And for when your phone is off or has no signal, dial <strong>*62*[your Conduit AI number]#</strong> and press call.</p>

<p>That's it. Three quick dials, each taking about ten seconds. Your iPhone now sends every missed call — whether you're busy, don't answer, or are out of service — to your AI receptionist instead of the default voicemail.</p>

<p>To undo it at any time, dial <strong>##61#</strong>, <strong>##67#</strong>, and <strong>##62#</strong> respectively. Or dial <strong>##002#</strong> to disable all forwarding at once.</p>

<h2>Android Setup</h2>

<p>Android gives you a built-in settings menu for call forwarding on most devices and carriers.</p>

<p>Open your Phone app and tap the three-dot menu in the top corner. Go to <strong>Settings</strong>, then <strong>Calling accounts</strong> (or <strong>Supplementary services</strong> on Samsung devices), then <strong>Call forwarding</strong>. You'll see options for Forward when unanswered, Forward when busy, and Forward when unreachable. Tap each one and enter your Conduit AI phone number.</p>

<p>On some Android devices, the menu path is slightly different: Phone app, then Settings, then Calls, then Call forwarding. The exact location varies by manufacturer, but the options are always there.</p>

<p>If the settings menu approach doesn't work on your specific device, the star codes from the iPhone section work on Android too. They're carrier-level codes, not phone-specific, so <strong>*61*</strong>, <strong>*67*</strong>, and <strong>*62*</strong> followed by your AI number and <strong>#</strong> will activate forwarding on any phone.</p>

<h2>Business Phone Systems</h2>

<p>If you use a business VoIP system like RingCentral, Grasshopper, Google Voice, or OpenPhone, call forwarding is typically configured in the admin dashboard rather than on the phone itself.</p>

<p><strong>RingCentral:</strong> Log into your admin portal. Navigate to Phone System, then Auto-Receptionist or Call Handling. Under the rules for your number, add a forwarding rule that sends unanswered calls to your Conduit AI number after your desired ring time.</p>

<p><strong>Google Voice:</strong> Open Google Voice settings. Under Calls, find the "Forward calls to" section and add your Conduit AI number. Enable the option to ring your linked numbers first, with Google Voice forwarding to the AI number if no one answers.</p>

<p><strong>Grasshopper:</strong> In your Grasshopper dashboard, go to the extension you want to configure. Under Call Forwarding, add your Conduit AI number as a forwarding destination. Set it to forward after your main numbers don't answer.</p>

<p><strong>OpenPhone:</strong> In your OpenPhone settings, navigate to Phone Numbers, select your number, and under Call Flow, add a forwarding step to your Conduit AI number as the fallback when no team member answers.</p>

<p>Most VoIP systems also let you set time-based rules. For example, forward to the AI after hours (6 PM to 8 AM) automatically, while keeping normal routing during business hours. This is particularly useful for businesses that have someone answering during the day but need coverage at night and on weekends.</p>

<h2>Landline and Office Phone Setup</h2>

<p>Traditional landlines use the same star codes as cell phones. Pick up your office phone, dial <strong>*61*[your Conduit AI number]#</strong>, and you'll hear a confirmation tone. Repeat with <strong>*67*</strong> and <strong>*62*</strong> for complete coverage.</p>

<p>If your office has a PBX system managed by a phone company, call them and ask to enable conditional call forwarding to your AI number. They can usually do this in under five minutes while you're on the phone.</p>

<h2>Testing Your Setup</h2>

<p>After enabling forwarding, test it immediately. Call your business number from a different phone. Let it ring without answering. After four to five rings, you should hear your AI receptionist pick up and greet the caller. Have a short conversation with it — give it a fake name and describe a service you need. Within seconds, you should receive the lead notification on your phone or email.</p>

<p>If the call still goes to voicemail instead of the AI, the most common fix is making sure you entered the full phone number with area code when setting up forwarding. Some carriers require a 1 before the area code, others don't. Try both formats if the first doesn't work.</p>

<h2>What Happens After Setup</h2>

<p>Once forwarding is active, your phone works exactly like it always has — with one important difference. Calls you miss no longer disappear into a voicemail box that nobody checks. Instead, they're answered by an AI that sounds natural, asks the right questions, and delivers a complete lead summary directly to you.</p>

<p>You keep your same phone number. Your customers don't know anything changed. You answer when you can, and when you can't, the AI handles it. The entire experience is seamless for both you and the caller.</p>

<p>Most Conduit AI customers tell us the same thing after their first week: "I had no idea how many calls I was missing." The leads that were silently vanishing into voicemail — the ones that never left a message, the ones that called after hours, the ones that came in while you were on another call — suddenly become visible. And visible leads become revenue.</p>` } }
      />

      {/* CTA */}
      <div style={ { maxWidth: 720, margin: "0 auto 60px", padding: "0 24px" } }>
        <div style={ { background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,102,255,0.08))", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 16, padding: "40px 32px", textAlign: "center" } }>
          <h3 style={ { fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 12, fontFamily: "'Sora', sans-serif" } }>Ready to Set Up Your AI Receptionist?</h3>
          <p style={ { color: "rgba(255,255,255,0.5)", marginBottom: 24, fontSize: 15 } }>Sign up, configure your AI, set up forwarding, and start capturing leads in under 5 minutes. 14-day free trial — no credit card required today.</p>
          <TrackClick event="cta_click" properties={{ button: "try_conduit_free", page: "blog_post" }}><a href="https://app.conduitai.io" style={ { display: "inline-block", background: "linear-gradient(135deg, #00d4ff, #0066ff)", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16 } }>Start Your Free Trial →</a></TrackClick>
          <p style={ { marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.35)" } }>Or try the AI live: <a href="tel:+15617303316" style={ { color: "#00d4ff" } }>(561) 730-3316</a></p>
        </div>
      </div>

      {/* More Posts */}
      <div style={ { maxWidth: 720, margin: "0 auto 60px", padding: "0 24px" } }>
        <h3 style={ { fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 16 } }>More from the Conduit AI Blog</h3>
              <a href="/blog/ai-receptionist-vs-voicemail" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 15, textDecoration: "none" }}>AI Receptionist vs. Voicemail: Why 80% of Callers Hang Up</a>
              <a href="/blog/solo-contractor-ai-receptionist" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 15, textDecoration: "none" }}>The Solo Contractor's Secret Weapon: How One-Person Businesses Answer Every Call</a>
              <a href="/blog/answering-service-vs-ai-receptionist-cost" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 15, textDecoration: "none" }}>Answering Service vs. AI Receptionist: The Real Cost Comparison Nobody Shows You</a>
              <a href="/blog/missed-call-cost-small-business" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 15, textDecoration: "none" }}>How Much Do Missed Calls Actually Cost Your Business?</a>
              <a href="/blog/first-response-wins-lead-response-time" style={{ display: "block", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 15, textDecoration: "none" }}>78% of Customers Buy From Whoever Responds First. Is That You?</a>
      </div>

      {/* Footer */}
      <footer style={ { textAlign: "center", padding: 40, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 13, color: "rgba(255,255,255,0.3)" } }>
        © 2026 Conduit AI. All rights reserved. · <a href="mailto:luis@conduitai.io" style={ { color: "rgba(255,255,255,0.4)" } }>Contact</a>
      </footer>
    </div>
  );
}
