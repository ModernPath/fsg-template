'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/app/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function WhyTrustyPage() {
  const t = useTranslations('WhyTrusty')
  
  // Force text colors to be visible on dark backgrounds
  useEffect(() => {
    const forceTextColors = () => {
      // Target all text elements within cards and the main container
      const selectors = [
        '.container p',
        '.container h1',
        '.container h2',
        '.container h3',
        '.container li',
        '.container div',
        '[class*="text-"]',
        '[class*="muted"]',
      ].join(', ');
      
      const elements = document.querySelectorAll(selectors);
      
      elements.forEach((el) => {
        const element = el as HTMLElement;
        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;
        const classNames = element.className ? element.className.toString() : '';
        
        // Check if background is dark (contains rgb values < 100)
        const isDarkBg = bgColor.includes('rgb') && 
          bgColor.match(/\d+/g)?.slice(0, 3).every(val => parseInt(val) < 100);
        
        if (isDarkBg || classNames.includes('bg-card')) {
          // Force light text on dark backgrounds
          element.style.setProperty('color', '#e5e5e5', 'important');
        }
        
        // Ensure gold text stays gold
        if (classNames.includes('gold-primary') || 
            classNames.includes('text-gold')) {
          element.style.setProperty('color', '#D4AF37', 'important');
        }
      });
    };
    
    // Run immediately
    forceTextColors();
    
    // Run after a delay to catch dynamically rendered content
    const timeouts = [100, 300, 500, 1000].map(delay =>
      setTimeout(forceTextColors, delay)
    );
    
    // Run periodically
    const interval = setInterval(forceTextColors, 2000);
    
    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [])
  
  const whyChooseUs = [
    {
      title: t('whatMakesUsDifferent.aiAnalysis.title'),
      description: t('whatMakesUsDifferent.aiAnalysis.description'),
      features: [
        t('whatMakesUsDifferent.aiAnalysis.features.documentAnalysis'),
        t('whatMakesUsDifferent.aiAnalysis.features.riskAssessment'),
        t('whatMakesUsDifferent.aiAnalysis.features.personalized'),
        t('whatMakesUsDifferent.aiAnalysis.features.continuous')
      ],
      icon: '🤖'
    },
    {
      title: t('whatMakesUsDifferent.personalService.title'),
      description: t('whatMakesUsDifferent.personalService.description'),
      features: [
        t('whatMakesUsDifferent.personalService.features.onboarding'),
        t('whatMakesUsDifferent.personalService.features.personalized'),
        t('whatMakesUsDifferent.personalService.features.highAvailability'),
        t('whatMakesUsDifferent.personalService.features.continuity')
      ],
      icon: '👥'
    },
    {
      title: t('whatMakesUsDifferent.transparentProcess.title'),
      description: t('whatMakesUsDifferent.transparentProcess.description'),
      features: [
        t('whatMakesUsDifferent.transparentProcess.features.clearProcessSteps'),
        t('whatMakesUsDifferent.transparentProcess.features.continuousReports'),
        t('whatMakesUsDifferent.transparentProcess.features.noPilotStamping'),
        t('whatMakesUsDifferent.transparentProcess.features.openMeetings')
      ],
      icon: '🔍'
    },
    {
      title: t('whatMakesUsDifferent.efficientService.title'),
      description: t('whatMakesUsDifferent.efficientService.description'),
      features: [
        t('whatMakesUsDifferent.efficientService.features.fastResponses'),
        t('whatMakesUsDifferent.efficientService.features.digitalProcess'),
        t('whatMakesUsDifferent.efficientService.features.realTimeFollowUp'),
        t('whatMakesUsDifferent.efficientService.features.mobilityAvailable')
      ],
      icon: '⚡'
    }
  ]

  const competitiveAdvantages = Array.isArray(t.raw('competitiveAdvantages.items')) 
    ? (t.raw('competitiveAdvantages.items') as Array<{traditional: string, trusty: string, benefit: string}>)
    : []

  const guarantees = Array.isArray(t.raw('guarantees.items'))
    ? (t.raw('guarantees.items') as Array<{title: string, description: string}>)
    : []

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

      {/* Why Choose Us */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t('whatMakesUsDifferent.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {whyChooseUs.map((reason, index) => (
            <Card key={index} className="bg-card border-border shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{reason.icon}</span>
                  <CardTitle className="text-xl font-semibold text-white">
                    {reason.title}
                  </CardTitle>
                </div>
                <p className="text-muted-foreground">
                  {reason.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {reason.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-gold-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Competitive Advantages */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t('competitiveAdvantages.title')}</h2>
        <div className="space-y-4">
          {competitiveAdvantages.map((advantage, index) => (
            <Card key={index} className="bg-card border-border shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="text-center md:text-left">
                    <div className="text-sm text-muted-foreground mb-1">{t('competitiveAdvantages.labels.traditional')}</div>
                    <div className="text-white">{advantage.traditional}</div>
                  </div>
                  <div className="text-center md:text-center">
                    <div className="text-sm text-gold-primary mb-1">{t('competitiveAdvantages.labels.trusty')}</div>
                    <div className="text-white font-semibold">{advantage.trusty}</div>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="bg-gold-primary/20 text-gold-primary px-3 py-1 rounded-full text-sm font-medium">
                      {advantage.benefit}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Guarantees */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t('guarantees.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {guarantees.map((guarantee, index) => (
            <Card key={index} className="bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gold-primary">
                  {guarantee.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {guarantee.description}
                </p>
              </CardContent>
            </Card>
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
