"use client";

import React, { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Spinner } from '@/components/ui/spinner';
import Image from 'next/image';

// Types (copied or imported as needed)
interface CompanySearchResult {
  businessId: string;
  name: string;
  address: string;
  postalAddress?: string;
  registrationDate?: string;
  status?: string;
  website?: string;
  euId?: string;
  companyForm?: string;
  mainBusinessLine?: string;
  postCode?: string;
  city?: string;
  street?: string;
  buildingNumber?: string;
  entrance?: string;
  apartmentNumber?: string;
  postalPostCode?: string;
  postalCity?: string;
  postalStreet?: string;
  postalBuilding?: string;
  countryCode?: string;
}

type CompanyRow = {
  id: string;
  analysis_status?: 'pending' | 'completed' | 'failed';
  analysis_result?: any;
  name?: string;
  business_id?: string;
  founded?: string; // Assuming this might exist
  contact_info?: { // Assuming this structure
    address?: string;
    postal_code?: string;
    city?: string;
  };
  website?: string;
  [key: string]: any;
};

// Props definition
interface Step2CompanyInfoProps {
  companyFormData: { name: string; code: string; selectedCompany: CompanySearchResult | null };
  companySearchQuery: string;
  companySearchResults: CompanySearchResult[];
  isCompanySearchLoading: boolean;
  companyData: CompanyRow | null;
  isAnalysisRunning: boolean;
  loading: boolean;
  error: string | null;
  locale?: string; // Add locale prop
  selectedCountry: 'finland' | 'sweden'; // Add selectedCountry prop
  handleCompanyFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCompanySelection: (selected: CompanySearchResult | null) => void;
  handleStep2Submit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  continueWithExistingCompany: () => void;
  setCompanyData: (data: CompanyRow | null) => void;
  setCompanyId: (id: string | null) => void;
  triggerImmediateEnrichment?: (companyId: string) => Promise<void>;
  setCompanyFormData: React.Dispatch<React.SetStateAction<{ name: string; code: string; selectedCompany: CompanySearchResult | null }>>;
  setCompanySearchQuery: (query: string) => void;
  onCountryChange?: (country: 'finland' | 'sweden') => void;
}

// Use onboarding styles with proper contrast
const inputClasses = "w-full px-5 py-3 text-lg text-white bg-gray-very-dark border border-gray-dark rounded-lg focus:ring-gold-primary/20 focus:border-gold-primary focus:bg-black transition-colors placeholder-gray-medium";

