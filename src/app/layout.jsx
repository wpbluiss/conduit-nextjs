import './globals.css';

export const metadata = {
  title: 'Conduit AI — Never Miss a Lead Again',
  description: 'AI voice agent that answers your missed calls, has real conversations, captures leads, and sends them to you instantly. Built for service businesses.',
  metadataBase: new URL('https://conduitai.io'),
  openGraph: {
    title: 'Conduit AI — Never Miss a Lead Again',
    description: 'AI voice agent that answers your missed calls, captures leads, and sends them to you instantly.',
    url: 'https://conduitai.io',
    siteName: 'Conduit AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conduit AI — Never Miss a Lead Again',
    description: 'AI voice agent that answers your missed calls, captures leads, and sends them to you instantly.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="noise-bg">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
