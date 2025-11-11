'use client'

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/Button'
import { Link } from '@/app/i18n/navigation'
import { IconCode, IconBrain, IconDatabase, IconGlobe, IconRocket, IconShield, IconChart, IconMoney, IconCalculator, CheckIcon } from '@/app/components/Icons'
import financeDashboardImage from '@/public/images/other/Screenshot_FSG.jpeg'
import financeOfficeImage from '@/public/images/other/tiimi_tsto2.jpeg'
import financialHealthGaugeImage from '@/public/images/other/apina_raporttituloste.jpeg'
import financingComparisonImage from '@/public/images/financing-comparison-optimized.webp'
import fsgLogo from '@/public/images/trusty-finance-logo-optimized.webp'

// Pre-calculate blur data URL for better performance
const blurDataURL = 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAAAwAQCdASoBAAEADsD+JaQAA3AA/uaKSAB4AAAAVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AA/uaKSAB4AA=='

interface Props {
  params: {
    locale: string
  }
}

export default function ServicePage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('Service')

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="container mx-auto px-8 relative max-w-[1440px] z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left Column: Text Content */}
            <div className="w-full md:w-3/5 text-center md:text-left">
              <div className="mb-4 inline-block">
                <span className="font-semibold text-lg">FSG Trusty Finance</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-xl">
                {t('hero.description')}
              </p>
              <div className="flex gap-6 justify-center md:justify-start">
                <Button
                  size="lg"
                  href="/onboarding"
                  variant="primary"
                  className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-lg shadow-md disabled:opacity-50 disabled:bg-gold-primary disabled:text-black"
                >
                  {t('hero.cta')}
                </Button>
              </div>
            </div>

            {/* Right Column: Hero Image */}
            <div className="w-full md:w-2/5 flex justify-center md:justify-end">
              <div className="relative w-full max-w-md md:max-w-none">
                <Image
                  src={financeOfficeImage}
                  alt="FSG Trusty Finance palvelu"
                  className="object-cover w-full h-auto rounded-lg shadow-lg"
                  width={500}
                  height={400}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Overview Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="">
                {t('overview.title')}
              </span>
            </h2>
            <p className="text-xl leading-relaxed">
              {t('overview.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">{t('overview.mainFeature.title')}</h3>
              <p className="text-lg mb-8">{t('overview.mainFeature.description')}</p>
              <ul className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <li key={item} className="flex items-start">
                    <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                    <span className="">{t(`overview.mainFeature.points.point${item}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src={financeDashboardImage}
                alt={t('images.dashboardAlt')}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('process.title')}
            </h2>
            <p className="text-xl">
              {t('process.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="p-8 bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark hover:border-gold-primary transition-all duration-300 group">
                <div className="w-16 h-16 bg-gold-primary/10 rounded-full flex items-center justify-center mb-6 font-bold text-2xl">
                  {step}
                </div>
                <h3 className="text-xl font-semibold mb-4">{t(`process.steps.step${step}.title`)}</h3>
                <p className="text-base leading-relaxed">{t(`process.steps.step${step}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('benefits.title')}
            </h2>
            <p className="text-xl">
              {t('benefits.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src={financialHealthGaugeImage}
                alt={t('images.analysisAlt')}
                className="w-full h-auto"
              />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-6">{t('benefits.mainBenefit.title')}</h3>
              <p className="text-lg mb-8">{t('benefits.mainBenefit.description')}</p>
              <ul className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <li key={item} className="flex items-start">
                    <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                    <span className="">{t(`benefits.mainBenefit.points.point${item}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl">
              {t('testimonials.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((testimonial) => (
              <div key={testimonial} className="p-8 bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="flex items-center space-x-1 text-gold-primary">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="italic mb-6 flex-grow">"{t(`testimonials.quotes.quote${testimonial}`)}"</p>
                  <div className="flex items-center">
                    <div className="mr-4 w-12 h-12 bg-gold-primary/20 rounded-full flex items-center justify-center">
                      {t(`testimonials.clients.client${testimonial}.initial`)}
                    </div>
                    <div>
                      <p className="font-semibold">{t(`testimonials.clients.client${testimonial}.name`)}</p>
                      <p className="text-sm text-foreground/80">{t(`testimonials.clients.client${testimonial}.position`)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-xl mb-10">
              {t('cta.description')}
            </p>
            <Button
              size="lg"
              href="/onboarding"
              variant="primary"
              className="h-14 px-10 text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-xl shadow-lg"
            >
              {t('cta.button')}
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
} 