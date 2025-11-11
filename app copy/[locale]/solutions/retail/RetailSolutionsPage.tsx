'use client'

import IndustryPageTemplate from '@/components/pages/IndustryPageTemplate'
import { Link } from '@/app/i18n/navigation'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  ShoppingCartIcon,
  CurrencyEuroIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function RetailSolutionsPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('RetailSolutions')

  // Track industry page visit
  useEffect(() => {
    trackEvent({
      event_type: 'industry_page_visit',
      event_category: 'solutions',
      event_action: 'view',
      event_label: 'retail',
      custom_dimensions: {
        industry: 'retail',
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
      event_label: `retail_${ctaType}_${location}`,
      custom_dimensions: {
        industry: 'retail',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ShoppingCartIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.inventory.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.inventory.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.inventory.title')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('solutions.creditLine.title')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CurrencyEuroIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.cashFlow.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.cashFlow.description')}
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.inventory.title')}</h3>
          <p className="text-foreground/80 mb-4">
            {t('solutions.inventory.description')}
          </p>
          <ul className="space-y-2 text-sm mb-4">
            {Array.isArray(t.raw('solutions.inventory.benefits')) && (t.raw('solutions.inventory.benefits') as string[]).slice(0, 3).map((benefit, i) => (
              <li key={i}>• {benefit}</li>
            ))}
          </ul>
          <Link href="/funding/business-loan" className="text-gold-primary hover:text-gold-highlight text-sm font-medium">
            {t('solutions.inventory.readMore')} →
          </Link>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.factoring.title')}</h3>
          <p className="text-foreground/80 mb-4">
            {t('solutions.factoring.description')}
          </p>
          <ul className="space-y-2 text-sm mb-4">
            {Array.isArray(t.raw('solutions.factoring.benefits')) && (t.raw('solutions.factoring.benefits') as string[]).slice(0, 3).map((benefit, i) => (
              <li key={i}>• {benefit}</li>
            ))}
          </ul>
          <Link href="/funding/factoring-ar" className="text-gold-primary hover:text-gold-highlight text-sm font-medium">
            {t('solutions.factoring.readMore')} →
          </Link>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('solutions.creditLine.title')}</h3>
          <p className="text-foreground/80 mb-4">
            {t('solutions.creditLine.description')}
          </p>
          <ul className="space-y-2 text-sm mb-4">
            {Array.isArray(t.raw('solutions.creditLine.benefits')) && (t.raw('solutions.creditLine.benefits') as string[]).slice(0, 3).map((benefit, i) => (
              <li key={i}>• {benefit}</li>
            ))}
          </ul>
          <Link href="/funding/credit-line" className="text-gold-primary hover:text-gold-highlight text-sm font-medium">
            {t('solutions.creditLine.readMore')} →
          </Link>
        </div>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('retailSpecificNeeds.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('retailSpecificNeeds.description')}
        </p>
        <div className="flex flex-wrap gap-3">
          {Array.isArray(t.raw('retailSpecificNeeds.points')) && (t.raw('retailSpecificNeeds.points') as string[]).map((point, i) => (
            <div key={i} className="inline-flex items-center px-3 py-2 bg-card border border-border rounded-lg text-sm">
              • {point}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <IndustryPageTemplate
      serviceName={t('hero.title')}
      description={t('hero.description')}
      serviceTypes={[
        t('solutions.inventory.title'),
        t('solutions.creditLine.title'),
        t('solutions.factoring.title'),
        t('solutions.leasing.title')
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