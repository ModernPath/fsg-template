'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/app/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CustomerStoriesPage() {
  const t = useTranslations('CustomerStories')
  
  // Get stories from translations
  const stories = t.raw('successStories.stories')
  const customerStories = Object.values(stories).map((story: any) => ({
    ...story,
    id: story.company.toLowerCase().replace(/ /g, '-')
  }))

  // Get process steps from translations
  const processSteps = t.raw('process.steps')

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

      {/* Customer Stories */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t('successStories.title')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {customerStories.map((story: any) => (
            <Card key={story.id} className="bg-card border-border shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardTitle className="text-xl font-semibold text-white">
                      {story.company}
                    </CardTitle>
                    <p className="text-gold-primary font-medium">{story.industry}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{t('successStories.labels.financing')}</div>
                    <div className="text-lg font-bold text-gold-primary">{story.amount}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('successStories.labels.processTime')}:</span>
                    <span className="ml-2 font-semibold text-white">{story.timeline}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('successStories.labels.savings')}:</span>
                    <span className="ml-2 font-semibold text-gold-primary">{story.savings}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">{t('successStories.labels.challenge')}</h4>
                  <p className="text-sm text-muted-foreground">{story.challenge}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">{t('successStories.labels.solution')}</h4>
                  <p className="text-sm text-muted-foreground">{story.solution}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">{t('successStories.labels.results')}</h4>
                  <ul className="space-y-1">
                    {story.results.map((result: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-gold-primary rounded-full"></div>
                        {result}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="text-gold-primary text-lg mb-2">"</div>
                  <p className="text-sm text-muted-foreground italic mb-3">
                    {story.testimonial}
                  </p>
                  <div className="text-sm">
                    <div className="font-semibold text-white">{story.author}</div>
                    <div className="text-gold-primary">{story.company}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Process Overview */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t('process.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.isArray(processSteps) && processSteps.map((step: any, index: number) => (
            <div key={index} className="text-center">
              <div className="bg-gold-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-gold-primary">{step.number}</span>
              </div>
              <h3 className="font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          {t('cta.title')}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t('cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/onboarding">
            <Button className="bg-gold-primary text-black hover:bg-gold-highlight">
              {t('cta.startButton')}
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" className="border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-black">
              {t('cta.backButton')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
