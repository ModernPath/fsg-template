'use client';

import { useCallback, useEffect } from 'react';
import Turnstile from 'react-turnstile';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: (error: any) => void;
  onExpire?: () => void;
  className?: string;
}

export function TurnstileWidget({ onVerify, onError, onExpire, className = '' }: TurnstileProps) {
  const handleVerify = useCallback((token: string) => {
    onVerify(token);
  }, [onVerify]);

  const handleError = useCallback((error: any) => {
    console.error('Turnstile error:', error);
    onError?.(error);
  }, [onError]);

  const handleExpire = useCallback(() => {
    console.log('Turnstile token expired');
    onExpire?.();
  }, [onExpire]);

  // In development, if site key is not configured, simulate successful verification
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      console.warn('⚠️ Turnstile site key not configured in development, simulating successful verification');
      // Simulate successful verification after a short delay
      const timer = setTimeout(() => {
        onVerify('dev-mock-token');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onVerify]);

  // If in development and no site key, render a placeholder
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return (
      <div className={`${className} p-4 bg-yellow-100 border border-yellow-300 rounded-lg`}>
        <p className="text-sm text-yellow-800">
          🔧 Kehitysympäristö: Turnstile-validointi simuloitu
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onVerify={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        theme="auto"
      />
    </div>
  );
} 