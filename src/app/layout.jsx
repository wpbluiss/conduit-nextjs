import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('https://conduitai.io'),
  title: {
    default: 'Conduit AI — Never Miss Another Lead | 14-Day Free Trial',
    template: '%s | Conduit AI',
  },
  description: 'Stop losing customers to missed calls. Conduit AI answers, qualifies, and delivers leads 24/7 with AI voice agents for service businesses. HVAC, plumbing, salons, roofing & more.',
  keywords: ['AI receptionist', 'missed call recovery', 'AI voice agent', 'lead capture', 'service business', 'HVAC leads', 'plumber leads', 'salon booking', 'after hours answering'],
  authors: [{ name: 'Conduit AI LLC' }],
  creator: 'Conduit AI LLC',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://conduitai.io',
    siteName: 'Conduit AI',
    title: 'Conduit AI — Never Miss Another Lead',
    description: 'AI voice agents that answer missed calls, capture leads, and send them to you instantly. 14-day free trial for service businesses.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Conduit AI — AI-Powered Lead Recovery for Service Businesses',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conduit AI — Never Miss Another Lead',
    description: 'AI voice agents that answer missed calls, capture leads, and send them to you instantly. 14-day free trial.',
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
      operatingSystem: 'Web',
      description: 'AI-powered voice agent that answers missed calls, captures lead information, and delivers real-time notifications to service businesses.',
      url: 'https://conduitai.io',
      offers: [
        {
          '@type': 'Offer',
          name: 'Beauty & Wellness Plan',
          price: '199',
          priceCurrency: 'USD',
          priceValidUntil: '2027-12-31',
          description: 'For salons, barbershops, spas, and med spas. Up to 50 leads/mo included.',
        },
        {
          '@type': 'Offer',
          name: 'Home Services Plan',
          price: '349',
          priceCurrency: 'USD',
          priceValidUntil: '2027-12-31',
          description: 'For HVAC, plumbing, electrical, roofing, and contractors. Up to 75 leads/mo included.',
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '12',
        bestRating: '5',
        worstRating: '1',
      },
    },
    {
      '@type': 'Organization',
      name: 'Conduit AI LLC',
      url: 'https://conduitai.io',
      logo: 'https://conduitai.io/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-561-446-4520',
        contactType: 'sales',
        email: 'luis@conduitai.io',
        areaServed: 'US',
        availableLanguage: ['English', 'Spanish'],
      },
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'FL',
        addressCountry: 'US',
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
          name: 'How long does Conduit AI setup take?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Most businesses are live within 24-48 hours. You sign up, we configure your voice agent with your business info and custom scripts, integrate with your phone number, test everything, and go live. No hardware or phone number changes needed.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Conduit AI replace my receptionist?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Conduit works alongside your existing team. We catch everything they can\'t — after-hours, overflow when lines are busy, lunch breaks, weekends, and holidays.',
          },
        },
        {
          '@type': 'Question',
          name: 'What happens after the 14-day trial?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Your subscription continues at the plan rate. If it\'s not for you, cancel before day 14 — no questions, no contracts, no fees.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does the AI voice agent actually sound natural?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Callers often don\'t realize they\'re not talking to a person. Call our demo line yourself: (561) 730-3316.',
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
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
