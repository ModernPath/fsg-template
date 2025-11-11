'use client'

import IndustryPageTemplate from '@/components/pages/IndustryPageTemplate'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  CheckCircleIcon, 
  ComputerDesktopIcon,
  RocketLaunchIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface Props {
  params: {
    locale: string
  }
}

export default function TechnologySolutionsPage({ params }: Props) {
  const { locale } = params
  const t = useTranslations('TechnologySolutions')

  // Track industry page visit
  useEffect(() => {
    trackEvent({
      event_type: 'industry_page_visit',
      event_category: 'solutions',
      event_action: 'view',
      event_label: 'technology',
      custom_dimensions: {
        industry: 'technology',
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
      event_label: `technology_${ctaType}_${location}`,
      custom_dimensions: {
        industry: 'technology',
        cta_type: ctaType,
        location: location
      }
    }).catch(console.error)
  }

  const challengesContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ComputerDesktopIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.development.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.development.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.development.solutions.rdLoan.type')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.scaling.title')}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <UserGroupIcon className="w-8 h-8 text-gold-primary mr-3" />
          <h3 className="text-xl font-semibold text-foreground">{t('challenges.scaling.title')}</h3>
        </div>
        <p className="text-foreground/80 mb-4">
          {t('challenges.scaling.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.scaling.solutions.scaleUp.type')}</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-gold-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/80">{t('challenges.scaling.solutions.revenueBased.type')}</span>
          </li>
        </ul>
      </div>
    </div>
  )

  const solutionsContent = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('products.revenueBased.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('challenges.scaling.solutions.revenueBased.why')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('products.revenueBased.features')) && (t.raw('products.revenueBased.features') as string[]).map((feature, i) => (
            <li key={i}>• {feature}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('products.mrrBased.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('challenges.scaling.solutions.revenueBased.why')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('products.mrrBased.features')) && (t.raw('products.mrrBased.features') as string[]).map((feature, i) => (
            <li key={i}>• {feature}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('products.deepTech.title')}</h3>
        <p className="text-foreground/80 mb-4">
          {t('challenges.development.solutions.rdLoan.why')}
        </p>
        <ul className="space-y-2 text-sm">
          {Array.isArray(t.raw('products.deepTech.features')) && (t.raw('products.deepTech.features') as string[]).map((feature, i) => (
            <li key={i}>• {feature}</li>
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
        t('products.revenueBased.title'),
        t('products.mrrBased.title'),
        t('products.deepTech.title'),
        t('challenges.scaling.solutions.scaleUp.type')
      ]}
      title={t('hero.title')}
      subtitle={t('challenges.subtitle')}
      heroDescription={[
        t('hero.description')
      ]}
      challengesTitle={t('challenges.title')}
      challengesContent={challengesContent}
      solutionsTitle={t('products.title')}
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