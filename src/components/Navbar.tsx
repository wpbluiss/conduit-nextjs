"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#departments", label: "Departments" },
    { href: "#story", label: "Story" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0A0908]/95 backdrop-blur-md border-b border-[#1F1C19]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group" aria-label="Conduit AI">
            <Logo size={44} />
            <span className="text-[15px] tracking-tight text-[#F5F1EA]">
              Conduit <span className="text-[#8C8884]">AI</span>
            </span>
          </a>

          <div className="hidden md:flex items-center gap-10">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[14px] text-[#8C8884] hover:text-[#F5F1EA] transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a href="#cta" className="btn-primary text-[14px]">
              Request Access
            </a>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col gap-[5px] p-2 -mr-2"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <span
              className={`block w-5 h-px bg-[#F5F1EA] transition-transform ${
                open ? "rotate-45 translate-y-[6px]" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[#F5F1EA] transition-opacity ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[#F5F1EA] transition-transform ${
                open ? "-rotate-45 -translate-y-[6px]" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      <div
        className={`md:hidden fixed inset-0 z-40 bg-[#0A0908] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="pt-24 px-6 flex flex-col gap-6">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[28px] serif text-[#F5F1EA]"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#cta"
            onClick={() => setOpen(false)}
            className="btn-primary mt-4 justify-center"
          >
            Request Access →
          </a>
        </div>
      </div>
    </>
  );
}
