'use client';

import { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';
import Link from 'next/link';
import Logo from './Logo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'How it works', href: '#how' },
    { label: 'Demo', href: '#demo' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Blog', href: '/blog' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-darker/90 backdrop-blur-xl border-b border-brand-border shadow-2xl'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size={32} />
          <span className="font-[var(--font-heading)] font-bold text-lg tracking-tight">
            Conduit <span className="text-gradient">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-brand-text-muted hover:text-brand-text transition-colors">{link.label}</a>
          ))}
          <a href="https://app.conduitai.io" className="btn-primary text-sm !py-2.5 !px-5" onClick={() => track('cta_click', { button: 'start_free_trial', page: 'navbar' })}>
            Start Free Trial <span className="ml-1">→</span>
          </a>
        </div>

        <button className="md:hidden p-2 text-brand-text-muted" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-brand-darker/95 backdrop-blur-xl border-t border-brand-border">
          <div className="px-6 py-4 flex flex-col gap-3">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-brand-text-muted hover:text-brand-text py-2 transition-colors">{link.label}</a>
            ))}
            <a href="https://app.conduitai.io" className="btn-primary text-center mt-2" onClick={() => { track('cta_click', { button: 'start_free_trial', page: 'navbar' }); setMobileOpen(false); }}>Start Free Trial →</a>
          </div>
        </div>
      )}
    </nav>
  );
}
