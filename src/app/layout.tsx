import type { Metadata } from "next";
import { Sora, DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Conduit AI — Your Company Runs Itself",
  description:
    "Conduit deploys autonomous AI employees across every department. Engineering, sales, support, finance, HR, legal, marketing, ops, and product — all running 24/7.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Conduit AI — Your Company Runs Itself",
    description:
      "Autonomous AI employees for every department. Your company runs itself.",
    url: "https://conduitai.io",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${dmSans.variable} ${spaceMono.variable}`}
    >
      <body className="min-h-screen bg-bg text-text antialiased">
        {children}
        <div className="noise-overlay" />
      </body>
    </html>
  );
}
