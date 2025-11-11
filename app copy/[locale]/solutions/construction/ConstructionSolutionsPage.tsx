'use client'

import IndustryPageTemplate from '@/components/pages/IndustryPageTemplate'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  HomeIcon,
  TruckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function ConstructionSolutionsPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('ConstructionSolutions')

  // Track industry page visit
  useEffect(() => {
    trackEvent({
      event_type: 'industry_page_visit',
      event_category: 'solutions',
      event_action: 'view',
      event_label: 'construction',
      custom_dimensions: {
        industry: 'construction',
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
      event_label: `construction_${ctaType}_${location}`,
      custom_dimensions: {
        industry: 'construction',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <HomeIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.longProjects.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.longProjects.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.projectFinancing.title')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.factoring.title')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <TruckIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.guarantees.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.guarantees.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.equipmentLeasing.title')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.creditLine.title')}</span>
          </li>
        </ul>
      </div>
    </div>
  )

  const solutionsContent = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.projectFinancing.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('solutions.projectFinancing.description')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.projectFinancing.features')) && (t.raw('solutions.projectFinancing.features') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.equipmentLeasing.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('solutions.equipmentLeasing.description')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.equipmentLeasing.features')) && (t.raw('solutions.equipmentLeasing.features') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.factoring.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('solutions.factoring.description')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.factoring.features')) && (t.raw('solutions.factoring.features') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
    </div>
  )

  return (
    <IndustryPageTemplate
      serviceName={t('hero.title')}
      description={t('hero.description')}
      serviceTypes={[
        t('solutions.projectFinancing.title'),
        t('solutions.equipmentLeasing.title'),
        t('solutions.factoring.title'),
        t('solutions.creditLine.title')
      ]}
      title={t('hero.title')}
      subtitle={t('challenges.subtitle')}
      heroDescription={[
        t('hero.description')
      ]}
      challengesTitle={t('challenges.title')}
      challengesContent={challengesContent}
      solutionsTitle={t('solutions.title')}
      solutionsContent={solutionsContent}
      ctaTitle={t('cta.title')}
      ctaDescription={t('cta.description')}
      primaryCta={t('cta.button')}
      secondaryCta={t('hero.cta')}
      contactCta={t('cta.contactButton')}
      onCTAClick={handleCTAClick}
    />
  )
}