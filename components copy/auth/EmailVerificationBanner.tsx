'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface EmailVerificationBannerProps {
  user: User;
}

export default function EmailVerificationBanner({ user }: EmailVerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('Auth');
  const supabase = createClientComponentClient();

  // Check if email is verified
  const isEmailVerified = user.email_confirmed_at !== null || 
    (user.user_metadata && user.user_metadata.email_verified === true);

  if (isEmailVerified) {
    return null; // Don't show banner if email is verified
  }

  const handleSendVerificationEmail = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-dark border-l-4 border-gold-secondary p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-gold-secondary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-gold-primary">
            {t('emailVerificationNeeded')}
          </p>
          <div className="mt-2">
            <button
              type="button"
              onClick={handleSendVerificationEmail}
              disabled={loading}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-dark bg-gold-secondary hover:bg-gold-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary disabled:opacity-50"
            >
              {loading ? t('sendingEmail') : t('sendVerificationEmail')}
            </button>
          </div>
          {success && (
            <p className="mt-2 text-sm text-green-600">
              {t('verificationEmailSent')}
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 