'use client'

import { Link } from '@/app/i18n/navigation'
import { Button } from '@/components/ui/button'
import { CheckIcon } from '@/app/components/Icons'
import OptimizedImage from '@/components/optimized/OptimizedImage'
import { useTranslations } from 'next-intl'

export default function BusinessAcquisitionsPage() {
  const t = useTranslations('BusinessAcquisitions')
  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative max-w-[1440px] z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-4xl mx-auto">
              {t('hero.description')}
            </p>
            <div className="flex gap-6 justify-center">
              <Button
                size="lg"
                href="/onboarding"
                variant="primary"
                className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-lg shadow-md"
              >
{t('hero.cta')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <p className="text-lg mb-8">
              {t('challenge.description')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('challenge.title')}
            </h2>
            <div className="flex justify-center mb-8">
              <OptimizedImage
                src="/images/other/deal.jpeg"
alt={t('challenge.imageAlt')}
                width={400}
                height={320}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-gold-primary">{t('challenge.amount.title')}</h3>
              <p className="text-muted-foreground">
                {t('challenge.amount.description')}
              </p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-gold-primary">{t('challenge.timeline.title')}</h3>
              <p className="text-muted-foreground">
                {t('challenge.timeline.description')}
              </p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-gold-primary">{t('challenge.integration.title')}</h3>
              <p className="text-muted-foreground">
                {t('challenge.integration.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Financing Options */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('financing.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-white">{t('financing.businessLoan.title')}</h3>
              <p className="text-muted-foreground">{t('financing.businessLoan.description')}</p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-white">{t('financing.paymentTerms.title')}</h3>
              <p className="text-muted-foreground">{t('financing.paymentTerms.description')}</p>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <h3 className="text-xl font-semibold mb-4 text-white">{t('financing.bridgeFinancing.title')}</h3>
              <p className="text-muted-foreground">{t('financing.bridgeFinancing.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('caseStudy.title')}
            </h2>
          </div>

          <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 mb-12">
            <div className="max-w-4xl mx-auto">
              <p className="text-lg mb-6">
                {t('caseStudy.description')}
              </p>
              <p className="text-lg mb-6">
                <strong className="text-gold-primary">Rahoitusratkaisu:</strong> {t('caseStudy.solution')}
              </p>
              <p className="text-lg text-gold-primary">
                <strong>Kaupan jälkeen:</strong> {t('caseStudy.result')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('expertise.title')}
            </h2>
            <p className="text-lg">
              {t('expertise.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('whyChoose.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <div className="flex items-start">
                <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('whyChoose.understand.title')}</h3>
                  <p className="text-muted-foreground">{t('whyChoose.understand.description')}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <div className="flex items-start">
                <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('whyChoose.fast.title')}</h3>
                  <p className="text-muted-foreground">{t('whyChoose.fast.description')}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <div className="flex items-start">
                <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('whyChoose.competitive.title')}</h3>
                  <p className="text-muted-foreground">{t('whyChoose.competitive.description')}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
              <div className="flex items-start">
                <CheckIcon className="w-6 h-6 text-gold-primary mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('whyChoose.free.title')}</h3>
                  <p className="text-muted-foreground">{t('whyChoose.free.description')}</p>
                </div>
              </div>
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
        </div>
      </section>
    </main>
  )
}
