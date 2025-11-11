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
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import ServiceSchema from '@/components/seo/ServiceSchema'

interface Props {
  params: {
    locale: string
  }
}

export default function CreditLinePage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('CreditLine')

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* SEO Schema Markup */}
      <ServiceSchema
        serviceName={t('hero.title')}
        description={t('hero.description')}
        serviceArea="Finland"
        serviceType="Credit Line"
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
                {t('hero.description2')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/onboarding">
                <Button size="lg" className="w-full sm:w-auto">
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

      {/* Milloin yritysluottolimiitti on järkevä valinta */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gold-primary text-center">
              {t('whenWhy.title')}
            </h2>
            <div className="flex justify-center mb-8">
              <OptimizedImage
                src="/images/other/huvipuisto.jpeg"
                alt="Huvipuisto - yritysluottolimiitti joustavuus ja vaihtelu"
                width={400}
                height={320}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
              />
            </div>
            
            <div className="text-xl leading-relaxed mb-12">
              <p className="mb-6">
                {t('whenWhy.description')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-background/10 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gold-primary">{t('whenWhy.bestWhen')}</h3>
                </div>
                <ul className="space-y-3 text-foreground/80">
                  <li className="flex items-start">
                    <span className="text-gold-primary mr-2">•</span>
                    {t('whenWhy.points.0')}
                  </li>
                  <li className="flex items-start">
                    <span className="text-gold-primary mr-2">•</span>
                    {t('whenWhy.points.1')}
                  </li>
                  <li className="flex items-start">
                    <span className="text-gold-primary mr-2">•</span>
                    {t('whenWhy.points.2')}
                  </li>
                  <li className="flex items-start">
                    <span className="text-gold-primary mr-2">•</span>
                    {t('whenWhy.points.3')}
                  </li>
                  <li className="flex items-start">
                    <span className="text-gold-primary mr-2">•</span>
                    {t('whenWhy.points.4')}
                  </li>
                  <li className="flex items-start">
                    <span className="text-gold-primary mr-2">•</span>
                    {t('whenWhy.points.5')}
                  </li>
                </ul>
              </div>

              <div className="bg-background/10 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gold-primary">{t('whenWhy.notSuitable.title')}</h3>
                </div>
                <ul className="space-y-3 text-foreground/80">
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {t('whenWhy.notSuitable.points.0')}
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {t('whenWhy.notSuitable.points.1')}
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {t('whenWhy.notSuitable.points.2')}
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {t('whenWhy.notSuitable.points.3')}
                  </li>
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
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    {t('comparison.traditional.points.0')}
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    {t('comparison.traditional.points.1')}
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    {t('comparison.traditional.points.2')}
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    {t('comparison.traditional.points.3')}
                  </li>
                </ul>
              </div>

              <div className="bg-gold-primary/10 rounded-lg p-8">
                <h3 className="text-2xl font-semibold text-gold-primary mb-6">{t('comparison.digital.title')}</h3>
                <ul className="space-y-4 text-foreground/80">
                  <li className="flex items-start">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-gold-primary mr-3 mt-1 flex-shrink-0" />
                    {t('comparison.digital.points.0')}
                  </li>
                  <li className="flex items-start">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-gold-primary mr-3 mt-1 flex-shrink-0" />
                    {t('comparison.digital.points.1')}
                  </li>
                  <li className="flex items-start">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-gold-primary mr-3 mt-1 flex-shrink-0" />
                    {t('comparison.digital.points.2')}
                  </li>
                  <li className="flex items-start">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-gold-primary mr-3 mt-1 flex-shrink-0" />
                    {t('comparison.digital.points.3')}
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-background/50 rounded-lg p-6">
              <p className="text-lg leading-relaxed">
                {t('comparisonDetail.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Digital Section */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              {t('whyDigital.title')}
            </h2>

            <div className="text-xl leading-relaxed mb-8">
              <p className="mb-6">
                {t('whyDigital.description')}
              </p>
            </div>

            <div className="bg-gold-primary/10 rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-semibold text-gold-primary mb-4">
                <CalculatorIcon className="w-6 h-6 inline mr-2" />
                {t('whyDigital.example.title')}
              </h3>
              <div className="space-y-3 text-lg">
                {Array.isArray(t.raw('whyDigital.example.points')) && Object.entries(t.raw('whyDigital.example.points') as Record<string, string>).map(([key, point], index) => (
                  <p key={key} className={index === 4 ? "text-gold-primary font-semibold" : ""}>• {point}</p>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-1 gap-6">
              <div className="bg-background/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  {t('whyDigital.betterChoice.title')}
                </h3>
                <ul className="space-y-3 text-foreground/80">
                  {Array.isArray(t.raw('whyDigital.betterChoice.points')) && Object.entries(t.raw('whyDigital.betterChoice.points') as Record<string, string>).map(([key, point]) => (
                    <li key={key} className="flex items-start">
                      <span className="text-gold-primary mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mistakes Section */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              {t('mistakes.title')}
            </h2>

            <div className="text-lg leading-relaxed mb-8">
              <p>
                {t('mistakes.description')}
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 inline mr-2" />
                  {t('mistakes.tooSmall.title')}
                </h3>
                <p className="mb-4">
                  {t('mistakes.tooSmall.description')}
                </p>
                <div className="bg-red-500/5 rounded p-4">
                  <p className="text-sm">
                    <strong>{locale === 'sv' ? 'Exempel' : locale === 'en' ? 'Example' : 'Esimerkki'}:</strong> {t('mistakes.tooSmall.example')}
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 inline mr-2" />
                  {t('mistakes.fullUsage.title')}
                </h3>
                <p className="mb-4 text-foreground/80">
                  {t('mistakes.fullUsage.description')}
                </p>
                <div className="bg-muted rounded p-4">
                  <p className="text-sm text-foreground/70">
                    <strong>{locale === 'sv' ? 'Exempel' : locale === 'en' ? 'Example' : 'Esimerkki'}:</strong> {t('mistakes.fullUsage.example')}
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 inline mr-2" />
                  {t('mistakes.singleOffer.title')}
                </h3>
                <p className="text-foreground/80">
                  {t('mistakes.singleOffer.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Paras aika hakea */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
              {t('bestTime.title')}
            </h2>

            <div className="text-xl leading-relaxed mb-8">
              <p className="mb-6">
                {t('bestTime.description')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-background/10 rounded-lg p-6 text-left">
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  <ClockIcon className="w-6 h-6 inline mr-2" />
                  {t('bestTime.proactive.title')}
                </h3>
                <ul className="space-y-2 text-foreground/80">
                  {Array.isArray(t.raw('bestTime.proactive.points')) && Object.entries(t.raw('bestTime.proactive.points') as Record<string, string>).map(([key, point]) => (
                    <li key={key}>• {point}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gold-primary/10 rounded-lg p-6 text-left">
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  <ShieldCheckIcon className="w-6 h-6 inline mr-2" />
                  {t('bestTime.insurance.title')}
                </h3>
                <p className="text-foreground/80">
                  {t('bestTime.insurance.description')}
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
              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q1.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q1.answer')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q2.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q2.answer')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q3.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q3.answer')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q4.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q4.answer')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q5.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q5.answer')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q6.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q6.answer')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q7.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q7.answer')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q8.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q8.answer')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q9.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q9.answer')}
                </p>
              </div>

              <div className="bg-gray-very-dark rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gold-primary mb-3">
                  {t('faq.questions.q10.question')}
                </h3>
                <p className="text-foreground/80">
                  {t('faq.questions.q10.answer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">
              Varmista kassavirta yritysluottolimiitillä
            </h2>
            <p className="text-xl leading-relaxed mb-8 text-muted-foreground">
              Hae yritysluottolimiitti verkossa ja saa joustava puskuri kassavirran vaihteluihin. 
              Kilpailuta vaihtoehdot ja löydä yrityksellesi paras limiittiratkaisu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding">
                <Button size="lg" variant="dark" className="w-full sm:w-auto">
                  Hae yritysluottolimiittiä
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline-dark" className="w-full sm:w-auto">
                  {t('cta.secondaryButton')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}