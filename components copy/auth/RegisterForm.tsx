'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TurnstileWidget } from '@/components/ui/turnstile';
import { createClient } from '@/utils/supabase/client';
import LocaleSwitcher from '@/app/components/LocaleSwitcher';

type FormData = {
  name: string;
  email: string;
  company: string;
  companyCode: string;
  terms: boolean;
  newsletter: boolean;
};

type FormErrors = {
  [K in keyof FormData]?: string;
};

const steps = ['basicInfo', 'companyInfo'] as const;
type Step = typeof steps[number];

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const router = useRouter();
  const { locale } = useParams();
  const t = useTranslations('Auth');
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    companyCode: '',
    terms: true, // Default to true as we're not collecting this anymore
    newsletter: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      handleNextStep();
      return;
    }
    setLoading(true);
    setError(null);

    if (!turnstileToken) {
      setError(t('error.captcha'));
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const company = formData.get('company') as string;
    const companyCode = formData.get('companyCode') as string;
    const newsletter = formData.get('newsletter') === 'on';
    const marketing = formData.get('marketing') === 'on';

    try {
      // Validate turnstile token first
      const validateResponse = await fetch('/api/auth/validate-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: turnstileToken }),
      });

      if (!validateResponse.ok) {
        throw new Error(t('error.captchaValidation'));
      }

      // Use passwordless login with OTP (Magic Link)
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            username: email.split('@')[0],
            full_name: name,
            company,
            company_code: companyCode,
            newsletter_subscription: newsletter,
            marketing_consent: marketing,
            email_verified: false,
          },
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`
        },
      });

      if (signInError) throw signInError;

      // Show success message and notification that email has been sent
      setError(null);
      router.push(`/${locale}/auth/check-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : t('error.register'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                currentStep > index 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : currentStep === index 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-gray-300 text-gray-300'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 w-16 ${
                  currentStep > index ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <span key={step} className="text-sm text-gray-600">
              {t(`registration.steps.${step}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-base font-medium text-gray-700">
              {t('registration.name')} *
            </label>
            <div className="mt-1">
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder={t('registration.namePlaceholder')}
              />
            </div>
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-700">
              {t('registration.email')} *
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder={t('registration.emailPlaceholder')}
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Company Info */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="company" className="block text-base font-medium text-gray-700">
              {t('registration.company')} *
            </label>
            <div className="mt-1">
              <input
                id="company"
                name="company"
                type="text"
                required
                value={formData.company}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder={t('registration.companyPlaceholder')}
              />
            </div>
            {errors.company && (
              <p className="mt-2 text-sm text-red-600">{errors.company}</p>
            )}
          </div>

          <div>
            <label htmlFor="companyCode" className="block text-base font-medium text-gray-700">
              {t('registration.companyCode')} *
            </label>
            <div className="mt-1">
              <input
                id="companyCode"
                name="companyCode"
                type="text"
                required
                value={formData.companyCode}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder={t('registration.companyCodePlaceholder')}
              />
            </div>
            {errors.companyCode && (
              <p className="mt-2 text-sm text-red-600">{errors.companyCode}</p>
            )}
          </div>

          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="newsletter"
                name="newsletter"
                type="checkbox"
                checked={formData.newsletter}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="newsletter" className="text-base text-gray-700">
                {t('registration.newsletter')}
              </label>
              <p className="text-sm text-gray-500">
                {t('registration.newsletterDescription')}
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>{t('registration.termsDescription')}</p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handlePrevStep}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('registration.back')}
          </button>
        )}
        <button
          type="submit"
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            currentStep === 0 ? 'ml-auto' : ''
          }`}
        >
          {currentStep === steps.length - 1 ? (
            <>
              {t('registration.createAccount')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          ) : (
            <>
              {t('registration.next')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Language Selector */}
      <div className="mt-8 text-center">
        <LocaleSwitcher />
      </div>
    </form>
  );
} 