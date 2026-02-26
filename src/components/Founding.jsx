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
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

export default function Founding() {
  const benefits = [
    'Locked-in pricing for life',
    'Priority 1-on-1 onboarding',
    'Direct line to the founder',
    'Shape the product roadmap',
    'Featured as a case study',
    '14-day free trial',
  ];

  return (
    <section id="founding" className="relative py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <FadeInOnScroll>
          <div className="relative glass-card p-10 md:p-14 overflow-hidden">
            {/* Corner glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-cyan/10 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <span className="section-label">Exclusive Offer</span>
              <h2 className="font-[var(--font-heading)] text-4xl md:text-5xl font-black mt-4 mb-4">
                Join the <span className="text-gradient">Founding 10</span>
              </h2>
              <p className="text-brand-text-muted text-lg mb-8 max-w-lg">
                Be one of the first 10 businesses on Conduit AI and lock in benefits forever.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-10">
                {benefits.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-brand-text">
                    <span className="text-brand-cyan font-bold">✓</span>
                    {item}
                  </div>
                ))}
              </div>

              {/* Spots remaining */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <a href="https://app.conduitai.io" className="btn-primary text-lg">
                  Claim Your Spot →
                </a>
                <div className="flex items-center gap-3">
                  {/* Visual dots */}
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < 3
                            ? 'bg-brand-cyan'
                            : 'bg-brand-border'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-brand-text-muted font-medium">
                    7 of 10 spots remaining
                  </span>
                </div>
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
