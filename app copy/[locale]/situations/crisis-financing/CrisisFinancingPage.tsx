'use client'

import SituationPageTemplate from '@/components/pages/SituationPageTemplate'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function CrisisFinancingPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('CrisisFinancing')

  // Track page visit
  useEffect(() => {
    trackEvent({
      event_type: 'situation_page_visit',
      event_category: 'situations',
      event_action: 'view',
      event_label: 'crisis-financing',
      custom_dimensions: {
        situation: 'crisis-financing',
        locale: locale
      }
    }).catch(console.error)
  }, [locale])

  // Track CTA clicks
  const handleCTAClick = (ctaType: string, location: string) => {
    trackEvent({
      event_type: 'cta_click',
      event_category: 'engagement',
      event_action: 'click',
      event_label: `crisis_financing_${ctaType}_${location}`,
      custom_dimensions: {
        situation: 'crisis-financing',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.sudden.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.sudden.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.sudden.solutions.quickLoan')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.sudden.solutions.factoring')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ClockIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.marketChange.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.marketChange.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.marketChange.solutions.bridgeLoan')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.marketChange.solutions.restructuringLoan')}</span>
          </li>
        </ul>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.businessRescue.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.businessRescue.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.businessRescue.solutions.restructuringLoan')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.businessRescue.solutions.paymentTerms')}</span>
          </li>
        </ul>
      </div>
    </div>
  )

  const solutionsContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('solutions.quick.title')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('solutions.quick.description')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('solutions.quick.typical')}</h4>
            <p className="text-sm text-foreground/80">{t('solutions.quick.typicalValue')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('solutions.quick.duration')}</h4>
            <p className="text-sm text-foreground/80">{t('solutions.quick.durationValue')}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.quick.benefits')) && (t.raw('solutions.quick.benefits') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('solutions.restructuring.title')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('solutions.restructuring.description')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('solutions.restructuring.typical')}</h4>
            <p className="text-sm text-foreground/80">{t('solutions.restructuring.typicalValue')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('solutions.restructuring.duration')}</h4>
            <p className="text-sm text-foreground/80">{t('solutions.restructuring.durationValue')}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.restructuring.benefits')) && (t.raw('solutions.restructuring.benefits') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
    </div>
  )

  return (
    <SituationPageTemplate
      serviceName={t('hero.title')}
      description={t('hero.description')}
      serviceTypes={[
        t('challenges.sudden.solutions.quickLoan'),
        t('challenges.marketChange.solutions.restructuringLoan'),
        t('challenges.sudden.solutions.factoring'),
        t('challenges.marketChange.solutions.bridgeLoan')
      ]}
      title={t('hero.title')}
      subtitle={t('challenges.subtitle')}
      heroDescription={[
        t('hero.description'),
        t('hero.subtitle')
      ]}
      challengesTitle={t('challenges.title')}
      challengesContent={challengesContent}
      solutionsTitle={t('solutions.title')}
      solutionsContent={solutionsContent}
      ctaTitle={t('cta.title')}
      ctaDescription={t('cta.description')}
      primaryCta={t('cta.button')}
      secondaryCta={t('cta.secondary')}
      onCTAClick={handleCTAClick}
    />
  )
}
