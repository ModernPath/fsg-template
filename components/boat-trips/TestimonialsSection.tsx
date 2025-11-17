'use client'

import { Star, Quote } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function TestimonialsSection() {
  const t = useTranslations('BoatTrips.testimonials')

  const testimonials = [
    { key: 'testimonial1', stars: 5, image: '/images/gallery/customers-1.jpg' },
    { key: 'testimonial2', stars: 5, image: '/images/gallery/customers-2.jpg' },
    { key: 'testimonial3', stars: 5, image: '/images/gallery/customers-1.jpg' },
    { key: 'testimonial4', stars: 5, image: '/images/gallery/customers-2.jpg' },
  ]

  return (
    <section id="testimonials" className="py-32 bg-gradient-to-b from-white via-blue-50/50 to-white relative overflow-hidden scroll-mt-20">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20" data-aos="fade-up">
          <h2 className="font-geist text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 text-blue-600">
            {t('title')}
          </h2>
          <p className="text-2xl text-blue-400 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {testimonials.map(({ key, stars }, index) => (
            <div
              key={key}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group relative"
            >
              <div className="bg-white rounded-3xl p-8 transition-all duration-500 hover:scale-105 border-2 border-blue-100 hover:border-blue-300 shadow-xl hover:shadow-2xl hover:-translate-y-2 h-full">
                {/* Quote icon with glow effect */}
                <div className="relative mb-6">
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
                  <Quote className="w-12 h-12 text-blue-300 relative z-10" />
                </div>

                {/* Stars with animation */}
                <div className="flex gap-1 mb-6">
                  {[...Array(stars)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-6 h-6 fill-yellow-400 text-yellow-400 transition-transform duration-300 group-hover:scale-110"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>

                {/* Review */}
                <p className="text-blue-600 mb-8 leading-relaxed text-lg relative z-10">
                  "{t(`${key}.review`)}"
                </p>

                {/* Author section with glassmorphism */}
                <div className="border-t-2 border-blue-100 pt-6 mt-auto">
                  <div className="font-bold text-blue-700 text-lg">{t(`${key}.author`)}</div>
                  <div className="text-blue-400 font-medium mt-1">{t(`${key}.location`)}</div>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust section */}
        <div className="mt-20 text-center" data-aos="fade-up" data-aos-delay="200">
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-5 rounded-full shadow-2xl">
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            <div className="text-left">
              <div className="font-bold text-2xl">4.9/5.0</div>
              <div className="text-sm opacity-90">Yli 1,500 arvostelua</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
