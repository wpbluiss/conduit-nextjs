import TrackClick from '../../../components/TrackClick';

export const metadata = {
  title: 'AI Receptionist for Plumbers: Never Miss an Emergency Call Again | Conduit AI',
  description: 'Plumbers lose $3,000+/month to missed calls on job sites. An AI receptionist answers 24/7, captures emergency leads, and texts you instantly.',
  keywords: 'AI receptionist for plumbers, plumber answering service, plumbing emergency calls, missed calls plumber, plumber phone system',
  openGraph: {
    title: 'AI Receptionist for Plumbers: Never Miss an Emergency Call Again',
    description: 'Plumbers lose $3,000+/month to missed calls on job sites. An AI receptionist answers 24/7, captures emergency leads, and texts you instantly.',
    url: 'https://conduitai.io/blog/plumbers/ai-receptionist-for-plumbers',
    siteName: 'Conduit AI',
    images: [
      {
        url: 'https://conduitai.io/og/ai-receptionist-for-plumbers.png',
        width: 1200,
        height: 630,
        alt: 'AI Receptionist for Plumbers',
      },
    ],
    locale: 'en_US',
    type: 'article',
    publishedTime: '2026-03-09T00:00:00Z',
  },
};

export default function AIReceptionistForPlumbers() {
  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f5f5', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid #1f1f1f', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a0a0a', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#f5f5f5', letterSpacing: '-0.3px' }}>Conduit AI</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="/blog" style={{ color: '#999', fontSize: '14px', textDecoration: 'none' }}>Blog</a>
          <a href="/#pricing" style={{ color: '#999', fontSize: '14px', textDecoration: 'none' }}>Pricing</a>
          <TrackClick eventName="nav_cta_click" properties={{ page: 'ai-receptionist-for-plumbers', location: 'nav' }}>
            <a href="https://app.conduitai.io" style={{ backgroundColor: '#7c3aed', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              Get Started
            </a>
          </TrackClick>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '72px 24px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ backgroundColor: '#1a1a2e', color: '#818cf8', fontSize: '12px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px', border: '1px solid #2e2e5e' }}>
            Plumbers
          </span>
          <span style={{ color: '#555', fontSize: '13px' }}>March 9, 2026</span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.15, color: '#f5f5f5', letterSpacing: '-0.8px', marginBottom: '20px' }}>
          AI Receptionist for Plumbers: Never Miss an Emergency Call Again
        </h1>

        <p style={{ fontSize: '18px', color: '#a3a3a3', lineHeight: 1.7, marginBottom: '16px' }}>
          You're 20 feet under a crawl space fixing a burst pipe when your phone rings. You can't answer. The homeowner hangs up, Googles the next plumber, and books them instead. That job was worth $400. It's gone in 30 seconds — and it happens multiple times a day.
        </p>
        <p style={{ fontSize: '18px', color: '#a3a3a3', lineHeight: 1.7 }}>
          A Conduit AI receptionist answers every call the moment it comes in, qualifies the emergency, collects the caller's info, and texts you a summary — so you never lose a lead to voicemail again.
        </p>
      </section>

      {/* DIVIDER */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
        <hr style={{ border: 'none', borderTop: '1px solid #1f1f1f', marginBottom: '48px' }} />
      </div>

      {/* SECTION 1 — THE COST OF MISSED CALLS */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 56px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#f5f5f5', marginBottom: '16px', letterSpacing: '-0.4px' }}>
          How Much Are Missed Calls Actually Costing You?
        </h2>
        <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8, marginBottom: '20px' }}>
          Most plumbers miss 3–6 calls per day while on the job. At an average ticket value of $250–$600 for a service call, that adds up faster than a water bill after a slab leak.
        </p>

        <div style={{ backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '28px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            The Real Numbers
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
            {[
              { stat: '62%', label: 'of callers won\'t leave a voicemail' },
              { stat: '3–6×', label: 'calls missed per day on job sites' },
              { stat: '$3,200+', label: 'avg. monthly revenue lost to missed calls' },
              { stat: '85%', label: 'of customers who can\'t reach you call a competitor' },
            ].map(({ stat, label }) => (
              <div key={stat} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#7c3aed', letterSpacing: '-1px', marginBottom: '6px' }}>{stat}</div>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8 }}>
          The math is brutal. If you miss just 2 calls per day at an average of $350 per job, you're leaving over <strong style={{ color: '#f5f5f5' }}>$50,000 per year</strong> on the table — revenue that a competitor with an answering service is happily collecting.
        </p>
      </section>

      {/* SECTION 2 — HOW IT WORKS FOR PLUMBERS */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 56px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#f5f5f5', marginBottom: '16px', letterSpacing: '-0.4px' }}>
          How Conduit AI Works for Plumbing Businesses
        </h2>
        <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8, marginBottom: '28px' }}>
          Conduit AI isn't a call center or a clunky phone tree. It's a smart voice agent that answers your business line in under 2 rings, sounds professional, and handles the full intake conversation — just like a real receptionist would.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
          {[
            {
              icon: '📞',
              title: 'Answers every call, 24/7',
              desc: 'Whether it\'s 2 AM for a burst pipe or Saturday afternoon for a slow drain, Conduit AI picks up immediately. No rings to voicemail. No missed opportunities.',
            },
            {
              icon: '🚨',
              title: 'Triages emergency vs. routine',
              desc: 'The AI asks the right questions to determine urgency — burst pipe, no hot water, sewage backup — and flags true emergencies in your text alert so you can decide whether to call back mid-job.',
            },
            {
              icon: '📋',
              title: 'Captures full lead details',
              desc: 'Name, address, phone number, problem description, and preferred appointment time — all collected and sent to you as a text summary before the caller even hangs up.',
            },
            {
              icon: '📲',
              title: 'Texts you instantly',
              desc: 'You get a concise SMS with everything you need. Reply to the text to call them back, or let Conduit AI book the appointment if you\'ve enabled scheduling.',
            },
            {
              icon: '🗓️',
              title: 'Books appointments automatically',
              desc: 'Connect your calendar and Conduit AI can schedule service windows on the spot — no phone tag, no back-and-forth, no lost jobs.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: '16px', backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#f5f5f5', marginBottom: '6px', fontSize: '15px' }}>{title}</div>
                <div style={{ fontSize: '14px', color: '#777', lineHeight: 1.7 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — COMMON PLUMBER SCENARIOS */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 56px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#f5f5f5', marginBottom: '16px', letterSpacing: '-0.4px' }}>
          Real Scenarios Where Conduit AI Saves the Job
        </h2>
        <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8, marginBottom: '28px' }}>
          These aren't hypotheticals. These are the calls that plumbers miss every single day — and the revenue that walks out the door with them.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            {
              scenario: 'The 6 AM Burst Pipe',
              without: 'Call goes to voicemail. Panicked homeowner calls two more plumbers. The one who answers gets a $900 emergency job.',
              with: 'Conduit AI answers immediately, confirms the emergency, collects the address, and texts you. You finish draining the current job and call back within 20 minutes. You get the work.',
            },
            {
              scenario: 'Saturday Afternoon Water Heater Failure',
              without: 'You\'re at a youth soccer game with your kids. Phone rings, you ignore it. $1,200 water heater replacement goes to someone who was sitting by the phone.',
              with: 'Conduit AI handles intake. You get a text. You glance at it during halftime, see it\'s not a code-red emergency, and schedule it for Monday morning. Job saved, weekend intact.',
            },
            {
              scenario: 'New Customer During a Multi-Hour Job',
              without: 'You\'re knee-deep in a repiping project. New customer calling for the first time can\'t reach you, assumes you\'re too busy or unprofessional, and never calls back.',
              with: 'Conduit AI answers professionally, books a quote appointment for the following day, and sends the new customer a confirmation text. First impression: flawless.',
            },
          ].map(({ scenario, without, with: withConduit }) => (
            <div key={scenario} style={{ backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#16101e', padding: '14px 20px', borderBottom: '1px solid #1f1f1f' }}>
                <span style={{ fontWeight: 700, color: '#c4b5fd', fontSize: '15px' }}>{scenario}</span>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#ef4444', textTransform: 'uppercase', marginBottom: '8px' }}>Without Conduit AI</div>
                  <p style={{ fontSize: '13px', color: '#777', lineHeight: 1.7, margin: 0 }}>{without}</p>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#22c55e', textTransform: 'uppercase', marginBottom: '8px' }}>With Conduit AI</div>
                  <p style={{ fontSize: '13px', color: '#a3a3a3', lineHeight: 1.7, margin: 0 }}>{withConduit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — PRICING & ROI */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 56px' }}>
        <h2 style={{ fontSize: '26px', fontWeight