import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Praxis — Sign in",
  description:
    "Praxis is the operating system for autonomous AI workforces. Sign in to your workspace.",
  openGraph: {
    title: "Praxis — Sign in",
    description:
      "Praxis is the operating system for autonomous AI workforces.",
    siteName: "Praxis",
    images: [
      { url: "/praxis-mark.png", width: 632, height: 961, alt: "Praxis" },
    ],
  },
  twitter: {
    card: "summary",
    title: "Praxis — Sign in",
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
