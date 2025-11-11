'use client'

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/Button'
import { Link } from '@/app/i18n/navigation'
import OptimizedImage from '@/components/optimized/OptimizedImage'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  CalculatorIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'
import ServiceSchema from '@/components/seo/ServiceSchema'

interface Props {
  params: {
    locale: string
  }
}

export default function FactoringPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('Factoring')

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* SEO Schema Markup */}
      <ServiceSchema
        serviceName={t('hero.title')}
        description={t('hero.description')}
        serviceArea="Finland"
        serviceType="Factoring"
        priceRange={t('hero.cta')}
        provider="Trusty Finance"
      />
      
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-8 text-gold-primary">
              {t('hero.title')}
            </h1>
            
            <div className="text-lg sm:text-xl lg:text-2xl leading-relaxed mb-12 max-w-4xl">
              <p className="mb-8 text-foreground/80">
                {t('hero.description')}
              </p>
              
              <p className="mb-8 text-foreground/80">
                {t('hero.paragraph2')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/onboarding">
                <Button size="lg" className="w-full sm:w-auto bg-gold-primary text-gray-900 hover:bg-gold-highlight !bg-[#D4AF37] !text-gray-900">
                  {t('hero.cta')}
                </Button>
              </Link>
              <Link href="#vertailu">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  {t('hero.compare')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Milloin factoring on järkevä valinta */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gold-primary text-center">
              {t('whenFactoring.title')}
            </h2>
            <div className="flex justify-center mb-8">
              <OptimizedImage
                src="/images/other/hanground.jpeg"
                alt={t('whenFactoring.imageAlt')}
                width={400}
                height={320}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
              />
            </div>
            
            <div className="text-xl leading-relaxed mb-12">
              <p className="mb-6">
                {t('whenFactoring.intro')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-background/10 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gold-primary">{t('whenFactoring.worksWhen.title')}</h3>
                </div>
                <ul className="space-y-3 text-foreground/80">
                  {Array.isArray(t.raw('whenFactoring.worksWhen.items')) && (t.raw('whenFactoring.worksWhen.items') as string[]).map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-gold-primary mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background/10 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gold-primary">{t('whenFactoring.considerAlternative.title')}</h3>
                </div>
                <ul className="space-y-3 text-foreground/80">
                  {Array.isArray(t.raw('whenFactoring.considerAlternative.items')) && (t.raw('whenFactoring.considerAlternative.items') as string[]).map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perinteinen pankki vs digipankki */}
      <section id="vertailu" className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              {t('comparison.title')}
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gray-very-dark rounded-lg p-8">
                <h3 className="text-2xl font-semibold text-gold-primary mb-6">{t('comparison.traditional.title')}</h3>
                <ul className="space-y-4 text-foreground/80">
                  {Array.isArray(t.raw('comparison.traditional.items')) && (t.raw('comparison.traditional.items') as string[]).map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gold-primary/10 rounded-lg p-8">
                <h3 className="text-2xl font-semibold text-gold-primary mb-6">{t('comparison.digital.title')}</h3>
                <ul className="space-y-4 text-foreground/80">
                  {Array.isArray(t.raw('comparison.digital.items')) && (t.raw('comparison.digital.items') as string[]).map((item, i) => (
                    <li key={i} className="flex items-start">
                      <ArrowTrendingUpIcon className="w-5 h-5 text-gold-primary mr-3 mt-1 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-background/50 rounded-lg p-6">
              <p className="text-lg leading-relaxed">
                {t('comparison.note')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Miksi digi voi olla järkevämpi */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              {t('whyDigital.title')}
            </h2>

            <div className="text-xl leading-relaxed mb-8">
              <p className="mb-6">
                {t('whyDigital.intro')}
              </p>
            </div>

            <div className="bg-gold-primary/10 rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-semibold text-gold-primary mb-4">
                <CalculatorIcon className="w-6 h-6 inline mr-2" />
                {t('whyDigital.example.title')}
              </h3>
              <div className="space-y-3 text-lg">
                {Array.isArray(t.raw('whyDigital.example.items')) && (t.raw('whyDigital.example.items') as string[]).map((item, i) => (
                  <p key={i}>{i === 4 ? <span className="text-gold-primary font-semibold">{item}</span> : `• ${item}`}</p>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-1 gap-6">
              <div className="bg-background/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  {t('whyDigital.betterWhen.title')}
                </h3>
                <ul className="space-y-3 text-foreground/80">
                  {Array.isArray(t.raw('whyDigital.betterWhen.items')) && (t.raw('whyDigital.betterWhen.items') as string[]).map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-gold-primary mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vältä virheet */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              {t('mistakes.title')}
            </h2>

            <div className="text-lg leading-relaxed mb-8">
              <p>
                {t('mistakes.intro')}
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 inline mr-2" />
                  {t('mistakes.expensive.title')}
                </h3>
                <p className="mb-4">
                  {t('mistakes.expensive.description')}
                </p>
                <div className="bg-red-500/5 rounded p-4">
                  <p className="text-sm">
                    {t('mistakes.expensive.example')}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 inline mr-2" />
                  {t('mistakes.binding.title')}
                </h3>
                <p>
                  {t('mistakes.binding.description')}
                </p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-orange-400 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 inline mr-2" />
                  {t('mistakes.oneOffer.title')}
                </h3>
                <p className="mb-4">
                  {t('mistakes.oneOffer.description')}
                </p>
                <div className="bg-orange-500/5 rounded p-4">
                  <p className="text-sm">
                    {t('mistakes.oneOffer.example')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Paras aika aloittaa */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
              {t('timing.title')}
            </h2>

            <div className="text-xl leading-relaxed mb-8">
              <p className="mb-6">
                {t('timing.intro')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-background/10 rounded-lg p-6 text-left">
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  <ClockIcon className="w-6 h-6 inline mr-2" />
                  {t('timing.startEarly.title')}
                </h3>
                <ul className="space-y-2 text-foreground/80">
                  {Array.isArray(t.raw('timing.startEarly.items')) && (t.raw('timing.startEarly.items') as string[]).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gold-primary/10 rounded-lg p-6 text-left">
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  <ArrowTrendingUpIcon className="w-6 h-6 inline mr-2" />
                  {t('timing.autoScale.title')}
                </h3>
                <p className="text-foreground/80">
                  {t('timing.autoScale.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-gold-primary text-center">
              {t('faq.title')}
            </h2>

            <div className="space-y-6">
              {/* FAQ items */}
              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.speed.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.speed.a')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.cost.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.cost.a')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.notice.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.notice.a')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.collateral.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.collateral.a')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.unpaid.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.unpaid.a')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.smallBusiness.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.smallBusiness.a')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.partial.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.partial.a')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.accounting.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.accounting.a')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.international.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.international.a')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.silent.q')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.silent.a')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gold-primary">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-very-dark">
              {t('cta.title')}
            </h2>
            <p className="text-xl leading-relaxed mb-8 text-gray-very-dark">
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding">
                <Button size="lg" variant="dark" className="w-full sm:w-auto">
                  {t('cta.primary')}
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline-dark" className="w-full sm:w-auto">
                  {t('cta.secondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}