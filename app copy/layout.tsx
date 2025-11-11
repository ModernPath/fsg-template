import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from '@/app/providers'
import { Toaster } from '@/components/ui/toaster'
import AnalyticsWrapper from '@/components/analytics/AnalyticsWrapper'
import { CookieConsentWrapper } from '@/components/cookie-consent-wrapper'
import AIBotMessageWrapper from '@/components/AIBotMessageWrapper'
import LastBotWidget from '@/components/lastbot/LastBotWidget'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trustyfinance.fi'),
  title: {
    template: '%s | TrustyFinance - AI-Powered Financial Analysis',
    default: 'TrustyFinance - AI-Powered Business Financing Analysis Service',
  },
  description: 'TrustyFinance offers AI-powered analysis to help businesses assess financial health, identify funding opportunities, and make strategic decisions. Optimize your financing with data-driven insights.',
  keywords: ['AI Financial Analysis', 'Business Financing', 'Financial Health Assessment', 'Funding Opportunities', 'Strategic Finance', 'Cash Flow Management', 'Data-Driven Decisions'],
  authors: [{ name: 'TrustyFinance Team' }],
  creator: 'TrustyFinance Inc',
  publisher: 'TrustyFinance Inc',
  icons: {
    icon: '/images/icon.svg',
    shortcut: '/images/favicon.ico',
    apple: '/images/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  openGraph: {
    type: 'website',
    siteName: 'TrustyFinance',
    title: 'TrustyFinance - AI-Powered Business Financing Analysis',
    description: 'Leverage AI for financial health assessment, funding recommendations, and strategic planning with TrustyFinance.',
    images: [
      {
        url: '/images/og/trusty-og.png',
        width: 1200,
        height: 630,
        alt: 'TrustyFinance - AI-Powered Financial Analysis',
        type: 'image/webp',
      },
    ],
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrustyFinance - AI-Powered Business Financing Analysis',
    description: 'Optimize your business financing with TrustyFinance\'s AI-powered analysis and strategic recommendations.',
    images: ['/images/og/trustyfinance-og.webp'],
    creator: '@trustyfinance',
    site: '@trustyfinance',
  },
  verification: {
    google: 'F23gxMaXd0gWbH4HSmev2vzhqnsoIuFCz_fUy_R3g-A',
  },
  alternates: {
    canonical: new URL('/en', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trustyfinance.fi').toString(),
    languages: {
      'en': new URL('/en', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trustyfinance.fi').toString(),
      'fi': new URL('/fi', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trustyfinance.fi').toString(),
      'sv': new URL('/sv', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trustyfinance.fi').toString(),
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html dir="ltr" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        {/* Remove unused preload link */}
        {/* <link rel="preload" href="/images/hero-bg-abstract-new.webp" as="image" /> */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AIBotMessageWrapper />
        <Providers>
          {children}
          <Toaster />
          <AnalyticsWrapper />
          <CookieConsentWrapper />
          <LastBotWidget />
        </Providers>
      </body>
    </html>
  );
}
