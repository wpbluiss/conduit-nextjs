import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-brand-border py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Logo size={32} />
              <span className="font-[var(--font-heading)] font-bold text-lg tracking-tight">
                Conduit <span className="text-gradient">AI</span>
              </span>
            </Link>
            <p className="text-brand-text-muted text-sm leading-relaxed max-w-sm">
              AI-powered lead recovery for service businesses. Never miss a call, never lose a customer.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-brand-text">Product</h4>
            <ul className="space-y-2">
              {[
                { label: 'How it works', href: '#how' },
                { label: 'Demo', href: '#demo' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Blog', href: '/blog' },
              ].map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-brand-text-muted hover:text-brand-cyan transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-brand-text">Company</h4>
            <ul className="space-y-2">
              {[
                { label: 'Start Free Trial', href: 'https://app.conduitai.io' },
                { label: 'Contact', href: 'mailto:luis@conduitai.io' },
                { label: 'Product Hunt', href: 'https://www.producthunt.com/products/conduit-ai-2' },
              ].map((link) => (
                <li key={link.href}>
                  <a href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="text-sm text-brand-text-muted hover:text-brand-cyan transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-text-dim">&copy; {new Date().getFullYear()} Conduit AI LLC. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-xs text-brand-text-dim hover:text-brand-text-muted transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-xs text-brand-text-dim hover:text-brand-text-muted transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
