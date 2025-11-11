'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/app/i18n/navigation'
import { 
  BookOpenIcon, 
  CalculatorIcon, 
  BookmarkIcon, 
  QuestionMarkCircleIcon,
  ArrowRightIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

export default function KnowledgeBankPage() {
  const t = useTranslations('KnowledgeBank')

  const knowledgeAreas = [
    {
      id: 'guide',
      title: t('guide.title'),
      description: t('guide.description'),
      icon: BookOpenIcon,
      href: '/knowledge/guide',
      color: 'bg-blue-500',
      items: [
        t('guide.items.basics'),
        t('guide.items.types'),
        t('guide.items.process'),
        t('guide.items.tips')
      ]
    },
    {
      id: 'calculators',
      title: t('calculators.title'),
      description: t('calculators.description'),
      icon: CalculatorIcon,
      href: '/knowledge/calculators',
      color: 'bg-green-500',
      items: [
        t('calculators.items.cashflow'),
        t('calculators.items.loan'),
        t('calculators.items.roi'),
        t('calculators.items.factoring')
      ]
    },
    {
      id: 'glossary',
      title: t('glossary.title'),
      description: t('glossary.description'),
      icon: BookmarkIcon,
      href: '/knowledge/glossary',
      color: 'bg-purple-500',
      items: [
        t('glossary.items.terms'),
        t('glossary.items.ratios'),
        t('glossary.items.types'),
        t('glossary.items.institutions')
      ]
    },
    {
      id: 'faq',
      title: t('faq.title'),
      description: t('faq.description'),
      icon: QuestionMarkCircleIcon,
      href: '/knowledge/faq',
      color: 'bg-orange-500',
      items: [
        t('faq.items.general'),
        t('faq.items.application'),
        t('faq.items.requirements'),
        t('faq.items.process')
      ]
    }
  ]

  const featuredResources = [
    {
      title: t('featured.cashflow.title'),
      description: t('featured.cashflow.description'),
      icon: ChartBarIcon,
      href: '/knowledge/calculators/cashflow',
      type: t('featured.cashflow.type')
    },
    {
      title: t('featured.loanComparison.title'), 
      description: t('featured.loanComparison.description'),
      icon: CurrencyEuroIcon,
      href: '/knowledge/calculators/loan-comparison',
      type: t('featured.loanComparison.type')
    },
    {
      title: t('featured.beginnerGuide.title'),
      description: t('featured.beginnerGuide.description'),
      icon: DocumentTextIcon,
      href: '/knowledge/guide/getting-started',
      type: t('featured.beginnerGuide.type')
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              {t('hero.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/knowledge/guide"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <BookOpenIcon className="h-5 w-5 mr-2" />
                {t('hero.cta.guide')}
              </Link>
              <Link
                href="/knowledge/calculators"
                className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 border border-input rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <CalculatorIcon className="h-5 w-5 mr-2" />
                {t('hero.cta.calculators')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Knowledge Areas */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('areas.title')}
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12">
            {t('areas.description')}
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {knowledgeAreas.map((area) => (
              <div key={area.id} className="bg-card border rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4 mb-6">
                  <div className={`${area.color} p-3 rounded-lg text-white`}>
                    <area.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {area.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {area.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {area.items.map((item, index) => (
                    <li key={index} className="flex items-center text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href={area.href}
                  className="inline-flex items-center text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  {t('areas.explore')}
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Resources */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {t('featured.title')}
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-12">
              {t('featured.description')}
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredResources.map((resource, index) => (
                <Link
                  key={index}
                  href={resource.href}
                  className="bg-card border rounded-lg p-6 hover:shadow-md transition-all hover:scale-105"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <resource.icon className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      {resource.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {resource.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {t('cta.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/finance-application"
                className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                {t('cta.analyze')}
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 border border-input rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cta.contact')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
