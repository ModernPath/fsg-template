'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/spinner';
import { 
  trackPhase4Display, 
  trackPhase4CustomMessage,
  trackPhase4Exit
} from '@/lib/analytics';

export interface Phase4Action {
  type: 'continue';
  message: string;
}

interface Phase4ContinuedConversationProps {
  recommendations: any[];
  onActionSelect: (action: Phase4Action) => Promise<void>;
  loading: boolean;
  className?: string;
}

const Phase4ContinuedConversation: React.FC<Phase4ContinuedConversationProps> = ({
  recommendations,
  onActionSelect,
  loading,
  className = ''
}) => {
  const t = useTranslations('Onboarding.phase4');
  const [message, setMessage] = useState('');
  const [displayStartTime] = useState(Date.now());

  // Track when Phase 4 is displayed
  React.useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      trackPhase4Display(recommendations.length);
    }
  }, [recommendations]);

  // Track abandonment when component unmounts
  React.useEffect(() => {
    return () => {
      const timeSpent = Math.round((Date.now() - displayStartTime) / 1000);
      trackPhase4Exit('abandon', timeSpent);
    };
  }, [displayStartTime]);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading) return;

    // Track analytics
    trackPhase4CustomMessage(trimmedMessage.length, 'continue');
    
    try {
      await onActionSelect({ 
        type: 'continue',
        message: trimmedMessage
      });
      setMessage('');
    } catch (error) {
      console.error('Error handling Phase 4 action:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card className={`bg-gray-900/70 border border-gold-primary/40 text-gray-100 ${className}`}>
      <div className="p-6 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gold-primary">
            {t('conversationTitle')}
          </h3>
          <p className="text-gray-300 text-sm max-w-2xl mx-auto">
            {t('conversationSubtitle')}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-gold-primary" />
            <label className="text-sm font-medium text-gray-200">
              {t('continueConversation')}
            </label>
          </div>
          
          <div className="flex gap-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('conversationPlaceholder')}
              disabled={loading}
              className="
                flex-1 min-h-[100px] px-4 py-3 text-sm
                bg-black/40 border border-gray-600/50 rounded-lg
                text-gray-100 placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary/50
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors resize-none
              "
              rows={4}
            />
            
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || loading}
              className="
                self-end px-6 py-3 h-auto
                bg-gold-primary text-gray-900 hover:bg-gold-primary/90
                disabled:opacity-50 disabled:cursor-not-allowed
                font-medium
              "
            >
              {loading ? (
                <Spinner className="w-4 h-4" />
              ) : (
                t('send')
              )}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
              <Spinner className="w-4 h-4" />
              {t('processingMessage')}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default Phase4ContinuedConversation;
