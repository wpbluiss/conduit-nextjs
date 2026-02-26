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

export default function Industries() {
  const industries = [
    { icon: '💈', title: 'Salons & Barbershops', desc: 'Capture bookings while you\'re with clients' },
    { icon: '🔧', title: 'HVAC & Plumbing', desc: 'Never miss an emergency call on the job' },
    { icon: '🦷', title: 'Dental & Medical', desc: 'Recover new patient leads the front desk misses' },
    { icon: '🏗️', title: 'Roofing & Contractors', desc: 'Capture leads while you\'re on the roof' },
  ];

  return (
    <section id="industries" className="relative py-24 md:py-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        <FadeInOnScroll>
          <div className="text-center mb-16">
            <span className="section-label">Who We Serve</span>
            <h2 className="font-[var(--font-heading)] text-4xl md:text-5xl font-black mt-4">
              Built for <span className="text-gradient">service businesses</span>
            </h2>
          </div>
        </FadeInOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((item, i) => (
            <FadeInOnScroll key={i} delay={i * 0.1}>
              <div className="glass-card p-8 text-center hover:border-brand-cyan/30 transition-all duration-300 group cursor-default">
                <div className="text-5xl mb-5 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-brand-cyan transition-colors">{item.title}</h3>
                <p className="text-sm text-brand-text-muted">{item.desc}</p>
              </div>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
