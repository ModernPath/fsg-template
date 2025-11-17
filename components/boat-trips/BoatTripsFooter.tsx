'use client'

import { useTranslations } from 'next-intl'
import { Anchor, Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react'
import { Link } from '@/app/i18n/navigation'

interface BoatTripsFooterProps {
  locale: string
}

export function BoatTripsFooter({ locale }: BoatTripsFooterProps) {
  const t = useTranslations('BoatTrips')

  return (
    <footer className="bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-xl">
                <Anchor className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-xl font-black text-white">Fuengirola</div>
                <div className="text-sm text-amber-400 font-medium -mt-1">Veneretket</div>
              </div>
            </div>
            <p className="text-blue-200 mb-6 leading-relaxed">
              {t('meta.description')}
            </p>
            {/* Social Media */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=100093641448235"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-800 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/fuengirolanveneretket/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-800 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@FuengirolanVeneretket"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-800 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all hover:scale-110"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">{t('trips.title')}</h3>
            <ul className="space-y-3">
              <li>
                <a href="#trips" className="text-blue-200 hover:text-amber-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                  {t('trips.dolphinWatching.title')}
                </a>
              </li>
              <li>
                <a href="#trips" className="text-blue-200 hover:text-amber-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                  {t('trips.sunsetCruise.title')}
                </a>
              </li>
              <li>
                <a href="#trips" className="text-blue-200 hover:text-amber-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                  {t('trips.privateCharter.title')}
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Tietoa meistä</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-blue-200 hover:text-amber-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                  {t('features.title')}
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-blue-200 hover:text-amber-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                  {t('gallery.title')}
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-blue-200 hover:text-amber-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                  {t('testimonials.title')}
                </a>
              </li>
              <li>
                <a href="#blog" className="text-blue-200 hover:text-amber-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                  {t('blog.title')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">{t('contact.title')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                <div className="text-blue-200">
                  <div className="font-medium text-white">Puerto Deportivo</div>
                  <div>Fuengirola, Málaga</div>
                  <div>España 29640</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                <div className="text-blue-200">
                  <a href="tel:+358400770991" className="hover:text-amber-400 transition-colors block">
                    +358 400 770 991 / WhatsApp
                  </a>
                  <a href="tel:+34633969224" className="hover:text-amber-400 transition-colors block mt-1">
                    +34 633 969 224 / WhatsApp
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <a href="mailto:varaukset@fuengirolanveneretket.fi" className="text-blue-200 hover:text-amber-400 transition-colors">
                  varaukset@fuengirolanveneretket.fi
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-blue-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-blue-300 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Fuengirola Veneretket. {locale === 'fi' ? 'Kaikki oikeudet pidätetään' : locale === 'sv' ? 'Alla rättigheter förbehållna' : 'All rights reserved'}.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href={`/${locale}/privacy`} className="text-blue-300 hover:text-amber-400 transition-colors">
                {locale === 'fi' ? 'Tietosuoja' : locale === 'sv' ? 'Integritet' : 'Privacy'}
              </Link>
              <Link href={`/${locale}/terms`} className="text-blue-300 hover:text-amber-400 transition-colors">
                {locale === 'fi' ? 'Käyttöehdot' : locale === 'sv' ? 'Villkor' : 'Terms'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

