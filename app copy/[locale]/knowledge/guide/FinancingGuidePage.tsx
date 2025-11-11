'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/app/i18n/navigation'
import { 
  BookOpenIcon,
  LightBulbIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function FinancingGuidePage() {
  const t = useTranslations('FinancingGuide')

  const guideSteps = [
    {
      id: 'assess',
      title: t('steps.assess.title'),
      description: t('steps.assess.description'),
      icon: ChartBarIcon,
      content: [
        t('steps.assess.items.cashflow'),
        t('steps.assess.items.statements'),
        t('steps.assess.items.future'),
        t('steps.assess.items.amount')
      ]
    },
    {
      id: 'explore',
      title: t('steps.explore.title'),
      description: t('steps.explore.description'),
      icon: CurrencyEuroIcon,
      content: [
        t('steps.explore.items.business_loan'),
        t('steps.explore.items.credit_line'),
        t('steps.explore.items.factoring'),
        t('steps.explore.items.leasing')
      ]
    },
    {
      id: 'prepare',
      title: t('steps.prepare.title'),
      description: t('steps.prepare.description'),
      icon: DocumentTextIcon,
      content: [
        t('steps.prepare.items.financials'),
        t('steps.prepare.items.business_plan'),
        t('steps.prepare.items.credit_report'),
        t('steps.prepare.items.additional')
      ]
    },
    {
      id: 'apply',
      title: t('steps.apply.title'),
      description: t('steps.apply.description'),
      icon: UserGroupIcon,
      content: [
        t('steps.apply.items.research'),
        t('steps.apply.items.compare'),
        t('steps.apply.items.submit'),
        t('steps.apply.items.follow_up')
      ]
    }
  ]

  const tips = [
    {
      title: t('tips.timing.title'),
      description: t('tips.timing.description'),
      icon: ClockIcon
    },
    {
      title: t('tips.preparation.title'),
      description: t('tips.preparation.description'),
      icon: CheckCircleIcon
    },
    {
      title: t('tips.relationships.title'),
      description: t('tips.relationships.description'),
      icon: UserGroupIcon
    },
    {
      title: t('tips.alternatives.title'),
      description: t('tips.alternatives.description'),
      icon: LightBulbIcon
    }
  ]

  const commonMistakes = [
    t('mistakes.insufficient_planning'),
    t('mistakes.poor_timing'),
    t('mistakes.incomplete_documentation'),
    t('mistakes.unrealistic_expectations'),
    t('mistakes.single_option'),
    t('mistakes.cash_flow_neglect')
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/knowledge"
              className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-6"
            >
              <ArrowRightIcon className="h-4 w-4 mr-2 rotate-180" />
              {t('navigation.back')}
            </Link>
            
            <div className="flex items-start space-x-6 mb-8">
              <div className="bg-primary p-4 rounded-xl text-primary-foreground">
                <BookOpenIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                  {t('hero.title')}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground">
                  {t('hero.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Steps */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('process.title')}
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12">
            {t('process.description')}
          </p>

          <div className="space-y-12">
            {guideSteps.map((step, index) => (
              <div key={step.id} className="relative">
                {index < guideSteps.length - 1 && (
                  <div className="absolute left-8 top-20 w-0.5 h-20 bg-border" />
                )}
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-center space-x-4 md:w-80">
                    <div className="bg-primary p-4 rounded-xl text-primary-foreground">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary mb-1">
                        {t('process.step')} {index + 1}
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-card border rounded-lg p-6">
                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Tips */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {t('tips.title')}
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-12">
              {t('tips.description')}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {tips.map((tip, index) => (
                <div key={index} className="bg-card border rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <tip.icon className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {tip.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Common Mistakes */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-4 bg-orange-100 dark:bg-orange-900/20 rounded-xl mb-6">
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('mistakes.title')}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('mistakes.description')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {commonMistakes.map((mistake, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    {mistake}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 py-16">
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
                href="/knowledge/calculators"
                className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 border border-input rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cta.calculators')}
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
