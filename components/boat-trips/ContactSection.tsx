'use client'

import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export function ContactSection() {
  const t = useTranslations('BoatTrips.contact')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Implement contact form submission
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <section id="contact" className="py-32 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 relative overflow-hidden scroll-mt-20">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-300 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20" data-aos="fade-up">
          <h2 className="font-geist text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 text-white drop-shadow-2xl">
            {t('title')}
          </h2>
          <p className="text-2xl text-white/90 max-w-3xl mx-auto drop-shadow-lg">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info Cards */}
          <div className="space-y-6" data-aos="fade-right">
            {[
              { icon: Phone, label: t('info.phone'), value: '+34 952 123 456', href: 'tel:+34952123456' },
              { icon: Mail, label: t('info.email'), value: 'info@fuengirolanveneretket.fi', href: 'mailto:info@fuengirolanveneretket.fi' },
              { icon: MapPin, label: t('info.address'), value: 'Puerto Deportivo de Fuengirola\n29640 Fuengirola, Málaga\nEspaña', href: '#' },
              { icon: Clock, label: t('info.hours'), value: t('info.hoursValue'), href: '#' },
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-white/50 hover:border-white transition-all duration-500 hover:scale-105 hover:-translate-y-2"
              >
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-blue-400/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-blue-500 mb-2 font-bold uppercase tracking-wide">{item.label}</div>
                    {item.href !== '#' ? (
                      <a 
                        href={item.href} 
                        className="text-lg text-blue-700 hover:text-blue-600 transition-colors font-semibold whitespace-pre-line"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <div className="text-lg text-blue-700 font-semibold whitespace-pre-line">
                        {item.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form with glassmorphism */}
          <div data-aos="fade-left">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border-2 border-white/50">
              <h3 className="text-3xl font-bold text-blue-700 mb-8">{t('form.title')}</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-blue-600 mb-3">
                    {t('form.name')}
                  </label>
                  <Input
                    id="name"
                    type="text"
                    required
                    className="bg-blue-50 border-2 border-blue-200 text-blue-900 focus:border-blue-500 focus:ring-blue-500 rounded-2xl py-6 text-lg transition-all duration-300 hover:border-blue-300"
                    placeholder={t('form.namePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-blue-600 mb-3">
                    {t('form.email')}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="bg-blue-50 border-2 border-blue-200 text-blue-900 focus:border-blue-500 focus:ring-blue-500 rounded-2xl py-6 text-lg transition-all duration-300 hover:border-blue-300"
                    placeholder={t('form.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-blue-600 mb-3">
                    {t('form.phone')}
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    className="bg-blue-50 border-2 border-blue-200 text-blue-900 focus:border-blue-500 focus:ring-blue-500 rounded-2xl py-6 text-lg transition-all duration-300 hover:border-blue-300"
                    placeholder={t('form.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-blue-600 mb-3">
                    {t('form.message')}
                  </label>
                  <Textarea
                    id="message"
                    required
                    rows={5}
                    className="bg-blue-50 border-2 border-blue-200 text-blue-900 focus:border-blue-500 focus:ring-blue-500 rounded-2xl text-lg transition-all duration-300 hover:border-blue-300 resize-none"
                    placeholder={t('form.messagePlaceholder')}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-7 text-lg rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    t('form.sending')
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('form.send')}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
