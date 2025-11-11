"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Spinner } from '@/components/ui/spinner';
import { createClient } from '@/utils/supabase/client';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

// Schema for passwordless login (email only)
const passwordlessSchema = z.object({
  email: z.string().email()
});

type PasswordlessFormData = z.infer<typeof passwordlessSchema>;

// Shared input class for dark theme (from frontend.md)
const inputClasses = "w-full px-5 py-3 text-lg text-gold-primary bg-gray-very-dark border border-gray-dark rounded-lg focus:ring-gold-primary/20 focus:border-gold-primary focus:bg-black transition-colors placeholder-gray-dark";

export default function SignInForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const locale = params.locale as string;
  const nextUrl = searchParams.get('next') || `/${locale}/dashboard`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordlessFormData>({
    resolver: zodResolver(passwordlessSchema),
  });

  const onSubmit = async (data: PasswordlessFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(nextUrl)}`
        }
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Redirect to check email page
      router.push(`/${locale}/auth/check-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left side - Form */}
      <div className="w-full md:w-3/5  flex flex-col justify-center items-center p-8 lg:p-16">
        <div className="max-w-xl w-full">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-gold-primary">{t('welcomeBack')}</h1>
          <p className="text-gold-primary text-xl leading-relaxed mb-12">
            {t('continueAnalysis', {
              default: 'Continue your financial analysis journey'
            })}
          </p>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {error && (
              <div 
                className="text-red-400 text-base p-4 bg-red-900/30 border border-red-500/50 rounded-lg"
                dangerouslySetInnerHTML={{ __html: error }}
              />
            )}

            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gold-secondary mb-3">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                {...register('email')}
                className={inputClasses}
                placeholder={t('emailPlaceholder', { default: 'Enter your email address' })}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{t('invalidEmail')}</p>
              )}
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-light mb-4">
                {t('passwordlessDescription', { default: "We'll send you a magic link to sign in without a password" })}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative z-10 w-full flex justify-center py-4 px-6 text-lg font-semibold border border-transparent rounded-lg shadow-lg text-black bg-gold-primary hover:bg-gold-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary/50 focus:ring-offset-black disabled:opacity-50 disabled:bg-gold-primary disabled:text-black transition duration-200"
            >
              {isLoading ? <Spinner className="h-6 w-6 text-black" /> : t('passwordlessLogin', { default: 'Send Magic Link' })}
            </button>
          </form>
          
          <div className="mt-8 space-y-4">
            <div className="text-center text-base text-gold-secondary/80">
              {t('noAccount', { default: "Don't have an account?" })} {' '}
              <a href={`/${locale}/auth/register`} className="text-gold-secondary font-medium hover:text-gold-primary">{t('createAccount', { default: 'Create Account' })}</a>
            </div>
            

          </div>
        </div>
      </div>
      
      {/* Right side - Hero Image - Updated with Mascot */}
      <div className="hidden md:block md:w-2/5 relative overflow-hidden flex items-center justify-center">
        <img 
          src="/images/mascots/apina_torni.webp"
          alt="Chimp mascot playing with wooden blocks"
          className="object-cover w-full h-full max-h-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/70 to-black/40 flex flex-col justify-center px-16 pointer-events-none">
          <div className="max-w-3xl">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-10 leading-tight">
              {t('signInHeroTitle', { default: 'Access Your Financial Insights' })}
            </h2>
            <ul className="space-y-8">
              {[
                t('signInBenefit1', { default: 'View your latest financial analysis' }),
                t('signInBenefit2', { default: 'Explore personalized funding opportunities' }),
                t('signInBenefit3', { default: 'Track your business performance metrics' })
              ].map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className="h-8 w-8 text-green-400 mr-4 flex-shrink-0 mt-1" />
                  <span className="text-white text-xl">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
