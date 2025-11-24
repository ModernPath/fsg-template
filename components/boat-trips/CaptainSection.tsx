'use client'

import { useTranslations } from 'next-intl'
import { Anchor, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CaptainSection() {
  const t = useTranslations('BoatTrips.charterFeatures')

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 relative overflow-hidden">
      {/* Animated waves */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-wave-pattern animate-wave-move"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6" data-aos="zoom-in">
            <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <Anchor className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-6 drop-shadow-lg"
            data-aos="fade-up"
          >
            ⭐ {t('captain.title')}
          </h2>

          <p 
            className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            {t('captain.description')}
          </p>

          <div data-aos="fade-up" data-aos-delay="200">
            <a
              href={t('captain.link')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-2"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                {t('captain.button')}
              </Button>
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6" data-aos="fade-up" data-aos-delay="300">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-black text-amber-400 mb-2">🇫🇮</div>
              <div className="text-white font-bold">{t('captain.card1.title')}</div>
              <div className="text-white/80 text-sm">{t('captain.card1.subtitle')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-black text-amber-400 mb-2">🐬</div>
              <div className="text-white font-bold">{t('captain.card2.title')}</div>
              <div className="text-white/80 text-sm">{t('captain.card2.subtitle')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-black text-amber-400 mb-2">⚓</div>
              <div className="text-white font-bold">{t('captain.card3.title')}</div>
              <div className="text-white/80 text-sm">{t('captain.card3.subtitle')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  )
}

