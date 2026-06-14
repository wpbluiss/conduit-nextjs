import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import "@/styles/praxis-tokens.css";
import "@/styles/praxis-system.css";
import "@/styles/praxis-design-language.css";
import "@/styles/engineering-cinema.css";
import "@/styles/memory-canvas.css";
import { ThemeBoot } from "@/components/conduit/ThemeBoot";
import { PwaInstaller } from "@/components/conduit/PwaInstaller";

// R18 Slice 0: body sans switched from Inter to Geist Sans per the
// design-language spec (frontend-design skill forbids Inter as generic
// AI aesthetic). GeistSans is Vercel's font; ships with next/font-
// compatible `.variable` binding directly. Bound to --font-sans so every
// existing `font-sans` Tailwind utility class continues to work without
// per-component edits.

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0908",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://conduitai.io"),
  title: "Conduit AI — Intelligence at work",
  description:
    "Conduit AI builds Praxis, the operating system for autonomous AI workforces. Voice, sales, engineering, ops, finance — running 24/7.",
  manifest: "/manifest.json",
  icons: {
    icon: "/praxis-mark.png",
    apple: "/praxis-mark.png",
  },
  openGraph: {
    title: "Conduit AI — Intelligence at work",
    description:
      "Conduit AI builds Praxis, the operating system for autonomous AI workforces. Voice, sales, engineering, ops, finance — running 24/7.",
    url: "https://conduitai.io",
    siteName: "Conduit AI",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Praxis — Your AI-powered business team",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conduit AI — Intelligence at work",
    description:
      "Conduit AI builds Praxis, the operating system for autonomous AI workforces.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeBoot />
      </head>
      <body>
        <a href="#main-content" className="conduit-skip-link">
          Skip to content
        </a>
        <div id="main-content">{children}</div>
        <PwaInstaller />
      </body>
    </html>
  );
}
