'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TurnstileWidget } from '@/components/ui/turnstile';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import { createClient } from '@/utils/supabase/client';

type CompanyOption = {
  businessId: string;
  name: string;
  registrationDate?: string;
  companyForm?: string;
}

type FormData = {
  name: string;
  email: string;
  company: string;
  companyCode: string;
  newsletter: boolean;
  marketing: boolean;
}

export default function MultiStepRegisterForm() {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [isStepComplete, setIsStepComplete] = useState({
    1: false,
    2: false
  });
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    companyCode: '',
    newsletter: false,
    marketing: false
  });

  // Company search
  const [searchQuery, setSearchQuery] = useState('');
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Auth state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  
  // Refs & router
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { locale } = useParams();
  const t = useTranslations('Auth');

  // Handle outside click for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if step is complete
  useEffect(() => {
    const checkStep1 = () => formData.company.length > 0 && formData.companyCode.length > 0;
    const checkStep2 = () => formData.name.length > 0 && 
                            formData.email.length > 0 && 
                            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    
    setIsStepComplete({
      1: checkStep1(),
      2: checkStep2()
    });
  }, [formData]);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setCompanyOptions([]);
        setIsSearching(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/companies/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
          setCompanyOptions(data.data);
        } else {
          console.error('Search error:', data.error);
          setCompanyOptions([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setCompanyOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;

  // Handle search input change
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFormData(prev => ({ ...prev, company: query }));
    
    if (query.length >= 3) {
      setIsSearching(true);
      setShowDropdown(true);
      debouncedSearch(query);
    } else {
      setCompanyOptions([]);
      setShowDropdown(false);
    }
  };

  // Handle company selection
  const handleCompanySelect = (company: CompanyOption) => {
    setFormData(prev => ({
      ...prev,
      company: company.name,
      companyCode: company.businessId
    }));
    setSearchQuery(company.name);
    setShowDropdown(false);
  };

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle step navigation
  const goToNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle final form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!turnstileToken) {
      setError(t('error.captcha'));
      setLoading(false);
      return;
    }

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

      const supabase = createClient();
      
      // Generate a random password
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2) + '!1';
      
      // First sign up the user
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: formData.email,
        password: randomPassword,
        options: {
          data: {
            username: formData.email.split('@')[0],
            full_name: formData.name,
            company: formData.company,
            company_code: formData.companyCode,
            newsletter_subscription: formData.newsletter,
            marketing_consent: formData.marketing,
            email_verified: true, // Mark as verified
          }
        }
      });

      if (signUpError) throw signUpError;

      // Then explicitly sign in the user with the same credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: randomPassword,
      });

      if (signInError) throw signInError;

      // If successful, redirect to dashboard or home page
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : t('error.register'));
    } finally {
      setLoading(false);
    }
  };

  // Step content components
  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {[1, 2].map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div 
              className={
                currentStep > step || isStepComplete[step as keyof typeof isStepComplete]
                  ? 'step-number-amber'
                  : currentStep === step
                    ? 'step-number-amber-inactive'
                    : 'step-number-amber-pending'
                + ' w-10 h-10 flex items-center justify-center rounded-full border-2'
              }
            >
              {currentStep > step || isStepComplete[step as keyof typeof isStepComplete] ? (
                <CheckCircleIcon className="w-6 h-6 text-black" />
              ) : (
                <span className="text-lg font-semibold">{step}</span>
              )}
            </div>
            <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {step === 1 ? t('companyInfo') : t('contactInfo')}
            </span>
          </div>
        ))}
      </div>
      
      <div className="relative flex items-center max-w-md mx-auto mt-4">
        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-medium text-gray-900 dark:text-white">
          {t('companySearch')}
        </h3>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
          {t('companySearchDescription')}
        </p>
      </div>
      
      <div ref={searchRef} className="relative">
        <label htmlFor="company" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('company')}
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            name="company"
            id="company"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length >= 3 && setShowDropdown(true)}
            required
            className="block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-lg px-4 py-3 pr-12"
            placeholder={t('companySearchPlaceholder')}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            {isSearching ? (
              <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </div>
        
        {/* Company search dropdown */}
        {showDropdown && companyOptions.length > 0 && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl max-h-80 overflow-auto py-2">
            {companyOptions.map((company) => (
              <div
                key={company.businessId}
                onClick={() => handleCompanySelect(company)}
                className="px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="font-medium text-lg text-gray-900 dark:text-white">{company.name}</div>
                <div className="text-base text-gray-500 dark:text-gray-400">
                  {company.businessId} • {company.companyForm}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showDropdown && searchQuery.length >= 3 && companyOptions.length === 0 && !isSearching && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl py-3 px-6">
            <p className="text-base text-gray-500 dark:text-gray-400">
              {t('noCompaniesFound')}
            </p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="companyCode" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('companyCode')}
        </label>
        <input
          type="text"
          name="companyCode"
          id="companyCode"
          value={formData.companyCode}
          onChange={handleInputChange}
          required
          placeholder="1234567-8"
          pattern="[0-9]{7}-[0-9]"
          title={t('companyCodeFormat')}
          className="block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-lg px-4 py-3"
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('companyCodeHelp')}
        </p>
      </div>
      
      <div className="pt-6">
        <button
          type="button"
          onClick={goToNextStep}
          disabled={!isStepComplete[1]}
          className="w-full flex justify-center items-center py-4 px-8 border border-transparent rounded-xl shadow-xl text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105"
        >
          {t('continue')}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-medium text-gray-900 dark:text-white">
          {t('contactInfo')}
        </h3>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
          {t('contactInfoDescription')}
        </p>
      </div>
      
      <div>
        <label htmlFor="name" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('fullName')}
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-lg px-4 py-3"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('email')}
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-lg px-4 py-3"
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="newsletter"
            id="newsletter"
            checked={formData.newsletter}
            onChange={handleInputChange}
            className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-white-600 focus:ring-primary-500 dark:bg-gray-700"
          />
          <label htmlFor="newsletter" className="ml-3 block text-base text-gray-700 dark:text-gray-300">
            {t('newsletter')}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="marketing"
            id="marketing"
            checked={formData.marketing}
            onChange={handleInputChange}
            className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-white-600 focus:ring-primary-500 dark:bg-gray-700"
          />
          <label htmlFor="marketing" className="ml-3 block text-base text-gray-700 dark:text-gray-300">
            {t('marketing')}
          </label>
        </div>
      </div>

      <TurnstileWidget
        onVerify={setTurnstileToken}
        onError={() => setError(t('error.captcha'))}
        onExpire={() => setTurnstileToken(null)}
        className="mt-6"
      />

      {error && (
        <div className="text-red-600 dark:text-red-400 text-base">
          {error}
        </div>
      )}
      
      <div className="pt-6 flex space-x-4">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="w-1/3 flex justify-center py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-lg font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
        >
          {t('back')}
        </button>
        <button
          type="submit"
          disabled={loading || !turnstileToken || !isStepComplete[2]}
          className="w-2/3 flex justify-center items-center py-4 px-8 border border-transparent rounded-xl shadow-xl text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105"
        >
          {loading ? t('creatingAccount') : t('register')}
          {!loading && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('instantLoginDescription')}
        </p>
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
        {t('privacyNotice')}
      </p>
    </div>
  );

  // Main render
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {renderStepIndicator()}
      
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
    </form>
  );
} 