// Progress component for company analysis
const CompanyAnalysisProgress: React.FC = () => {
  const t = useTranslations('Onboarding');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  const phases = [
    {
      key: 'searching',
      title: t('step2.phases.searching.title', { default: 'Söker företagsinformation' }),
      description: t('step2.phases.searching.desc', { default: 'Hämtar officiella företagsuppgifter från register...' }),
      duration: 15000 // 15 seconds
    },
    {
      key: 'enriching', 
      title: t('step2.phases.enriching.title', { default: 'Analyserar marknadsinformation' }),
      description: t('step2.phases.enriching.desc', { default: 'Söker finansiella data och marknadsinformation...' }),
      duration: 30000 // 30 seconds
    },
    {
      key: 'finalizing',
      title: t('step2.phases.finalizing.title', { default: 'Slutför analys' }),
      description: t('step2.phases.finalizing.desc', { default: 'Sammanställer företagsprofil och rekommendationer...' }),
      duration: 10000 // 10 seconds
    }
  ];

  React.useEffect(() => {
    let totalElapsed = 0;
    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
    
    const updateProgress = () => {
      totalElapsed += 500; // Update every 500ms
      const newProgress = Math.min((totalElapsed / totalDuration) * 100, 100);
      setProgress(newProgress);
      
      // Determine current phase
      let elapsed = 0;
      for (let i = 0; i < phases.length; i++) {
        elapsed += phases[i].duration;
        if (totalElapsed <= elapsed) {
          setCurrentPhase(i);
          break;
        }
      }
      
      if (totalElapsed < totalDuration) {
        setTimeout(updateProgress, 500);
      }
    };
    
    updateProgress();
  }, []);

  return (
    <div className="text-center py-16">
      {/* Animated icon */}
      <div className="relative mx-auto mb-6">
        <div className="w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-gold-primary/30 rounded-full"></div>
          <div 
            className="absolute inset-0 border-4 border-gold-primary rounded-full border-t-transparent animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-gold-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <h3 className="text-xl font-bold text-foreground mb-2">
        {phases[currentPhase]?.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {phases[currentPhase]?.description}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-sm mx-auto mb-4">
        <div className="bg-gray-700 h-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-gold-primary to-gold-secondary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{Math.round(progress)}%</span>
          <span>{t('step2.estimatedTime', { default: 'Ca 1-2 minuter' })}</span>
        </div>
      </div>

      {/* Phase dots */}
      <div className="flex justify-center space-x-3 mb-6">
        {phases.map((phase, index) => (
          <div
            key={phase.key}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index <= currentPhase 
                ? 'bg-gold-primary scale-110' 
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Additional info */}
      <div className="text-xs text-muted-foreground bg-gray-800/50 rounded-lg p-3 max-w-md mx-auto">
        <p className="mb-2">{t('step2.analysisNote', { 
          default: 'Vi hämtar omfattande företagsinformation från officiella källor och finansiella databaser för att ge dig den bästa analysen.' 
        })}</p>
        <p>{t('step2.reliabilityNote', { 
          default: 'All information verifieras från pålitliga källor. Om data inte kan hittas markeras det tydligt.' 
        })}</p>
      </div>
    </div>
  );
};

export const Step2CompanyInfo: React.FC<Step2CompanyInfoProps> = ({
  companyFormData,
  companySearchQuery,
  companySearchResults,
  isCompanySearchLoading,
  companyData,
  isAnalysisRunning,
  loading,
  error,
  locale = 'en', // Default to English
  selectedCountry, // Use selectedCountry from props
  handleCompanyFormChange,
  handleCompanySelection,
  handleStep2Submit,
  continueWithExistingCompany,
  setCompanyData,
  setCompanyId,
  setCompanyFormData,
  setCompanySearchQuery,
  onCountryChange,
  triggerImmediateEnrichment
}) => {
  const t = useTranslations('Onboarding');
  
  // Check if Swedish mode is active
  const isSwedishMode = selectedCountry === 'sweden';

  // Helper function to validate Swedish organisationsnummer (disabled for now)
  const validateSwedishOrgnr = (orgnr: string): boolean => {
    // Validation disabled - accept any input for Swedish companies
    return true;
  };

  // Helper function to format Swedish organisationsnummer
  const formatSwedishOrgnr = (orgnr: string): string => {
    // Remove any non-digit characters
    const cleaned = orgnr.replace(/[^\d]/g, '');
    
    // Don't format if empty or too short
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 6) return cleaned;
    
    // Add hyphen after 6 digits
    if (cleaned.length <= 10) {
      return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
    }
    
    // Limit to 10 digits total
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Helper function to render company details from database record with enriched data
  const renderCompanyDataDetails = () => {
    if (!companyData) return null;
    
    return (
      <div className="flex flex-col h-full overflow-y-auto px-2">
        {/* Company Header */}
        <div className="text-center mb-6">
          <Image
            src="/images/other/laiskiainen_suurennuslasi.jpeg"
            alt={t('step2.slothAlt', { default: 'Sloth with magnifying glass inspecting company details' })}
            width={200}
            height={150}
            className="mx-auto mb-4 rounded-lg"
          />
          <h3 className="text-2xl font-bold onboarding-text-white mb-2">{companyData.name}</h3>
          <p className="text-sm onboarding-text-secondary">{t('step2.businessId', { default: 'Business ID' })}: {companyData.business_id}</p>
        </div>

        {/* Basic Company Information Only */}
        <div className="space-y-4 text-center">
          {companyData.founded && (
            <p className="text-base onboarding-text-secondary">
              <span className="font-semibold onboarding-text-white">{t('step2.foundedLabel', { default: 'Founded' })}</span>: {companyData.founded}
            </p>
          )}
          
          {companyData.address && (
            <div>
              <h4 className="text-base font-semibold onboarding-text-white mb-1">{t('step2.addressLabel', { default: 'Address' })}:</h4>
              <p className="text-base onboarding-text-secondary">{companyData.address}</p>
            </div>
          )}
          
          {companyData.contact_info && typeof companyData.contact_info === 'object' && companyData.contact_info.address && !companyData.address && (
            <div>
              <h4 className="text-base font-semibold onboarding-text-white mb-1">{t('step2.addressLabel', { default: 'Address' })}:</h4>
              <p className="text-base onboarding-text-secondary">
                {companyData.contact_info.address}
                {companyData.contact_info.postal_code && companyData.contact_info.city ? 
                  `, ${companyData.contact_info.postal_code} ${companyData.contact_info.city}` : ''}
              </p>
            </div>
          )}
          
          {companyData.website && (
            <div>
              <h4 className="text-base font-semibold onboarding-text-white mb-1">{t('step2.websiteLabel', { default: 'Website' })}:</h4>
              <a href={companyData.website.startsWith('http') ? companyData.website : `https://${companyData.website}`} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="text-gold-primary hover:text-gold-secondary underline">
                {companyData.website}
              </a>
            </div>
          )}
          
          {/* Hint about detailed analysis in next step */}
          <div className="mt-8 p-4 bg-gold-primary/10 border border-gold-primary/30 rounded-lg">
            <p className="text-sm onboarding-text-secondary italic">
              {t('step2.detailedInfoHint', { default: '💡 Kattava yritysanalyysi näkyy seuraavassa vaiheessa' })}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Helper function to render selected company from search
  const renderSelectedCompanyDetails = () => {
    if (!companyFormData.selectedCompany) return null;
    
    const company = companyFormData.selectedCompany;
    return (
      <div className="flex flex-col items-center text-center h-full justify-center">
        <Image
          src="/images/other/laiskiainen_suurennuslasi.jpeg"
          alt={t('step2.slothAlt', { default: 'Sloth with magnifying glass inspecting company details' })}
          width={250}
          height={188}
          className="mb-6 rounded-lg"
        />
        <div className="max-w-md">
          <h3 className="text-2xl font-bold onboarding-text-white mb-4">{company.name}</h3>
          <p className="text-base onboarding-text-secondary mb-2">{t('step2.companyCode', { default: 'Business ID' })}: {company.businessId}</p>
          
          {company.registrationDate && (
            <p className="text-base onboarding-text-secondary mb-2">
              {t('step2.registrationDateLabel', { default: 'Registration Date' })}: {company.registrationDate}
            </p>
          )}
          
          {company.address && (
            <div className="mb-4">
              <h4 className="text-base font-semibold onboarding-text-white">{t('step2.addressLabel', { default: 'Address' })}:</h4>
              <p className="text-base onboarding-text-secondary">{company.address}</p>
            </div>
          )}
          
          {company.website && (
            <p className="text-base onboarding-text-secondary mb-2">
              {t('step2.websiteLabel', { default: 'Website' })}: 
              <a href={company.website} target="_blank" rel="noopener noreferrer" 
                 className="onboarding-text-secondary hover:onboarding-text-white underline ml-1">
                {company.website}
              </a>
            </p>
          )}
        </div>
      </div>
    );
  };
  
  // Helper function to render confirmation form for existing company
  const renderExistingCompanyForm = () => (
    <div className="space-y-8">
      <div className="onboarding-info-card mb-6">
        <h3 className="text-lg font-medium onboarding-text-white mb-2">{t('step2.existingCompanyTitle', { default: 'Your Company' })}</h3>
        <p className="text-sm onboarding-text-secondary">{t('step2.existingCompanyDescription', { default: 'We found an existing company associated with your account. You can continue with this company or search for a different one.' })}</p>
      </div>
      
      <div className="flex space-y-4 flex-col">
        <button
          type="button"
          onClick={continueWithExistingCompany}
          className="onboarding-btn-primary"
        >
          {t('step2.continueWithExisting', { default: 'Continue with This Company' })}
        </button>
        
        {/* Immediate Research Button */}
        {triggerImmediateEnrichment && companyData?.id && (
          <button
            type="button"
            onClick={() => triggerImmediateEnrichment(companyData.id)}
            className="onboarding-btn-secondary bg-blue-600 hover:bg-blue-700 text-white"
          >
            🔍 {t('step2.triggerResearch', { default: 'Research Company Now' })}
          </button>
        )}
        
        <button
          type="button"
          onClick={() => {
            setCompanyData(null);
            setCompanyId(null);
            setCompanyFormData({ name: '', code: '', selectedCompany: null });
          }}
          className="onboarding-btn-secondary"
        >
          {t('step2.selectDifferent', { default: 'Select Different Company' })}
        </button>
      </div>
    </div>
  );
  
  // Helper function to render Swedish company form with automatic lookup
  const renderSwedishCompanyForm = () => (
    <form onSubmit={handleStep2Submit} className="space-y-8">
      {/* Organisationsnummer - Primary Input with Auto-lookup */}
      <div>
        <label htmlFor="code" className="onboarding-label text-lg font-medium mb-3">
          {t('step2.organisationsnummer', { default: 'Organisationsnummer' })}
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          value={companyFormData.code}
          onChange={handleCompanyFormChange}
          className={`${inputClasses} ${isAnalysisRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={t('step2.organisationsnummerPlaceholder', { default: 'Enter organisationsnummer (e.g., 556123-4567)' })}
          pattern="\d{6}-\d{4}|\d{10}" // Swedish organisationsnummer format
          disabled={isAnalysisRunning}
        />
        <p className="mt-1 text-sm onboarding-text-secondary">
          {t('step2.organisationsnummerFormat', { default: 'Format: 556123-4567 (10 digits with check digit)' })}
        </p>
        {isCompanySearchLoading && (
          <p className="mt-1 text-sm text-gold-primary">
            {t('step2.searchingCompany', { default: 'Searching for company information...' })}
          </p>
        )}
      </div>

      {/* Company Name - Auto-filled or Manual Entry */}
      <div>
        <label htmlFor="name" className="onboarding-label text-lg font-medium mb-3">
          {t('step2.companyName', { default: 'Company Name' })}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={companyFormData.name}
          onChange={handleCompanyFormChange}
          className={`${inputClasses} ${isAnalysisRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={t('step2.companyNamePlaceholderSwedish', { default: 'Company name will be filled automatically...' })}
          disabled={isAnalysisRunning}
        />
        <p className="mt-1 text-sm onboarding-text-secondary">
          {t('step2.companyNameAutoNote', { default: 'Company name will be automatically filled when you enter a valid organisationsnummer' })}
        </p>
      </div>

      {/* Show company search results if available */}
      {companySearchResults.length > 0 && (
        <div className="bg-gray-800 border border-gold-primary/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gold-primary mb-2">
            {t('step2.foundCompany', { default: 'Found Company' })}
          </h4>
          {companySearchResults.map((company, index) => (
            <div key={index} className="text-sm text-white">
              <p><strong>{company.name}</strong></p>
              <p>{company.address}</p>
              <p>{company.postCode} {company.city}</p>
              {company.website && <p>Website: {company.website}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Note about automatic data fetching */}
      <div className="bg-gray-800 border border-gold-primary/30 rounded-lg p-4">
        <p className="text-sm text-gold-primary">
          {t('step2.swedishAutoNote', { default: 'We will automatically fetch your company details, financial information, and perform business analysis based on your organisationsnummer.' })}
        </p>
      </div>

      {error && (
        <div className="onboarding-error mb-4">
          <div dangerouslySetInnerHTML={{ __html: error }} />
          {(error.includes('tekniska begränsningar') || error.includes('datahämtning misslyckades') || error.includes('försök igen')) && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleStep2Submit}
                className="px-6 py-2 bg-gold-primary text-black font-medium rounded-lg hover:bg-gold-highlight transition-colors"
              >
                {t('step2.retryAnalysis', { default: 'Försök igen med företagsanalys' })}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={loading || !companyFormData.name || !companyFormData.code || isAnalysisRunning} 
          className="onboarding-btn-primary"
        >
          {loading ? <Spinner className="h-5 w-5 mr-2 text-black" /> : null}
          {loading ? t('loading') : t('step2.submitAndAnalyze', { default: 'Submit & Analyze' })}
        </button>
      </div>
    </form>
  );

  // Helper function to render company search form
  const renderCompanySearchForm = () => (
    <form onSubmit={handleStep2Submit} className="space-y-8">
      {/* Company Name with Predictive Search (Combobox) */}
      <div>
        <Combobox value={companyFormData.selectedCompany} onChange={handleCompanySelection} nullable disabled={isAnalysisRunning}>
          <Combobox.Label className="onboarding-label text-lg font-medium mb-3">{t('step2.companyName', { default: 'Company Name' })}</Combobox.Label>
          <div className="relative mt-1">
            <Combobox.Input
              className={`${inputClasses} ${isAnalysisRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              displayValue={(company: CompanySearchResult | null) => company?.name || companyFormData.name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setCompanyFormData(prev => ({ ...prev, name: event.target.value, selectedCompany: null, code: '' }));
                setCompanySearchQuery(event.target.value);
              }}
              placeholder={t('step2.companyNamePlaceholder', { default: 'Start typing your company name...' })}
              autoComplete="off"
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-medium" aria-hidden="true" />
            </Combobox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => !companyFormData.selectedCompany && setCompanySearchQuery('')} // Clear query if nothing selected
            >
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-very-dark border border-gray-dark py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-xs">
                {isCompanySearchLoading && (
                  <div className="relative cursor-default select-none py-2 px-4 text-white">{t('loading', { default: 'Loading...' })}</div>
                )}
                {!isCompanySearchLoading && companySearchQuery.length >= 3 && companySearchResults.length === 0 && (
                  <div className="relative cursor-default select-none py-2 px-4 text-white">{t('step2.noResults', { default: 'No companies found.' })}</div>
                )}
                {companySearchResults.map((company) => (
                  <Combobox.Option
                    key={company.businessId}
                    className={({ active }: { active: boolean }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-gold-primary/10 text-gold-primary' : 'text-white'}`
                    }
                    value={company}
                  >
                    {({ selected, active }: { selected: boolean, active: boolean }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium text-gold-primary' : 'font-normal text-white'}`}>
                          {company.name} ({company.businessId})
                        </span>
                        {selected ? (
                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-gold-highlight' : 'text-gold-primary'}`}>
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                        <span className={`block truncate text-xs ${active ? 'text-gold-primary/70' : 'text-gray-100'}`}>
                          {company.address}
                        </span>
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
      </div>

      {/* Company Code (Y-tunnus) */}
      <div>
        <label htmlFor="code" className="onboarding-label text-lg font-medium mb-3">{t('step2.businessId', { default: 'Business ID (Y-tunnus)' })}</label>
        <input
          type="text"
          id="code"
          name="code"
          required
          value={companyFormData.code}
          onChange={handleCompanyFormChange} // Allows manual entry/correction
          className={`${inputClasses} ${isAnalysisRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={t('step2.businessIdPlaceholder', { default: 'Enter Y-tunnus (e.g., 1234567-8)' })}
          pattern="\d{7}-\d|\d{7}[\dA-Za-z]" // Fixed pattern to allow both formats
          readOnly={!!companyFormData.selectedCompany || isAnalysisRunning} // Make read-only if selected from dropdown or analysis running
          aria-readonly={!!companyFormData.selectedCompany || isAnalysisRunning}
          disabled={isAnalysisRunning}
        />
        {/* Help text for manual entry */}
        <p className="mt-1 text-sm onboarding-text-secondary">
          {t('step2.businessIdFormat', { default: 'Format: 1234567-8 or 12345678' })}
        </p>
      </div>

      {error && (
        <div className="onboarding-error mb-4">
          <div dangerouslySetInnerHTML={{ __html: error }} />
          {(error.includes('tekniska begränsningar') || error.includes('datahämtning misslyckades') || error.includes('försök igen')) && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleStep2Submit}
                className="px-6 py-2 bg-gold-primary text-black font-medium rounded-lg hover:bg-gold-highlight transition-colors"
              >
                {t('step2.retryAnalysis', { default: 'Försök igen med företagsanalys' })}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={loading || !companyFormData.name || !companyFormData.code || isAnalysisRunning} 
          className="onboarding-btn-primary"
        >
          {loading ? <Spinner className="h-5 w-5 mr-2 text-black" /> : null}
          {loading ? t('loading') : t('step2.submitAndAnalyze', { default: 'Submit & Analyze' })}
        </button>
      </div>
    </form>
  );
  
  // Helper function to render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center text-center h-full justify-center">
      <Image
        src="/images/other/laiskiainen_suurennuslasi.jpeg"
        alt={t('step2.slothAltEmpty', { default: 'Sloth with magnifying glass waiting for company search' })}
        width={250}
        height={188}
        className="mb-6 rounded-lg opacity-70"
      />
      <div className="max-w-md">
        <h3 className="text-2xl font-bold onboarding-text-white mb-4">
          {isSwedishMode 
            ? t('step2.enterCompanyTitle', { default: 'Enter Your Company Details' })
            : t('step2.findCompanyTitle', { default: 'Find Your Company' })
          }
        </h3>
        <p className="text-base onboarding-text-secondary">
          {isSwedishMode 
            ? t('step2.enterCompanyDescription', { default: 'Fill in your company name and organisationsnummer on the left. We\'ll analyze your company information.' })
            : t('step2.findCompanyDescription', { default: 'Use the search on the left to find your company. Selecting a company will populate its details here.' })
          }
        </p>
      </div>
    </div>
  );

  return (
    <div className="onboarding-container">
      <div className="flex items-center justify-between mb-8">
        <h2 className="onboarding-title text-2xl lg:text-3xl font-bold">
          {t('step2.title', { default: 'Company Info' })}
        </h2>
      </div>
      
      <p className="onboarding-description text-lg mb-6">
        {t('step2.description', { default: 'Please provide your company details.' })}
      </p>

      {/* Country Selector */}
      <div className="mb-8">
        <label className="onboarding-label text-base font-medium mb-3 block">
          {t('step2.selectCountry', { default: 'Select Country' })}
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => {
              onCountryChange?.('finland');
              // Clear form when switching countries
              setCompanyFormData({ name: '', code: '', selectedCompany: null });
              setCompanySearchQuery('');
            }}
            className={`flex items-center px-6 py-3 rounded-lg border transition-all ${
              selectedCountry === 'finland'
                ? 'border-gold-primary bg-gold-primary/10 text-gold-primary'
                : 'border-gray-dark bg-gray-very-dark text-gray-light hover:border-gray-medium'
            }`}
          >
            <span className="text-xl mr-3">🇫🇮</span>
            {t('step2.finland', { default: 'Finland' })}
            {selectedCountry === 'finland' && (
              <span className="ml-2 text-sm">({t('step2.withSearch', { default: 'with search' })})</span>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onCountryChange?.('sweden');
              // Clear form when switching countries
              setCompanyFormData({ name: '', code: '', selectedCompany: null });
              setCompanySearchQuery('');
            }}
            className={`flex items-center px-6 py-3 rounded-lg border transition-all ${
              selectedCountry === 'sweden'
                ? 'border-gold-primary bg-gold-primary/10 text-gold-primary'
                : 'border-gray-dark bg-gray-very-dark text-gray-light hover:border-gray-medium'
            }`}
          >
            <span className="text-xl mr-3">🇸🇪</span>
            {t('step2.sweden', { default: 'Sweden' })}
            {selectedCountry === 'sweden' && (
              <span className="ml-2 text-sm">({t('step2.manualEntry', { default: 'manual entry' })})</span>
            )}
          </button>
        </div>
      </div>
      
      <div className="onboarding-card rounded-xl shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Left Column - Form (either company search or confirmation) */}
          <div className="md:w-1/2 p-8 border-r onboarding-border">
            {isAnalysisRunning ? (
              <CompanyAnalysisProgress />
            ) : companyData && !companyFormData.selectedCompany ? (
              renderExistingCompanyForm()
            ) : isSwedishMode ? (
              renderSwedishCompanyForm()
            ) : (
              renderCompanySearchForm()
            )}
          </div>
          
          {/* Right Column - Company Details or Analysis Status */}
          <div className="md:w-1/2 p-8 onboarding-bg-card">
            {isAnalysisRunning ? (
              <CompanyAnalysisProgress />
            ) : companyData && !companyFormData.selectedCompany ? (
              renderCompanyDataDetails()
            ) : companyFormData.selectedCompany ? (
              renderSelectedCompanyDetails()
            ) : (
              renderEmptyState()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2CompanyInfo; 