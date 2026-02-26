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

export default function Pricing() {
  const plans = [
    {
      name: 'Beauty & Wellness',
      subtitle: 'Salons, barbershops, spas, med spas',
      price: 199,
      features: [
        'Up to 50 leads/mo included',
        '$3/lead after 50',
        'Custom booking scripts',
        '24/7 call capture',
        'Email lead notifications',
        'Analytics dashboard',
      ],
    },
    {
      name: 'Home Services',
      subtitle: 'HVAC, plumbing, electrical, roofing',
      price: 349,
      popular: true,
      features: [
        'Up to 75 leads/mo included',
        '$5/lead after 75',
        'Emergency call prioritization',
        'Job estimate capture',
        '24/7 call & SMS capture',
        'Priority support',
      ],
    },
  ];

  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      <div className="max-w-5xl mx-auto px-6">
        <FadeInOnScroll>
          <div className="text-center mb-16">
            <span className="section-label">Pricing</span>
            <h2 className="font-[var(--font-heading)] text-4xl md:text-5xl font-black mt-4 mb-4">
              14 days free. No setup fee. <span className="text-gradient">No risk.</span>
            </h2>
            <p className="text-brand-text-muted text-lg">
              One recovered job pays for months of service.
            </p>
          </div>
        </FadeInOnScroll>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <FadeInOnScroll key={i} delay={i * 0.15}>
              <div
                className={`relative glass-card p-8 md:p-10 flex flex-col h-full ${
                  plan.popular ? 'border-brand-cyan/40' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-brand-cyan to-brand-blue text-brand-dark text-xs font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-brand-text-muted">{plan.subtitle}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-gradient">${plan.price}</span>
                    <span className="text-brand-text-muted">/mo</span>
                  </div>
                  <p className="text-sm text-brand-cyan mt-1 font-medium">First 14 days free</p>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-brand-text-muted">
                      <span className="text-brand-cyan mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="https://app.conduitai.io"
                  className={plan.popular ? 'btn-primary text-center justify-center' : 'btn-secondary text-center justify-center'}
                >
                  Start Free Trial
                </a>
              </div>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
