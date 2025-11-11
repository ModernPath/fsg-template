'use client'

import { Link } from '@/app/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import OptimizedImage from '@/components/optimized/OptimizedImage'
import { useTranslations } from 'next-intl'


export default function SituationsPage() {
  const t = useTranslations('Situations')

  const situations = [
    {
      id: 'growth',
      title: t('situations.growth.title'),
      description: t('situations.growth.description'),
      href: '/situations/growth',
      features: t.raw('situations.growth.features')
    },
    {
      id: 'working-capital',
      title: t('situations.working_capital.title'),
      description: t('situations.working_capital.description'),
      href: '/situations/working-capital',
      features: t.raw('situations.working_capital.features')
    },
    {
      id: 'investment',
      title: t('situations.investment.title'),
      description: t('situations.investment.description'),
      href: '/situations/investment',
      features: t.raw('situations.investment.features')
    },
    {
      id: 'business-acquisitions',
      title: t('situations.acquisitions.title'),
      description: t('situations.acquisitions.description'),
      href: '/situations/business-acquisitions',
      features: t.raw('situations.acquisitions.features')
    },
    {
      id: 'crisis-financing',
      title: t('situations.crisis.title'),
      description: t('situations.crisis.description'),
      href: '/situations/crisis-financing',
      features: t.raw('situations.crisis.features')
    }
  ]

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative max-w-[1440px] z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-4xl lg:max-w-none">
                {t('hero.description')}
              </p>
              <div className="flex gap-6 justify-center lg:justify-start">
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
            <div className="order-1 lg:order-2 flex justify-center">
              <OptimizedImage
                src="/images/other/laiskiainen_suurennuslasi.jpeg"
                alt="Laiskiainen suurennuslasilla tutkimassa eri rahoitustilanteita"
                width={500}
                height={400}
                className="object-contain max-w-full h-auto lg:max-w-[450px]"
                placeholder="blur"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Situations Overview */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('sections.identifyTitle')}
            </h2>
            <div className="flex justify-center mb-8">
              <OptimizedImage
                src="/images/other/apina_darts.jpeg"
                alt="Apina heittämässä tikkaa - oikea osuma oikeaan rahoitustilanteeseen"
                width={350}
                height={280}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
              />
            </div>
          </div>

          {/* Situations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
            {situations.map((situation) => (
              <div key={situation.id} className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8 hover:border-gold-primary transition-all duration-300">
                <h3 className="text-2xl font-semibold mb-4 text-white">
                  {situation.title}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {situation.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {situation.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-gold-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={situation.href}>
                  <Button className="w-full bg-gold-primary text-black hover:bg-gold-highlight">
                    {t('sections.exploreButton')}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Trusty Finance */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('whyChoose.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {Array.isArray(t.raw('whyChoose.reasons')) && (t.raw('whyChoose.reasons') as Array<{title: string; description: string}>).map((reason, index) => (
              <div key={index} className="bg-gray-very-dark rounded-2xl shadow-lg shadow-black/30 border border-gray-dark p-8">
                <h3 className="text-xl font-semibold mb-3 text-gold-primary">{reason.title}</h3>
                <p className="text-muted-foreground">{reason.description}</p>
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
