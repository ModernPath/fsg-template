'use client'

import Image from "next/image"
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/Button'
import { Link } from '@/app/i18n/navigation'
import OptimizedImage from '@/components/optimized/OptimizedImage'
import { IconMoney, IconCalculator, IconTarget, IconAward, IconTrendingUp, IconChart, IconShield } from '@/app/components/Icons'

interface Props {
  params: {
    locale: string
  }
}

export default function FundingOptionsPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('FundingOptions')

  const fundingOptions = [
    {
      title: t('options.businessLoan.title'),
      description: t('options.businessLoan.description'),
      href: "/funding/business-loan",
      icon: IconMoney,
      features: Array.isArray(t.raw('options.businessLoan.features')) 
        ? (t.raw('options.businessLoan.features') as string[])
        : [],
      idealFor: t('options.businessLoan.idealFor')
    },
    {
      title: t('options.creditLine.title'),
      description: t('options.creditLine.description'),
      href: "/funding/credit-line",
      icon: IconCalculator,
      features: Array.isArray(t.raw('options.creditLine.features')) 
        ? (t.raw('options.creditLine.features') as string[])
        : [],
      idealFor: t('options.creditLine.idealFor')
    },
    {
      title: t('options.factoring.title'),
      description: t('options.factoring.description'),
      href: "/funding/factoring-ar",
      icon: IconTarget,
      features: Array.isArray(t.raw('options.factoring.features')) 
        ? (t.raw('options.factoring.features') as string[])
        : [],
      idealFor: t('options.factoring.idealFor')
    },
    {
      title: t('options.leasing.title'),
      description: t('options.leasing.description'),
      href: "/funding/leasing",
      icon: IconAward,
      features: Array.isArray(t.raw('options.leasing.features')) 
        ? (t.raw('options.leasing.features') as string[])
        : [],
      idealFor: t('options.leasing.idealFor')
    }
  ]

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-8 text-gold-primary">
              {t('hero.title')}
            </h1>
            
            <div className="text-lg sm:text-xl lg:text-2xl leading-relaxed mb-12 max-w-4xl">
              <p className="mb-8 text-foreground/80">
                {t('hero.description')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                href="/onboarding"
                size="lg"
                className="h-16 px-12 text-xl font-semibold bg-gold-primary hover:bg-gold-highlight text-black rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {t('hero.cta')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Rahoitusvaihtoehdot Grid */}
      <section className="relative py-20 bg-gray-very-dark">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-8 text-gold-primary">
              {t('sections.findRight.title')}
            </h2>
            <div className="flex justify-center mb-8">
              <OptimizedImage
                src="/images/other/osoittava_laiskiainen.jpeg"
                alt="Osoittava laiskiainen - neuvoo oikean rahoitusvaihtoehdon löytämisessä"
                width={400}
                height={320}
                className="object-contain max-w-full h-auto"
                placeholder="blur"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {fundingOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <div key={index} className="group">
                  <div className="p-8 rounded-2xl bg-card border border-gold-primary/20 hover:border-gold-primary/40 transition-all duration-300 h-full">
                    <div className="flex items-start gap-6 mb-6">
                      <div className="w-16 h-16 bg-gold-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <IconComponent className="w-8 h-8 text-gold-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-3 text-gold-primary">{option.title}</h3>
                        <p className="text-lg text-foreground/80 mb-6">{option.description}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-4 text-gold-primary">{t('sections.features')}</h4>
                      <ul className="space-y-2">
                        {option.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-gold-primary mt-2 shrink-0"></div>
                            <span className="text-foreground/90">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-lg font-semibold mb-3 text-gold-primary">{t('sections.idealFor')}</h4>
                      <p className="text-foreground/80">{option.idealFor}</p>
                    </div>

                    <Link
                      href={option.href}
                      className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-gold-primary hover:bg-gold-highlight text-black font-semibold transition-all duration-300 group-hover:scale-105"
                    >
                      {t('sections.readMore')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vertailuosio */}
      <section className="relative py-20 bg-background">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary text-center">
              {t('sections.comparisonTable.title')}
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gold-primary/20 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gold-primary/10">
                    <th className="border border-gold-primary/20 p-4 text-left font-semibold text-gold-primary">{t('sections.comparisonTable.headers.situation')}</th>
                    <th className="border border-gold-primary/20 p-4 text-left font-semibold text-gold-primary">{t('sections.comparisonTable.headers.bestOption')}</th>
                    <th className="border border-gold-primary/20 p-4 text-left font-semibold text-gold-primary">{t('sections.comparisonTable.headers.why')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(t.raw('sections.comparisonTable.rows')) && (t.raw('sections.comparisonTable.rows') as Array<{situation: string; bestOption: string; why: string}>).map((row, index) => (
                    <tr key={index} className={index % 2 === 1 ? "bg-card/30" : ""}>
                      <td className="border border-gold-primary/20 p-4">{row.situation}</td>
                      <td className="border border-gold-primary/20 p-4 text-gold-primary font-semibold">{row.bestOption}</td>
                      <td className="border border-gold-primary/20 p-4">{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gray-very-dark text-center">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
            {t('sections.finalCta.title')}
          </h2>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('sections.finalCta.description')}
          </p>
          <Button
            href="/onboarding"
            size="lg"
            className="h-16 px-12 text-xl font-semibold bg-gold-primary hover:bg-gold-highlight text-black rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            {t('sections.finalCta.button')}
          </Button>
        </div>
      </section>
    </main>
  )
} 
