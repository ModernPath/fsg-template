'use client'

import SituationPageTemplate from '@/components/pages/SituationPageTemplate'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  RocketLaunchIcon,
  UserGroupIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function GrowthFundingPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('GrowthFunding')

  // Track page visit
  useEffect(() => {
    trackEvent({
      event_type: 'situation_page_visit',
      event_category: 'situations',
      event_action: 'view',
      event_label: 'growth',
      custom_dimensions: {
        situation: 'growth',
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
      event_label: `growth_${ctaType}_${location}`,
      custom_dimensions: {
        situation: 'growth',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <RocketLaunchIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('labels.rapidScaling')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('phases.startupToGrowth.challenge_description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('phases.startupToGrowth.solutions.growth.type')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('phases.startupToGrowth.solutions.staff.type')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <UserGroupIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('phases.domesticToInternational.challenge')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('phases.domesticToInternational.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('phases.domesticToInternational.solutions.international.type')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('phases.domesticToInternational.solutions.workingCapital.link_text')}</span>
          </li>
        </ul>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <GlobeAltIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('phases.marketExpansion.challenge')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('phases.domesticToInternational.challenge_description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('phases.domesticToInternational.solutions.international.link_text')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('phases.domesticToInternational.solutions.workingCapital.link_text')}</span>
          </li>
        </ul>
      </div>
    </div>
  )

  const solutionsContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('phases.startupToGrowth.solutions.growth.type')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('phases.startupToGrowth.solutions.growth.description')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('labels.amount')}</h4>
            <p className="text-sm text-foreground/80">{t('phases.startupToGrowth.solutions.growth.amount')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('labels.paymentTerm')}</h4>
            <p className="text-sm text-foreground/80">2-7 {locale === 'sv' ? 'år' : locale === 'en' ? 'years' : 'vuotta'}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('phases.startupToGrowth.solutions.growth.benefits')) && (t.raw('phases.startupToGrowth.solutions.growth.benefits') as string[]).map((benefit, i) => (
            <li key={i}>• {benefit}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('phases.startupToGrowth.solutions.staff.type')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('phases.startupToGrowth.solutions.staff.description')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('labels.amount')}</h4>
            <p className="text-sm text-foreground/80">{t('phases.startupToGrowth.solutions.staff.amount')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t('labels.paymentTerm')}</h4>
            <p className="text-sm text-foreground/80">6-24 {locale === 'sv' ? 'månader' : locale === 'en' ? 'months' : 'kuukautta'}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('phases.startupToGrowth.solutions.staff.benefits')) && (t.raw('phases.startupToGrowth.solutions.staff.benefits') as string[]).map((benefit, i) => (
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
        t('phases.startupToGrowth.solutions.growth.type'),
        t('phases.startupToGrowth.solutions.staff.type'),
        t('phases.domesticToInternational.solutions.international.type'),
        t('phases.domesticToInternational.solutions.workingCapital.type')
      ]}
      title={t('hero.title')}
      subtitle={t('phases.subtitle')}
      heroDescription={[
        t('hero.description')
      ]}
      challengesTitle={t('phases.title')}
      challengesContent={challengesContent}
      solutionsTitle={t('phases.title')}
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