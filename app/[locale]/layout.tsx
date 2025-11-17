import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { staticLocales as locales, defaultLocale } from '../i18n/config'
import Navigation from '@/app/components/Navigation'
import FooterWrapper from '@/app/components/FooterWrapper'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { dedupingServerFetch } from '@/lib/utils/server-deduplication'

const inter = Inter({ subsets: ['latin'] })

type Props = {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

// Validate locale before using it
async function validateLocale(locale: string) {
  try {
    // Get enabled locales from database
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'

    const response = await dedupingServerFetch(`${baseUrl}/api/languages`)
    
    if (!response.ok) {
      console.warn(`Failed to fetch languages, using static locales. Status: ${response.status}`)
      return locales.includes(locale) ? locale : defaultLocale
    }

    const { data: languages } = await response.json()
    const enabledLocales = languages?.map((lang: { code: string, enabled: boolean }) => 
      lang.enabled ? lang.code : null
    ).filter(Boolean) || locales

    // Check if locale is enabled
    if (!enabledLocales.includes(locale)) {
      return defaultLocale
    }
    return locale
  } catch (error) {
    console.error('Error validating locale:', error)
    // Fallback to static locales if database check fails
    return locales.includes(locale) ? locale : defaultLocale
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  // Await and validate the incoming locale
  const resolvedParams = await params
  const validatedLocale = await validateLocale(resolvedParams.locale)

  // Get messages using next-intl's built-in system (uses app/i18n/request.ts)
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={validatedLocale}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <Navigation />
          <main className={inter.className}>{children}</main>
          <FooterWrapper />
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
