import TrackClick from '../../../components/TrackClick';

export const metadata = {
  title: 'How Nail Salons Lose $2,000/Month to Missed Calls (And How to Stop It) | Conduit AI',
  description: 'Nail salons miss 40% of booking calls while doing nails. See exactly how much revenue that costs and how an AI receptionist fixes it for $39/month.',
  keywords: 'nail salon missed calls, nail salon phone system, AI receptionist nail salon, nail salon booking automation, nail salon appointment calls',
  openGraph: {
    title: 'How Nail Salons Lose $2,000/Month to Missed Calls (And How to Stop It)',
    description: 'Nail salons miss 40% of booking calls while doing nails. See exactly how much revenue that costs and how an AI receptionist fixes it for $39/month.',
    url: 'https://conduitai.io/blog/nail-salons/nail-salon-missed-calls',
    siteName: 'Conduit AI',
    type: 'article',
    publishedTime: '2026-03-09T00:00:00Z',
  },
};

export default function NailSalonMissedCalls() {
  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1f1f1f', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: '#0a0a0a', zIndex: 50 }}>
        <a href="/" style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          Conduit <span style={{ color: '#7c3aed' }}>AI</span>
        </a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/blog" style={{ color: '#a3a3a3', textDecoration: 'none', fontSize: '14px' }}>Blog</a>
          <a href="/#pricing" style={{ color: '#a3a3a3', textDecoration: 'none', fontSize: '14px' }}>Pricing</a>
          <TrackClick eventName="nav_cta_click" properties={{ page: 'nail-salon-missed-calls' }}>
            <a href="https://app.conduitai.io" style={{ backgroundColor: '#7c3aed', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
              Get Started
            </a>
          </TrackClick>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px 48px' }}>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ backgroundColor: '#3b0764', color: '#c084fc', fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px' }}>
            Nail Salons
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '800', lineHeight: '1.2', color: '#ffffff', marginBottom: '20px', letterSpacing: '-0.5px' }}>
          How Nail Salons Lose $2,000/Month to Missed Calls (And How to Stop It)
        </h1>
        <p style={{ fontSize: '18px', color: '#a3a3a3', lineHeight: '1.7', marginBottom: '24px' }}>
          Your technicians are mid-fill, both hands occupied, client talking — and your phone rings. Nobody picks up. That caller books somewhere else. Multiply that by every day of the week, and you're watching thousands of dollars walk out the door before they ever walked in.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#6b7280', fontSize: '13px', borderTop: '1px solid #1f1f1f', paddingTop: '20px' }}>
          <span>Conduit AI Team</span>
          <span>·</span>
          <span>March 9, 2026</span>
          <span>·</span>
          <span>6 min read</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Section 1 */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.3px' }}>
            The 40% Problem Nobody Talks About
          </h2>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8', marginBottom: '16px' }}>
            Industry data from salon software providers consistently shows that nail salons miss between <strong style={{ color: '#e5e5e5' }}>35–45% of inbound phone calls</strong> during business hours. The reason is obvious once you think about it: nail techs work with both hands constantly occupied. You can't put down a nail file mid-set, strip off a glove, and grab the phone — not without ruining a client's fresh acrylics and burning the appointment's goodwill.
          </p>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8', marginBottom: '16px' }}>
            But here's the part that stings: <strong style={{ color: '#e5e5e5' }}>the people who call are the highest-intent leads you'll ever get.</strong> They already found you. They already decided they want to book. They just need someone to pick up.
          </p>
          <div style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f', borderLeft: '4px solid #7c3aed', borderRadius: '8px', padding: '24px', margin: '24px 0' }}>
            <p style={{ fontSize: '15px', color: '#d4d4d4', lineHeight: '1.7', margin: 0 }}>
              <strong style={{ color: '#c084fc' }}>Real talk:</strong> A caller who gets voicemail doesn't leave a message and wait patiently. They open Google, find the next nail salon nearby, and book there. You don't get a second chance at a missed call.
            </p>
          </div>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8' }}>
            Most salon owners know this is a problem. Very few have done anything about it — because until recently, the only fix was hiring a dedicated front-desk receptionist, which runs $2,500–$3,500/month in South Florida alone.
          </p>
        </section>

        {/* Section 2 — Math */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.3px' }}>
            The Math: What Missed Calls Actually Cost You
          </h2>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8', marginBottom: '24px' }}>
            Let's run the numbers for a typical mid-size nail salon. These aren't inflated — they're conservative.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Inbound calls per day', value: '15–20' },
              { label: 'Missed (40%)', value: '6–8 calls' },
              { label: 'Avg. appointment value', value: '$65' },
              { label: 'Missed revenue/day', value: '~$455' },
              { label: 'Missed revenue/month', value: '~$13,650' },
              { label: 'Conservative capture rate', value: '15% recovered' },
            ].map((stat) => (
              <div key={stat.label} style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#c084fc', marginBottom: '6px' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8', marginBottom: '16px' }}>
            Even if you only recover <strong style={{ color: '#e5e5e5' }}>15% of those missed calls</strong> — people who would've hung up and booked somewhere else — that's roughly <strong style={{ color: '#e5e5e5' }}>$2,000/month in recaptured revenue.</strong> At 25% recovery, you're looking at $3,400/month.
          </p>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8' }}>
            These numbers don't include repeat clients. Nail clients return every 2–4 weeks. One captured new client isn't a $65 booking — it's potentially <strong style={{ color: '#e5e5e5' }}>$780–$1,560 per year.</strong> The missed call problem compounds over time.
          </p>
        </section>

        {/* Section 3 — Why existing "solutions" fail */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.3px' }}>
            Why Voicemail and Online Booking Don't Solve It
          </h2>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8', marginBottom: '16px' }}>
            The two most common "fixes" salon owners try are leaving a voicemail greeting and setting up an online booking widget. Both help at the margins. Neither solves the problem.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '10px' }}>Voicemail</h3>
            <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8' }}>
              Voicemail message rates have dropped below 20% for business calls, according to RingCentral. The vast majority of callers — especially under 40 — will simply hang up. Those who do leave a message expect a callback within minutes, not hours. By the time you finish a set and listen to messages, they've already booked elsewhere.
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '10px' }}>Online Booking Widgets</h3>
            <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8' }}>
              Online booking is great — for the clients who find your website and prefer booking digitally. But a significant portion of your callers are older clients, walk-in inquiries, or people who have a specific question before booking ("Do you do nail art? How long for a full set?"). These clients call because they want to talk to someone. A booking widget doesn't answer questions.
            </p>
          </div>

          <div style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f', borderLeft: '4px solid #7c3aed', borderRadius: '8px', padding: '24px', margin: '24px 0' }}>
            <p style={{ fontSize: '15px', color: '#d4d4d4', lineHeight: '1.7', margin: 0 }}>
              <strong style={{ color: '#c084fc' }}>The real fix:</strong> Someone — or something — needs to answer the phone, answer basic questions, and capture the booking intent in real time. That's what an AI receptionist does.
            </p>
          </div>
        </section>

        {/* Section 4 — How AI receptionist works */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.3px' }}>
            How an AI Receptionist Works for a Nail Salon
          </h2>
          <p style={{ fontSize: '16px', color: '#a3a3a3', lineHeight: '1.8', marginBottom: '16px' }}>
            Conduit AI's voice agent answers calls instantly — in under two seconds — whenever you or your staff can't pick up. It sounds natural, responds to questions conversationally, and captures what matters: the caller's name, number, service they want, and preferred time.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {[
              {
                step: '01',
                title: 'Call comes in, you\'re busy',
                desc: 'Your tech is mid-set. Instead of ringing to voicemail, Conduit AI picks up on the second ring.',
              },
              {
                step: '02',
                title: 'AI greets the caller naturally',
                desc: '"Hi, thanks for calling [Salon Name]! We\'re with a client right now — I can help you get booked or answer any questions. What are you looking for today?"',
              },
              {
                step: '03',
                title: 'Handles common questions',
                desc: 'Services offered, pricing ranges, availability, parking, whether you do gel vs. acrylic — whatever you configure it to know.',
              },
              {
                step: '04',
                title: 'Captures the booking info',
                desc: 'Name, callback number, service requested, preferred time. You get a summary text or email the moment the call ends.',
              },
              {
                step: '05',
                title: 'You confirm in seconds',
                desc: 'When your set is done, you\'ve got a clean lead waiting — not a missed call with no trace.',
              },
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', gap: '16px', backgroundColor: '#111111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#7c3aed', minWidth: '28