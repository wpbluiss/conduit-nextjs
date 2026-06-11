import type { Metadata, Viewport } from "next";
import "../finance/finance.css";

export const metadata: Metadata = {
  title: "Cadence — Your AI-powered private bank",
  description: "Track income, kill debt, and hit your savings goal with an AI advisor that knows your money. By Conduit AI.",
  manifest: "/cadence.webmanifest",
  icons: { icon: "/cadence-icon.svg", apple: "/cadence-icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0a0908" };

export default function CadenceMarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fin-scope relative min-h-screen overflow-x-hidden">
      <div className="fin-aurora" aria-hidden />
      <div className="fin-grid-texture fixed inset-0 z-0 opacity-30" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
