'use client'

import { Link } from '@/app/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function AboutPage() {
  const t = useTranslations('About')
  
  const aboutSections = [
    {
      id: 'team',
      titleKey: 'sections.team.title',
      descriptionKey: 'sections.team.description',
      href: '/about/team',
      featureKeys: ['expertise', 'tech', 'international', 'personal']
    },
    {
      id: 'why-trusty',
      titleKey: 'sections.whyTrusty.title',
      descriptionKey: 'sections.whyTrusty.description',
      href: '/about/why-trusty',
      featureKeys: ['ai', 'advisory', 'transparent', 'efficient']
    },
    {
      id: 'customer-stories',
      titleKey: 'sections.customerStories.title',
      descriptionKey: 'sections.customerStories.description',
      href: '/about/customer-stories',
      featureKeys: ['growth', 'successful', 'testimonials', 'results']
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gold-primary mb-4">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t('hero.description')}
        </p>
      </div>

      {/* About Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {aboutSections.map((section) => (
          <Card key={section.id} className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-white">
                {t(section.titleKey as any)}
              </CardTitle>
              <p className="text-muted-foreground">
                {t(section.descriptionKey as any)}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                {section.featureKeys.map((featureKey, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-gold-primary rounded-full"></div>
                    {t(`sections.${section.id.replace('-', '')}.features.${featureKey}` as any)}
                  </li>
                ))}
              </ul>
              <Link href={section.href}>
                <Button className="w-full bg-gold-primary text-gray-900 hover:bg-gold-highlight !bg-[#D4AF37] !text-gray-900">
                  {t(`sections.${section.id.replace('-', '')}.link` as any)}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t('cta.title')}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t('cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/onboarding">
            <Button className="bg-gold-primary text-gray-900 hover:bg-gold-highlight !bg-[#D4AF37] !text-gray-900">
              {t('cta.button')}
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-gray-900">
              {t('sections.team.link')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
