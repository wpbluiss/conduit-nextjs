import type { Metadata } from "next";
import "./finance.css";
import { Aurora } from "@/components/finance/ui";

export const metadata: Metadata = {
  title: "Praxis — Luis & Delia's Private Bank",
  description: "One pool. One goal. $75K toward the down payment.",
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
