'use client'

import SituationPageTemplate from '@/components/pages/SituationPageTemplate'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  BuildingOffice2Icon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function BusinessAcquisitionsPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('BusinessAcquisitions')

  // Track page visit
  useEffect(() => {
    trackEvent({
      event_type: 'situation_page_visit',
      event_category: 'situations',
      event_action: 'view',
      event_label: 'business-acquisitions',
      custom_dimensions: {
        situation: 'business-acquisitions',
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
      event_label: `business_acquisitions_${ctaType}_${location}`,
      custom_dimensions: {
        situation: 'business-acquisitions',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <BuildingOffice2Icon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenge.amount.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenge.amount.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('financing.acquisitionLoan.title')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('financing.bridgeFinancing.title')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ChartBarIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenge.timeline.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenge.timeline.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenge.timeline.solutions.valuation')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenge.timeline.solutions.riskAnalysis')}</span>
          </li>
        </ul>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <UserGroupIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('labels.integrationFinancing')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenge.integration.description_long')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('financing.paymentTerms.title')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('financing.businessLoan.title')}</span>
          </li>
        </ul>
      </div>
    </div>
  )

  const solutionsContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('financing.acquisitionLoan.title')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('financing.acquisitionLoan.description')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('labels.amount')}</h4>
            <p className="text-sm text-foreground/80">{t('financing.businessLoan.typical')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('labels.paymentTerm')}</h4>
            <p className="text-sm text-foreground/80">{t('financing.businessLoan.duration')}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('financing.acquisitionLoan.benefits')) && (t.raw('financing.acquisitionLoan.benefits') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('financing.bridgeFinancing.title')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('financing.bridgeFinancing.description')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('labels.amount')}</h4>
            <p className="text-sm text-foreground/80">{t('financing.bridgeFinancing.amount')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('labels.time')}</h4>
            <p className="text-sm text-foreground/80">{t('financing.bridgeFinancing.time')}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('financing.bridgeFinancing.benefits')) && (t.raw('financing.bridgeFinancing.benefits') as string[]).map((benefit, i) => (
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
        t('financing.businessLoan.title'),
        t('financing.paymentTerms.title'),
        t('financing.bridgeFinancing.title'),
        t('challenge.integration.title')
      ]}
      title={t('hero.title')}
      subtitle={t('challenge.title')}
      heroDescription={[
        t('hero.description')
      ]}
      challengesTitle={t('challenge.title')}
      challengesContent={challengesContent}
      solutionsTitle={t('financing.title')}
      solutionsContent={solutionsContent}
      ctaTitle={t('cta.title')}
      ctaDescription={t('cta.description')}
      primaryCta={t('cta.button')}
      secondaryCta={t('hero.cta')}
      contactCta={t('cta.contactButton')}
      relatedIndustriesTitle={t('relatedIndustries.title')}
      relatedIndustries={[
        { href: '/solutions/retail', title: t('relatedIndustries.items.0.title'), description: t('relatedIndustries.items.0.description') },
        { href: '/solutions/manufacturing', title: t('relatedIndustries.items.1.title'), description: t('relatedIndustries.items.1.description') },
        { href: '/solutions/technology', title: t('relatedIndustries.items.2.title'), description: t('relatedIndustries.items.2.description') }
      ]}
      relatedResourcesTitle={t('relatedResources.title')}
      relatedResources={[
        { href: '/knowledge/faq', label: t('relatedResources.items.0.label') },
        { href: '/knowledge/glossary', label: t('relatedResources.items.1.label') },
        { href: '/knowledge/guide', label: t('relatedResources.items.2.label') }
      ]}
      onCTAClick={handleCTAClick}
    />
  )
}