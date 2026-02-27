"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── PARTICLE CANVAS ───
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    particlesRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.35 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, zIndex: 1 }}
    />
  );
}

// ─── ANIMATED NUMBER ───
function AnimNum({ target, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const dur = 1200;
          const t0 = performance.now();
          const step = (now) => {
            const p = Math.min((now - t0) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(ease * target));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── SECTION WRAPPER WITH FADE IN ───
function Section({ children, className = "", id = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section
      ref={ref}
      id={id}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
      }}
    >
      {children}
    </section>
  );
}

// ─── DATA ───
const INDUSTRIES = [
  { icon: "🔧", name: "HVAC" },
  { icon: "🔩", name: "Plumbing" },
  { icon: "⚡", name: "Electrical" },
  { icon: "🏠", name: "Roofing" },
  { icon: "💇", name: "Salons" },
  { icon: "💈", name: "Barbershops" },
  { icon: "🧖", name: "Spa & Wellness" },
  { icon: "✨", name: "Med Spa" },
  { icon: "🦷", name: "Dental" },
  { icon: "🏥", name: "Medical" },
  { icon: "🐛", name: "Pest Control" },
  { icon: "🔥", name: "Fire Alarm" },
  { icon: "🌿", name: "Landscaping" },
  { icon: "🎨", name: "Painting" },
  { icon: "🧱", name: "Stucco / Masonry" },
  { icon: "🎉", name: "Events" },
  { icon: "🏋️", name: "Fitness / Gyms" },
  { icon: "🏡", name: "Real Estate" },
  { icon: "🏢", name: "Property Mgmt" },
  { icon: "⚖️", name: "Legal" },
  { icon: "🍽️", name: "Restaurants" },
  { icon: "🔧", name: "Auto Repair" },
  { icon: "🧹", name: "Cleaning" },
  { icon: "🛡️", name: "Insurance" },
  { icon: "📊", name: "Accounting" },
  { icon: "🐾", name: "Veterinary" },
  { icon: "🚗", name: "Towing" },
  { icon: "🔑", name: "Locksmith" },
  { icon: "➕", name: "Other" },
];

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Voice Agent",
    desc: "Human-like conversations that capture every detail — name, service, urgency, and job value.",
    live: true,
  },
  {
    icon: "🌍",
    title: "Multi-Language Support",
    desc: "English, Spanish, French, Portuguese, and more. Your agent speaks your customer's language.",
    live: true,
  },
  {
    icon: "🎙️",
    title: "Custom Voice & Personality",
    desc: "Choose from multiple voices, accents, and personalities. Professional, friendly, or casual — you decide.",
    live: true,
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    desc: "See every call, lead, and conversion. Weekly reports with revenue recovered and peak call times.",
    live: true,
  },
  {
    icon: "⏰",
    title: "Business Hours Routing",
    desc: "Different scripts for business hours vs after-hours. Emergency calls get prioritized automatically.",
    live: true,
  },
  {
    icon: "📧",
    title: "Instant Notifications",
    desc: "Get email and push alerts the moment a lead is captured. Never miss a hot prospect.",
    live: true,
  },
  {
    icon: "🔗",
    title: "Zapier + 5,000 Integrations",
    desc: "Connect to ServiceTitan, Housecall Pro, Jobber, Booksy, Google Calendar, HubSpot, Salesforce, and thousands more.",
    soon: false,
  },
  {
    icon: "📝",
    title: "Call Recording & Transcripts",
    desc: "Every call recorded and transcribed. AI extracts key details, urgency level, and estimated job value.",
    soon: false,
  },
  {
    icon: "😊",
    title: "Sentiment Analysis",
    desc: "AI detects caller mood — happy, frustrated, urgent. High-priority calls get flagged automatically.",
    soon: false,
  },
  {
    icon: "⭐",
    title: "Lead Scoring",
    desc: "AI ranks leads by estimated value so you know exactly who to call back first.",
    soon: false,
  },
  {
    icon: "📱",
    title: "Auto Follow-Up",
    desc: "After capturing a lead, automatically send a confirmation text or email. Missed call? Auto-text a booking link.",
    soon: false,
  },
  {
    icon: "📞",
    title: "Live Call Transfer",
    desc: "High-value or complex calls get warm-transferred to your cell with full context. Never lose a big deal.",
    soon: false,
  },
  {
    icon: "👥",
    title: "Team & Multi-Location",
    desc: "Multiple users, role permissions, and location-based routing. Built for businesses that scale.",
    soon: false,
  },
  {
    icon: "⭐",
    title: "Auto Review Requests",
    desc: "After a completed job, auto-text asking for a Google review. Build your reputation on autopilot.",
    soon: false,
  },
  {
    icon: "❓",
    title: "FAQ Training",
    desc: "Upload your FAQ and the AI answers common questions — hours, location, pricing — without capturing a lead.",
    soon: false,
  },
];

