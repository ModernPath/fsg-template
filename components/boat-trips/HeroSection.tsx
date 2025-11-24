'use client'

import { Button } from '@/components/ui/button'
import { Anchor, Waves, Ship, Play, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'

export function HeroSection() {
  const t = useTranslations('BoatTrips')
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY
        const parallax = scrolled * 0.5
        heroRef.current.style.transform = `translateY(${parallax}px)`
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section 
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-40"
    >
      {/* Animated Ocean Background */}
      <div className="absolute inset-0 z-0">
        {/* Animated gradient ocean */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 animate-gradient-shift"></div>
        
        {/* Animated waves */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-wave-pattern animate-wave-move"></div>
        </div>

        {/* Moving light rays */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-white/40 via-white/10 to-transparent animate-light-ray-1"></div>
          <div className="absolute top-0 left-2/4 w-1 h-full bg-gradient-to-b from-white/30 via-white/10 to-transparent animate-light-ray-2"></div>
          <div className="absolute top-0 left-3/4 w-1 h-full bg-gradient-to-b from-white/40 via-white/10 to-transparent animate-light-ray-3"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-blue-800/20 to-blue-900/40"></div>
      </div>

      {/* Animated floating elements */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute top-40 md:top-48 left-4 md:left-10 animate-float">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl">
            <Anchor className="w-8 h-8 md:w-10 md:h-10 text-white/70" />
          </div>
        </div>
        <div className="absolute bottom-40 right-4 md:right-20 animate-float-delayed">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl">
            <Waves className="w-10 h-10 md:w-12 md:h-12 text-white/70" />
          </div>
        </div>
        <div className="absolute top-1/2 md:top-1/3 right-1/4 animate-float-slow">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl">
            <Ship className="w-7 h-7 md:w-8 md:h-8 text-white/70" />
          </div>
        </div>
      </div>

      {/* Main content with glassmorphism */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center z-20 max-w-7xl">
        {/* Glassmorphism card */}
        <div className="mx-auto bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border border-white/20">
          <div className="space-y-6 sm:space-y-8">
            {/* Premium badge */}
            <div 
              className="inline-block mb-4 px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-2xl animate-pulse"
              data-aos="zoom-in"
            >
              <span className="text-white font-black text-xs sm:text-sm tracking-widest uppercase flex items-center gap-2">
                ⭐ Premium Charter Service
              </span>
            </div>

            {/* Title with text shadow - PREMIUM */}
            <h1 
              className="font-geist text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-2xl break-words"
              data-aos="fade-up"
              data-aos-duration="1000"
            >
              {t('hero.title')}
              <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent animate-pulse break-words">
                Costa del Sol
              </div>
            </h1>
            
            <p 
              className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-white/95 leading-relaxed font-bold drop-shadow-lg px-4"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              {t('hero.subtitle')}
            </p>

            <p 
              className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-white/85 drop-shadow-lg font-medium px-4"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              {t('hero.description')}
            </p>

            {/* CTA Buttons - PREMIUM */}
            <div 
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-4 sm:pt-8 px-4"
              data-aos="fade-up"
              data-aos-delay="600"
            >
              <Button 
                size="lg" 
                className="group relative bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-600 hover:to-amber-700 text-white font-black text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 hover:-translate-y-2 overflow-hidden w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('hero.bookNow')}
                </span>
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full transition-all duration-500 hover:scale-110 hover:-translate-y-2 bg-white/10 backdrop-blur-lg shadow-2xl w-full sm:w-auto"
              >
                {t('hero.viewTrips')}
              </Button>
            </div>

            {/* Trust indicators - PREMIUM */}
            <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-4">
              {[
                { value: '10+', label: t('hero.stats.years'), icon: '🏆' },
                { value: '15K+', label: t('hero.stats.customers'), icon: '⭐' },
                { value: '5.0★', label: t('hero.stats.rating'), icon: '💎' },
                { value: '100%', label: t('hero.stats.safety'), icon: '✓' }
              ].map((stat, i) => (
                <div 
                  key={i}
                  data-aos="zoom-in"
                  data-aos-delay={800 + (i * 100)}
                  className="group relative text-center bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl transition-all duration-500 hover:scale-105 sm:hover:scale-110 hover:-translate-y-2 sm:hover:-translate-y-3 border-2 border-white/50 overflow-hidden"
                >
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{stat.icon}</div>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent mb-1 sm:mb-2">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-700 font-bold uppercase tracking-wide">{stat.label}</div>
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
        <div className="flex flex-col items-center gap-2 text-white/80">
          <span className="text-sm font-medium">Scroll</span>
          <ChevronDown className="w-6 h-6" />
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  )
}
