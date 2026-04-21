import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#1F1C19] bg-[#0A0908] py-16">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <Logo size={24} />
            <span className="text-[15px] tracking-tight">
              Conduit <span className="text-[#8C8884]">AI</span>
            </span>
          </div>
          <p className="text-[13px] text-[#8C8884] max-w-xs leading-relaxed">
            Virtual business operating system.
          </p>
        </div>

        <div>
          <p className="eyebrow mb-4">Explore</p>
          <ul className="space-y-2.5">
            {[
              { href: "#departments", label: "Departments" },
              { href: "#story", label: "Story" },
              { href: "#pricing", label: "Pricing" },
              { href: "/blog.html", label: "Blog" },
              { href: "mailto:luis@conduitai.io", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-[14px] text-[#F5F1EA] hover:text-[#FFB347] transition-colors"
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
              <a href="/privacy-policy.html" className="text-[14px] text-[#F5F1EA] hover:text-[#FFB347] transition-colors">
                Privacy
              </a>
            </li>
            <li>
              <a href="/terms.html" className="text-[14px] text-[#F5F1EA] hover:text-[#FFB347] transition-colors">
                Terms
              </a>
            </li>
            <li className="pt-2 text-[13px] text-[#8C8884]">
              © 2026 Conduit AI. West Palm Beach, FL.
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
