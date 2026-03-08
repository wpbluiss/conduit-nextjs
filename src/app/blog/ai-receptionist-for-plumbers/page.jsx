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
  },
};

export default function AIReceptionistForPlumbers() {
  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#f5f5f5', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid #1f1f1f', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: '#0a0a0a', zIndex: 50 }}>
        <a href="/" style={{ fontWeight: 700, fontSize: '18px', color: '#f5f5f5', textDecoration: 'none', letterSpacing: '-0.3px' }}>
          Conduit <span style={{ color: '#7c3aed' }}>AI</span>
        </a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/blog" style={{ color: '#a3a3a3', textDecoration: 'none', fontSize: '14px' }}>Blog</a>
          <a href="/#pricing" style={{ color: '#a3a3a3', textDecoration: 'none', fontSize: '14px' }}>Pricing</a>
          <TrackClick eventName="nav_cta_click" properties={{ page: 'ai-receptionist-for-plumbers' }}>
            <a
              href="https://app.conduitai.io"
              style={{ backgroundColor: '#7c3aed', color: '#fff', padding: '8px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
            >
              Get Started
            </a>
          </TrackClick>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ maxWidth: '760px', margin: '0 auto', padding: '72px 24px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ backgroundColor: '#1a0a2e', color: '#a78bfa', fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '999px', border: '1px solid #3b1f6e' }}>
            Plumbers
          </span>
          <span style={{ color: '#525252', fontSize: '13px' }}>March 9, 2026</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.8px', marginBottom: '20px', color: '#f5f5f5' }}>
          AI Receptionist for Plumbers: Never Miss an Emergency Call Again
        </h1>
        <p style={{ fontSize: '18px', color: '#a3a3a3', lineHeight: 1.7, marginBottom: '32px' }}>
          You're elbow-deep under a sink when your phone rings. You let it go to voicemail. That caller — a homeowner with water gushing across their kitchen floor — hangs up and dials the next plumber in Google Maps. You just lost a $400 job in 30 seconds. Multiply that by a week and you're looking at real money walking out the door. An AI receptionist stops the bleeding.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <TrackClick eventName="hero_demo_click" properties={{ page: 'ai-receptionist-for-plumbers' }}>
            <a
              href="tel:+15617303316"
              style={{ backgroundColor: '#7c3aed', color: '#fff', padding: '13px 26px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}
            >
              Call Our Demo Line: (561) 730-3316
            </a>
          </TrackClick>
          <TrackClick eventName="hero_start_click" properties={{ page: 'ai-receptionist-for-plumbers' }}>
            <a
              href="https://app.conduitai.io"
              style={{ backgroundColor: '#1a1a1a', color: '#f5f5f5', padding: '13px 26px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', textDecoration: 'none', display: 'inline-block', border: '1px solid #2a2a2a' }}
            >
              Start Free →
            </a>
          </TrackClick>
        </div>
      </header>

      {/* DIVIDER */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
        <hr style={{ border: 'none', borderTop: '1px solid #1f1f1f', marginBottom: '56px' }} />
      </div>

      {/* ARTICLE BODY */}
      <article style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* SECTION 1 */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '16px', color: '#f5f5f5' }}>
            How Much Are Missed Calls Actually Costing You?
          </h2>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8, marginBottom: '16px' }}>
            Most plumbers don't track missed calls because the pain is invisible. The job just… doesn't happen. But the numbers are sobering when you lay them out.
          </p>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8, marginBottom: '24px' }}>
            According to data from plumbing industry associations, the average residential plumbing call is worth $285–$450 in revenue. Emergency calls — burst pipes, sewage backups, water heater failures — routinely run $600–$1,200. A solo plumber working 5 days a week misses an average of 7–12 calls per week while on job sites, in crawl spaces, or simply driving between stops.
          </p>

          {/* STAT BOX */}
          <div style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '28px', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>By the Numbers</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px' }}>
              {[
                { stat: '7–12', label: 'calls missed per week, avg solo plumber' },
                { stat: '$350', label: 'average value per residential call' },
                { stat: '$3,150+', label: 'potential revenue lost every month' },
                { stat: '62%', label: 'of callers won\'t leave a voicemail' },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: '#a78bfa', marginBottom: '4px', letterSpacing: '-1px' }}>{item.stat}</p>
                  <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5 }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8 }}>
            That 62% figure is the brutal part. Most customers calling about a plumbing emergency have water running somewhere right now. They are not leaving a voicemail and waiting two hours for a callback. They're hanging up and calling the next result in Google Maps — likely your competitor.
          </p>
        </section>

        {/* SECTION 2 */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '16px', color: '#f5f5f5' }}>
            What an AI Receptionist Does on Every Single Call
          </h2>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8, marginBottom: '24px' }}>
            Think of it as a professional dispatcher who never sleeps, never puts anyone on hold, and costs less than a single missed service call per month. Here's exactly what happens when a customer dials your number and you can't pick up:
          </p>

          {[
            {
              step: '01',
              title: 'Answers in under 2 rings',
              body: 'The AI picks up instantly with a greeting you customize — your business name, your tone. The caller never hits voicemail.',
            },
            {
              step: '02',
              title: 'Qualifies the job in real time',
              body: 'It asks the right questions: What\'s the issue? How urgent? What\'s your address? Is water actively running? This context lets you prioritize your callback list the moment you\'re free.',
            },
            {
              step: '03',
              title: 'Captures full contact details',
              body: 'Name, phone number, address, and problem type — all logged automatically. No more deciphering half-written voicemail messages.',
            },
            {
              step: '04',
              title: 'Texts you instantly',
              body: 'The second the call ends, you get an SMS summary: "Emergency leak — Maria Santos — 1242 Palm Ct — water under kitchen sink actively running." You call back the hottest leads first.',
            },
            {
              step: '05',
              title: 'Books appointments (optional)',
              body: 'If it\'s not an emergency, the AI can book a service window directly into your calendar so you\'re not playing phone tag all afternoon.',
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{ display: 'flex', gap: '20px', marginBottom: '28px', alignItems: 'flex-start' }}
            >
              <div style={{ minWidth: '44px', height: '44px', backgroundColor: '#1a0a2e', border: '1px solid #3b1f6e', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 800 }}>{item.step}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f5f5', marginBottom: '6px' }}>{item.title}</h3>
                <p style={{ fontSize: '15px', color: '#a3a3a3', lineHeight: 1.7 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 3 */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '16px', color: '#f5f5f5' }}>
            Why Plumbers Specifically Need This More Than Most
          </h2>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8, marginBottom: '16px' }}>
            Every trade has missed-call problems. But plumbing has three factors that make it especially brutal:
          </p>

          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            {[
              {
                icon: '🚨',
                title: 'Emergencies can\'t wait',
                body: 'A burst pipe, a sewer backup, or a failed water heater is not a "call me back when you\'re free" situation. Customers in crisis move to whoever answers. Your window to capture that lead is 90 seconds.',
              },
              {
                icon: '🔧',
                title: 'You work with your hands all day',
                body: 'Unlike a desk-based business, you physically cannot answer your phone while pressure-testing a line, working in a crawl space, or driving a work van. Your hands-free periods are limited.',
              },
              {
                icon: '📍',
                title: 'Local search competition is fierce',
                body: 'Google Maps shows 3–5 plumbers to anyone who searches "emergency plumber near me." Whoever answers first wins. An AI receptionist means you\'re always the business that answers.',
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
              >
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{card.icon}</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f5f5', marginBottom: '8px' }}>{card.title}</h3>
                  <p style={{ fontSize: '15px', color: '#a3a3a3', lineHeight: 1.7 }}>{card.body}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: 1.8 }}>
            The