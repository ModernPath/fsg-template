'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  PencilSquareIcon,
  InformationCircleIcon, 
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/spinner';
import { 
  trackPhase4Action, 
  trackPhase4Display, 
  trackPhase4CustomMessage,
  trackPhase4Exit
} from '@/lib/analytics';
import { useABTest } from '@/lib/ab-testing';

export interface Phase4Action {
  type: 'refine' | 'justify' | 'proceed';
  message?: string;
}

interface Phase4InteractiveConfirmationVariantsProps {
  recommendations: any[];
  onActionSelect: (action: Phase4Action) => Promise<void>;
  loading: boolean;
  className?: string;
}

// Variant A: Original design (cards with icons)
const VariantA: React.FC<Phase4InteractiveConfirmationVariantsProps> = ({
  recommendations,
  onActionSelect,
  loading,
  className = ''
}) => {
  const t = useTranslations('Onboarding.phase4');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedAction, setSelectedAction] = useState<'refine' | 'justify' | 'proceed' | null>(null);
  const [submittingCustom, setSubmittingCustom] = useState(false);
  const [displayStartTime] = useState(Date.now());

  const handleActionClick = async (actionType: 'refine' | 'justify' | 'proceed') => {
    if (loading) return;
    
    setSelectedAction(actionType);
    trackPhase4Action(actionType);
    
    try {
      await onActionSelect({ type: actionType });
      if (actionType === 'proceed') {
        const timeSpent = Math.round((Date.now() - displayStartTime) / 1000);
        trackPhase4Exit('proceed', timeSpent);
      }
    } catch (error) {
      console.error('Error handling action:', error);
      setSelectedAction(null);
    }
  };

  const handleCustomMessageSubmit = async () => {
    const message = customMessage.trim();
    if (!message || submittingCustom || loading) return;

    setSubmittingCustom(true);
    trackPhase4CustomMessage(message.length, 'refine');
    trackPhase4Action('refine', message);
    
    try {
      await onActionSelect({ type: 'refine', message });
      setCustomMessage('');
    } catch (error) {
      console.error('Error submitting custom message:', error);
    } finally {
      setSubmittingCustom(false);
    }
  };

  const actions = [
    {
      key: 'refine',
      icon: PencilSquareIcon,
      variant: 'secondary' as const,
      color: 'border-blue-500/50 hover:border-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
    },
    {
      key: 'justify', 
      icon: InformationCircleIcon,
      variant: 'secondary' as const,
      color: 'border-amber-500/50 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
    },
    {
      key: 'proceed',
      icon: ArrowRightIcon, 
      variant: 'default' as const,
      color: 'border-green-500/50 hover:border-green-400 bg-green-500/10 hover:bg-green-500/20'
    }
  ];

  return (
    <Card className={`bg-gray-900/70 border border-gold-primary/40 text-gray-100 ${className}`}>
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gold-primary">
            {t('title')}
          </h3>
          <p className="text-gray-300 text-sm max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loading && selectedAction === action.key;
            const isDisabled = loading || submittingCustom;
            
            return (
              <Button
                key={action.key}
                variant={action.variant}
                onClick={() => handleActionClick(action.key as 'refine' | 'justify' | 'proceed')}
                disabled={isDisabled}
                className={`
                  h-auto p-4 flex flex-col items-center space-y-3 text-left
                  transition-all duration-200 relative group
                  border ${action.color}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
                `}
              >
                {isLoading ? (
                  <Spinner className="w-6 h-6 text-gold-primary" />
                ) : (
                  <Icon className="w-6 h-6 text-gold-primary group-hover:text-gold-secondary transition-colors" />
                )}
                
                <div className="space-y-1 text-center">
                  <div className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                    {t(`actions.${action.key}.title`)}
                  </div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                    {t(`actions.${action.key}.description`)}
                  </div>
                </div>
                
                {!isLoading && (
                  <div className="text-xs font-medium text-gold-primary group-hover:text-gold-secondary transition-colors">
                    {t(`actions.${action.key}.button`)}
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        <div className="border-t border-gray-700/50 pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-gold-primary" />
              <label className="text-sm font-medium text-gray-200">
                {t('customMessage.label')}
              </label>
            </div>
            
            <div className="flex gap-3">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={t('customMessage.placeholder')}
                disabled={loading || submittingCustom}
                className="
                  flex-1 min-h-[80px] px-3 py-2 text-sm
                  bg-black/40 border border-gray-600/50 rounded-md
                  text-gray-100 placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors resize-none
                "
                rows={3}
              />
              
              <Button
                onClick={handleCustomMessageSubmit}
                disabled={!customMessage.trim() || loading || submittingCustom}
                variant="outline"
                size="sm"
                className="
                  self-end px-4 py-2 h-auto
                  border-gold-primary/50 text-gold-primary hover:bg-gold-primary/10
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {submittingCustom ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  t('customMessage.submit')
                )}
              </Button>
            </div>
          </div>
        </div>

        {(loading || submittingCustom) && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
              <Spinner className="w-4 h-4" />
              {t('loading')}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Variant B: Horizontal button layout with emphasis
const VariantB: React.FC<Phase4InteractiveConfirmationVariantsProps> = ({
  recommendations,
  onActionSelect,
  loading,
  className = ''
}) => {
  const t = useTranslations('Onboarding.phase4');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedAction, setSelectedAction] = useState<'refine' | 'justify' | 'proceed' | null>(null);
  const [submittingCustom, setSubmittingCustom] = useState(false);
  const [displayStartTime] = useState(Date.now());

  const handleActionClick = async (actionType: 'refine' | 'justify' | 'proceed') => {
    if (loading) return;
    
    setSelectedAction(actionType);
    trackPhase4Action(actionType);
    
    try {
      await onActionSelect({ type: actionType });
      if (actionType === 'proceed') {
        const timeSpent = Math.round((Date.now() - displayStartTime) / 1000);
        trackPhase4Exit('proceed', timeSpent);
      }
    } catch (error) {
      console.error('Error handling action:', error);
      setSelectedAction(null);
    }
  };

  const handleCustomMessageSubmit = async () => {
    const message = customMessage.trim();
    if (!message || submittingCustom || loading) return;

    setSubmittingCustom(true);
    trackPhase4CustomMessage(message.length, 'refine');
    trackPhase4Action('refine', message);
    
    try {
      await onActionSelect({ type: 'refine', message });
      setCustomMessage('');
    } catch (error) {
      console.error('Error submitting custom message:', error);
    } finally {
      setSubmittingCustom(false);
    }
  };

  return (
    <Card className={`bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gold-primary/40 text-gray-100 ${className}`}>
      <div className="p-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-primary/20 rounded-full">
            <StarIcon className="w-4 h-4 text-gold-primary" />
            <span className="text-xs font-medium text-gold-primary">Suositukset valmiit</span>
          </div>
          <h3 className="text-xl font-semibold text-gold-primary">
            {t('title')}
          </h3>
          <p className="text-gray-300 text-sm max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => handleActionClick('refine')}
            disabled={loading || submittingCustom}
            variant="outline"
            className="flex-1 h-12 border-blue-400/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400"
          >
            {loading && selectedAction === 'refine' ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <PencilSquareIcon className="w-4 h-4 mr-2" />
            )}
            {t('actions.refine.button')}
          </Button>

          <Button
            onClick={() => handleActionClick('justify')}
            disabled={loading || submittingCustom}
            variant="outline"
            className="flex-1 h-12 border-amber-400/50 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400"
          >
            {loading && selectedAction === 'justify' ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <InformationCircleIcon className="w-4 h-4 mr-2" />
            )}
            {t('actions.justify.button')}
          </Button>

          <Button
            onClick={() => handleActionClick('proceed')}
            disabled={loading || submittingCustom}
            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-0"
          >
            {loading && selectedAction === 'proceed' ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircleIcon className="w-4 h-4 mr-2" />
            )}
            {t('actions.proceed.button')}
          </Button>
        </div>

        <div className="border-t border-gray-700/50 pt-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-gold-primary" />
              {t('customMessage.label')}
            </label>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={t('customMessage.placeholder')}
                disabled={loading || submittingCustom}
                className="
                  flex-1 h-10 px-3 text-sm
                  bg-black/40 border border-gray-600/50 rounded-md
                  text-gray-100 placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCustomMessageSubmit();
                  }
                }}
              />
              
              <Button
                onClick={handleCustomMessageSubmit}
                disabled={!customMessage.trim() || loading || submittingCustom}
                size="sm"
                className="h-10 px-4 bg-gold-primary/20 hover:bg-gold-primary/30 text-gold-primary border-gold-primary/50"
              >
                {submittingCustom ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  t('customMessage.submit')
                )}
              </Button>
            </div>
          </div>
        </div>

        {(loading || submittingCustom) && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
              <Spinner className="w-4 h-4" />
              {t('loading')}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Main component that uses A/B testing
export default function Phase4InteractiveConfirmationVariants(props: Phase4InteractiveConfirmationVariantsProps) {
  const { variant, trackExposure } = useABTest('phase4-ui-design');

  // Track display
  React.useEffect(() => {
    if (props.recommendations && props.recommendations.length > 0) {
      trackPhase4Display(props.recommendations.length);
      trackExposure(); // Track A/B test exposure
    }
  }, [props.recommendations, trackExposure]);

  // Track abandonment when component unmounts
  React.useEffect(() => {
    const startTime = Date.now();
    return () => {
      // Only track if user didn't proceed
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackPhase4Exit('abandon', timeSpent);
    };
  }, []);

  if (!props.recommendations || props.recommendations.length === 0) {
    return null;
  }

  // Return appropriate variant based on A/B test
  switch (variant?.config?.layout) {
    case 'horizontal':
      return <VariantB {...props} />;
    case 'cards':
    default:
      return <VariantA {...props} />;
  }
}
