'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Heart,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ThemeToggle } from '@/app/components/ThemeToggle';

interface SwedishTrialLandingPageProps {
  locale: string;
}

export default function SwedishTrialLandingPage({ locale }: SwedishTrialLandingPageProps) {
  const t = useTranslations('SwedishTrial');
  const router = useRouter();
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  // Hide navigation and footer on mount
  useEffect(() => {
    const hideNavigationAndFooter = () => {
      const elementsToHide = document.querySelectorAll('nav, .sticky.top-0, header, [class*="sticky"], footer, [class*="footer"]');
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.visibility = 'hidden';
        (el as HTMLElement).style.height = '0';
        (el as HTMLElement).style.overflow = 'hidden';
      });
    };

    hideNavigationAndFooter();
    
    // Also hide after a short delay to catch any dynamically loaded elements
    const timer = setTimeout(() => {
      hideNavigationAndFooter();
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - run only once on mount

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    // Navigate to onboarding with Swedish locale and context
    router.push(`/${locale}/onboarding?source=swedish-trial&context=swedish-trial`);
  };

  const handleFeedback = async () => {
    try {
      // Create public survey invitation and redirect
      const response = await fetch('/api/surveys/invitations/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'swedish-trial', email: null, language: 'sv' })
      });
      
      const data = await response.json();
      if (data.invitation?.token) {
        window.open(`/${locale}/survey/${data.invitation.token}`, '_blank');
      } else {
        console.error('No invitation token received:', data);
        alert('Fel vid skapande av enkätlänk. Försök igen.');
      }
    } catch (error) {
      console.error('Error creating survey invitation:', error);
      alert('Fel vid skapande av enkätlänk. Försök igen.');
    }
  };

  return (
    <>
      <style jsx global>{`
        /* Hide navigation and footer for swedish trial page */
        .swedish-trial-page nav,
        .swedish-trial-page .sticky.top-0,
        .swedish-trial-page header,
        .swedish-trial-page [class*="sticky"],
        .swedish-trial-page [class*="top-0"],
        .swedish-trial-page footer,
        .swedish-trial-page [class*="footer"] {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        .swedish-trial-page main {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
        /* Force hide any navigation and footer elements */
        body:has(.swedish-trial-page) nav,
        body:has(.swedish-trial-page) .sticky,
        body:has(.swedish-trial-page) header,
        body:has(.swedish-trial-page) footer,
        body:has(.swedish-trial-page) [class*="footer"] {
          display: none !important;
        }
      `}</style>
      <div className="min-h-screen bg-background text-foreground swedish-trial-page">
      {/* Theme Toggle - Fixed position in top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        
        <div className="relative max-w-6xl mx-auto text-center">
          {/* Beta Badge */}
          <Badge className="mb-6 bg-gold-primary/20 text-gold-primary border-gold-primary/30 px-4 py-2 text-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            {t('hero.betaBadge', { default: 'BETA - Exklusiv förhandsvisning' })}
          </Badge>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            <span className="text-gold-primary">
              TrustyFinance
            </span>
            <br />
            <span className="text-3xl md:text-4xl text-muted-foreground">
              {t('hero.subtitle', { default: 'kommer till Sverige' })}
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            {t('hero.description', { 
              default: 'Bli en av de första att testa Sveriges smartaste AI-drivna finansieringsplattform. Få personliga rekommendationer på minuter och hjälp oss forma framtidens företagsfinansiering.' 
            })}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={handleStartTrial}
              disabled={isStartingTrial}
              className="bg-gold-primary hover:bg-gold-highlight text-black font-semibold py-4 px-8 text-lg rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {isStartingTrial ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  {t('hero.cta.starting', { default: 'Startar...' })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {t('hero.cta.primary', { default: 'Testa nu gratis' })}
                </div>
              )}
            </Button>

            <Button
              onClick={handleFeedback}
              variant="outline"
              className="border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10 py-4 px-8 text-lg rounded-xl"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {t('hero.cta.feedback', { default: 'Ge feedback' })}
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold-primary" />
              {t('hero.trust.secure', { default: 'Säker & konfidentiell' })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-primary" />
              {t('hero.trust.fast', { default: '5 minuter att testa' })}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-primary" />
              {t('hero.trust.early', { default: 'Exklusiv tidig åtkomst' })}
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Experience Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t('experience.title', { default: 'Vad du kommer att uppleva' })}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('experience.subtitle', { 
                default: 'Få en försmak av framtidens företagsfinansiering med vår AI-drivna plattform' 
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-card border-gold-primary/20 p-8 text-center hover:bg-card/70 transition-all duration-300">
              <div className="w-16 h-16 bg-gold-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-gold-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                AI-analys snabbt
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Ge dina företagsuppgifter, svara på enkäten. Du får finansieringsrekommendationer på några minuter.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-card border-gold-primary/20 p-8 text-center hover:bg-card/70 transition-all duration-300">
              <div className="w-16 h-16 bg-gold-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-gold-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                {t('experience.features.conversation.title', { default: 'Interaktiv CFO-rådgivare' })}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('experience.features.conversation.description', { 
                  default: 'Chatta med vår AI-CFO som ställer smarta frågor och ger skräddarsydda råd baserat på ditt företags unika situation.' 
                })}
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-card border-gold-primary/20 p-8 text-center hover:bg-card/70 transition-all duration-300">
              <div className="w-16 h-16 bg-gold-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-gold-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                {t('experience.features.insights.title', { default: 'Djupa affärsinsikter' })}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('experience.features.insights.description', { 
                  default: 'Upptäck dolda möjligheter i din verksamhet och få konkreta rekommendationer för finansiell tillväxt.' 
                })}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Beta Test Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                {t('beta.title', { default: 'Varför testa i beta?' })}
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-gold-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('beta.benefits.first.title', { default: 'Bli först i Sverige' })}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('beta.benefits.first.description', { 
                        default: 'Få exklusiv tillgång till den senaste finansieringsteknologin innan den lanseras officiellt.' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Heart className="w-6 h-6 text-gold-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('beta.benefits.influence.title', { default: 'Påverka utvecklingen' })}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('beta.benefits.influence.description', { 
                        default: 'Din feedback hjälper oss att skapa en plattform som verkligen möter svenska företags behov.' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Star className="w-6 h-6 text-gold-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('beta.benefits.insights.title', { default: 'Värdefulla insikter' })}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('beta.benefits.insights.description', { 
                        default: 'Få djup förståelse för ditt företags finansiella situation och möjligheter helt kostnadsfritt.' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gold-primary/10 rounded-3xl flex items-center justify-center">
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden">
                  <Image
                    src="/images/mascots/sloth-magnifying-glass-optimized.webp"
                    alt="TrustyFinance AI Assistant"
                    fill
                    sizes="192px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            {t('finalCta.title', { default: 'Redo att forma framtiden?' })}
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t('finalCta.description', { 
              default: 'Gå med i ett exklusivt community av svenska företagare som testar morgondagens finansieringslösningar.' 
            })}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleStartTrial}
              disabled={isStartingTrial}
              className="bg-gold-primary hover:bg-gold-highlight text-black font-semibold py-4 px-8 text-lg rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {isStartingTrial ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  {t('finalCta.starting', { default: 'Startar...' })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {t('finalCta.primary', { default: 'Starta din gratis test' })}
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>

            <Button
              onClick={handleFeedback}
              variant="outline"
              className="border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10 py-4 px-8 text-lg rounded-xl"
            >
              {t('finalCta.feedback', { default: 'Har du frågor? Kontakta oss' })}
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-muted-foreground/70 text-sm mt-8 max-w-2xl mx-auto">
            {t('footer.note', { 
              default: 'Beta-versionen är helt kostnadsfri. Inga kreditupplysningar. Inga förpliktelser. Bara värdefull feedback och insikter för ditt företag.' 
            })}
          </p>
        </div>
      </section>

      {/* Survey Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Hjälp oss förbättra vår tjänst
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Din feedback är ovärderlig för oss. Ta en kort enkät och hjälp oss att göra 
              FSG Trusty Finance ännu bättre för dig och andra företag.
            </p>
          </div>
          
          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-gold-primary hover:bg-gold-highlight text-gray-900 font-semibold px-8 py-4 text-lg"
              onClick={() => {
                // Create public survey invitation and redirect
                fetch('/api/surveys/invitations/public', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ source: 'swedish-trial', email: null, language: 'sv' })
                })
                .then(response => response.json())
                .then(data => {
                  if (data.invitation?.token) {
                    window.open(`/sv/survey/${data.invitation.token}`, '_blank');
                  }
                })
                .catch(error => {
                  console.error('Error creating survey invitation:', error);
                });
              }}
            >
              Starta enkät
            </Button>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
