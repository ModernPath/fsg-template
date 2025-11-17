'use client'

import { Clock, Users, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function TripsSection() {
  const t = useTranslations('BoatTrips.trips')

  const trips = [
    { 
      key: 'dolphinWatching', 
      image: '/images/gallery/dolphins-1.jpg',
      rating: 5.0,
      popular: true
    },
    { 
      key: 'sunsetCruise', 
      image: '/images/gallery/sunset-1.jpg',
      rating: 5.0,
      popular: true
    },
    { 
      key: 'privateCharter', 
      image: '/images/gallery/boat-1.jpg',
      rating: 5.0,
      popular: false
    },
    { 
      key: 'carRental', 
      image: '/images/gallery/boat-2.jpg',
      rating: 5.0,
      popular: false
    },
  ]

  return (
    <section id="trips" className="py-32 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden scroll-mt-20">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-cyan-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
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
          {trips.map(({ key, image, duration, capacity, rating, popular }, index) => (
            <div
              key={key}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group relative"
            >
              {/* Popular badge */}
              {popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-2 rounded-full font-bold text-sm shadow-xl">
                  ⭐ Suosituin
                </div>
              )}

              <div className="bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:scale-105 border-2 border-blue-100 hover:border-blue-300 shadow-2xl hover:shadow-blue-500/30 h-full flex flex-col">
                {/* Image with parallax effect */}
              <div className="relative h-80 overflow-hidden">
                    <Image
                      src={image}
                      alt={t(`${key}.title`)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-125 group-hover:rotate-2"
                    />
                    {/* Animated overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Rating badge - PREMIUM */}
                    <div className="absolute top-4 right-4 bg-gradient-to-br from-amber-400 to-amber-600 px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                      <Star className="w-6 h-6 fill-white text-white" />
                      <span className="font-black text-white text-lg">{rating}</span>
                    </div>

                  {/* Hover info */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl">
                      <div className="flex items-center justify-around text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-gray-800">{duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-gray-800">{capacity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col bg-gradient-to-br from-white to-blue-50/30">
                  <h3 className="text-2xl font-bold text-blue-700 mb-4 group-hover:text-blue-600 transition-colors">
                    {t(`${key}.title`)}
                  </h3>
                  <p className="text-blue-500 mb-6 leading-relaxed flex-1">
                    {t(`${key}.description`)}
                  </p>

                  {/* Price and button - PREMIUM */}
                  <div className="flex items-center justify-between mt-auto pt-6 border-t-2 border-gradient-to-r from-amber-400 to-amber-600">
                    <div>
                      <div className="text-sm text-amber-600 font-bold uppercase tracking-wide mb-1">{t('from')}</div>
                      <div className="text-4xl font-black bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
                        {t(`${key}.price`)}
                      </div>
                    </div>
                    <Button className="group relative bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-600 hover:to-amber-700 text-white font-black rounded-2xl shadow-2xl transition-all duration-500 hover:scale-110 hover:-translate-y-1 px-8 py-7 text-lg overflow-hidden">
                      <span className="relative z-10">{t('book')}</span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
