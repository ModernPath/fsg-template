'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  X, 
  Clock, 
  MessageSquare, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';

interface SwedishLendersComingSoonPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedback: () => void;
  recommendationType?: string;
  recommendationTitle?: string;
}

export default function SwedishLendersComingSoonPopup({
  isOpen,
  onClose,
  onFeedback,
  recommendationType,
  recommendationTitle,
}: SwedishLendersComingSoonPopupProps) {
  const t = useTranslations('SwedishLendersPopup');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <Card className="relative bg-gray-900/95 border border-gold-primary/30 p-8 max-w-2xl w-full shadow-2xl">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border border-gold-primary/40">
            <Image
              src="/images/mascots/sloth-magnifying-glass-optimized.webp"
              alt="TrustyFinance Assistant"
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-gold-primary" />
            <h2 className="text-2xl font-bold text-white">
              {t('title', { default: 'Svenska långivare kommer snart!' })}
            </h2>
            <Sparkles className="w-6 h-6 text-gold-primary" />
          </div>
          
          {recommendationTitle && (
            <p className="text-gold-primary font-medium mb-2">
              {t('selectedRecommendation', { default: 'Valt alternativ' })}: {recommendationTitle}
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6 mb-8">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-300 mb-2">
                  {t('comingSoon.title', { default: 'Under utveckling för Sverige' })}
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  {t('comingSoon.description', { 
                    default: 'Vi arbetar intensivt med att etablera partnerskap med svenska banker och finansinstitut. Dina rekommendationer visar vad som är möjligt - snart kan du ansöka direkt genom vår plattform.' 
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-gold-primary rounded-full"></span>
                {t('features.analysis.title', { default: 'Analys klar' })}
              </h4>
              <p className="text-gray-300 text-sm">
                {t('features.analysis.description', { 
                  default: 'Du har redan fått värdefulla insikter om ditt företags finansiella situation.' 
                })}
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                {t('features.lenders.title', { default: 'Långivare på väg' })}
              </h4>
              <p className="text-gray-300 text-sm">
                {t('features.lenders.description', { 
                  default: 'Svenska finansinstitut ansluter sig till plattformen under Q1 2025.' 
                })}
              </p>
            </div>
          </div>

          <div className="bg-gold-primary/10 border border-gold-primary/30 rounded-lg p-4">
            <p className="text-gold-primary text-sm leading-relaxed">
              <strong>{t('earlyAccess.title', { default: 'Exklusiv tidig åtkomst:' })}</strong> {' '}
              {t('earlyAccess.description', { 
                default: 'Som beta-testare får du förtur att ansöka om finansiering så snart svenska långivare är tillgängliga på plattformen.' 
              })}
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              {t('helpUs', { 
                default: 'Hjälp oss att förbättra plattformen för svenska företag:' 
              })}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={onFeedback}
                className="bg-gold-primary hover:bg-gold-highlight text-black font-medium flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {t('buttons.giveFeedback', { default: 'Ge feedback' })}
              </Button>
              
              <Button
                onClick={onClose}
                variant="outline"
                className="border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10"
              >
                {t('buttons.continueExploring', { default: 'Fortsätt utforska' })}
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {t('notification', { 
                default: 'Vi meddelar dig via e-post så snart ansökningar är tillgängliga' 
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
