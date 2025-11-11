'use client'

import IndustryPageTemplate from '@/components/pages/IndustryPageTemplate'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  HeartIcon,
  BuildingOfficeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function HealthSolutionsPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('HealthSolutions')

  // Track industry page visit
  useEffect(() => {
    trackEvent({
      event_type: 'industry_page_visit',
      event_category: 'solutions',
      event_action: 'view',
      event_label: 'health',
      custom_dimensions: {
        industry: 'health',
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
      event_label: `health_${ctaType}_${location}`,
      custom_dimensions: {
        industry: 'health',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <HeartIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.equipment.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.equipment.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.equipmentLeasing.title')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.facilityFinancing.title')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <BuildingOfficeIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.facilities.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.facilities.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.factoring.title')}</span>
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
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.facilityFinancing.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('solutions.facilityFinancing.description')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.facilityFinancing.features')) && (t.raw('solutions.facilityFinancing.features') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.creditLine.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('solutions.creditLine.description')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.creditLine.features')) && (t.raw('solutions.creditLine.features') as string[]).map((benefit, i) => (
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
        t('solutions.equipmentLeasing.title'),
        t('solutions.facilityFinancing.title'),
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