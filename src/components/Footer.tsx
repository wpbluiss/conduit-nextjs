import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#1F1C19] bg-[#0A0908] py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 md:gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <Logo size={32} />
            <span className="text-[15px] tracking-tight">
              Conduit
            </span>
          </div>
          <p className="text-[13px] text-[#8C8884] max-w-xs leading-relaxed">
            Intelligence at work. We build Praxis.
          </p>
        </div>

        <div>
          <p className="eyebrow mb-4">Praxis</p>
          <ul className="space-y-2.5">
            {[
              { href: "/products/praxis-console", label: "Praxis Console" },
              { href: "/products/praxis-mobile", label: "Praxis Mobile" },
              { href: "/products/praxis-hq", label: "Praxis HQ" },
              { href: "/#pricing", label: "Pricing" },
            ].map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-[14px] text-[#F5F1EA] hover:text-[#FF8A3D] transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">Conduit</p>
          <ul className="space-y-2.5">
            {[
              { href: "/about", label: "About" },
              { href: "/#vision", label: "Vision" },
              { href: "/blog.html", label: "Blog" },
              { href: "mailto:luis@conduitai.io", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-[14px] text-[#F5F1EA] hover:text-[#FF8A3D] transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">Legal</p>
          <ul className="space-y-2.5">
            <li>
              <a
                href="/privacy-policy.html"
                className="text-[14px] text-[#F5F1EA] hover:text-[#FF8A3D] transition-colors"
              >
                Privacy
              </a>
            </li>
            <li>
              <a
                href="/terms.html"
                className="text-[14px] text-[#F5F1EA] hover:text-[#FF8A3D] transition-colors"
              >
                Terms
              </a>
            </li>
            <li className="pt-2 text-[13px] text-[#8C8884]">
              © 2026 Conduit. West Palm Beach, FL.
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
