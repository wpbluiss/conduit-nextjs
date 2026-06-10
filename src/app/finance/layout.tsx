import type { Metadata, Viewport } from "next";
import "./finance.css";
import { Aurora } from "@/components/finance/ui";

export const metadata: Metadata = {
  title: "Cadence — by Conduit AI",
  description: "Your AI-powered private bank. One pool, one goal — track income, kill debt, hit your savings target.",
  manifest: "/cadence.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Cadence" },
  icons: { icon: "/cadence-icon.svg", apple: "/cadence-icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
};

export default function FinanceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fin-scope relative min-h-screen overflow-x-hidden">
      <Aurora />
      <div className="fin-grid-texture fixed inset-0 z-0 opacity-40" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
