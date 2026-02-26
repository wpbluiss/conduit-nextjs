'use client';

import { useRef, useEffect, useState } from 'react';

function FadeInOnScroll({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function Problem() {
  const cards = [
    {
      icon: '📞',
      title: "They won't call back",
      desc: '80% of callers who hit voicemail never leave a message. They call the next business on Google instead.',
    },
    {
      icon: '⏰',
      title: 'Speed wins the deal',
      desc: '78% of customers go with whoever answers first. If you\'re on a job, in a meeting, or closed — you lose.',
    },
    {
      icon: '💸',
      title: 'It adds up fast',
      desc: 'Miss 5 calls a week at $200 average job value? That\'s $52,000 per year walking out the door.',
    },
  ];

  return (
    <section id="problem" className="relative py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInOnScroll>
          <div className="text-center mb-16">
            <span className="section-label">The Problem</span>
            <h2 className="font-[var(--font-heading)] text-4xl md:text-5xl font-black mt-4 mb-4">
              Your phone rings. Nobody picks up.
              <br />
              <span className="text-brand-text-muted">That customer is gone.</span>
            </h2>
          </div>
        </FadeInOnScroll>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <FadeInOnScroll key={i} delay={i * 0.15}>
              <div className="glass-card p-8 h-full hover:border-brand-cyan/30 transition-all duration-300 group">
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-brand-cyan transition-colors">
                  {card.title}
                </h3>
                <p className="text-brand-text-muted leading-relaxed">{card.desc}</p>
              </div>
            </FadeInOnScroll>
          ))}
        </div>

        {/* Bottom stat */}
        <FadeInOnScroll delay={0.3}>
          <div className="mt-16 text-center glass-card p-8 max-w-2xl mx-auto">
            <div className="text-5xl md:text-6xl font-black text-gradient mb-2">62%</div>
            <p className="text-brand-text-muted">
              of calls to small businesses go unanswered during business hours.
              Your marketing brought them in — but nobody was there to close.
            </p>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
