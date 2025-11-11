'use client'

import { Link } from '@/app/i18n/navigation'
import { Button } from '@/app/components/Button'
import OptimizedImage from '@/components/optimized/OptimizedImage'
import ServiceSchema from '@/components/seo/ServiceSchema'
import { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

interface IndustryPageTemplateProps {
  // SEO
  serviceName: string
  description: string
  serviceTypes: string[]
  
  // Hero section
  title: string
  subtitle: string
  heroDescription: string[]
  
  // Main content sections
  challengesTitle: string
  challengesContent?: ReactNode
  solutionsTitle: string
  solutionsContent?: ReactNode
  
  // CTA
  ctaTitle: string
  ctaDescription: string
  primaryCta: string
  secondaryCta?: string
  contactCta?: string
  
  // Optional image
  heroImage?: string
  
  // Analytics
  onCTAClick?: (ctaType: string, location: string) => void
}

export default function IndustryPageTemplate({
  serviceName,
  description,
  serviceTypes,
  title,
  subtitle,
  heroDescription,
  challengesTitle,
  challengesContent,
  solutionsTitle,
  solutionsContent,
  ctaTitle,
  ctaDescription,
  primaryCta,
  secondaryCta,
  contactCta,
  heroImage,
  onCTAClick
}: IndustryPageTemplateProps) {
  const t = useTranslations('Common')
  
  return (
    <>
      <ServiceSchema
        serviceName={serviceName}
        description={description}
        serviceArea="Finland"
        serviceType={serviceTypes}
      />
      
      <main className="flex flex-col bg-background text-foreground">
        {/* Hero Section */}
        <section className="relative bg-background overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
          <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
            <div className="max-w-4xl mx-auto text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-8 text-gold-primary">
                {title}
              </h1>
              
              <div className="text-lg sm:text-xl lg:text-2xl leading-relaxed mb-12 max-w-4xl">
                {heroDescription.map((paragraph, index) => (
                  <p key={index} className="mb-8 text-foreground/80">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/onboarding">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto"
                    onClick={() => onCTAClick?.('onboarding', 'hero')}
                  >
                    {primaryCta}
                  </Button>
                </Link>
                {secondaryCta && (
                  <Link href="#ratkaisut">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      {secondaryCta}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Challenges Section */}
        <section className="relative py-20 bg-gray-very-dark">
          <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gold-primary text-center">
                {challengesTitle}
              </h2>
              {heroImage && (
                <div className="flex justify-center mb-8">
                  <OptimizedImage
                    src={heroImage}
                    alt={subtitle}
                    width={600}
                    height={400}
                    className="rounded-lg shadow-lg"
                  />
                </div>
              )}
              {challengesContent}
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section className="relative py-20 bg-background" id="ratkaisut">
          <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gold-primary text-center">
                {solutionsTitle}
              </h2>
              {solutionsContent}
            </div>
          </div>
        </section>

        {/* Related Solutions - Hidden until properly localized */}
        <section className="relative py-20 bg-muted/30" style={{display: 'none'}}>
          <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gold-primary text-center">
                Liittyvät rahoitustilanteet
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Link href="/situations/growth" className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <h3 className="text-lg font-semibold text-gold-primary mb-2">Kasvun rahoitus</h3>
                  <p className="text-sm text-foreground/80">Skaalaa liiketoimintaasi oikealla rahoituksella</p>
                </Link>
                <Link href="/situations/working-capital" className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <h3 className="text-lg font-semibold text-gold-primary mb-2">Käyttöpääoma</h3>
                  <p className="text-sm text-foreground/80">Hallitse kassavirtaa ja sesonkivaihteluita</p>
                </Link>
                <Link href="/situations/investment" className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                  <h3 className="text-lg font-semibold text-gold-primary mb-2">Investoinnit</h3>
                  <p className="text-sm text-foreground/80">Rahoita koneet, laitteet ja teknologia</p>
                </Link>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Hyödylliset resurssit</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/knowledge/faq" className="inline-flex items-center px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted/50 transition-colors">
                    Usein kysytyt kysymykset
                  </Link>
                  <Link href="/knowledge/glossary" className="inline-flex items-center px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted/50 transition-colors">
                    Rahoitussanasto
                  </Link>
                  <Link href="/knowledge/calculators" className="inline-flex items-center px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted/50 transition-colors">
                    Laskurit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 bg-gradient-to-r from-gold-primary/10 to-gold-highlight/10">
          <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-primary">
                {ctaTitle}
              </h2>
              <p className="text-xl leading-relaxed mb-8 text-foreground">
                {ctaDescription}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/onboarding">
                  <Button 
                    size="lg" 
                    variant="primary"
                    className="h-16 px-12 text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    onClick={() => onCTAClick?.('onboarding', 'cta')}
                  >
                    {primaryCta}
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="h-16 px-12 text-xl font-semibold rounded-xl"
                  >
                    {contactCta || t('contact.cta')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
