'use client'

import SituationPageTemplate from '@/components/pages/SituationPageTemplate'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  CurrencyEuroIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function WorkingCapitalPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('WorkingCapital')

  // Track page visit
  useEffect(() => {
    trackEvent({
      event_type: 'situation_page_visit',
      event_category: 'situations',
      event_action: 'view',
      event_label: 'working-capital',
      custom_dimensions: {
        situation: 'working-capital',
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
      event_label: `working_capital_${ctaType}_${location}`,
      custom_dimensions: {
        situation: 'working-capital',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CurrencyEuroIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.paymentTerms.challenge')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.paymentTerms.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.paymentTerms.solutions.factoring.type')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.paymentTerms.solutions.creditLine.type')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ClockIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.seasonality.challenge')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.seasonality.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.seasonality.solutions.seasonal.type')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.seasonality.solutions.inventory.type')}</span>
          </li>
        </ul>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ChartBarIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.unexpected.challenge')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.unexpected.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.unexpected.solutions.standby.type')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.unexpected.solutions.quick.type')}</span>
          </li>
        </ul>
      </div>
    </div>
  )

  const solutionsContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('challenges.paymentTerms.solutions.factoring.type')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('challenges.paymentTerms.solutions.factoring.how')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{locale === 'sv' ? 'Pengar på konto' : locale === 'en' ? 'Money to account' : 'Rahat tilille'}</h4>
            <p className="text-sm text-foreground/80">24-48 {locale === 'sv' ? 'timmar' : locale === 'en' ? 'hours' : 'tunnissa'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{locale === 'sv' ? 'Andel av faktura' : locale === 'en' ? 'Share of invoice' : 'Osuus laskusta'}</h4>
            <p className="text-sm text-foreground/80">80-90%</p>
          </div>
        </div>
        <p className="text-sm text-foreground/80 font-semibold mb-2">{t('challenges.paymentTerms.solutions.factoring.benefit')}</p>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-gold-primary mb-4">{t('challenges.paymentTerms.solutions.creditLine.type')}</h3>
        <p className="text-foreground/80 mb-6">
          {t('challenges.paymentTerms.solutions.creditLine.how')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{locale === 'sv' ? 'Limit' : locale === 'en' ? 'Limit' : 'Limiitti'}</h4>
            <p className="text-sm text-foreground/80">10 000 - 150 000 €</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">{locale === 'sv' ? 'Användning' : locale === 'en' ? 'Usage' : 'Käyttöönotto'}</h4>
            <p className="text-sm text-foreground/80">{locale === 'sv' ? 'Omedelbart vid behov' : locale === 'en' ? 'Immediately when needed' : 'Heti tarpeen mukaan'}</p>
          </div>
        </div>
        <p className="text-sm text-foreground/80 font-semibold mb-2">{t('challenges.paymentTerms.solutions.creditLine.benefit')}</p>
      </div>
    </div>
  )

  return (
    <SituationPageTemplate
      serviceName={t('hero.title')}
      description={t('hero.description')}
      serviceTypes={[
        t('challenges.paymentTerms.solutions.factoring.type'),
        t('challenges.paymentTerms.solutions.creditLine.type'),
        t('challenges.seasonality.solutions.seasonal.type'),
        t('challenges.seasonality.solutions.inventory.type')
      ]}
      title={t('hero.title')}
      subtitle={t('challenges.subtitle')}
      heroDescription={[
        t('hero.description')
      ]}
      challengesTitle={t('challenges.title')}
      challengesContent={challengesContent}
      solutionsTitle={t('challenges.title')}
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