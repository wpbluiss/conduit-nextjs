import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://conduitai.io"),
  title: "Conduit AI — Virtual Business Operating System",
  description:
    "Deploy 32 autonomous AI employees across 9 departments. Voice, sales, support, ops, finance, marketing — all running 24/7. One platform. Zero payroll.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Conduit AI — Virtual Business Operating System",
    description:
      "Deploy 32 autonomous AI employees across 9 departments. Voice, sales, support, ops, finance, marketing — all running 24/7. One platform. Zero payroll.",
    url: "https://conduitai.io",
    siteName: "Conduit AI",
    type: "website",
    images: [{ url: "/logo.svg", width: 1200, height: 1200, alt: "Conduit AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conduit AI — Virtual Business Operating System",
    description:
      "Deploy 32 autonomous AI employees across 9 departments. 24/7. One platform. Zero payroll.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