const COMPARISON = [
  { feature: "Monthly Price (Starter)", conduit: "$19.99", rosie: "$49", goodcall: "$79", smithai: "$292.50" },
  { feature: "Multi-Language Support", conduit: "✓", rosie: "✗", goodcall: "✗", smithai: "✓" },
  { feature: "Custom Voice Selection", conduit: "✓", rosie: "✗", goodcall: "Limited", smithai: "✗" },
  { feature: "Personal Plan (Individuals)", conduit: "✓", rosie: "✗", goodcall: "✗", smithai: "✗" },
  { feature: "14-Day Free Trial", conduit: "✓", rosie: "✗", goodcall: "✓", smithai: "✗" },
  { feature: "5,000+ Integrations (Zapier)", conduit: "✓", rosie: "Limited", goodcall: "✗", smithai: "✓" },
  { feature: "Sentiment Analysis", conduit: "✓", rosie: "✗", goodcall: "✗", smithai: "✗" },
  { feature: "Lead Scoring", conduit: "✓", rosie: "✗", goodcall: "✗", smithai: "✗" },
  { feature: "Live Call Transfer", conduit: "✓", rosie: "✗", goodcall: "✗", smithai: "✓" },
  { feature: "Mobile App", conduit: "✓", rosie: "✗", goodcall: "✗", smithai: "✗" },
  { feature: "No Setup Fee", conduit: "✓", rosie: "✓", goodcall: "✓", smithai: "✗" },
];

const BILLING_INTERVALS = ["weekly", "monthly", "yearly"];

