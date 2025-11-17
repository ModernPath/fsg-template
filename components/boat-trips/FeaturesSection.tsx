'use client'

import { Anchor, Clock, Users, Wine, Fish, Shield, Star, Waves } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function FeaturesSection() {
  const t = useTranslations('BoatTrips.features')

  const iconMap = {
    anchor: Anchor,
    waves: Waves,
    star: Star,
    users: Users,
    wine: Wine,
    fish: Fish,
    shield: Shield,
    clock: Clock,
  }

  const features = [
    { icon: 'anchor', key: 'luxury' },
    { icon: 'waves', key: 'routes' },
    { icon: 'star', key: 'sunset' },
    { icon: 'users', key: 'groups' },
    { icon: 'star', key: 'photography' },
    { icon: 'wine', key: 'catering' },
    { icon: 'fish', key: 'fishing' },
    { icon: 'shield', key: 'safety' },
  ]

  return (
    <section id="features" className="py-32 bg-gradient-to-b from-white via-blue-50/50 to-white relative overflow-hidden scroll-mt-20">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-300/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20" data-aos="fade-up">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 bg-blue-100 px-6 py-3 rounded-full">
              <Star className="w-5 h-5 text-blue-600 fill-blue-600" />
              <span className="text-blue-600 font-semibold">Miksi valita meidät</span>
            </div>
          </div>
          <h2 className="font-geist text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 text-blue-600">
            {t('title')}
          </h2>
          <p className="text-2xl text-blue-400 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map(({ icon, key }, index) => {
            const Icon = iconMap[icon as keyof typeof iconMap]
            return (
              <div
                key={key}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="group relative"
              >
                {/* 3D Card effect */}
                <div className="relative bg-white rounded-3xl p-10 transition-all duration-500 hover:scale-105 border-2 border-blue-100 hover:border-blue-300 shadow-xl hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer"></div>
                  
                  {/* Icon with 3D effect */}
                  <div className="relative mb-6">
                    <div className="inline-block p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    {/* Icon glow */}
                    <div className="absolute inset-0 bg-blue-400/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>

                  <h3 className="text-2xl font-bold text-blue-700 mb-4 group-hover:text-blue-600 transition-colors">
                    {t(`${key}.title`)}
                  </h3>
                  <p className="text-blue-500 leading-relaxed text-lg">
                    {t(`${key}.description`)}
                  </p>

                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
