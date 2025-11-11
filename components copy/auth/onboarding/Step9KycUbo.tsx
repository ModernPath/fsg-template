"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ApplicationFormData } from '../OnboardingFlow';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { FinnishSSN } from 'finnish-ssn';
import {
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Types
export interface UboData {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
}

interface FetchedApplicationData {
  id: string;
  amount: number | null;
  term_months: number | null;
  type: string | null;
  status: string | null;
  created_at: string;
  companies: {
    name: string | null;
    business_id: string | null;
  } | null;
  financing_needs: {
    id: string;
    purpose: string | null;
    requirements?: any;
  } | null;
}

interface Step9KycUboProps {
  loading: boolean;
  error: string | null;
  applicantNationalId: string;
  ubos: UboData[];
  applicationId: string | null;
  setApplicantNationalId: (value: string) => void;
  setUbos: (ubos: UboData[]) => void;
  onBack: () => void;
  companyId: string | null;
  applicationFormData: any;
  fundingFormData: any;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  currentLocale: string;
}

// Helper Functions
const generateTempId = () => `ubo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export const Step9KycUbo: React.FC<Step9KycUboProps> = ({
  loading: parentLoading,
  error: parentError,
  applicantNationalId,
  ubos,
  applicationId,
  setApplicantNationalId,
  setUbos,
  onBack,
  companyId,
  applicationFormData,
  fundingFormData,
  setError: setParentError,
  setLoading: setParentLoading,
  currentLocale,
}) => {
  const t = useTranslations('Onboarding');
  const { session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'en';
  const supabase = createClient();

  // State for internal operations
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [fetchedApplicationData, setFetchedApplicationData] = useState<FetchedApplicationData | null>(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [applicantIdError, setApplicantIdError] = useState<string | null>(null);
  const [uboIdErrors, setUboIdErrors] = useState<Record<string, string | null>>({});

  // Fetch application data
  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!applicationId || !session?.access_token) {
        setFetchedApplicationData(null);
        return;
      }

      console.log(`[Step9KycUbo] Fetching summary & financing_needs data for applicationId: ${applicationId}`);
      setIsFetchingSummary(true);
      setSummaryError(null);

      try {
        const { data, error } = await supabase
          .from('funding_applications')
          .select(`
            id,
            amount,
            term_months,
            type,
            status,
            created_at,
            companies ( name, business_id ),
            financing_needs ( id, purpose, requirements )
          `)
          .eq('id', applicationId)
          .maybeSingle();

        if (error) {
          console.error('[Step9KycUbo] Error fetching summary/needs data:', error);
          throw new Error(t('step8.error.fetchSummaryFailed', { default: 'Failed to load application summary.' }));
        }

        if (data) {
          console.log('[Step9KycUbo] Summary & financing_needs data fetched:', data);
          const mappedData = {
            ...data,
            financing_needs: data.financing_needs && !Array.isArray(data.financing_needs)
                               ? data.financing_needs
                               : null
          };
          setFetchedApplicationData(mappedData as FetchedApplicationData);
        } else {
          console.warn(`[Step9KycUbo] Application not found for ID: ${applicationId}`);
          setFetchedApplicationData(null);
          throw new Error(t('step8.error.applicationNotFound', { default: 'Application data not found.' }));
        }

      } catch (err: any) {
        console.error('[Step9KycUbo] Catch block fetching summary/needs data:', err);
        setSummaryError(err.message || t('error.generic'));
        setFetchedApplicationData(null);
      } finally {
        setIsFetchingSummary(false);
      }
    };

    fetchSummaryData();
  }, [applicationId, supabase, session?.access_token, t]);

  // Auto-redirect to dashboard after successful submission
  useEffect(() => {
    if (submissionSuccess) {
      // Start countdown from 5 seconds
      setRedirectCountdown(5);
      
      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push(`/${locale}/dashboard`);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [submissionSuccess, router, locale]);

  // UBO Management
  const handleUboChange = (id: string, field: keyof Omit<UboData, 'id'>, value: string) => {
    setUbos(
      ubos.map((ubo) =>
        ubo.id === id ? { ...ubo, [field]: value } : ubo
      )
    );
  };

  const addUbo = () => {
    setUbos([...ubos, { 
      id: generateTempId(), 
      nationalId: applicantNationalId,
      firstName: '', 
      lastName: '' 
    }]);
  };

  const removeUbo = (id: string) => {
    setUbos(ubos.filter((ubo) => ubo.id !== id));
  };

  // Helper to localize purpose field
  const getPurposeLabel = (purpose: string | null | undefined): string => {
    if (!purpose) return '';
    
    // Convert to lowercase and replace spaces with underscores for lookup
    const purposeKey = purpose.toLowerCase().replace(/\s+/g, '_');
    
    // Try to get translation from recommendationType namespace
    const translated = t(`recommendationType.${purposeKey}`, { default: '' });
    
    // If translation exists, return it; otherwise return original
    return translated || purpose;
  };

  // Render Application Summary
  const renderApplicationSummary = () => {
    const formatCurrency = (value: number | string | null | undefined): string => {
        const numericValue = (typeof value === 'number' || typeof value === 'string') ? Number(value) : 0;
        if (isNaN(numericValue) || !isFinite(numericValue)) {
          return '-';
        }
        return new Intl.NumberFormat('fi-FI', { 
          style: 'currency', 
          currency: 'EUR', 
          maximumFractionDigits: 0
        }).format(numericValue);
    };
    
    const FUNDING_TYPES = [
      { value: 'business_loan', labelKey: 'recommendationType.business_loan' },
      { value: 'business_loan_unsecured', labelKey: 'recommendationType.business_loan_unsecured' },
      { value: 'business_loan_secured', labelKey: 'recommendationType.business_loan_secured' },
      { value: 'credit_line', labelKey: 'recommendationType.credit_line' },
      { value: 'factoring_ar', labelKey: 'recommendationType.factoring_ar' },
      { value: 'leasing', labelKey: 'recommendationType.leasing' },
    ];

    const getFundingTypeLabel = (typeValue: string | undefined | null): string => {
        if (!typeValue) return t('step8.notSpecified', { default: 'Not specified' });
        const typeDef = FUNDING_TYPES.find((ft: { value: string; labelKey: string }) => ft.value === typeValue);
        return typeDef ? t(typeDef.labelKey, { default: typeValue }) : typeValue; 
    };

    if (isFetchingSummary) {
      return (
        <div className="p-6 bg-gray-dark/30 border border-gray-dark rounded-lg space-y-3 flex items-center justify-center min-h-[200px]">
          <Spinner className="h-6 w-6 text-gold-primary mr-2" />
          <span className="text-gray-light">{t('step8.loadingSummary', { default: 'Loading Summary...' })}</span>
        </div>
      );
    }

    if (summaryError) {
      return (
        <div className="p-6 bg-red-900/30 border border-red-500/50 rounded-lg space-y-3">
          <h3 className="text-xl font-semibold text-red-400 mb-3">{t('step8.summaryErrorTitle', { default: 'Error Loading Summary' })}</h3>
          <p className="text-sm text-red-300">{summaryError}</p>
        </div>
      );
    }

    if (!fetchedApplicationData) {
       return (
        <div className="p-6 bg-gray-dark/30 border border-gray-dark rounded-lg space-y-3">
          <h3 className="text-xl font-semibold text-gold-primary mb-3">{t('step8.summaryTitle', { default: 'Application Summary' })}</h3>
          <p className="text-sm text-gray-light italic">{t('step8.summaryNotAvailable', { default: 'Application summary not available.' })}</p>
        </div>
      );
    }

    return (
      <div className="p-6 bg-gray-dark/30 border border-gray-dark rounded-lg space-y-3"> 
        <h3 className="text-xl font-semibold text-gold-primary mb-3">{t('step8.summaryTitle', { default: 'Application Summary' })}</h3>
        
        {fetchedApplicationData.companies?.name && (
            <p className="text-sm"><strong>{t('step2.companyNameLabel', { default: 'Company' })}:</strong> {fetchedApplicationData.companies.name}</p>
        )}
        
        {fetchedApplicationData.type && (
            <p className="text-sm">
                <strong>{t('step6.fundingTypeLabel', { default: 'Funding Type' })}:</strong> {getFundingTypeLabel(fetchedApplicationData.type)}
            </p>
        )}
        
        {fetchedApplicationData.amount && (
          <p className="text-sm"><strong>{t('step6.amountLabel', { default: 'Funding Amount' })}:</strong> {formatCurrency(fetchedApplicationData.amount)}</p>
        )}
        
        {fetchedApplicationData.type === 'business_loan' && fetchedApplicationData.term_months && (
          <p className="text-sm"><strong>{t('step6.termLabel', { default: 'Loan Term' })}:</strong> {fetchedApplicationData.term_months} {t('step6.monthsUnit', { default: 'months' })}</p>
        )}
        
        {fetchedApplicationData.financing_needs?.purpose && (
            <p className="text-sm"><strong>{t('step4.purposeLabel', { default: 'Purpose' })}:</strong> {getPurposeLabel(fetchedApplicationData.financing_needs.purpose)}</p>
        )}
        
        <p className="text-xs text-gray-medium pt-2">{t('step8.summaryDisclaimer', { default: 'Review details before submitting.' })}</p>
      </div>
    );
  };

  // Final Application Submission Handler
  const handleFinalApplicationSubmit = async () => {
    console.log('[Step9KycUbo] Submit button clicked - starting submission process');
    
    setParentError(null);
    setApplicantIdError(null);

    if (!memoizedIsFormValid()) {
      console.log('[Step9KycUbo] Form validation failed - stopping submission');
      document.getElementById('applicantNationalId')?.focus();
      return;
    }
    console.log('[Step9KycUbo] Form validation passed - proceeding with submission');

    setParentLoading(true);

    console.log('Context Check:', { 
        hasSession: !!session, 
        companyId: companyId, 
        applicationId: applicationId 
    });

    if (!session || !companyId || !applicationId) {
      setParentError(t('error.missingContext', { default: 'Session, Company ID, or Application ID missing.' }));
      setParentLoading(false);
      return;
    }

    const fundingType = fetchedApplicationData?.type;
    const requiresTermMonths = fundingType?.includes('business_loan');
    
    const finalPayload: any = {
      applicationId: applicationId,
      company_id: companyId,
      amount: Number(fetchedApplicationData?.amount ?? applicationFormData.amount),
      funding_type: fetchedApplicationData?.type,
      applicant_national_id: applicantNationalId,
      ubo_list: ubos.map(({ id, ...rest }) => rest),
      user_id: session.user.id,
    };
    
    if (requiresTermMonths) {
      finalPayload.term_months = Number(fetchedApplicationData?.term_months ?? applicationFormData.term_months);
    } else if (fundingType === 'leasing') {
      const leasingTerm = applicationFormData.leasing_leaseTerm;
      if (leasingTerm && !isNaN(Number(leasingTerm)) && Number(leasingTerm) > 0) {
        finalPayload.term_months = Number(leasingTerm);
      }
    }

    console.log('Submitting final application payload to API:', {
      ...finalPayload,
      applicant_national_id: '[REDACTED]',
      ubo_list: '[REDACTED]'
    });

    try {
      const response = await fetch('/api/onboarding/submit-final-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(finalPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[Step9KycUbo] Submission API call failed or reported failure:', result);
        let errorData = result;
        if (errorData.lenderErrors && errorData.lenderErrors.length > 0) {
             const lenderErrorMessages = errorData.lenderErrors.map((err: any) =>
                `<li>${err.lenderName || 'Unknown Lender'}: ${err.message} ${err.details ? `(${err.details})` : ''}</li>`
            ).join('');
            throw new Error(`${errorData.message || 'Application submitted, but failed for some lenders.'}<br/><strong>Lender Status:</strong><ul>${lenderErrorMessages}</ul>`);
        } else {
            throw new Error(errorData.message || errorData.error || 'Failed to submit application.');
        }
      }

      console.log('Final application submitted successfully via API:', result);
      setSubmissionSuccess(true);
      toast({
        title: t('step8.finalSuccessPopupTitle'),
        description: t('step8.finalSuccessPopupDescription'),
        duration: 9000,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="ml-auto border-amber-300 text-amber-300 hover:bg-amber-300/10"
          >
            {t('step8.finalSuccessPopupAction')}
          </Button>
        ),
      });

       setApplicantNationalId('');
       setUbos([]);
       console.log('Cleared sensitive KYC/UBO data from Step 9 state.');

    } catch (err: any) {
      console.error('Error submitting final funding application via API:', err);
      setParentError(err.message || 'An unexpected error occurred.'); 
      toast({
        variant: 'destructive',
        title: t('error.genericTitle'),
        description: err.message || t('error.generic'), 
      });
    } finally {
      setParentLoading(false);
    }
  };

  // UBO ID and Applicant ID Validation
  const handleUboIdChange = (id: string, value: string) => {
    handleUboChange(id, 'nationalId', value);

    if (value.length >= 11) {
      try {
        const isValid = FinnishSSN.validate(value);
        setUboIdErrors(prev => ({
          ...prev,
          [id]: isValid ? null : t('step8.error.invalidPersonalId', { default: 'Invalid Finnish personal ID format' })
        }));
      } catch (error) {
        setUboIdErrors(prev => ({
          ...prev,
          [id]: t('step8.error.invalidPersonalId', { default: 'Invalid Finnish personal ID format' })
        }));
      }
    } else if (uboIdErrors[id]) {
      setUboIdErrors(prev => ({
        ...prev,
        [id]: null
      }));
    }
  };

  const handleApplicantNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApplicantNationalId(value);

    if (applicantIdError) {
      setApplicantIdError(null);
    }

    if (value.length >= 11) {
      try {
        const isValid = FinnishSSN.validate(value);
        if (!isValid) {
          setApplicantIdError(t('step8.error.invalidPersonalId', { default: 'Invalid Finnish personal ID format' }));
        }
      } catch (error) {
        setApplicantIdError(t('step8.error.invalidPersonalId', { default: 'Invalid Finnish personal ID format' }));
      }
    }
  };

  const memoizedIsFormValid = useCallback(() => {
    console.log('[Step9KycUbo] Validating form:', {
      applicantNationalId: applicantNationalId ? '[FILLED]' : '[EMPTY]',
      ubos: ubos.map(ubo => ({
        id: ubo.id,
        nationalId: ubo.nationalId ? '[FILLED]' : '[EMPTY]',
        firstName: ubo.firstName ? '[FILLED]' : '[EMPTY]',
        lastName: ubo.lastName ? '[FILLED]' : '[EMPTY]'
      }))
    });

    if (!applicantNationalId.trim()) {
      console.log('[Step9KycUbo] Validation failed: Applicant National ID is empty');
      setApplicantIdError(t('step8.error.personalIdRequired', { default: 'Personal ID is required' }));
      return false;
    }

    try {
      const isApplicantIdValid = FinnishSSN.validate(applicantNationalId);
      if (!isApplicantIdValid) {
        setApplicantIdError(t('step8.error.invalidPersonalId', { default: 'Invalid Finnish personal ID format' }));
        return false;
      }
    } catch (error) {
      setApplicantIdError(t('step8.error.invalidPersonalId', { default: 'Invalid Finnish personal ID format' }));
      return false;
    }

    if (ubos.length > 0) {
      const currentUboErrors: Record<string, string | null> = {};
      let hasUboError = false;

      for (const ubo of ubos) {
        let uboError: string | null = null;
        if (!ubo.nationalId.trim()) {
          uboError = t('step8.error.personalIdRequired', { default: 'Personal ID is required' });
        } else {
          try {
            const isUboIdValid = FinnishSSN.validate(ubo.nationalId);
            if (!isUboIdValid) {
              uboError = t('step8.error.invalidPersonalId', { default: 'Invalid Finnish personal ID format' });
            }
          } catch (error) {
            uboError = t('step8.error.invalidPersonalId', { default: 'Invalid Finnish personal ID format' });
          }
        }

        if (!uboError && (!ubo.firstName.trim() || !ubo.lastName.trim())) {
            uboError = t('step8.error.uboNameRequired', { default: 'First and last names are required' });
        }

        if (uboError) {
          currentUboErrors[ubo.id] = uboError;
          hasUboError = true;
        }
      }

      setUboIdErrors(currentUboErrors);

      if (hasUboError) {
          setParentError(t('step8.error.uboValidationFailed', { default: 'Please correct the errors in the Beneficial Owner details.' }));
          return false;
      }
    } else {
        setUboIdErrors({});
    }

    console.log('[Step9KycUbo] Validation passed! All KYC/UBO fields are valid');
    setApplicantIdError(null);
    if (parentError === t('step8.error.uboValidationFailed')) {
        setParentError(null);
    }
    return true;
  }, [applicantNationalId, ubos, t, parentError, setParentError]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-gold-secondary">
      <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-center text-gold-primary">
        {t('step9.title', { default: 'Final Verification & Submission' })}
      </h2>
      <p className="text-lg text-center text-gray-light mb-10">
        {t('step9.description', { default: 'Provide your personal identification and submit your application.' })}
      </p>

      {/* Success Banner */}
      {submissionSuccess && (
        <div className="mb-8 p-6 bg-gradient-to-r from-green-900/40 to-green-800/40 border-2 border-green-500/60 rounded-xl shadow-2xl animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-green-400 mb-2">
                {t('step8.successBannerTitle', { default: '✅ Hakemus lähetetty onnistuneesti!' })}
              </h3>
              <p className="text-lg text-gray-200 mb-4">
                {t('step8.successBannerDescription', { default: 'Rahoitushakemuksenne on vastaanotettu ja lähetetty rahoittajille käsittelyyn. Saat ilmoituksen sähköpostiin kun hakemuksenne on käsitelty.' })}
              </p>
              {redirectCountdown !== null && (
                <div className="text-sm text-green-300 flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  {t('step8.autoRedirectMessage', { 
                    default: `Siirretään hallintapaneeliin ${redirectCountdown} sekunnin kuluttua...`,
                    seconds: redirectCountdown 
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Handling Disclaimer */}
      <div className="onboarding-info-card mb-8">
        <InformationCircleIcon className="onboarding-info-icon" />
        <div>
          <h3 className="onboarding-info-title">
            {t('step8.note', { default: 'Note:' })}
          </h3>
          <p className="onboarding-info-text">
            {t('step8.dataHandlingDisclaimer', { default: 'All personal data is processed securely and used only for application verification.' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {/* Left/Main Column - Form */}
        <div className="md:col-span-2 space-y-8">
          {/* Applicant National ID */}
          <div>
            <label htmlFor="applicantNationalId" className="onboarding-label">
              {t('step8.applicantIdLabel', { default: "Applicant's Personal ID / National ID" })} <span className="text-red-500">*</span>
            </label>
            <Input
              id="applicantNationalId"
              name="applicantNationalId"
              type="text"
              required
              value={applicantNationalId}
              onChange={handleApplicantNationalIdChange}
              placeholder={t('step8.applicantIdPlaceholder', { default: 'Enter Finnish Personal ID (HETU)' })}
              className={`onboarding-input ${applicantIdError ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {applicantIdError && (
              <p className="mt-1 text-sm text-red-400">{applicantIdError}</p>
            )}
            <p className="mt-1 text-sm onboarding-text-secondary">
              {t('step8.applicantIdHelp', { default: 'Required for lender verification.' })}
            </p>
          </div>

          {/* UBO Section */}
          <div className="onboarding-ubo-section space-y-6">
            <h3 className="text-xl font-semibold onboarding-text-white">
              {t('step8.uboTitle', { default: 'Ultimate Beneficial Owners (UBOs)' })}
            </h3>
            <p className="text-sm onboarding-text-secondary">
              {t('step8.uboDescription', { default: 'List all individuals who ultimately own or control 25% or more of the company. If none, leave blank.' })}
            </p>
            
            {ubos.length === 0 && (
              <p className="text-sm onboarding-text-secondary italic">
                {t('step8.uboNone', { default: 'No UBOs added yet. Add one if applicable.' })}
              </p>
            )}

            {ubos.map((ubo, index) => (
              <div key={ubo.id} className="onboarding-ubo-item space-y-4">
                <h4 className="text-md font-medium onboarding-text-secondary">
                  {t('step8.uboEntryTitle', { index: index + 1, default: `Beneficial Owner ${index + 1}` })}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div>
                      <label htmlFor={`ubo_nationalId_${ubo.id}`} className="text-sm onboarding-text-secondary mb-1 block">
                        {t('step8.uboIdLabel', { default: 'Personal ID / National ID' })} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id={`ubo_nationalId_${ubo.id}`}
                        type="text"
                        required
                        value={ubo.nationalId}
                      onChange={(e) => handleUboIdChange(ubo.id, e.target.value)}
                        placeholder={t('step8.uboIdPlaceholder', { default: 'Enter HETU' })}
                      className={`onboarding-input text-sm ${uboIdErrors[ubo.id] ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                    {uboIdErrors[ubo.id] && (
                      <p className="mt-1 text-xs text-red-400">{uboIdErrors[ubo.id]}</p>
                    )}
                    </div>
                    <div>
                      <label htmlFor={`ubo_firstName_${ubo.id}`} className="text-sm onboarding-text-secondary mb-1 block">
                        {t('step8.uboFirstNameLabel', { default: 'First Name' })} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id={`ubo_firstName_${ubo.id}`}
                        type="text"
                        required
                        value={ubo.firstName}
                        onChange={(e) => handleUboChange(ubo.id, 'firstName', e.target.value)}
                        placeholder={t('step8.uboFirstNamePlaceholder', { default: 'Given name' })}
                        className="onboarding-input text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor={`ubo_lastName_${ubo.id}`} className="text-sm onboarding-text-secondary mb-1 block">
                        {t('step8.uboLastNameLabel', { default: 'Last Name' })} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id={`ubo_lastName_${ubo.id}`}
                        type="text"
                        required
                        value={ubo.lastName}
                        onChange={(e) => handleUboChange(ubo.id, 'lastName', e.target.value)}
                        placeholder={t('step8.uboLastNamePlaceholder', { default: 'Family name' })}
                        className="onboarding-input text-sm"
                      />
                    </div>
                </div>

                 <button
                    type="button"
                    onClick={() => removeUbo(ubo.id)}
                    className="absolute top-2 right-2 onboarding-text-secondary hover:text-red-500 p-1"
                    aria-label={t('step8.removeUboAria', { default: 'Remove this owner' })}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addUbo}
              className="onboarding-btn-outline mt-4"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              {t('step8.addUboButton', { default: 'Add Beneficial Owner' })}
            </Button>
          </div>

          {/* Error Display */}
          {parentError && (
            <div className="onboarding-error"
                 dangerouslySetInnerHTML={{ __html: parentError }} />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t onboarding-border mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="onboarding-btn-secondary"
              disabled={parentLoading || submissionSuccess}
            >
              {t('back', { default: 'Back' })}
            </Button>
            
            {submissionSuccess ? (
              <Button
                type="button"
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="onboarding-btn-success"
              >
                {t('step8.goToDashboardButton', { default: 'Go to Dashboard' })}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinalApplicationSubmit}
                disabled={parentLoading}
                className="onboarding-btn-primary"
              >
                {parentLoading ? <Spinner className="h-5 w-5 mr-2 text-black" /> : null}
                {parentLoading ? t('step8.submitting', { default: 'Submitting...' }) : t('step8.submitButton', { default: 'Confirm & Submit Application' })}
              </Button>
            )}
          </div>
        </div>

        {/* Right Column - Application Summary */}
        <div className="md:col-span-1">
          <div className="sticky top-24 space-y-6">
             {renderApplicationSummary()}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Step9KycUbo;