const PRICING = [
  {
    name: "Personal",
    desc: "For individuals who never want to miss a call again.",
    prices: {
      weekly:  { display: "$5.99", period: "/wk", effective: "$25.96/mo effective", link: "https://buy.stripe.com/00w14gf4Jes47SWfEge3e08" },
      monthly: { display: "$19.99", period: "/mo", effective: "", link: "https://buy.stripe.com/eVq5kw8Gl5Vyc9ceAce3e09" },
      yearly:  { display: "$199", period: "/yr", effective: "$16.58/mo — save $41", link: "https://buy.stripe.com/3cIcMYbSx1Fic9ccs4e3e0a" },
    },
    features: [
      "AI answers missed or all calls",
      "Custom greeting & personality",
      "Multi-language support",
      "Email & push notifications",
      "Basic analytics dashboard",
      "1 phone number included",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Beauty & Wellness",
    desc: "For salons, barbershops, spas, and med spas.",
    prices: {
      weekly:  { display: "$59", period: "/wk", effective: "$255.67/mo effective", link: "https://buy.stripe.com/aFafZa2hX3Nq3CG4ZCe3e0b" },
      monthly: { display: "$199", period: "/mo", effective: "", link: "https://buy.stripe.com/aFa5kwbSx97Kc9c9fSe3e0c" },
      yearly:  { display: "$1,990", period: "/yr", effective: "$165.83/mo — save $398", link: "https://buy.stripe.com/fZueV6e0F83Gddgcs4e3e0d" },
    },
    features: [
      "Everything in Personal",
      "Up to 50 leads/mo included",
      "$3/lead after 50",
      "Custom booking scripts",
      "Appointment capture & reminders",
      "24/7 call capture",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Home Services",
    desc: "For HVAC, plumbing, roofing, electrical, and contractors.",
    prices: {
      weekly:  { display: "$99", period: "/wk", effective: "$429/mo effective", link: "https://buy.stripe.com/cNieV62hX83G7SWdw8e3e0e" },
      monthly: { display: "$349", period: "/mo", effective: "", link: "https://buy.stripe.com/fZu5kw3m10Be6OS8bOe3e0f" },
      yearly:  { display: "$3,490", period: "/yr", effective: "$290.83/mo — save $698", link: "https://buy.stripe.com/28E8wI09P2Jmgps1Nqe3e0g" },
    },
    features: [
      "Everything in Beauty & Wellness",
      "Up to 75 leads/mo included",
      "$5/lead after 75",
      "Emergency call prioritization",
      "Job estimate capture",
      "Revenue recovery tracking",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    desc: "For multi-location businesses and franchises.",
    prices: null,
    features: [
      "Everything in Home Services",
      "Unlimited leads",
      "Multi-location routing",
      "Team roles & permissions",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Us",
    popular: false,
  },
];

const FAQS = [
  {
    q: "How does the AI voice agent work?",
    a: "When a call comes in that you can't answer — or all calls if you prefer — Conduit AI picks up with a natural, human-like voice. It greets the caller, asks the right questions, captures their information, and sends you the lead details instantly via email, push notification, or directly into your CRM.",
  },
  {
    q: "What languages does the AI support?",
    a: "Our AI supports multiple languages including English, Spanish, French, Portuguese, and more. You choose the language during setup, and your customers hear a fluent, natural conversation in their preferred language.",
  },
  {
    q: "Is there a contract or commitment?",
    a: "No contracts, no commitments. All plans include a 14-day free trial. Cancel anytime — no questions asked.",
  },
  {
    q: "Can I customize what the AI says?",
    a: "Absolutely. You control the greeting, personality, voice, language, and the questions it asks. You can set different scripts for business hours vs after-hours, and train it on your FAQs so it answers common questions automatically.",
  },
  {
    q: "What's the Founding 10 offer?",
    a: "We're offering our first 10 customers lifetime access for a one-time payment of $999. That includes every feature, every future update, forever. Once 10 spots are claimed, this offer is gone permanently.",
  },
  {
    q: "How is Conduit AI different from competitors?",
    a: "Most competitors offer template-based scripts at low prices with no customization, or expensive enterprise solutions. Conduit AI gives you full control — custom voices, multiple languages, deep integrations, and a personal plan starting at $19.99/mo. We're the only AI voice platform built for everyone, from individuals to multi-location businesses.",
  },
  {
    q: "How fast is setup?",
    a: "Most customers are live within 15 minutes. Sign up, configure your AI agent, forward your number, and you're capturing leads. No technical skills required.",
  },
];

// ─── ROI CALCULATOR ───
function ROICalculator() {
  const [calls, setCalls] = useState(15);
  const [value, setValue] = useState(200);
  const recovered = Math.round(calls * 4.33 * 0.8 * value * 0.34);
  const monthly = calls <= 20 ? 199 : 349;
  const roi = recovered - monthly;

  return (
    <div style={styles.roiCard}>
      <div style={styles.roiGrid}>
        <div>
          <label style={styles.roiLabel}>Missed calls per week</label>
          <input
            type="range"
            min={1}
            max={50}
            value={calls}
            onChange={(e) => setCalls(Number(e.target.value))}
            style={styles.roiSlider}
          />
          <div style={styles.roiValue}>{calls} calls/week</div>
        </div>
        <div>
          <label style={styles.roiLabel}>Average job value ($)</label>
          <input
            type="range"
            min={50}
            max={2000}
            step={50}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            style={styles.roiSlider}
          />
          <div style={styles.roiValue}>${value}</div>
        </div>
      </div>
      <div style={styles.roiResults}>
        <div style={styles.roiResultItem}>
          <div style={styles.roiResultLabel}>Monthly Revenue Recovered</div>
          <div style={styles.roiResultBig}>
            ${recovered.toLocaleString()}
          </div>
        </div>
        <div style={styles.roiResultItem}>
          <div style={styles.roiResultLabel}>Conduit AI Cost</div>
          <div style={{ ...styles.roiResultBig, color: "rgba(255,255,255,0.5)", fontSize: 28 }}>
            ${monthly}/mo
          </div>
        </div>
        <div style={styles.roiResultItem}>
          <div style={styles.roiResultLabel}>Your Net ROI</div>
          <div style={{ ...styles.roiResultBig, color: roi > 0 ? "#00ff88" : "#ff4444" }}>
            ${roi > 0 ? "+" : ""}
            {roi.toLocaleString()}/mo
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ ITEM ───
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        ...styles.faqItem,
        borderColor: open ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.06)",
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={styles.faqQ}>
        <span>{q}</span>
        <span style={{ color: "#00d4ff", fontSize: 20, transition: "transform 0.3s", transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </div>
      <div
        style={{
          maxHeight: open ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 0.4s ease",
        }}
      >
        <p style={styles.faqA}>{a}</p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [billingInterval, setBillingInterval] = useState("monthly");

  return (
    <div style={styles.page}>
      {/* ─── NAV ─── */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <a href="#" style={styles.logo}>
            <span style={styles.logoIcon}>⚡</span>
            <span style={styles.logoText}>Conduit</span>
            <span style={styles.logoAi}>AI</span>
          </a>
          <div style={styles.navLinks}>
            <a href="#how-it-works" style={styles.navLink}>How it Works</a>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#pricing" style={styles.navLink}>Pricing</a>
            <a href="#demo" style={styles.navLink}>Demo</a>
            <a href="https://app.conduitai.io" style={styles.navCta}>Start Free Trial</a>
          </div>
          <button
            style={styles.mobileToggle}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? "✕" : "☰"}
          </button>
        </div>
        {mobileMenu && (
          <div style={styles.mobileMenuPanel}>
            <a href="#how-it-works" style={styles.mobileLink} onClick={() => setMobileMenu(false)}>How it Works</a>
            <a href="#features" style={styles.mobileLink} onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#pricing" style={styles.mobileLink} onClick={() => setMobileMenu(false)}>Pricing</a>
            <a href="#demo" style={styles.mobileLink} onClick={() => setMobileMenu(false)}>Demo</a>
            <a href="https://app.conduitai.io" style={styles.mobileCta}>Start Free Trial →</a>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section style={styles.hero} id="hero">
        <div style={styles.gridBg} />
        <div style={styles.glowOrb1} />
        <div style={styles.glowOrb2} />
        <ParticleCanvas />
        <div style={styles.heroContent}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            Now accepting Founding 10 members — 10 spots left
          </div>
          <h1 style={styles.heroH1}>
            The Only AI Voice Platform{" "}
            <span style={styles.heroGradient}>Built for Everyone.</span>
          </h1>
          <p style={styles.heroSub}>
            Your AI receptionist answers calls, captures leads, books
            appointments, and sends you every detail — in any language, for
            any industry, 24/7.
          </p>
          <div style={styles.ctaGroup}>
            <a href="https://app.conduitai.io" style={styles.btnPrimary}>
              Start 14-Day Free Trial →
            </a>
            <a href="tel:5617303316" style={styles.btnSecondary}>
              🎧 Hear the AI Live
            </a>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statNum}>
                <AnimNum target={80} suffix="%" />
              </div>
              <div style={styles.statLabel}>of callers won't leave voicemail</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>
                $<AnimNum target={120} />K
              </div>
              <div style={styles.statLabel}>avg lost to missed calls/yr</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>
                <AnimNum target={2} />.8s
              </div>
              <div style={styles.statLabel}>AI response time</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOUNDING 10 BANNER ─── */}
      <Section className="founding" id="founding">
        <div style={styles.foundingBanner}>
          <div style={styles.foundingInner}>
            <div>
              <h2 style={styles.foundingH2}>⚡ Founding 10 — Lifetime Access</h2>
              <p style={styles.foundingP}>
                One-time payment of <strong style={{ color: "#00d4ff" }}>$999</strong>. Every feature, every update, forever. No monthly fees. Once 10 spots are claimed, this offer disappears permanently.
              </p>
            </div>
            <div style={styles.foundingRight}>
              <div style={styles.foundingSpots}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={styles.foundingDot} />
                ))}
              </div>
              <div style={styles.foundingSpotsLabel}>10 of 10 spots available</div>
              <a href="https://app.conduitai.io" style={styles.btnPrimary}>
                Claim Your Spot →
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── HOW IT WORKS ─── */}
      <Section id="how-it-works">
        <div style={styles.section}>
          <div style={styles.sectionLabel}>HOW IT WORKS</div>
          <h2 style={styles.sectionH2}>Live in 15 minutes. No tech skills needed.</h2>
          <div style={styles.stepsGrid}>
            {[
              { num: "01", title: "Sign Up & Configure", desc: "Create your account, choose your AI voice, language, and personality. Set your business hours and greeting." },
              { num: "02", title: "Forward Your Number", desc: "Forward missed calls (or all calls) to your Conduit AI number. Takes 2 minutes in your phone settings." },
              { num: "03", title: "AI Captures Every Lead", desc: "Your AI agent answers, has a real conversation, captures caller details, and qualifies the lead automatically." },
              { num: "04", title: "Get Instant Notifications", desc: "Receive the lead via email, push notification, or directly in your CRM. Call them back while they're still hot." },
            ].map((step, i) => (
              <div key={i} style={styles.stepCard}>
                <div style={styles.stepNum}>{step.num}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── INDUSTRIES ─── */}
      <Section id="industries">
        <div style={styles.section}>
          <div style={styles.sectionLabel}>INDUSTRIES</div>
          <h2 style={styles.sectionH2}>Built for every business that depends on the phone.</h2>
          <div style={styles.industriesGrid}>
            {INDUSTRIES.map((ind, i) => (
              <div key={i} style={styles.industryChip}>
                <span style={{ fontSize: 20 }}>{ind.icon}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{ind.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── FEATURES ─── */}
      <Section id="features">
        <div style={styles.section}>
          <div style={styles.sectionLabel}>FEATURES</div>
          <h2 style={styles.sectionH2}>Everything you need. Nothing you don't.</h2>
          <div style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} style={styles.featureCard}>
                {f.soon && <div style={styles.soonBadge}>Coming Soon</div>}
                <div style={styles.featureIcon}>{f.icon}</div>
                <h3 style={styles.featureTitle}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── DEMO ─── */}
      <Section id="demo">
        <div style={styles.section}>
          <div style={styles.sectionLabel}>LIVE DEMO</div>
          <h2 style={styles.sectionH2}>Hear the AI in action.</h2>
          <p style={{ ...styles.heroSub, maxWidth: 500, margin: "0 auto 40px" }}>
            Call our demo line right now and experience exactly what your customers will hear.
          </p>
          <div style={styles.demoCard}>
            <div style={styles.demoPhone}>
              <div style={styles.demoPhoneRing} />
              <span style={{ fontSize: 48 }}>📞</span>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Tap to call our AI agent
              </div>
              <a href="tel:5617303316" style={styles.demoNumber}>
                (561) 730-3316
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── COMPARISON TABLE ─── */}
      <Section id="compare">
        <div style={styles.section}>
          <div style={styles.sectionLabel}>COMPARISON</div>
          <h2 style={styles.sectionH2}>See how we stack up.</h2>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Feature</th>
                  <th style={{ ...styles.th, ...styles.thHighlight }}>Conduit AI</th>
                  <th style={styles.th}>Rosie</th>
                  <th style={styles.th}>Goodcall</th>
                  <th style={styles.th}>Smith.ai</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{row.feature}</td>
                    <td style={{ ...styles.td, ...styles.tdHighlight }}>{row.conduit}</td>
                    <td style={styles.td}>{row.rosie}</td>
                    <td style={styles.td}>{row.goodcall}</td>
                    <td style={styles.td}>{row.smithai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ─── ROI CALCULATOR ─── */}
      <Section id="roi">
        <div style={styles.section}>
          <div style={styles.sectionLabel}>ROI CALCULATOR</div>
          <h2 style={styles.sectionH2}>See how much revenue you're leaving on the table.</h2>
          <ROICalculator />
        </div>
      </Section>

      {/* ─── PRICING ─── */}
      <Section id="pricing">
        <div style={styles.section}>
          <div style={styles.sectionLabel}>PRICING</div>
          <h2 style={styles.sectionH2}>Simple, transparent pricing. No setup fees.</h2>
          <p style={{ ...styles.heroSub, maxWidth: 500, margin: "0 auto 0" }}>
            Every plan includes a 14-day free trial. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div style={styles.toggleWrap}>
            {BILLING_INTERVALS.map((interval) => (
              <button
                key={interval}
                onClick={() => setBillingInterval(interval)}
                style={{
                  ...styles.toggleBtn,
                  ...(billingInterval === interval ? styles.toggleBtnActive : {}),
                }}
              >
                {interval.charAt(0).toUpperCase() + interval.slice(1)}
                {interval === "yearly" && (
                  <span style={styles.saveBadge}>Save 17%</span>
                )}
              </button>
            ))}
          </div>

          <div style={styles.pricingGrid}>
            {PRICING.map((plan, i) => {
              const priceData = plan.prices ? plan.prices[billingInterval] : null;
              return (
                <div
                  key={i}
                  style={{
                    ...styles.pricingCard,
                    ...(plan.popular ? styles.pricingPopular : {}),
                  }}
                >
                  {plan.popular && <div style={styles.popularBadge}>Most Popular</div>}
                  <h3 style={styles.pricingName}>{plan.name}</h3>
                  <p style={styles.pricingDesc}>{plan.desc}</p>
                  <div style={styles.pricingPrice}>
                    {priceData ? (
                      <>
                        <span style={styles.pricingAmount}>{priceData.display}</span>
                        <span style={styles.pricingPeriod}>{priceData.period}</span>
                      </>
                    ) : (
                      <span style={styles.pricingAmount}>Custom</span>
                    )}
                  </div>
                  {priceData && priceData.effective && (
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                      {priceData.effective}
                    </div>
                  )}
                  {priceData && (
                    <div style={{ fontSize: 13, color: "#00d4ff", marginBottom: 24 }}>
                      First 14 days free — $0 today
                    </div>
                  )}
                  {!priceData && (
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>
                      Let’s build your plan
                    </div>
                  )}
                  <ul style={styles.pricingFeatures}>
                    {plan.features.map((f, j) => (
                      <li key={j} style={styles.pricingFeature}>
                        <span style={{ color: "#00d4ff" }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  
                  <a
                    href={priceData ? priceData.link : "mailto:luis@conduitai.io"}
                    style={plan.popular ? styles.btnPrimary : styles.btnSecondary}
                  >
                    {plan.cta}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ─── FAQ ─── */}
      <Section id="faq">
        <div style={styles.section}>
          <div style={styles.sectionLabel}>FAQ</div>
          <h2 style={styles.sectionH2}>Frequently asked questions</h2>
          <div style={styles.faqList}>
            {FAQS.map((f, i) => (
              <FAQItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </Section>

      {/* ─── FINAL CTA ─── */}
      <Section>
        <div style={{ ...styles.section, textAlign: "center", paddingBottom: 120 }}>
          <h2 style={{ ...styles.sectionH2, fontSize: "clamp(28px, 4vw, 48px)" }}>
            Stop losing customers.{" "}
            <span style={styles.heroGradient}>Start recovering revenue.</span>
          </h2>
          <p style={{ ...styles.heroSub, maxWidth: 500, margin: "0 auto 40px" }}>
            Join hundreds of businesses already using Conduit AI to capture every lead, 24/7.
          </p>
          <div style={styles.ctaGroup}>
            <a href="https://app.conduitai.io" style={styles.btnPrimary}>
              Start 14-Day Free Trial →
            </a>
            <a href="tel:5617303316" style={styles.btnSecondary}>
              🎧 Hear the AI Live
            </a>
          </div>
        </div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerCol}>
            <div style={styles.logo}>
              <span style={styles.logoIcon}>⚡</span>
              <span style={styles.logoText}>Conduit</span>
              <span style={styles.logoAi}>AI</span>
            </div>
            <p style={styles.footerDesc}>
              The only AI voice platform built for everyone.
            </p>
            <p style={styles.footerContact}>luis@conduitai.io</p>
            <p style={styles.footerContact}>(561) 730-3316</p>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerH4}>Product</h4>
            <a href="#features" style={styles.footerLink}>Features</a>
            <a href="#pricing" style={styles.footerLink}>Pricing</a>
            <a href="#compare" style={styles.footerLink}>Compare</a>
            <a href="#demo" style={styles.footerLink}>Demo</a>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerH4}>Company</h4>
            <a href="/blog" style={styles.footerLink}>Blog</a>
            <a href="mailto:luis@conduitai.io" style={styles.footerLink}>Contact</a>
            <a href="#founding" style={styles.footerLink}>Founding 10</a>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerH4}>Legal</h4>
            <a href="/privacy" style={styles.footerLink}>Privacy Policy</a>
            <a href="/terms" style={styles.footerLink}>Terms of Service</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          © 2026 Conduit AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// ─── STYLES ───
const styles = {
  page: {
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
    overflowX: "hidden",
  },

  // Nav
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: "rgba(10,10,10,0.8)",
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
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    color: "#fff",
  },
  logoIcon: { fontSize: 20 },
  logoText: { fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20 },
  logoAi: {
    fontFamily: "'Sora', sans-serif",
    fontWeight: 700,
    fontSize: 20,
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 32,
  },
  navLink: {
    color: "rgba(255,255,255,0.6)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "color 0.2s",
  },
  navCta: {
    padding: "10px 24px",
    borderRadius: 10,
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    color: "#fff",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  },
  mobileToggle: {
    display: "none",
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 24,
    cursor: "pointer",
  },
  mobileMenuPanel: {
    display: "flex",
    flexDirection: "column",
    padding: "16px 24px 24px",
    gap: 16,
  },
  mobileLink: {
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 500,
  },
  mobileCta: {
    padding: "14px 24px",
    borderRadius: 10,
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    color: "#fff",
    textDecoration: "none",
    fontSize: 16,
    fontWeight: 600,
    textAlign: "center",
  },

  // Hero
  hero: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingTop: 80,
  },
  gridBg: {
    position: "absolute",
    inset: 0,
    backgroundImage: "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
    backgroundSize: "60px 60px",
    opacity: 0.6,
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
  heroContent: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    padding: "0 20px",
    maxWidth: 900,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 20px",
    borderRadius: 100,
    background: "rgba(0,212,255,0.08)",
    border: "1px solid rgba(0,212,255,0.2)",
    fontSize: 13,
    color: "#00d4ff",
    letterSpacing: 0.5,
    marginBottom: 32,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#00d4ff",
    boxShadow: "0 0 8px rgba(0,212,255,0.6)",
  },
  heroH1: {
    fontFamily: "'Sora', sans-serif",
    fontSize: "clamp(32px, 5.5vw, 68px)",
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: 24,
  },
  heroGradient: {
    background: "linear-gradient(135deg, #00d4ff, #0066ff, #00d4ff)",
    backgroundSize: "200% 200%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: "clamp(15px, 1.8vw, 19px)",
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.7,
    maxWidth: 580,
    margin: "0 auto 40px",
  },
  ctaGroup: {
    display: "flex",
    gap: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "16px 36px",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    color: "#fff",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
  },
  btnSecondary: {
    padding: "16px 36px",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: "pointer",
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: 48,
    marginTop: 64,
    flexWrap: "wrap",
  },
  stat: { textAlign: "center" },
  statNum: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 32,
    fontWeight: 700,
    background: "linear-gradient(135deg, #00d4ff, #fff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    marginTop: 4,
  },

  // Founding
  foundingBanner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px",
  },
  foundingInner: {
    padding: "48px",
    borderRadius: 20,
    border: "1px solid rgba(0,212,255,0.15)",
    background: "linear-gradient(135deg, rgba(0,212,255,0.04), rgba(0,60,255,0.02))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 40,
    flexWrap: "wrap",
  },
  foundingH2: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12,
  },
  foundingP: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    lineHeight: 1.6,
    maxWidth: 500,
  },
  foundingRight: { textAlign: "center" },
  foundingSpots: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    justifyContent: "center",
  },
  foundingDot: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid rgba(0,212,255,0.3)",
    background: "transparent",
  },
  foundingSpotsLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 16,
  },

  // Section
  section: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "100px 24px",
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 3,
    color: "#00d4ff",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: 600,
  },
  sectionH2: {
    fontFamily: "'Sora', sans-serif",
    fontSize: "clamp(24px, 3.5vw, 42px)",
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 1.2,
  },

  // Steps
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 24,
  },
  stepCard: {
    padding: 32,
    borderRadius: 16,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  stepNum: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 40,
    fontWeight: 800,
    background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.05))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: 16,
  },
  stepTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.6,
  },

  // Industries
  industriesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  industryChip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    borderRadius: 100,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  // Features
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20,
  },
  featureCard: {
    position: "relative",
    padding: 28,
    borderRadius: 16,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  soonBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: "4px 10px",
    borderRadius: 100,
    background: "rgba(255,165,0,0.1)",
    border: "1px solid rgba(255,165,0,0.3)",
    fontSize: 10,
    fontWeight: 600,
    color: "#ffa500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  featureIcon: { fontSize: 28, marginBottom: 12 },
  featureTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.6,
  },

  // Demo
  demoCard: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    justifyContent: "center",
    padding: 40,
    borderRadius: 20,
    background: "rgba(0,212,255,0.04)",
    border: "1px solid rgba(0,212,255,0.15)",
    maxWidth: 500,
    margin: "0 auto",
  },
  demoPhone: { position: "relative" },
  demoPhoneRing: {
    position: "absolute",
    inset: -12,
    borderRadius: "50%",
    border: "2px solid rgba(0,212,255,0.2)",
    animation: "pulse 2s infinite",
  },
  demoNumber: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: "#00d4ff",
    textDecoration: "none",
  },

  // Comparison table
  tableWrapper: {
    overflowX: "auto",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    padding: "16px 20px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    whiteSpace: "nowrap",
  },
  thHighlight: {
    color: "#00d4ff",
    background: "rgba(0,212,255,0.06)",
  },
  td: {
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.6)",
    whiteSpace: "nowrap",
  },
  tdHighlight: {
    color: "#00d4ff",
    fontWeight: 600,
    background: "rgba(0,212,255,0.03)",
  },

  // ROI
  roiCard: {
    maxWidth: 700,
    margin: "0 auto",
    padding: 40,
    borderRadius: 20,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  roiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 32,
    marginBottom: 40,
  },
  roiLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 12,
    display: "block",
  },
  roiSlider: {
    width: "100%",
    accentColor: "#00d4ff",
    marginBottom: 8,
  },
  roiValue: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "'Sora', sans-serif",
  },
  roiResults: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 20,
    paddingTop: 32,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  roiResultItem: { textAlign: "center" },
  roiResultLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  roiResultBig: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 32,
    fontWeight: 700,
    color: "#00d4ff",
  },

  // Pricing
  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    alignItems: "start",
  },
  pricingCard: {
    position: "relative",
    padding: 32,
    borderRadius: 20,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
  },
  pricingPopular: {
    border: "1px solid rgba(0,212,255,0.3)",
    background: "rgba(0,212,255,0.04)",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "6px 16px",
    borderRadius: 100,
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  },
  pricingName: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  pricingDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 24,
    lineHeight: 1.5,
  },
  pricingPrice: {
    marginBottom: 8,
    display: "flex",
    alignItems: "baseline",
    gap: 2,
  },
  pricingDollar: {
    fontSize: 20,
    fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
  },
  pricingAmount: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 44,
    fontWeight: 800,
  },
  pricingPeriod: {
    fontSize: 15,
    color: "rgba(255,255,255,0.4)",
  },
  pricingFeatures: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 24px",
    flex: 1,
  },
  pricingFeature: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    padding: "6px 0",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  toggleWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    margin: "32px auto 48px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 100,
    padding: 4,
    width: "fit-content",
  },
  toggleBtn: {
    padding: "10px 24px",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.45)",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: 100,
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  toggleBtnActive: {
    background: "linear-gradient(135deg, #00d4ff, #0066ff)",
    color: "#fff",
    fontWeight: 600,
    boxShadow: "0 2px 12px rgba(0,212,255,0.3)",
  },
  saveBadge: {
    background: "rgba(0,255,136,0.15)",
    border: "1px solid rgba(0,255,136,0.3)",
    color: "#00ff88",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 100,
  },

  // FAQ
  faqList: {
    maxWidth: 700,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  faqItem: {
    padding: "20px 24px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    cursor: "pointer",
    transition: "border-color 0.3s",
  },
  faqQ: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    fontWeight: 600,
    fontSize: 15,
  },
  faqA: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.7,
    paddingTop: 12,
  },

  // Footer
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(0,0,0,0.3)",
  },
  footerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "64px 24px 40px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 40,
  },
  footerCol: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  footerDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 1.6,
    marginTop: 8,
  },
  footerContact: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
  },
  footerH4: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 1,
    marginBottom: 8,
    color: "rgba(255,255,255,0.7)",
  },
  footerLink: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    textDecoration: "none",
  },
  footerBottom: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px 24px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
  },
};

// ─── CSS INJECTION FOR RESPONSIVE + ANIMATIONS ───
if (typeof document !== "undefined") {
  const id = "conduit-global-css";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Sora:wght@100..800&display=swap');
      html { scroll-behavior: smooth; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { overflow-x: hidden; }
      a:hover { opacity: 0.9; }
      @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,0.3)} 50%{box-shadow:0 0 0 12px rgba(0,212,255,0)} }
      @media (max-width: 768px) {
        nav > div > div:last-of-type:not([style*="flex-direction"]) { display: none !important; }
        nav button { display: block !important; }
      }
      @media (min-width: 769px) {
        nav > div > div[style*="flex-direction: column"] { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }
}
