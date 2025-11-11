'use client'

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/Button'
import { Link } from '@/app/i18n/navigation'
import { IconBrain, IconDatabase, IconGlobe, IconRocket, IconShield, IconChart, IconMoney, IconCalculator, IconUsers, IconTrendingUp, IconTarget, IconAward } from '@/app/components/Icons'
import OrganizationSchema from '@/components/seo/OrganizationSchema'
import WebsiteSchema from '@/components/seo/WebsiteSchema'
import { usePerformanceOptimizations } from '@/app/hooks/usePreloadCriticalResources'
import OptimizedImage from '@/components/optimized/OptimizedImage'

// Pre-calculate blur data URL for better performance
const blurDataURL = 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAAAwAQCdASoBAAEADsD+JaQAA3AA/uaKSAB4AAAAVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AA/uaKSAB4AA=='

interface Props {
  params: {
    locale: string
  }
}

export default function HomePage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('Index')
  
  // Performance optimizations
  usePerformanceOptimizations()

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* SEO Schema Markup */}
      <OrganizationSchema locale={locale} />
      <WebsiteSchema locale={locale} />
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-20">
            {/* Left Column: Hero Image */}
            <div className="w-full lg:w-2/5 flex justify-center lg:justify-start order-2 lg:order-1">
              <OptimizedImage
                src="/images/other/apina_printtaa.jpeg"
                alt="Apina printtaa rahoitusanalyysiraporttia"
                width={550}
                height={400}
                className="object-contain max-w-full h-auto lg:max-w-[480px] xl:max-w-[520px]"
                priority
                placeholder="blur"
                blurDataURL={blurDataURL}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 520px"
                quality={90}
              />
            </div>

            {/* Right Column: Text Content */}
            <div className="w-full lg:w-3/5 text-center lg:text-left order-1 lg:order-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-8 text-gold-primary">
                {t('hero.title')}
              </h1>
              
              <div className="text-lg sm:text-xl lg:text-2xl leading-relaxed mb-12 max-w-3xl mx-auto lg:mx-0">
                <p className="mb-8 text-foreground/80">
                  {t('hero.description')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Button
                  size="lg"
                  href="/onboarding"
                  variant="primary"
                  className="h-16 px-12 text-xl font-semibold bg-gold-primary hover:bg-gold-highlight text-gray-900 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 !bg-[#D4AF37] !text-gray-900"
                >
                  {t('hero.cta')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Miksi rahoitusanalyysi on ratkaiseva */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column: Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gold-primary">
                {t('whyAnalysis.title')}
              </h2>
              <div className="space-y-6 text-lg leading-relaxed">
                <p className="text-foreground/80">
                  {t('whyAnalysis.description')}
                </p>
                <p className="font-semibold text-gold-primary">
                  {t('whyAnalysis.subtitle')}
                </p>
                <p className="font-semibold text-foreground">
                  {t('whyAnalysis.subtitle2')}
                </p>
                <ul className="space-y-3">
                  {(Array.isArray(t.raw('whyAnalysis.items')) ? t.raw('whyAnalysis.items') : []).map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-gold-primary mt-3 shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-foreground/80 font-semibold">
                  {t('whyAnalysis.conclusion')}
                </p>
              </div>
            </div>

            {/* Right Column: Animal Image */}
            <div className="flex justify-center">
              <OptimizedImage
                src="/images/other/laiskiainen_suurennuslasi.jpeg"
                alt="Laiskiainen suurennuslasilla analysoimassa rahoitustarpeita"
                width={500}
                height={400}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
                blurDataURL={blurDataURL}
                sizes="(max-width: 768px) 100vw, 500px"
                quality={85}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Näin prosessi toimii */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
              {t('howItWorks.title')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-6">
                <OptimizedImage
                  src="/images/other/apina_raporttituloste.jpeg"
                  alt="Apina lukee rahoitusanalyysin tuloksia"
                  width={200}
                  height={150}
                  className="object-contain max-w-full h-auto"
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  sizes="200px"
                  quality={85}
                />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gold-primary">{t('howItWorks.step1.title')}</h3>
              <p className="text-lg text-foreground/80">{t('howItWorks.step1.description')}</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-6">
                <OptimizedImage
                  src="/images/other/Rahoitussuositukset.jpeg"
                  alt="Eläin esittelee rahoitussuosituksia"
                  width={200}
                  height={150}
                  className="object-contain max-w-full h-auto"
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  sizes="200px"
                  quality={85}
                />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gold-primary">{t('howItWorks.step2.title')}</h3>
              <p className="text-lg text-foreground/80">{t('howItWorks.step2.description')}</p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-6">
                <OptimizedImage
                  src="/images/other/deal.jpeg"
                  alt="Eläin tekee rahoitussopimusta"
                  width={200}
                  height={150}
                  className="object-contain max-w-full h-auto"
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  sizes="200px"
                  quality={85}
                />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gold-primary">{t('howItWorks.step3.title')}</h3>
              <p className="text-lg text-foreground/80">{t('howItWorks.step3.description')}</p>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <Button
              href="/onboarding"
              size="lg"
              className="h-16 px-12 text-xl font-semibold bg-gold-primary hover:bg-gold-highlight text-gray-900 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 !bg-[#D4AF37] !text-gray-900"
            >
              {t('howItWorks.cta')}
            </Button>
          </div>
        </div>
      </section>

      {/* Miksi valita Trusty Finance */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
              {t('whyTrusty.title')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gold-primary">{t('whyTrusty.expertise.title')}</h3>
                <p className="text-lg text-foreground/80">{t('whyTrusty.expertise.description')}</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gold-primary">{t('whyTrusty.independence.title')}</h3>
                <p className="text-lg text-foreground/80">{t('whyTrusty.independence.description')}</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gold-primary">{t('whyTrusty.noRisk.title')}</h3>
                <p className="text-lg text-foreground/80">{t('whyTrusty.noRisk.description')}</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gold-primary">{t('whyTrusty.easy.title')}</h3>
                <p className="text-lg text-foreground/80">{t('whyTrusty.easy.description')}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-12">
            <OptimizedImage
              src="/images/other/tiimi_taustakuva1.png"
              alt="Trusty Finance tiimi"
              width={600}
              height={300}
              className="object-contain max-w-full h-auto"
              placeholder="blur"
              blurDataURL={blurDataURL}
              sizes="(max-width: 768px) 100vw, 600px"
              quality={85}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
              {t('faq.title')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* FAQ Items */}
            <div className="space-y-8">
              <div className="bg-gray-very-dark p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4 text-gold-primary">{t('faq.cost.question')}</h3>
                <p className="text-foreground/80">{t('faq.cost.answer')}</p>
              </div>
              
              <div className="bg-gray-very-dark p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4 text-gold-primary">{t('faq.speed.question')}</h3>
                <p className="text-foreground/80">{t('faq.speed.answer')}</p>
              </div>
              
              <div className="bg-gray-very-dark p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4 text-gold-primary">{t('faq.collateral.question')}</h3>
                <p className="text-foreground/80">{t('faq.collateral.answer')}</p>
              </div>
              
              <div className="bg-gray-very-dark p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4 text-gold-primary">{t('faq.amount.question')}</h3>
                <p className="text-foreground/80">{t('faq.amount.answer')}</p>
              </div>
              
              <div className="bg-gray-very-dark p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4 text-gold-primary">{t('faq.why.question')}</h3>
                <p className="text-foreground/80">{t('faq.why.answer')}</p>
              </div>
              
              <div className="text-center">
                <Link href="/faq" className="text-gold-primary hover:text-gold-highlight font-semibold">
                  {t('faq.allQuestionsLink')} →
                </Link>
              </div>
            </div>
            
            {/* FAQ Image */}
            <div className="flex justify-center">
              <OptimizedImage
                src="/images/other/laiskiainen_FAQ.jpeg"
                alt="Laiskiainen vastaa usein kysyttyihin kysymyksiin"
                width={500}
                height={600}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
                blurDataURL={blurDataURL}
                sizes="(max-width: 768px) 100vw, 500px"
                quality={85}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10 text-center">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column: Content */}
            <div className="text-left lg:text-left">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
                {t('finalCta.title')}
              </h2>
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-foreground">
                {t('finalCta.description')}
              </p>
              
              <div className="mb-12">
                <h3 className="text-xl font-bold mb-4 text-gold-primary">{t('finalCta.subtitle')}</h3>
                <ul className="space-y-3 text-lg">
                  {(Array.isArray(t.raw('finalCta.items')) ? t.raw('finalCta.items') : []).map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-gold-primary mt-3 shrink-0"></div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button
                href="/onboarding"
                size="lg"
                variant="primary"
                className="h-16 px-12 text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {t('finalCta.cta')}
              </Button>
            </div>
            
            {/* Right Column: Hero Animal */}
            <div className="flex justify-center">
              <OptimizedImage
                src="/images/other/pera_hymyilee.jpeg"
                alt="Pirteä eläinhahmo hymyilee rohkaisten aloittamaan rahoitusanalyysin"
                width={500}
                height={600}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
                blurDataURL={blurDataURL}
                sizes="(max-width: 768px) 100vw, 500px"
                quality={85}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 