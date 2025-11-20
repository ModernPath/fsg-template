'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Anchor, Phone, Mail, Menu, X, Globe } from 'lucide-react'
import { usePathname, useRouter } from '@/app/i18n/navigation'

export function BoatTripsHeader() {
  const t = useTranslations('BoatTrips')
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Extract locale from URL pathname (most reliable for client-side)
  const [currentLocale, setCurrentLocale] = useState('fi')
  
  useEffect(() => {
    // Get locale from browser URL
    const path = window.location.pathname
    const segments = path.split('/').filter(Boolean)
    const localeFromPath = segments[0]
    
    // Validate and set locale
    const validLocales = ['fi', 'en', 'sv', 'es']
    if (validLocales.includes(localeFromPath)) {
      setCurrentLocale(localeFromPath)
      console.log('🌐 [BoatTripsHeader] Current locale from URL:', localeFromPath)
    }
  }, [pathname]) // Re-run when pathname changes

  const navigation = [
    { name: t('hero.title'), href: '#hero' },
    { name: t('trips.title'), href: '#trips' },
    { name: t('gallery.title'), href: '#gallery' },
    { name: t('contact.title'), href: '#contact' },
  ]

  const locales = [
    { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ]

  // Handle locale change with hard navigation
  const handleLocaleChange = (newLocale: string) => {
    console.log('🔄 [BoatTripsHeader] Changing locale:', {
      from: currentLocale,
      to: newLocale,
      currentUrl: window.location.href,
      newUrl: `/${newLocale}/fuengirola-veneretket`
    })
    
    // Force hard navigation to ensure proper locale loading
    const newUrl = `${window.location.origin}/${newLocale}/fuengirola-veneretket`
    console.log('🔄 [BoatTripsHeader] Navigating to:', newUrl)
    window.location.href = newUrl
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-md">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between py-2 text-sm border-b border-blue-50">
          <div className="flex items-center gap-6 text-blue-600">
            <a href="tel:+358400770991" className="flex items-center gap-2 hover:text-blue-700 transition-colors">
              <Phone className="w-4 h-4" />
              +358 400 770 991
            </a>
            <a href="tel:+34633969224" className="flex items-center gap-2 hover:text-blue-700 transition-colors">
              <Phone className="w-4 h-4" />
              +34 633 969 224
            </a>
            <a href="mailto:varaukset@fuengirolanveneretket.fi" className="flex items-center gap-2 hover:text-blue-700 transition-colors">
              <Mail className="w-4 h-4" />
              varaukset@fuengirolanveneretket.fi
            </a>
          </div>
          <div className="flex items-center gap-2">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => handleLocaleChange(loc.code)}
                className={`px-3 py-2 rounded-full text-2xl transition-all hover:scale-110 ${
                  currentLocale === loc.code
                    ? 'bg-blue-50 ring-2 ring-blue-600'
                    : 'hover:bg-blue-50'
                }`}
                title={loc.name}
              >
                {loc.flag}
              </button>
            ))}
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Anchor className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Fuengirola
              </div>
              <div className="text-sm text-blue-500 font-medium -mt-1">Veneretket</div>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-blue-700 font-medium hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a
              href="#contact"
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              {t('hero.bookNow')}
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-blue-100 bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
              >
                {item.name}
              </a>
            ))}
            <div className="pt-4 border-t border-blue-100">
              <a
                href="#contact"
                onClick={() => setIsMenuOpen(false)}
                className="block text-center px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white font-bold rounded-full shadow-lg"
              >
                {t('hero.bookNow')}
              </a>
            </div>
            {/* Mobile language switcher */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-blue-100">
              {locales.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => {
                    setIsMenuOpen(false)
                    handleLocaleChange(loc.code)
                  }}
                  className={`px-4 py-3 rounded-full text-3xl transition-all hover:scale-110 ${
                    currentLocale === loc.code
                      ? 'bg-blue-50 ring-2 ring-blue-600'
                      : 'hover:bg-blue-50'
                  }`}
                  title={loc.name}
                >
                  {loc.flag}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

