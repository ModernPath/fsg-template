'use client'

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/Button'
import { Link } from '@/app/i18n/navigation'
import { IconCode, IconBrain, IconDatabase, IconGlobe, IconRocket, IconShield, IconChart, IconMoney, IconCalculator, IconBank, CheckIcon } from '@/app/components/Icons'
import financeDashboardImage from '@/public/images/finance-dashboard-ui-optimized.webp'
import tiimikuva from '@/public/images/other/tiimi.jpeg'
import rahoitussuosituksetKuva from '@/public/images/other/Rahoitussuositukset.jpeg'
import OptimizedImage from '@/components/optimized/OptimizedImage'
import financialHealthGaugeImage from '@/public/images/financial-health-gauge-optimized.webp'
import financingComparisonImage from '@/public/images/financing-comparison-optimized.webp'
import fsgLogo from '@/public/images/trusty-finance-logo-optimized.webp'

// Pre-calculate blur data URL for better performance
const blurDataURL = 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAAAwAQCdASoBAAEADsD+JaQAA3AA/uaKSAB4AAAAVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AA/uaKSAB4AA=='

interface Props {
  params: {
    locale: string
  }
}

export default function SolutionsPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('Solutions')

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative max-w-[1440px] z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
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
            <div className="w-full md:w-1/2 flex justify-center md:justify-end">
              <Image
                src={tiimikuva}
                alt="FSG Trusty Finance rahoitusratkaisut"
                className="object-contain max-w-full h-auto md:max-w-[600px] lg:max-w-[800px]"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="">
                  {t('overview.title')}
                </span>
              </h2>
              <p className="text-xl leading-relaxed">
                {t('overview.description')}
              </p>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <OptimizedImage
                src="/images/other/apina_rubiikinkuutio.jpeg"
                alt="Apina ratkomassa Rubikin kuutiota - monipuoliset rahoitusratkaisut"
                width={400}
                height={300}
                className="object-contain max-w-full h-auto lg:max-w-[350px]"
                placeholder="blur"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Financing Instruments Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('instruments.title')}
            </h2>
            <p className="text-xl mb-8">
              {t('instruments.description')}
            </p>
            <div className="flex justify-center mb-8">
              <OptimizedImage
                src="/images/other/apina_palapeli.jpeg"
                alt="Apina kokoamassa palapeloa - räätälöidyt rahoitusratkaisut"
                width={350}
                height={250}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {/* Instrument 1: Yrityslimiitti */}
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 hover:border-gold-primary transition-all duration-300">
              <div className="w-16 h-16 bg-gold-primary/10 rounded-full flex items-center justify-center mb-6">
                <IconMoney className="w-8 h-8 text-gold-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t('instruments.creditLine.title')}</h3>
              <p className="mb-6">{t('instruments.creditLine.description')}</p>
              <h4 className="text-xl font-medium mb-2">{t('instruments.suitableFor')}</h4>
              <ul className="space-y-2 mb-6">
                {[1, 2, 3].map((point) => (
                  <li key={point} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-gold-primary mr-2 flex-shrink-0 mt-1" />
                    <span className="">{t(`instruments.creditLine.suitablePoints.point${point}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instrument 2: Yrityslainat */}
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 hover:border-gold-primary transition-all duration-300">
              <div className="w-16 h-16 bg-gold-primary/10 rounded-full flex items-center justify-center mb-6">
                <IconBank className="w-8 h-8 text-gold-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t('instruments.businessLoans.title')}</h3>
              <p className="mb-6">{t('instruments.businessLoans.description')}</p>
              <h4 className="text-xl font-medium mb-2">{t('instruments.suitableFor')}</h4>
              <ul className="space-y-2 mb-6">
                {[1, 2, 3].map((point) => (
                  <li key={point} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-gold-primary mr-2 flex-shrink-0 mt-1" />
                    <span className="">{t(`instruments.businessLoans.suitablePoints.point${point}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instrument 3: Factoring/laskurahoitus */}
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 hover:border-gold-primary transition-all duration-300">
              <div className="w-16 h-16 bg-gold-primary/10 rounded-full flex items-center justify-center mb-6">
                <IconChart className="w-8 h-8 text-gold-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t('instruments.factoring.title')}</h3>
              <p className="mb-6">{t('instruments.factoring.description')}</p>
              <h4 className="text-xl font-medium mb-2">{t('instruments.suitableFor')}</h4>
              <ul className="space-y-2 mb-6">
                {[1, 2, 3].map((point) => (
                  <li key={point} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-gold-primary mr-2 flex-shrink-0 mt-1" />
                    <span className="">{t(`instruments.factoring.suitablePoints.point${point}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instrument 4: Leasing/Sale Lease */}
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 hover:border-gold-primary transition-all duration-300">
              <div className="w-16 h-16 bg-gold-primary/10 rounded-full flex items-center justify-center mb-6">
                <IconRocket className="w-8 h-8 text-gold-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t('instruments.leasing.title')}</h3>
              <p className="mb-6">{t('instruments.leasing.description')}</p>
              <h4 className="text-xl font-medium mb-2">{t('instruments.suitableFor')}</h4>
              <ul className="space-y-2 mb-6">
                {[1, 2, 3].map((point) => (
                  <li key={point} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-gold-primary mr-2 flex-shrink-0 mt-1" />
                    <span className="">{t(`instruments.leasing.suitablePoints.point${point}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instrument 5: Lainojen uudelleenjärjestelyt */}
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 hover:border-gold-primary transition-all duration-300">
              <div className="w-16 h-16 bg-gold-primary/10 rounded-full flex items-center justify-center mb-6">
                <IconBrain className="w-8 h-8 text-gold-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t('instruments.restructuring.title')}</h3>
              <p className="mb-6">{t('instruments.restructuring.description')}</p>
              <h4 className="text-xl font-medium mb-2">{t('instruments.suitableFor')}</h4>
              <ul className="space-y-2 mb-6">
                {[1, 2, 3].map((point) => (
                  <li key={point} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-gold-primary mr-2 flex-shrink-0 mt-1" />
                    <span className="">{t(`instruments.restructuring.suitablePoints.point${point}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instrument 6: Pankki- tai erilaiset takaukset */}
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 hover:border-gold-primary transition-all duration-300">
              <div className="w-16 h-16 bg-gold-primary/10 rounded-full flex items-center justify-center mb-6">
                <IconShield className="w-8 h-8 text-gold-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t('instruments.guarantees.title')}</h3>
              <p className="mb-6">{t('instruments.guarantees.description')}</p>
              <h4 className="text-xl font-medium mb-2">{t('instruments.suitableFor')}</h4>
              <ul className="space-y-2 mb-6">
                {[1, 2, 3].map((point) => (
                  <li key={point} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-gold-primary mr-2 flex-shrink-0 mt-1" />
                    <span className="">{t(`instruments.guarantees.suitablePoints.point${point}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src={rahoitussuosituksetKuva}
                alt="FSG Trusty Finance rahoitusanalyysi"
                className="w-full h-auto"
              />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-6">{t('valueProposition.title')}</h3>
              <p className="text-lg mb-8">{t('valueProposition.description')}</p>
              <ul className="space-y-4">
                {[1, 2, 3, 4].map((point) => (
                  <li key={point} className="flex items-start">
                    <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                    <span className="">{t(`valueProposition.points.point${point}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
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