'use client';

import { useRef, useEffect, useState } from 'react';
import { track } from '@vercel/analytics';

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

export default function Demo() {
  return (
    <section id="demo" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-cyan/3 rounded-full blur-[150px]" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <FadeInOnScroll>
          <div className="text-center mb-12">
            <span className="section-label">Try It Yourself</span>
            <h2 className="font-[var(--font-heading)] text-4xl md:text-5xl font-black mt-4 mb-4">
              Hear the agent <span className="text-gradient">for yourself</span>
            </h2>
            <p className="text-brand-text-muted text-lg">
              Call now. It answers immediately. No signup needed.
            </p>
          </div>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.2}>
          <div className="glass-card p-8 md:p-12 text-center max-w-2xl mx-auto">
            {/* Phone number */}
            <a
              href="tel:+15617303316"
              className="inline-block text-4xl md:text-5xl font-black text-gradient mb-6 hover:scale-105 transition-transform"
              onClick={() => track('cta_click', { button: 'call_demo', page: 'demo' })}
            >
              (561) 730-3316
            </a>

            <p className="text-brand-text-muted mb-8 max-w-md mx-auto">
              This is a live Conduit AI agent configured for a sample business.
              Call it right now — hear how natural the conversation is.
            </p>

            {/* Feature checks */}
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
              {[
                'Real AI conversation',
                'Captures caller info',
                'Answers 24/7',
                'Sounds natural',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-brand-cyan">✓</span>
                  <span className="text-brand-text-muted">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
