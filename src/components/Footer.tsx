import { ConduitLogoFull } from "./ConduitLogo";

export default function Footer() {
  return (
    <footer className="relative border-t border-border px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <ConduitLogoFull iconSize={28} />
            <p className="text-text3 text-sm mt-3 leading-relaxed max-w-[240px]">
              Autonomous AI employees for every department. Your company runs itself.
            </p>
          </div>

          {/* Industries */}
          <div>
            <h4 className="text-text2 text-xs font-semibold tracking-widest uppercase mb-4">Industries</h4>
            <div className="flex flex-col gap-2.5">
              <a href="/hvac-plumbing.html" className="text-text3 text-sm hover:text-orange transition-colors">HVAC &amp; Plumbing</a>
              <a href="/salon-barbershop.html" className="text-text3 text-sm hover:text-orange transition-colors">Salon &amp; Barbershop</a>
              <a href="/roofing-contractors.html" className="text-text3 text-sm hover:text-orange transition-colors">Roofing Contractors</a>
              <a href="/dental-medical.html" className="text-text3 text-sm hover:text-orange transition-colors">Dental &amp; Medical</a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-text2 text-xs font-semibold tracking-widest uppercase mb-4">Resources</h4>
            <div className="flex flex-col gap-2.5">
              <a href="/blog.html" className="text-text3 text-sm hover:text-orange transition-colors">Blog</a>
              <a href="/affiliates.html" className="text-text3 text-sm hover:text-orange transition-colors">Affiliates</a>
              <a href="/privacy-policy.html" className="text-text3 text-sm hover:text-orange transition-colors">Privacy Policy</a>
              <a href="/terms.html" className="text-text3 text-sm hover:text-orange transition-colors">Terms of Service</a>
            </div>
          </div>

          {/* Blog */}
          <div>
            <h4 className="text-text2 text-xs font-semibold tracking-widest uppercase mb-4">Latest Posts</h4>
            <div className="flex flex-col gap-2.5">
              <a href="/blog-dental-missed-calls.html" className="text-text3 text-sm hover:text-orange transition-colors">Dental Missed Calls</a>
              <a href="/blog-plumber-emergency-calls.html" className="text-text3 text-sm hover:text-orange transition-colors">Plumber Emergency Calls</a>
              <a href="/blog-medspa-missed-calls.html" className="text-text3 text-sm hover:text-orange transition-colors">Med Spa Missed Calls</a>
              <a href="/blog-roofing-storm-leads.html" className="text-text3 text-sm hover:text-orange transition-colors">Roofing Storm Leads</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <div className="flex items-center gap-4 font-[family-name:var(--font-mono)] text-xs text-text3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange status-dot" />
              <span>ALL SYSTEMS OPERATIONAL</span>
            </div>
            <span className="text-border2">|</span>
            <span>v4.2.1</span>
          </div>

          <div className="font-[family-name:var(--font-mono)] text-xs text-text3">
            &copy; {new Date().getFullYear()} Conduit AI LLC. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
