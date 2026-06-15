import type { Metadata } from "next";

export const metadata: Metadata = {
  // Neutral default so it's correct across all auth routes (sign-in, sign-up,
  // forgot-password, etc.). Client pages can't export their own metadata, so a
  // page-specific title would require per-route server layouts.
  title: "Praxis — Your AI workforce",
  description:
    "Praxis is the operating system for autonomous AI workforces. Sign in or create your workspace.",
  openGraph: {
    title: "Praxis — Your AI workforce",
    description:
      "Praxis is the operating system for autonomous AI workforces.",
    siteName: "Praxis",
    images: [
      { url: "/praxis-mark.png", width: 632, height: 961, alt: "Praxis" },
    ],
  },
  twitter: {
    card: "summary",
    title: "Praxis — Your AI workforce",
    description:
      "Praxis is the operating system for autonomous AI workforces.",
    images: ["/praxis-mark.png"],
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
