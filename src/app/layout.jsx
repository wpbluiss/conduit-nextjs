import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import AffiliateLinker from '@/components/AffiliateLinker';
import './globals.css';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://conduitai.io'),
  title: {
    default: 'Conduit AI — The Only AI Voice Platform Built for Everyone',
    template: '%s | Conduit AI',
  },
  description: 'Your AI receptionist answers calls, captures leads, and books appointments — in any language, for any industry, 24/7. Personal plans from $19.99/mo. 14-day free trial.',
  keywords: ['AI receptionist', 'AI voice agent', 'missed call recovery', 'lead capture', 'AI answering service', 'service business', 'HVAC leads', 'salon booking', 'multi-language AI', 'virtual receptionist'],
  authors: [{ name: 'Conduit AI LLC' }],
  creator: 'Conduit AI LLC',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://conduitai.io',
    siteName: 'Conduit AI',
    title: 'Conduit AI — The Only AI Voice Platform Built for Everyone',
    description: 'AI voice agents that answer calls, capture leads, and book appointments in any language, 24/7. Plans from $19.99/mo. 14-day free trial.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Conduit AI — The Only AI Voice Platform Built for Everyone',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conduit AI — The Only AI Voice Platform Built for Everyone',
    description: 'AI voice agents that answer calls, capture leads, and book appointments in any language, 24/7. Plans from $19.99/mo.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://conduitai.io',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Conduit AI',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      description: 'The only AI voice platform built for everyone. AI receptionist that answers calls, captures leads, and books appointments in any language, 24/7.',
      url: 'https://conduitai.io',
      offers: [
        {
          '@type': 'Offer',
          name: 'Personal Plan',
          price: '19.99',
          priceCurrency: 'USD',
          description: 'For individuals who never want to miss a call. AI answers missed or all calls with custom greeting and multi-language support.',
        },
        {
          '@type': 'Offer',
          name: 'Beauty & Wellness Plan',
          price: '199',
          priceCurrency: 'USD',
          description: 'For salons, barbershops, spas, and med spas. Up to 50 leads/mo included.',
        },
        {
          '@type': 'Offer',
          name: 'Home Services Plan',
          price: '349',
          priceCurrency: 'USD',
          description: 'For HVAC, plumbing, electrical, roofing, and contractors. Up to 75 leads/mo included.',
        },
      ],
    },
    {
      '@type': 'Organization',
      name: 'Conduit AI LLC',
      url: 'https://conduitai.io',
      logo: 'https://conduitai.io/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-561-730-3316',
        contactType: 'sales',
        email: 'luis@conduitai.io',
        areaServed: 'US',
        availableLanguage: ['English', 'Spanish', 'French', 'Portuguese'],
      },
      sameAs: [
        'https://www.linkedin.com/company/conduitai',
        'https://www.producthunt.com/products/conduit-ai',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does the AI voice agent work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'When a call comes in that you can\'t answer, Conduit AI picks up with a natural, human-like voice. It greets the caller, asks the right questions, captures their information, and sends you the lead details instantly.',
          },
        },
        {
          '@type': 'Question',
          name: 'What languages does Conduit AI support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our AI supports multiple languages including English, Spanish, French, Portuguese, and more. You choose the language during setup.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is there a contract or commitment?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No contracts, no commitments. All plans include a 14-day free trial. Cancel anytime.',
          },
        },
        {
          '@type': 'Question',
          name: 'How fast is setup?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Most customers are live within 15 minutes. Sign up, configure your AI agent, forward your number, and you\'re capturing leads.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Sora:wght@100..800&display=swap" rel="stylesheet" />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a' }}>
        {children}
        <AffiliateLinker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
