import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo + tagline */}
          <div className="flex items-center gap-3">
            <Logo size={28} variant="full" />
            <span className="text-sm text-[var(--muted)]">
              Never miss a lead again.
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--muted)]">
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:luis@conduitai.io" className="hover:text-white transition-colors">Contact</a>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} Conduit AI LLC · All rights reserved.
        </div>
      </div>
    </footer>
  );
}
