'use client'

import { Anchor, Users, Sparkles, Crown, Shield, Award, Wine, Camera } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function CharterFeaturesSection() {
  const t = useTranslations('BoatTrips.charter')

  const features = [
    { icon: Crown, title: 'Luksusveneet', desc: 'Premium kalustoa viimeisimmällä tekniikalla', color: 'from-amber-400 to-amber-600' },
    { icon: Users, title: 'Yksityinen Charter', desc: 'Oma vene vain sinun seurueellesi', color: 'from-blue-400 to-blue-600' },
    { icon: Wine, title: 'Catering Palvelut', desc: 'Gourmet-ruoka ja juomat', color: 'from-purple-400 to-purple-600' },
    { icon: Camera, title: 'Ammattivalokuvaus', desc: 'Ikuista hetkesi ammattitaidolla', color: 'from-pink-400 to-pink-600' },
    { icon: Shield, title: 'Täysi Vakuutus', desc: '100% turvallinen matka', color: 'from-green-400 to-green-600' },
    { icon: Award, title: 'VIP-Palvelu', desc: 'Henkilökohtainen concierge', color: 'from-red-400 to-red-600' },
    { icon: Sparkles, title: 'Erikoistapahtumat', desc: 'Juhlat, häät, yritystapahtumat', color: 'from-cyan-400 to-cyan-600' },
    { icon: Anchor, title: 'Pitkät Retket', desc: 'Monipäiväiset charter-matkat', color: 'from-indigo-400 to-indigo-600' },
  ]

  return (
    <section className="py-32 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20" data-aos="fade-up">
          <div className="inline-block mb-6 px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-2xl">
            <span className="text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Premium Charter Experience
            </span>
          </div>
          
          <h2 className="font-geist text-5xl sm:text-6xl lg:text-7xl font-black mb-8 text-white">
            Miksi valita meidät?
          </h2>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
            Tarjoamme ylivoimaista laatua ja palvelua jokaisella retkellä
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="group relative"
              >
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 transition-all duration-500 hover:scale-105 border-2 border-white/20 hover:border-white/40 shadow-2xl h-full overflow-hidden">
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl`}></div>
                  
                  <div className="relative z-10">
                    {/* Icon with gradient */}
                    <div className={`inline-block p-4 bg-gradient-to-br ${feature.color} rounded-2xl shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 mb-6`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-black text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-lg">
                      {feature.desc}
                    </p>
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Premium CTA */}
        <div className="mt-20 text-center" data-aos="fade-up" data-aos-delay="400">
          <div className="inline-block bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-12 border-2 border-white/20 shadow-2xl max-w-3xl">
            <Crown className="w-16 h-16 text-amber-400 mx-auto mb-6" />
            <h3 className="text-3xl font-black text-white mb-4">
              Haluatko räätälöidyn charter-kokemuksen?
            </h3>
            <p className="text-xl text-gray-300 mb-8">
              Ota yhteyttä VIP-tiimiimme ja suunnitellaan unelmiesi veneretki
            </p>
            <button className="group relative bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-600 hover:to-amber-700 text-white font-black text-xl px-12 py-6 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 hover:-translate-y-2 overflow-hidden">
              <span className="relative z-10">Kysy Tarjous</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </section>
  )
}

