import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/praxis-tokens.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

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
  title: "Conduit — Intelligence at work",
  description:
    "Conduit builds Praxis, the operating system for autonomous AI workforces. Voice, sales, engineering, ops, finance — running 24/7.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Conduit — Intelligence at work",
    description:
      "Conduit builds Praxis, the operating system for autonomous AI workforces. Voice, sales, engineering, ops, finance — running 24/7.",
    url: "https://conduitai.io",
    siteName: "Conduit",
    type: "website",
    images: [{ url: "/logo.svg", width: 1200, height: 1200, alt: "Conduit" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conduit — Intelligence at work",
    description:
      "Conduit builds Praxis, the operating system for autonomous AI workforces.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <a href="#main-content" className="conduit-skip-link">
          Skip to content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
