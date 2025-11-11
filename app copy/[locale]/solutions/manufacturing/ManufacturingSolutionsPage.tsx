'use client'

import IndustryPageTemplate from '@/components/pages/IndustryPageTemplate'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  CogIcon,
  TruckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function ManufacturingSolutionsPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('ManufacturingSolutions')

  // Track industry page visit
  useEffect(() => {
    trackEvent({
      event_type: 'industry_page_visit',
      event_category: 'solutions',
      event_action: 'view',
      event_label: 'manufacturing',
      custom_dimensions: {
        industry: 'manufacturing',
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
      event_label: `manufacturing_${ctaType}_${location}`,
      custom_dimensions: {
        industry: 'manufacturing',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CogIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.equipment.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.equipment.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.equipmentFinancing.title')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.expansionFunding.title')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <TruckIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.inventory.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.inventory.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.workingCapital.title')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.inventoryFinancing.title')}</span>
          </li>
        </ul>
      </div>
    </div>
  )

  const solutionsContent = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.equipmentFinancing.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('solutions.equipmentFinancing.description')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.equipmentFinancing.benefits')) && (t.raw('solutions.equipmentFinancing.benefits') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.workingCapital.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('solutions.workingCapital.description')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.workingCapital.benefits')) && (t.raw('solutions.workingCapital.benefits') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.inventoryFinancing.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('solutions.inventoryFinancing.description')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('solutions.inventoryFinancing.benefits')) && (t.raw('solutions.inventoryFinancing.benefits') as string[]).map((benefit, i) => (
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
        t('solutions.equipmentFinancing.title'),
        t('solutions.workingCapital.title'),
        t('solutions.inventoryFinancing.title'),
        t('solutions.expansionFunding.title')
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