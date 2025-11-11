"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { TurnstileWidget } from '@/components/ui/turnstile';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { usePathname } from 'next/navigation';

// Props definition
interface Step1SignupProps {
  initialFormData: { 
    firstName: string; 
    lastName: string; 
    phone: string;
    email: string; 
    consentMarketing: boolean;
    consentAnalysis: boolean;
  };
  loading: boolean;
  error: string | null;
  turnstileToken: string | null;
  locale: string;
  handleInitialFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleCheckboxChange: (name: string, checked: boolean) => void;
  handleStep1Submit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  setTurnstileToken: (token: string | null) => void;
  setError: (error: string | null) => void;
}

// Use onboarding styles with explicit text color
const inputClasses = "onboarding-input text-lg !text-white";

export const Step1Signup: React.FC<Step1SignupProps> = ({
  initialFormData,
  loading,
  error,
  turnstileToken,
  locale,
  handleInitialFormChange,
  handleCheckboxChange,
  handleStep1Submit,
  setTurnstileToken,
  setError
}) => {
  const t = useTranslations('Onboarding');
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen onboarding-bg">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16">
        <div className="max-w-xl w-full">
          <h1 className="onboarding-title text-4xl lg:text-5xl font-bold mb-4 tracking-tight">{t('step1.title')}</h1>
          <p className="onboarding-description text-xl leading-relaxed mb-12">
            {t('step1.serviceDescription', {
              default: 'Trusty Finance helps you get the funding you need. Upload your financial documents and get personalized recommendations in minutes.'
            })}
          </p>
          
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="onboarding-label text-lg font-medium mb-3">
                  {t('step1.firstNameLabel', { default: 'First Name' })}
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={initialFormData.firstName}
                  onChange={handleInitialFormChange}
                  className={inputClasses}
                  style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}
                  placeholder={t('step1.firstNamePlaceholder', { default: 'Enter first name' })}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="onboarding-label text-lg font-medium mb-3">
                  {t('step1.lastNameLabel', { default: 'Last Name' })}
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={initialFormData.lastName}
                  onChange={handleInitialFormChange}
                  className={inputClasses}
                  style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}
                  placeholder={t('step1.lastNamePlaceholder', { default: 'Enter last name' })}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="onboarding-label text-lg font-medium mb-3">
                {t('step1.emailLabel')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={initialFormData.email}
                onChange={handleInitialFormChange}
                className={inputClasses}
                style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}
                placeholder={t('step1.emailPlaceholder')}
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="onboarding-label text-lg font-medium mb-3">
                {t('step1.phoneLabel', { default: 'Phone Number' })}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={initialFormData.phone}
                onChange={handleInitialFormChange}
                className={inputClasses}
                style={{ color: '#ffffff', backgroundColor: '#1a1a1a' }}
                placeholder={t('step1.phonePlaceholder', { default: 'Enter phone number' })}
              />
            </div>
            
            <TurnstileWidget
              onVerify={setTurnstileToken}
              onError={() => setError(t('error.captcha'))}
              onExpire={() => setTurnstileToken(null)}
            />
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentMarketing"
                  checked={initialFormData.consentMarketing}
                  onCheckedChange={(checked: boolean) => handleCheckboxChange('consentMarketing', !!checked)}
                  className="mt-1 border-gray-dark data-[state=checked]:bg-gold-primary data-[state=checked]:text-black"
                />
                <label htmlFor="consentMarketing" className="text-sm text-white cursor-pointer">
                  {t('step1.consentMarketingLabel', { default: 'I agree to receive marketing communications and offers from TrustyFinance.' })}
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentAnalysis"
                  checked={initialFormData.consentAnalysis}
                  onCheckedChange={(checked: boolean) => handleCheckboxChange('consentAnalysis', !!checked)}
                  className="mt-1 border-gray-dark data-[state=checked]:bg-gold-primary data-[state=checked]:text-black"
                />
                <label htmlFor="consentAnalysis" className="text-sm text-white cursor-pointer">
                  {t('step1.consentAnalysisLabel', { default: 'I consent to TrustyFinance analyzing my provided data to improve services and offer personalized recommendations.' })}
                </label>
              </div>
            </div>
            
            {error && (
              <div 
                className="onboarding-error"
                dangerouslySetInnerHTML={{ __html: error }}
              />
            )}
            
            <button
              type="submit"
              disabled={loading || !initialFormData.firstName || !initialFormData.lastName || !initialFormData.email || !initialFormData.phone || !turnstileToken || !initialFormData.consentAnalysis}
              className="onboarding-btn-primary w-full py-4 px-6 text-lg font-semibold"
            >
              {loading ? <Spinner className="h-6 w-6" /> : t('createAccount')}
            </button>
            
            <div className="mt-8 text-center text-base onboarding-text-secondary">
              {t('alreadyHaveAccount', { default: 'Already have an account?' })}{' '}
              <a 
                href={`/${locale}/auth/sign-in?next=${encodeURIComponent(pathname)}`} 
                className="onboarding-text-secondary font-medium hover:onboarding-text-white"
              >
                {t('signIn', { default: 'Sign In' })}
              </a>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right side - Hero Image */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <img 
          src="/images/other/apina_palapeli.jpeg" 
          alt="Ape mascot pointing towards the user" 
          className="object-cover h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/70 to-black/40 flex flex-col justify-center px-16">
          <div className="max-w-3xl">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-10 leading-tight">
              {t('step1.heroTitle', { default: 'Streamline Your Business Funding' })}
            </h2>
            <ul className="space-y-8">
              {[
                t('step1.benefit1', { default: 'Upload financial documents for instant analysis' }),
                t('step1.benefit2', { default: 'Get personalized funding recommendations' }),
                t('step1.benefit3', { default: 'Access multiple funding options in one place' }),
                t('step1.benefit4', { default: 'Select best offer and begin growing fast' })

              ].map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className="onboarding-hero-icon h-8 w-8 mr-4 flex-shrink-0 mt-1" />
                  <span className="text-white text-xl">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export default for lazy loading if needed, or named export
export default Step1Signup; 