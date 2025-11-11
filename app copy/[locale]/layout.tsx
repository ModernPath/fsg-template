import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl'
import { staticLocales as locales, defaultLocale } from '../i18n/config'
import Navigation from '@/app/components/Navigation'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import getI18nConfig from '@/app/i18n'
import ReferralTracker from '@/components/tracking/ReferralTracker'
import Footer from '@/app/components/Footer'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

// Metadata määritetään juuritason layout.tsx:ssä
// Tämä välttää tuplametadatan ja varmistaa yhtenäisyyden

// Validate locale before using it
async function validateLocale(locale: string) {
  try {
    // For now, use static validation to avoid fetch issues
    // TODO: Re-enable database validation once API is stable
    return locales.includes(locale) ? locale : defaultLocale
  } catch (error) {
    console.error('Error validating locale:', error)
    // Fallback to static locales if validation fails
    return locales.includes(locale) ? locale : defaultLocale
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}) {
  // Ei tarvita enää alkuperäisen polun hakemista headerista
  // Await and validate the incoming locale
  const resolvedParams = await params
  const validatedLocale = await validateLocale(resolvedParams.locale)

  // Get messages using our i18n configuration that includes database translations
  let messages: AbstractIntlMessages = {};
  try {
    const i18nConfig = await getI18nConfig({ locale: validatedLocale })
    messages = (i18nConfig.messages || {}) as AbstractIntlMessages; // Ensure messages is always an object
  } catch (error) {
      console.error("Failed to load translations for layout:", error);
      // Optionally load default locale messages as a fallback here if needed
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Trusty Finance',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/images/trusty-finance-logo-optimized.webp`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'info@trustyfinance.fi',
    },
    sameAs: [
      // TODO: Add social media links here
    ],
  }

  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    name: 'Trusty Finance',
    description: 'Löydä yrityksellesi parhaat rahoitusvaihtoehdot AI-pohjaisella analyysilla.',
    publisher: {
      '@type': 'Organization',
      name: 'Trusty Finance',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/images/trusty-finance-logo-optimized.webp`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${process.env.NEXT_PUBLIC_SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  // Map locale to HTML lang attribute format
  const htmlLang = {
    'en': 'en',
    'fi': 'fi-FI',
    'sv': 'sv-SE'
  }[validatedLocale] || 'en';

  return (
    <html lang={htmlLang} className="dark" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager-head" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-P7JM6CS9');
          `}
        </Script>
        {/* End Google Tag Manager */}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P7JM6CS9"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <NextIntlClientProvider messages={messages} locale={validatedLocale}>
            <QueryProvider>
              <AuthProvider>
              {process.env.NODE_ENV === 'development' && (
                <Script 
                  id="Cookiebot" 
                  src="https://consent.cookiebot.com/uc.js" 
                  data-cbid="241535c0-0fe8-454e-bfb1-7144e86a975d" 
                  data-blockingmode="auto" 
                  strategy="beforeInteractive" 
                />
              )}
              <Script
                id="organization-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
              />
              <Script
                id="website-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
              />
              <div className="sticky top-0 z-50 bg-background shadow-md">
                <Navigation />
              </div>
              <main className="bg-background text-foreground min-h-screen transition-colors duration-200 pt-2">
                {children}
                <ReferralTracker 
                  enableAutoTracking={true}
                  debug={process.env.NODE_ENV === 'development'}
                />
              </main>
                     <Footer />
              </AuthProvider>
            </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
