'use client'

import SituationPageTemplate from '@/components/pages/SituationPageTemplate'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  CogIcon,
  BuildingOfficeIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function InvestmentFundingPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('InvestmentFunding')

  // Track page visit
  useEffect(() => {
    trackEvent({
      event_type: 'situation_page_visit',
      event_category: 'situations',
      event_action: 'view',
      event_label: 'investment',
      custom_dimensions: {
        situation: 'investment',
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
      event_label: `investment_${ctaType}_${location}`,
      custom_dimensions: {
        situation: 'investment',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CogIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('types.machinery.type')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('types.machinery.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('types.machinery.solutions.leasing.option')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('types.machinery.solutions.loan.option')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <BuildingOfficeIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('types.property.type')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('types.property.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('types.property.solutions.property.option')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('types.property.solutions.renovation.option')}</span>
          </li>
        </ul>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ComputerDesktopIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('types.technology.type')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('types.technology.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('types.technology.solutions.itLeasing.option')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('types.technology.solutions.digitalization.option')}</span>
          </li>
        </ul>
      </div>
    </div>
  )

  const solutionsContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('types.machinery.solutions.leasing.option')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('types.machinery.solutions.leasing.when')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('comparison.factors.initialCapital.factor')}</h4>
            <p className="text-sm text-foreground/80">{t('comparison.factors.initialCapital.leasing')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('types.machinery.lifespan')}</h4>
            <p className="text-sm text-foreground/80">2-7 {locale === 'sv' ? 'år' : locale === 'en' ? 'years' : 'vuotta'}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('types.machinery.solutions.leasing.benefits')) && (t.raw('types.machinery.solutions.leasing.benefits') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('types.machinery.solutions.loan.option')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('types.machinery.solutions.loan.when')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('types.machinery.typical')}</h4>
            <p className="text-sm text-foreground/80">25 000 - 2 000 000 €</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('types.machinery.lifespan')}</h4>
            <p className="text-sm text-foreground/80">3-15 {locale === 'sv' ? 'år' : locale === 'en' ? 'years' : 'vuotta'}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('types.machinery.solutions.loan.benefits')) && (t.raw('types.machinery.solutions.loan.benefits') as string[]).map((benefit, i) => (
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
        t('types.machinery.solutions.leasing.option'),
        t('types.machinery.solutions.loan.option'),
        t('types.technology.solutions.itLeasing.option'),
        t('types.property.solutions.property.option')
      ]}
      title={t('hero.title')}
      subtitle={t('types.subtitle')}
      heroDescription={[
        t('hero.description')
      ]}
      challengesTitle={t('types.title')}
      challengesContent={challengesContent}
      solutionsTitle={t('comparison.title')}
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