'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { TurnstileWidget } from '@/components/ui/turnstile';
import { CheckCircleIcon, ArrowRightIcon, DocumentTextIcon, CloudArrowUpIcon, CurrencyDollarIcon, UserIcon, BuildingOffice2Icon, BuildingOfficeIcon, ExclamationCircleIcon, ChartBarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { debounce } from 'lodash-es';
import { Spinner } from '@/components/ui/spinner';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Trash2,
  FileUp,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAuthHeaders, trackConversion } from '@/utils/apiUtils';
import Step1Signup from './onboarding/Step1Signup';
import Step2CompanyInfo from './onboarding/Step2CompanyInfo';
import Step3AIConversation from './onboarding/Step3AIConversation';
import Step3PreAnalysis from './onboarding/Step3PreAnalysis';
import Step4FundingNeeds from './onboarding/Step4FundingNeeds';
import Step5DocumentUpload from './onboarding/Step5DocumentUpload';
import Step6Summary from './onboarding/Step6Summary';

import { toast } from '@/components/ui/use-toast';
import {
  ClipboardDocumentListIcon, // Icon for Summary
  PencilSquareIcon,          // Icon for Application
  IdentificationIcon        // Icon for KYC/UBO
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Dialog } from '@headlessui/react';
// --- ADDED: Import Realtime types --- 
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
// --- RESTORED: Import the loader ---
import ProgressBarLoader from '@/components/ui/ProgressBarLoader'; 

// --- NEW: InfoPopup Component ---
interface InfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const InfoPopup = ({ isOpen, onClose, title, children }: InfoPopupProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-very-dark border border-gold-primary/30 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-semibold leading-6 text-gold-primary flex items-center"
                >
                  <InformationCircleIcon className="h-6 w-6 mr-3 text-gold-primary" />
                  {title}
                </Dialog.Title>
                <div className="mt-4 text-gray-light">
                  {children}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    type="button"
                    onClick={onClose}
                    className="onboarding-btn-primary px-6 py-2"
                  >
                    OK
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
// --- END InfoPopup Component ---

// --- NEW: Define step names as enum for better maintainability ---
export enum StepName {
  SIGNUP = 'rekisteroityminen',
  COMPANY_INFO = 'yrityksen-valinta', 
  AI_CONVERSATION = 'yrityksen-taustatiedot',
  PRE_ANALYSIS = 'pre-analysis',
  FUNDING_NEEDS = 'rahoitustarve',
  DOCUMENT_UPLOAD = 'dokumentit',
  SUMMARY = 'yhteenveto'
}

// --- NEW: Step order mapping ---
const STEP_ORDER: StepName[] = [
  StepName.SIGNUP,
  StepName.COMPANY_INFO,
  StepName.AI_CONVERSATION,
];

// --- NEW: Helper functions for step management ---
const getStepIndex = (stepName: StepName): number => {
  return STEP_ORDER.indexOf(stepName) + 1; // 1-based index for display
};

const getStepName = (index: number): StepName | null => {
  return STEP_ORDER[index - 1] || null; // Convert 1-based index to 0-based
};

const getNextStep = (currentStep: StepName): StepName | null => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  return currentIndex >= 0 && currentIndex < STEP_ORDER.length - 1 
    ? STEP_ORDER[currentIndex + 1] 
    : null;
};

const getPreviousStep = (currentStep: StepName): StepName | null => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  return currentIndex > 0 ? STEP_ORDER[currentIndex - 1] : null;
};

// --- NEW: Get localized query parameter name for step ---
const getStepParamName = (locale: string): string => {
  const paramNames: Record<string, string> = {
    'fi': 'vaihe',
    'sv': 'steg',
    'en': 'step',
  };
  return paramNames[locale] || 'step';
};

// Type for our step data
type StepData = {
  name: StepName;
  title: string;
  icon: React.ElementType;
  description: string;
};

// Initial registration form data
// --- MODIFICATION: Update type definition ---
type InitialFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  consentMarketing: boolean;
  consentAnalysis: boolean;
};
// --- END MODIFICATION ---

// Document upload data
type DocumentFormData = {
  // Removed fiscalYear and fiscalPeriod fields
};

// Funding needs form data
type FundingFormData = {
  fundingNeeds: string;
  purpose: string;
  amount: number;
  timeline: string;
  factoring_monthlyInvoices?: number;
  factoring_paymentDays?: number;
  factoring_customerLocation?: string;
};



// --- EXPORTED Type ---
// Application details form data (Step 6)
export type ApplicationFormData = {
  amount: number | string; // Allow string for input flexibility
  term_months: number | string; // Allow string for input flexibility
  funding_recommendation_id?: string | null; // Optional ID if started from a recommendation
};

// Interface for company search results
interface CompanySearchResult {
  businessId: string;
  name: string;
  address: string; // primary address (type 1)
  postalAddress?: string; // postal address (type 2)
  registrationDate?: string;
  status?: string;
  website?: string;
  euId?: string;
  companyForm?: string;
  mainBusinessLine?: string;
  // Address details
  postCode?: string;
  city?: string;
  street?: string;
  buildingNumber?: string;
  entrance?: string;
  apartmentNumber?: string;
  // Postal address details
  postalPostCode?: string;
  postalCity?: string;
  postalStreet?: string;
  postalBuilding?: string;
  countryCode?: string;
}

// Document interface to match database schema and Step components
interface UploadedDocument {
  id: string;
  name: string; // Maps to file_name in database
  document_type_id?: string | null;
  document_types?: { name: string } | null;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
  file_size?: number;
  fiscal_year?: number | null;
  fiscal_period?: string | null;
  created_at: string;
  file_path: string;
  company_id?: string;
  user_id?: string;
  [key: string]: any;
}

// First, create a common input class to be used across all steps
const inputClasses = "w-full px-5 py-3 text-lg text-white bg-gray-very-dark border border-gray-dark rounded-lg focus:ring-gold-primary/20 focus:border-gold-primary focus:bg-black transition-colors placeholder-gray-dark";
const selectClasses = "w-full px-5 py-3 text-lg text-white bg-gray-very-dark border border-gray-dark rounded-lg focus:ring-gold-primary/20 focus:border-gold-primary focus:bg-black transition-colors appearance-none";
const textareaClasses = "w-full px-5 py-3 text-lg text-white bg-gray-very-dark border border-gray-dark rounded-lg focus:ring-gold-primary/20 focus:border-gold-primary focus:bg-black transition-colors placeholder-gray-dark";

// Type for Company row (adjust if needed based on actual schema)
export type CompanyRow = {
  id: string;
  name?: string; // Allow undefined, to match expected type
  business_id?: string; // Allow undefined, but not null
  // Add other relevant fields fetched
  [key: string]: any;
};

// Add a helper function to display errors properly
const DisplayError = ({ error }: { error: string | null }) => {
  if (!error) return null;
  return (
    <div
      className="text-red-500 text-sm p-4 bg-red-900/20 border border-red-500/50 rounded-lg"
      dangerouslySetInnerHTML={{ __html: error }}
    />
  );
};

export default function OnboardingFlow() {
  // Get router and translations
  const router = useRouter();
  const { locale } = useParams();
  const t = useTranslations('Onboarding');
  const { session, user, loading: authLoading } = useAuth();
  const supabase = createClient();

  // State management - UPDATED to use StepName
  const [currentStep, setCurrentStep] = useState<StepName>(StepName.SIGNUP);
  // --- MODIFICATION: Update state initialization ---
  const [initialFormData, setInitialFormData] = useState<InitialFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    consentMarketing: false,
    consentAnalysis: false,
  });
  // --- END MODIFICATION ---
  const [documentFormData, setDocumentFormData] = useState<DocumentFormData>({
    // Empty object since we removed the fields
  });
  const [fundingFormData, setFundingFormData] = useState<FundingFormData>({
    fundingNeeds: '',
    purpose: '',
    amount: 0,
    timeline: '',
  });
  const [companyFormData, setCompanyFormData] = useState({ 
    name: '', 
    code: '', 
    selectedCompany: null as CompanySearchResult | null 
  });
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companySearchResults, setCompanySearchResults] = useState<CompanySearchResult[]>([]);
  const [isCompanySearchLoading, setIsCompanySearchLoading] = useState(false);
  
  const [loading, setLoading] = useState<boolean>(false); // Initialize loading to false
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<CompanyRow | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  
  // State for selected country (determines search mode)
  const getDefaultCountry = () => {
    if (locale === 'sv') return 'sweden';
    return 'finland'; // Default for 'fi' and 'en'
  };
  const [selectedCountry, setSelectedCountry] = useState<'finland' | 'sweden'>(getDefaultCountry());

  // Add state for Step 6 application details
  const [applicationFormData, setApplicationFormData] = useState<ApplicationFormData>({
    amount: '',
    term_months: '', // Initial state is empty string
    funding_recommendation_id: null,
  });
  // Add state to store fetched recommendations for Step 5
  const [fundingRecommendations, setFundingRecommendations] = useState<any[]>([]);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState<boolean>(false);
  // --- ADDED: State for Application ID ---
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Add a state variable to track if the step has been initialized from URL
  const [stepInitializedFromUrl, setStepInitializedFromUrl] = useState(false);

  // Add new state variables for drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  // Rename state to hold an array of financial data objects
  const [financialDataArray, setFinancialDataArray] = useState<any[]>([]); // Initialize as empty array
  const [isFetchingFinancials, setIsFetchingFinancials] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // State for initial analysis button click/API call
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isFetchingDocuments, setIsFetchingDocuments] = useState<boolean>(false);
  const [isFetchingDocTypes, setIsFetchingDocTypes] = useState<boolean>(false);
  const [isPollingFinancials, setIsPollingFinancials] = useState<boolean>(false); // New state for polling

  // --- ADDED: Info Popup State ---
  const [infoPopup, setInfoPopup] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    content: null,
  });

  const showInfoPopup = useCallback((title: string, content: React.ReactNode) => {
    setInfoPopup({ isOpen: true, title, content });
  }, []);

  const closeInfoPopup = useCallback(() => {
    setInfoPopup(prev => ({ ...prev, isOpen: false }));
  }, []);
  // --- END: Info Popup State ---

  // --- ADDED: State to track if navigation from realtime recommendation is pending ---
  const [pendingRecommendationNavigation, setPendingRecommendationNavigation] = useState(false);

  // --- ADDED: State to store the ID from Step 4 --- 
  const [financingNeedsId, setFinancingNeedsId] = useState<string | null>(null);
  // --- END ADDED State ---

  // --- REMOVED: State for document polling ---
  // const [isPollingDocuments, setIsPollingDocuments] = useState<boolean>(false);
  // const [pendingDocumentIds, setPendingDocumentIds] = useState<string[]>([]); // Track IDs being processed

  // Add missing state variables for companies
  const [userCompanies, setUserCompanies] = useState<CompanyRow[]>([]);
  const [isFetchingCompanies, setIsFetchingCompanies] = useState<boolean>(false);



  // --- ADD state for Step 6 Funding Type ---
  // Default to business_loan_unsecured so there's always a valid selection when reaching step 6
  const [fundingType, setFundingType] = useState<string>('business_loan_unsecured');
  // --- END ADD state ---

  // --- NEW State to hold the latest application data saved in Step 6 ---
  const [latestApplicationData, setLatestApplicationData] = useState<any | null>(null);

  // --- NEW State to manage navigation after async state update ---
  const [nextStepTarget, setNextStepTarget] = useState<StepName | null>(null);

  // --- NEW State to trigger data refetch --- 
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);

  // --- MOVED: State for Recommendation Loader (from Step4) ---
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false); // State for background generation

  // Add new state to store analysis timestamp
  const [analysisStartTimestamp, setAnalysisStartTimestamp] = useState<number | undefined>(undefined);

  // --- MOVED: Function declarations before useEffects that use them ---
  
  // --- ADD: Missing fetchSelectedCompanyData function ---
  const fetchSelectedCompanyData = useCallback(async (companyId: string): Promise<CompanyRow | null> => {
    if (!companyId) return null;
    
    try {
      console.log(`🔍 [fetchSelectedCompanyData] Fetching company data for ID: ${companyId}`);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error) {
        console.error('❌ [fetchSelectedCompanyData] Error fetching company:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ [fetchSelectedCompanyData] Company data fetched:', data);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [fetchSelectedCompanyData] Unexpected error:', error);
      throw error;
    }
  }, [supabase]);

  // --- ADD: Missing fetchUserCompanies function ---
  const fetchUserCompanies = useCallback(async () => {
    if (!session?.user?.id || !session?.access_token) {
      console.log('ℹ️ [fetchUserCompanies] No user session or access token, skipping fetch');
      return;
    }
    
    setIsFetchingCompanies(true);
    
    try {
      console.log('🔍 [fetchUserCompanies] Fetching user companies via API...');
      
      // Use API route instead of direct Supabase query to avoid RLS issues
      const response = await fetch('/api/companies', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [fetchUserCompanies] API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      const companies = result.companies || [];
      
      console.log(`✅ [fetchUserCompanies] Found ${companies.length} companies`);
      setUserCompanies(companies);
      
      // If user has companies and no company is currently selected, select the first one
      if (companies.length > 0 && !companyId) {
        const firstCompany = companies[0];
        console.log('🎯 [fetchUserCompanies] Auto-selecting first company:', firstCompany.id);
        setCompanyId(firstCompany.id);
      }
      
    } catch (error) {
      console.error('❌ [fetchUserCompanies] Unexpected error:', error);
      setError('Failed to load your companies');
    } finally {
      setIsFetchingCompanies(false);
    }
  }, [session?.user?.id, session?.access_token, companyId]);

  // --- ADD: Missing handleCompanyChange function ---
  const handleCompanyChange = useCallback((selectedCompanyId: string) => {
    console.log('🔄 [handleCompanyChange] Company changed to:', selectedCompanyId);
    
    // Clear documents and other company-specific data immediately for better UX
    setDocuments([]);
    setFinancialDataArray([]);
    setFundingRecommendations([]);
    setApplicationId(null);
    setError(null);

    setCompanyId(selectedCompanyId);
    
    // Find the selected company in the userCompanies array
    const selectedCompany = userCompanies.find(company => company.id === selectedCompanyId);
    if (selectedCompany) {
      setCompanyData(selectedCompany);
      console.log('✅ [handleCompanyChange] Company data updated:', selectedCompany);
    }
  }, [userCompanies]);

  // --- ADD: Store financial metrics from company metadata ---
  const storeFinancialMetrics = useCallback(async (companyData: any) => {
    if (!companyData || !session?.user?.id) {
      console.log('ℹ️ [storeFinancialMetrics] Missing company data or user session');
      return;
    }
    
    try {
      console.log('💾 [storeFinancialMetrics] Storing financial metrics for company:', companyData.id);
      console.log('💾 [storeFinancialMetrics] Full company metadata:', JSON.stringify(companyData.metadata, null, 2));
      
      // Get financial data from company metadata
      const financialData = companyData.metadata?.financial_data;
      if (!financialData || !financialData.yearly || !Array.isArray(financialData.yearly)) {
        console.log('ℹ️ [storeFinancialMetrics] No yearly financial data available in metadata');
        return;
      }

      console.log('📊 [storeFinancialMetrics] Found yearly data:', financialData.yearly.length, 'years');
      console.log('📊 [storeFinancialMetrics] Yearly data detail:', JSON.stringify(financialData.yearly, null, 2));

      // Check for existing metrics to avoid duplicates
      const { data: existingMetrics } = await supabase
        .from('financial_metrics')
        .select('fiscal_year')
        .eq('company_id', companyData.id);

      const existingYears = new Set((existingMetrics || []).map(m => m.fiscal_year));
      console.log('📊 [storeFinancialMetrics] Existing years in DB:', Array.from(existingYears));

      // Process each year's financial data
      for (const yearData of financialData.yearly) {
        if (!yearData.year) {
          console.log('⚠️ [storeFinancialMetrics] Skipping year data with missing year:', yearData);
          continue;
        }

        const fiscalYear = parseInt(yearData.year);
        if (existingYears.has(fiscalYear)) {
          console.log(`ℹ️ [storeFinancialMetrics] Skipping year ${fiscalYear} - already exists`);
          continue;
        }

        // Parse financial values
        const parseFinancialValue = (value: any): number | null => {
          if (typeof value === 'number') return value;
          if (typeof value === 'string' && value !== 'Not available') {
            const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
            return Number.isFinite(parsed) ? parsed : null;
          }
          return null;
        };

        // Determine currency based on financial_data metadata or default to EUR
        const currency = companyData.metadata?.financial_data?.currency || 'EUR';
        
        // Prepare comprehensive metrics payload
        const metricsPayload = {
          company_id: companyData.id,
          fiscal_year: fiscalYear,
          fiscal_period: 'annual',
          // Revenue and profit
          revenue_current: parseFinancialValue(yearData.revenue),
          operational_cash_flow: parseFinancialValue(yearData.profit),
          net_profit: parseFinancialValue(yearData.netResult),
          ebitda: parseFinancialValue(yearData.ebitda),
          // Balance sheet
          total_assets: parseFinancialValue(yearData.totalAssets),
          current_assets: parseFinancialValue(yearData.currentAssets),
          total_equity: parseFinancialValue(yearData.equity),
          total_liabilities: parseFinancialValue(yearData.totalLiabilities),
          current_liabilities: parseFinancialValue(yearData.currentLiabilities),
          // Ratios
          return_on_equity: parseFinancialValue(yearData.solidityRatio), // Note: might need mapping
          current_ratio: parseFinancialValue(yearData.currentRatio),
          quick_ratio: parseFinancialValue(yearData.quickRatio),
          debt_to_equity_ratio: (() => {
            const liabilities = parseFinancialValue(yearData.totalLiabilities);
            const equity = parseFinancialValue(yearData.equity);
            return (liabilities && equity && equity !== 0) ? liabilities / equity : null;
          })(),
          // Metadata
          currency: currency,
          created_by: session.user.id,
          data_source: 'company_metadata',
          source_document_ids: []
        };

        console.log(`💾 [storeFinancialMetrics] Creating metric for year ${fiscalYear}:`, {
          revenue: metricsPayload.revenue_current,
          profit: metricsPayload.operational_cash_flow,
          netProfit: metricsPayload.net_profit,
          totalAssets: metricsPayload.total_assets,
          equity: metricsPayload.total_equity,
          ebitda: metricsPayload.ebitda
        });

        const { error: insertError } = await supabase
          .from('financial_metrics')
          .insert(metricsPayload);

        if (insertError) {
          console.error(`❌ [storeFinancialMetrics] Error creating metric for year ${fiscalYear}:`, insertError);
        } else {
          console.log(`✅ [storeFinancialMetrics] Successfully created metric for year ${fiscalYear}`);
        }
      }
      
    } catch (error) {
      console.error('❌ [storeFinancialMetrics] Error:', error);
    }
  }, [session?.user?.id, supabase]);

  // --- ADD: Missing fetchFundingRecommendations function ---
  const fetchFundingRecommendations = useCallback(async () => {
    if (!companyId || !session) {
      console.log('ℹ️ [fetchFundingRecommendations] Missing companyId or session');
      return;
    }
    
    setIsFetchingRecommendations(true);
    
    try {
      console.log('🔍 [fetchFundingRecommendations] Fetching recommendations for company:', companyId);
      
      const { data, error } = await supabase
        .from('funding_recommendations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [fetchFundingRecommendations] Error:', error);
        throw error;
      }
      
      console.log(`✅ [fetchFundingRecommendations] Found ${data?.length || 0} recommendations`);
      setFundingRecommendations(data || []);
      
    } catch (error) {
      console.error('❌ [fetchFundingRecommendations] Unexpected error:', error);
      setError('Failed to load funding recommendations');
    } finally {
      setIsFetchingRecommendations(false);
    }
  }, [companyId, session, supabase]);

  // --- ADD: Missing handleCheckboxChange function ---
  const handleCheckboxChange = useCallback((name: string, checked: boolean) => {
    setInitialFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  }, []);



  // Step definitions - UPDATED to use StepName
  const steps: StepData[] = [
    {
      name: StepName.SIGNUP,
      title: t('step1.title'),
      icon: UserIcon,
      description: t('step1.description'),
    },
    {
      name: StepName.COMPANY_INFO,
      title: t('step2.title', { default: 'Company Info' }),
      icon: BuildingOffice2Icon,
      description: t('step2.description', { default: 'Please provide your company details.' }),
    },
    {
      name: StepName.AI_CONVERSATION,
      title: t('step3.aiAnalysisTitle', { default: 'CFO-avustaja' }),
      icon: ChartBarIcon,
      description: t('step3.aiAnalysisDescription', { default: 'Rahoitustarpeiden kartoitus' }),
    },
  ];

  // --- UPDATED: Step initialization logic to use step names ---
  useEffect(() => {
    if (authLoading) return;
    
    // Get URL parameter for step if available (support localized parameter names)
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step') || params.get('vaihe') || params.get('steg');
    
    let initialStep: StepName = StepName.SIGNUP; // Default to signup
    
    // Legacy step name mapping (old English names -> new Finnish names)
    const legacyStepMapping: Record<string, StepName> = {
      'signup': StepName.SIGNUP,
      'company-info': StepName.COMPANY_INFO,
      'pre-analysis': StepName.PRE_ANALYSIS,
      'ai-conversation': StepName.AI_CONVERSATION,
      'funding-needs': StepName.FUNDING_NEEDS,
      'document-upload': StepName.DOCUMENT_UPLOAD,
      'summary': StepName.SUMMARY,
    };
    
    // Try to parse step parameter as number (legacy support)
    if (stepParam && !isNaN(Number(stepParam))) {
      const stepNumber = Number(stepParam);
      const stepName = getStepName(stepNumber);
      if (stepName) {
        initialStep = stepName;
      }
    } else if (stepParam) {
      // Check if it's a legacy step name
      if (legacyStepMapping[stepParam]) {
        initialStep = legacyStepMapping[stepParam];
      } else if (Object.values(StepName).includes(stepParam as StepName)) {
        // Direct step name support (new Finnish names)
        initialStep = stepParam as StepName;
      }
    }
    
    // Basic auth check - authenticated users shouldn't see signup step
    if (session && user && initialStep === StepName.SIGNUP) {
      initialStep = StepName.COMPANY_INFO;
    }
    
    // Always fetch company data for authenticated users
    if (session && user) {
      fetchUserCompanies();
    }
    
    // Apply the determined step
    setCurrentStep(initialStep);
    
  }, [authLoading, session, user]);

  // --- Authentication Check Effect - UPDATED ---
  useEffect(() => {
    // Don't run the check until authentication status is confirmed
    if (authLoading) return;

    // Check if user is unauthenticated AND on a protected step
    const protectedSteps = [
      StepName.COMPANY_INFO,
      StepName.AI_CONVERSATION,
    ];
    
    if (!session && protectedSteps.includes(currentStep)) {
      console.log(`Unauthenticated user trying to access step ${currentStep}. Redirecting to login.`);
      // Get the current path and query parameters
      const currentPath = window.location.pathname + window.location.search;
      // Construct the sign-in URL with the 'next' parameter
      const signInUrl = `/${locale}/auth/sign-in?next=${encodeURIComponent(currentPath)}`;
      // Redirect using router.replace to avoid adding the current (unauthorized) page to history
      router.replace(signInUrl);
    }
  }, [authLoading, session, currentStep, locale, router]);

  // Add useEffect to fetch recommendations when entering summary step
  useEffect(() => {
    if (currentStep === StepName.SUMMARY && companyId && session) {
      console.log('Current step is summary, fetching funding recommendations for company:', companyId);
      fetchFundingRecommendations();
    }
  }, [currentStep, companyId, session]);

  // Add useEffect to fetch documents when the current step is funding needs
  useEffect(() => {
    if (currentStep === StepName.FUNDING_NEEDS && companyId && session) {
      console.log('Current step is funding needs, fetching documents for company:', companyId);
      fetchDocuments();
    }
  }, [currentStep, companyId, session]);

  // --- UPDATED: useEffect to handle entering document upload step --- 
  useEffect(() => {
    if (currentStep === StepName.DOCUMENT_UPLOAD) {
      console.log('[Document Upload Entry] Ensuring isAnalyzing and isGeneratingRecommendations are false and fetching recommendations.');
      // Explicitly turn off loaders when entering document upload step as a safeguard
      if (isAnalyzing) {
        setIsAnalyzing(false); 
      }
      if (isGeneratingRecommendations) {
        setIsGeneratingRecommendations(false);
      }
      // Fetch recommendations and documents if needed
      if (companyId && session) {
         fetchFundingRecommendations();
         fetchDocuments(); // Also fetch documents for document upload step
      }
    }
  }, [currentStep, companyId, session, isAnalyzing, isGeneratingRecommendations]);

  // Function to fetch user's company if it exists
  const fetchUserCompany = async () => {
    if (!session || !user) return;
    
    try {
      // Check if user profile has a company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return;
      }
      
      if (profile && profile.company_id) {
        console.log('User has a company_id:', profile.company_id);
        setCompanyId(profile.company_id);
        
        // Fetch the company data
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();
        
        if (companyError) {
          console.error('Error fetching company data:', companyError);
          return;
        }
        
        if (company) {
          console.log('Preloading company data:', company);
          
          // Set company data state
          setCompanyData(company);
          
          // Populate company form data
          setCompanyFormData({
            name: company.name || '',
            code: company.business_id || '',
            selectedCompany: null // We don't have the YTJ data structure here
          });
          
          // If company already has analysis, show it
          if (company.analysis_status === 'completed' && company.analysis_result) {
            setAnalysisResult(company.analysis_result);
          } else if (company.analysis_status === 'pending') {
            setIsAnalysisRunning(true);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserCompany:', error);
    }
  };

  // Debounced function for company search (Finnish companies)
  const debouncedCompanySearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setCompanySearchResults([]);
        setIsCompanySearchLoading(false);
        return;
      }
      setIsCompanySearchLoading(true);
      setError(null); // Clear previous errors
      
      try {
        console.log(`[CompanySearch] Searching for: "${query}"`);
        const response = await fetch(`/api/companies/search?query=${encodeURIComponent(query)}&limit=5`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[CompanySearch] API error ${response.status}:`, errorText);
          throw new Error(`Yrityksen haku epäonnistui (${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`[CompanySearch] API response:`, result);
        
        if (result.success && result.data) {
          console.log(`[CompanySearch] Found ${result.data.length} companies`);
          setCompanySearchResults(result.data);
        } else {
          console.warn(`[CompanySearch] No results or error:`, result.error);
          setCompanySearchResults([]);
          if (result.error) {
            setError(`Yrityksen haku epäonnistui: ${result.error}`);
          }
        }
      } catch (error) {
        console.error('[CompanySearch] Network or parsing error:', error);
        setCompanySearchResults([]);
        setError(error instanceof Error ? error.message : 'Yrityksen haussa tapahtui virhe. Tarkista internetyhteytesi ja yritä uudelleen.');
      } finally {
        setIsCompanySearchLoading(false);
      }
    }, 500), // 500ms debounce
    []
  );

  // Debounced function for Swedish company search by organization number
  const debouncedSwedishCompanySearch = useCallback(
    debounce(async (orgNumber: string) => {
      if (orgNumber.length < 10) {
        setCompanySearchResults([]);
        setIsCompanySearchLoading(false);
        return;
      }
      setIsCompanySearchLoading(true);
      setError(null); // Clear previous errors
      
      try {
        console.log(`[SwedishCompanySearch] Searching for organization number: "${orgNumber}"`);
        const response = await fetch(`/api/companies/search-swedish?query=${encodeURIComponent(orgNumber)}&limit=1`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[SwedishCompanySearch] API error ${response.status}:`, errorText);
          throw new Error(`Svensk företagssökning misslyckades (${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`[SwedishCompanySearch] API response:`, result);
        
        if (result.success && result.data && result.data.length > 0) {
          console.log(`[SwedishCompanySearch] Found company:`, result.data[0]);
          // Convert Swedish company result to Finnish format
          const swedishCompany = result.data[0];
          const convertedCompany: CompanySearchResult = {
            businessId: swedishCompany.organisationsnummer,
            name: swedishCompany.name,
            address: swedishCompany.address || '',
            city: swedishCompany.city || '',
            postCode: swedishCompany.postCode || '',
            status: swedishCompany.status || '',
            website: swedishCompany.website || '',
            companyForm: swedishCompany.companyForm || '',
            mainBusinessLine: swedishCompany.industry || '',
            registrationDate: swedishCompany.registrationDate || '',
            countryCode: 'SE'
          };
          setCompanySearchResults([convertedCompany]);
          
          // Automatically select the found company and update form data
          console.log(`[SwedishCompanySearch] Auto-selecting company:`, convertedCompany.name);
          setCompanyFormData(prev => ({
            ...prev,
            name: convertedCompany.name,
            selectedCompany: convertedCompany
          }));
          
          // Clear search query after automatic selection
          setCompanySearchQuery('');
        } else {
          console.warn(`[SwedishCompanySearch] No results or error:`, result.error);
          setCompanySearchResults([]);
          if (result.error) {
            setError(`Svensk företagssökning misslyckades: ${result.error}`);
          }
        }
      } catch (error) {
        console.error('[SwedishCompanySearch] Network or parsing error:', error);
        setCompanySearchResults([]);
        setError(error instanceof Error ? error.message : 'Ett fel uppstod vid sökning av svenskt företag. Kontrollera din internetanslutning och försök igen.');
      } finally {
        setIsCompanySearchLoading(false);
      }
    }, 1000), // 1 second debounce for Swedish search (slower API)
    []
  );

  // Effect to trigger search when query changes
  useEffect(() => {
    if (selectedCountry === 'sweden') {
      // For Swedish companies, search by organization number when code changes
      if (companyFormData.code && companyFormData.code.length >= 10) {
        debouncedSwedishCompanySearch(companyFormData.code);
      } else {
        setCompanySearchResults([]);
        setIsCompanySearchLoading(false);
      }
    } else {
      // For Finnish companies, use the existing search
      debouncedCompanySearch(companySearchQuery);
    }
  }, [companySearchQuery, debouncedCompanySearch, debouncedSwedishCompanySearch, selectedCountry, companyFormData.code]);

  // Handle company form changes
  const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear selected company if name is manually changed
      selectedCompany: name === 'name' ? null : prev.selectedCompany,
    }));
    // If changing name, update search query
    if (name === 'name' && !companyFormData.selectedCompany) {
      setCompanySearchQuery(value);
    }
  };
  
  const handleCompanySelection = (selected: CompanySearchResult | null) => {
    if (selected) {
      setCompanyFormData({
        name: selected.name,
        code: selected.businessId,
        selectedCompany: selected,
      });
      setCompanySearchQuery(''); // Clear search query after selection
      setCompanySearchResults([]); // Clear results
    } else {
      // Handle case where selection is cleared (e.g., user deletes input)
       setCompanyFormData(prev => ({
         ...prev,
         selectedCompany: null,
       }));
    }
  };

  // Handle step 1 form submission - register and sign in user automatically
  const handleStep1Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- Added Consent Validation ---
    if (!initialFormData.consentAnalysis || !initialFormData.consentMarketing) {
      if (!initialFormData.consentAnalysis && !initialFormData.consentMarketing) {
        setError(t('error.bothConsentsRequired', { default: 'Both consents are required to continue.' }));
      } else if (!initialFormData.consentAnalysis) {
        setError(t('error.consentAnalysisRequired', { default: 'You must consent to data analysis to proceed.' }));
      } else if (!initialFormData.consentMarketing) {
        setError(t('error.consentMarketingRequired', { default: 'You must accept marketing communications to continue.' }));
      }
      setLoading(false);
      return;
    }
    // --- End Consent Validation ---

    if (!turnstileToken) {
      setError(t('error.captcha', { default: 'Please complete the captcha verification' }));
      setLoading(false);
      return;
    }

    try {
      // Validate turnstile token
      const validateResponse = await fetch('/api/auth/validate-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });

      if (!validateResponse.ok) {
        throw new Error(t('error.captchaValidation', { default: 'Captcha validation failed' }));
      }

      // Generate a random temporary password
      const randomPassword = Math.random().toString(36).slice(-10) + 
                           Math.random().toString(36).toUpperCase().slice(-2) + '!1';

      // Sign up the user
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email: initialFormData.email,
        password: randomPassword,
        options: {
          data: {
            // --- MODIFICATION: Use new fields and construct full_name ---
            first_name: initialFormData.firstName,
            last_name: initialFormData.lastName,
            phone_number: initialFormData.phone, // Use phone_number column name
            full_name: `${initialFormData.firstName} ${initialFormData.lastName}`, // Backward compatibility
            // --- END MODIFICATION ---
            username: initialFormData.email.split('@')[0] + Math.random().toString(36).substring(2, 7),
            email_verified: true,
          }
        }
      });

      // Handle case where user already exists (e.g., if they refreshed)
      if (signUpError && signUpError.message.includes('User already registered')) {
        // User already exists - show clear error message and offer to sign in
        setError(t('error.userExists', { 
          default: 'An account with this email already exists. Please sign in instead.' 
        }));
        setLoading(false);
        
        // After a short delay, redirect to sign-in page
        setTimeout(() => {
          router.push(`/${locale}/auth/sign-in?email=${encodeURIComponent(initialFormData.email)}`);
        }, 2000);
        return;

      } else if (signUpError) {
        // Throw any other sign-up errors
        throw signUpError;
      }

      // If sign up was successful OR sign-in after existing user check was successful:
      // Sign in the user automatically (needed even after signUp sometimes)
      const { data: { session: signedInSession, user: signedInUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email: initialFormData.email,
        password: randomPassword, // Use the generated temporary password
      });

      if (signInError) throw signInError;

      // --- Save Consents AND Profile details ---
      if (signedInUser) {
        console.log(`User signed in/created: ${signedInUser.id}. Upserting profile...`);
        // --- DEBUG: Log state before upsert ---
        console.log('[DEBUG] handleStep1Submit - signedInUser.id:', signedInUser.id);
        console.log('[DEBUG] handleStep1Submit - initialFormData:', JSON.stringify(initialFormData, null, 2));
        // --- END DEBUG ---

        // --- STEP 1: Ensure profile row exists (Upsert MINIMUM required fields) ---
        // We need to provide values for any NOT NULL columns (like username, email, full_name)
        const generatedUsername = initialFormData.email.split('@')[0] + Math.random().toString(36).substring(2, 7);
        console.log('[DEBUG] Generated username:', generatedUsername);
        const constructedFullName = `${initialFormData.firstName} ${initialFormData.lastName}`.trim();
        console.log('[DEBUG] Constructed full_name:', constructedFullName);

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            { 
              id: signedInUser.id,
              // --- FIX: Add required non-nullable fields ---
              username: generatedUsername,
              email: initialFormData.email,
              full_name: constructedFullName // Add full_name here
              // --- END FIX ---
            }, 
            { onConflict: 'id' } // Only specify conflict target, don't ignore other columns
          );

        if (upsertError) {
          console.error('Error ensuring profile row exists:', upsertError);
          // Decide if we should throw or continue to update attempt
          throw upsertError; // Throw for now, as update will likely fail
        }
        console.log('Profile row ensured (ID, Username, Email, FullName).');

        // --- STEP 2: Update remaining profile fields separately ---
        console.log('Attempting separate profile update for other fields...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: initialFormData.firstName,
            last_name: initialFormData.lastName,
            phone_number: initialFormData.phone || null,
            full_name: constructedFullName, 
            // --- FIX: Use correct column name for marketing consent --- 
            marketing_consent: initialFormData.consentMarketing,
            // Removed 'consents' object as the column doesn't exist
            // Removed analysis consent as there's no column for it
            // --- END FIX ---
            // No need to update email/username/full_name again here
          })
          .eq('id', signedInUser.id);

        if (updateError) {
          console.error('Error during separate profile update:', updateError);
          // Set error state, but maybe don't block navigation?
          setError(`Failed to update profile details: ${updateError.message}`);
          // Decide if you want to throw here or let the user proceed to step 2 anyway
          // throw updateError; 
        } else {
          console.log('Separate profile update successful.');
        }

      } // End if (signedInUser)
      // --- End Profile Save Logic ---

      // Track signup conversion
      try {
        if (signedInUser) {
          console.log('🎯 [OnboardingFlow] Tracking signup conversion for user:', signedInUser.id)
          
          const result = await trackConversion('signup', {
            userId: signedInUser.id,
            metadata: {
              email: signedInUser.email,
              signup_method: 'onboarding_flow',
              consent_marketing: initialFormData.consentMarketing,
              consent_analysis: initialFormData.consentAnalysis
            }
          })

          if (result.success && result.attributed) {
            console.log('✅ [OnboardingFlow] Signup conversion tracked and attributed:', result.attribution)
          } else if (result.success) {
            console.log('ℹ️ [OnboardingFlow] Signup conversion tracked (no attribution)')
          }
        }
      } catch (conversionError) {
        console.warn('⚠️ [OnboardingFlow] Failed to track signup conversion:', conversionError)
        // Don't fail the registration flow if conversion tracking fails
      }

      goToStep(StepName.COMPANY_INFO);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : t('error.register', { default: 'Registration failed. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  // Add cleanup effect for realtime subscription when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any active Supabase Realtime subscriptions when component unmounts
      if (realtimeChannel) {
        console.log('Cleaning up Realtime subscription on unmount');
        supabase.removeChannel(realtimeChannel).catch((err: Error) => {
          console.error('Error removing channel on unmount:', err);
        });
      }
    };
  }, [realtimeChannel]);

  // Add useEffect to fetch document types when the component mounts
  useEffect(() => {
    // Fetch document types when component mounts
    async function fetchDocumentTypes() {
      if (authLoading) return;
      
      setIsFetchingDocTypes(true); // Set loading state
      
      try {
        console.log('Fetching document types...');
        
        // Try to fetch via API first (more reliable than direct Supabase call)
        if (session?.access_token) {
          try {
            const response = await fetch('/api/documents/types', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const apiData = await response.json();
              if (apiData.document_types && apiData.document_types.length > 0) {
                console.log('Document types fetched via API:', apiData.document_types);
                setDocumentTypes(apiData.document_types);
                setIsFetchingDocTypes(false);
                return;
              }
            } else {
              console.warn('API fetch failed, falling back to direct Supabase call');
            }
          } catch (apiError) {
            console.warn('API fetch error, falling back to direct Supabase call:', apiError);
          }
        }

        // Fallback to direct Supabase call
        const { data, error } = await supabase
          .from('document_types')
          .select('*')
          .order('name');
          
        if (error) {
          console.error('Error fetching document types:', error);
          // Don't show error immediately, try to use default types
          console.log('Using default document types due to fetch error');
        }
        
        if (data && data.length > 0) {
          console.log('Document types fetched via Supabase:', data);
          setDocumentTypes(data);
        } else {
          // If no document types found, create default ones
          console.log('No document types found, using defaults');
          setDocumentTypes([
            {
              id: 'income_statement',
              name: 'income_statement',
              description: t('step3.incomeStatementDescription', { default: 'Income statement (tulos) from the last fiscal year' }),
              is_system_generated: false,
              required_for_analysis: true
            },
            {
              id: 'balance_sheet',
              name: 'balance_sheet',
              description: t('step3.balanceSheetDescription', { default: 'Balance sheet (tase) from the last fiscal year' }),
              is_system_generated: false,
              required_for_analysis: true
            },
            {
              id: 'recent_income_statement',
              name: 'recent_income_statement',
              description: t('step3.recentIncomeStatementDescription', { default: 'Most recent income statement draft (<2 months old)' }),
              is_system_generated: false,
              required_for_analysis: true
            },
            {
              id: 'recent_balance_sheet',
              name: 'recent_balance_sheet',
              description: t('step3.recentBalanceSheetDescription', { default: 'Most recent balance sheet draft (<2 months old)' }),
              is_system_generated: false,
              required_for_analysis: true
            }
          ]);
        }
      } catch (err) {
        console.error('Error in fetchDocumentTypes:', err);
        setError(t('error.fetchDocTypes', { default: 'Failed to fetch document types.' }));
      } finally {
        setIsFetchingDocTypes(false); // Clear loading state
      }
    }
    
    fetchDocumentTypes();
  }, [authLoading, supabase, t]);

  // --- Memoize fetchDocuments (moved before useEffects) --- 
  const fetchDocuments = useCallback(async () => {
    if (!session?.access_token || !companyId) {
      console.log('No session access token or company ID for fetchDocuments');
      return;
    }

    try {
      console.log('Refreshing documents for company:', companyId);
      
      // Try to fetch using a server API endpoint that uses service role
      const response = await fetch(`/api/documents/list?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const apiData = await response.json();
      
      if (apiData.data && apiData.data.length > 0) {
        console.log('Processing API response data:', apiData.data);
        // The API already includes document_types, but using a different structure
        const processedDocuments = apiData.data.map((doc: any) => {
          return {
            ...doc,
            document_type: doc.document_types || null
          };
        });
        setDocuments(processedDocuments);
        
        // Extract financial data from processed documents
        const financialDoc = processedDocuments.find((doc: any) => 
          doc.processed && doc.extraction_data?.financial_data
        );
        
        if (financialDoc?.extraction_data?.financial_data) {
          const extractedData = financialDoc.extraction_data.financial_data;
          console.log('Found financial data in document:', extractedData);
          
          setFinancialDataArray([
            {
              revenue: extractedData.revenue || 0,
              profit: extractedData.profit || 0,
              assets: extractedData.assets || 0,
              liabilities: extractedData.liabilities || 0,
              equity: extractedData.equity || 0,
              fiscal_year: extractedData.fiscal_year || new Date().getFullYear(),
              fiscal_period: extractedData.fiscal_period || 'annual'
            }
          ]);
        }
      } else {
        console.log('No documents found via API');
        setDocuments([]);
      }
    } catch (err) {
      console.error('Error refreshing documents:', err);
    }
  }, [companyId, session]); // Removed setDocuments and setFinancialDataArray to prevent circular dependencies

  // --- NEW: Fetch documents when companyId changes ---
  useEffect(() => {
    if (companyId && session?.access_token) {
      console.log('🗂️ Fetching documents for company:', companyId);
      fetchDocuments();
    }
  }, [companyId, session?.access_token, fetchDocuments]);

  // --- NEW: Real-time subscription for document updates ---
  useEffect(() => {
    if (!companyId || !supabase) return;

    console.log('🔄 Setting up real-time subscription for documents, companyId:', companyId);
    
    const channel = supabase
      .channel(`documents_${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `company_id=eq.${companyId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('📄 Document change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('➕ Document uploaded (INSERT)');
            fetchDocuments();
          } else if (payload.eventType === 'UPDATE') {
            // Document processing status changed
            console.log('🔄 Document update detected:', {
              old_status: payload.old?.processing_status,
              new_status: payload.new?.processing_status,
              old_processed: payload.old?.processed,
              new_processed: payload.new?.processed
            });
            
            // Check for both processing_status and processed field changes
            const statusChanged = payload.old?.processing_status !== payload.new?.processing_status;
            const processedChanged = payload.old?.processed !== payload.new?.processed;
            const isNowCompleted = payload.new?.processing_status === 'completed';
            const isNowProcessed = payload.new?.processed === true;
            
            if (statusChanged || processedChanged) {
              console.log('✅ Document status changed, refreshing documents list');
              fetchDocuments();
            }
            
            if (isNowCompleted || isNowProcessed) {
              console.log('🎉 Document processing completed! Refreshing documents...');
              // Delay to ensure database has propagated changes
              // fetchDocuments will trigger a re-fetch of financial data in Step3AIConversation
              setTimeout(() => {
                fetchDocuments();
              }, 2000);
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Document deleted');
            fetchDocuments();
          }
        }
      )
      .subscribe((status: string) => {
        console.log('📡 Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to document changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
        }
      });

    return () => {
      console.log('🧹 Cleaning up document subscription');
      supabase.removeChannel(channel);
    };
  }, [companyId, supabase, fetchDocuments]);

  // --- Review fetchFinancialData dependencies --- 
  const fetchFinancialData = useCallback(async () => {
    if (currentStep !== StepName.FUNDING_NEEDS) { 
      console.log('ℹ️ [fetchFinancialData] Not on Step 4, skipping fetch.');
      return;
    }
    // Use session directly instead of session?.access_token as dependency if possible
    if (!companyId || !session) { // Check session existence
       console.log('ℹ️ [fetchFinancialData] Missing companyId or session.');
       return;
    }

    console.log('📊 Fetching ALL financial data years... (User is on Step 4)');
    setIsFetchingFinancials(true);

    try {
      // Refresh session inside the try block
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData?.session?.access_token) {
        console.error('❌ Failed to refresh session or session invalid:', refreshError);
        throw new Error('Authentication session is invalid. Please sign in again.');
      }
      const refreshedToken = refreshData.session.access_token;

      // Corrected URL to use /list - REMOVED limit=1 to fetch all records
      const response = await fetch(`/api/financial-metrics/list?companyId=${companyId}&order=fiscal_year&direction=desc`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${refreshedToken}` // Use refreshed token
        }
      });

      if (response.ok) {
        const fetchedData = await response.json();
        console.log('✅ Fetched ALL financial data years:', fetchedData);

        // Set the entire array of metrics, defaulting to empty array if none found
        const allMetrics = fetchedData.data || [];
        setFinancialDataArray(allMetrics);

        // Check if polling is active and if *any* fetched data meets the criteria to stop
        if (isPollingFinancials && allMetrics.length > 0) {
           // Example condition: stop polling if assets > 0 in the *latest* record
          const latestMetrics = allMetrics[0]; // Since it's sorted desc
          const assetsLoaded = latestMetrics?.total_fixed_assets !== null && latestMetrics?.total_fixed_assets !== undefined && parseFloat(latestMetrics.total_fixed_assets) > 0;
          if (assetsLoaded) {
            console.log('🛑 Assets detected in latest record! Stopping polling.');
            setIsPollingFinancials(false);
            setSuccessMessage('Financial data updated successfully!'); // Update success message
          } else {
             console.log('⏳ Assets not yet loaded in latest record, continuing polling...');
          }
        } else if (isPollingFinancials) {
            console.log('⏳ No financial data returned yet, continuing polling...');
        }
      } else {
         // If fetch fails during polling, maybe stop polling or log and continue
         if (isPollingFinancials) {
            console.warn(`Polling fetch failed: ${response.status}`);
            // Optionally stop polling on fetch error:
            // setIsPollingFinancials(false);
            // setError('Failed to fetch updated financial data during polling.');
         }
         const errorText = await response.text();
         console.error(`❌ Error fetching financial data: ${response.status}`, errorText);
         setFinancialDataArray([]); // Reset to empty array on error
      }
    } catch (error) { 
        // Also handle catch block during polling
        if (isPollingFinancials) {
            console.error('Polling fetch unexpected error:', error);
            // Optionally stop polling on fetch error:
            // setIsPollingFinancials(false);
            // setError('An unexpected error occurred during financial data polling.');
        }
        console.error('❌ Unexpected error fetching financial data:', error);
        setFinancialDataArray([]); // Reset to empty array on error
    } finally {
       setIsFetchingFinancials(false); // Depends on setIsFetchingFinancials
    }
  }, [companyId, session, currentStep, isPollingFinancials, supabase.auth]); // Removed setter functions and circular dependencies

  // Function to handle document analysis triggering
  const handleAnalyzeAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !user) {
      setError(t('error.notAuthenticated', { default: 'Authentication required.' }));
      return;
    }
    
    // Tarkista onko dokumentteja ladattu
    if (!documents || documents.length === 0) {
      setError('Lataa vähintään yksi asiakirja ennen analyysin aloittamista.');
      return;
    }
    
    // Tarkista onko kaikki dokumentit käsitelty
    const hasProcessingDocs = documents.some(doc => 
      doc.processing_status === 'pending' || doc.processing_status === 'processing'
    );
    
    if (hasProcessingDocs) {
      setError('Odota että kaikki asiakirjat on käsitelty ennen analyysin aloittamista.');
      return;
    }
    
    // Prevent if initial trigger is happening (isAnalyzing) OR if background generation is already running
    if (isAnalyzing || isGeneratingRecommendations) return; 

    setError(null);
    setIsAnalyzing(true); // Set loading state for the button press/API call
    
    try {
      // Store the exact timestamp when analysis starts
      const currentTimestamp = Date.now();
      setAnalysisStartTimestamp(currentTimestamp);
      
      console.log(`🚀 [Analysis] Triggering analysis via API route for company ${companyId}`);
      
      // First, ensure we have an active Realtime subscription
      if (!realtimeChannel) {
        console.warn('⚠️ [Analysis] No active Realtime channel detected. Re-establishing...');
        // The dependency array in the Realtime effect will re-establish the channel
        setRefetchTrigger(prev => prev + 1);
        
        // Small delay to allow subscription to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!session?.access_token) {
          throw new Error('Access token is missing. Cannot trigger analysis.');
      }
      
      const response = await fetch('/api/onboarding/trigger-analysis', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          companyId: companyId, 
          locale: locale 
        }),
      });

      if (!response.ok) {        
        let errorMessage = `Failed to trigger analysis (Status: ${response.status})`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseErr) {
            console.warn("Could not parse error response from /api/onboarding/trigger-analysis", parseErr);
        }
        throw new Error(errorMessage);
      }
      
      console.log('✅ [Analysis] Trigger request sent successfully via API route.');
      
      // Update toast message to indicate we're proceeding to the summary page
      toast({
        title: t('step3.analysisStartedTitle', { default: 'Analysis Started' }),
        description: t('step3.analysisStartedDescription', { default: 'Document analysis and recommendation generation have been started. Proceeding to summary page.' }),
      });
      
      setIsGeneratingRecommendations(true); // Start the background generation loader state
      
      // Navigate to the summary page only after successful analysis trigger
      goToStep(StepName.SUMMARY); // Changed from 5 to 6 since step 5 is document upload

      // Clear any success message that might have been set
      setSuccessMessage(null);

    } catch (err: any) {
      console.error('❌ [Analysis] Error triggering analysis event:', err);
      setError(err.message || 'An unexpected error occurred while starting the analysis.');
      setIsGeneratingRecommendations(false);
    } finally {
      setIsAnalyzing(false); // Reset button-press state regardless of success/error
    }
  };

  // Render step indicator - Refactored for better styling and compactness
  const renderStepIndicator = () => (
    <div className="fixed top-[60px] left-0 right-0 z-10 bg-black/90 backdrop-blur-sm py-3 border-b border-gold-primary/30 shadow-lg">
      <div className="max-w-5xl mx-auto px-6">
        <nav className="flex items-center justify-center" aria-label="Progress">
          {steps.map((step, index) => (
            <React.Fragment key={step.name}>
              <div className="relative flex flex-col items-center">
                <div
                  className={
                    getStepIndex(currentStep) > index + 1
                      ? 'step-number-amber' // Completed
                      : currentStep === step.name
                        ? 'step-number-amber-inactive' // Active
                        : 'step-number-amber-pending' // Pending
                  + ' flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300 cursor-pointer hover:opacity-80'}
                  onClick={() => goToStep(step.name)}
                  role="button"
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                  tabIndex={0}
                >
                  {getStepIndex(currentStep) > index + 1 ? (
                    <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  ) : (
                    <span className="font-medium text-sm">
                      {index + 1}
                    </span>
                  )}
                </div>
                <span 
                  className={`mt-2 text-xs font-medium text-center cursor-pointer hover:opacity-80 ${
                    currentStep === step.name ? 'text-gold-primary' :
                    getStepIndex(currentStep) > index + 1 ? 'text-gold-primary' :
                    'text-gray-dark'
                  }`}
                  onClick={() => goToStep(step.name)}
                  role="button"
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                  tabIndex={0}
                >
                  {step.title}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 min-w-[40px] max-w-[80px] transition-colors duration-300 ${
                  getStepIndex(currentStep) > index + 1 ? 'bg-gold-primary' : 'bg-gray-dark'
                }`} />
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  );

  // Update the step navigation functions to be more robust - UPDATED to use StepName
  const goToStep = (step: StepName) => {
    // Validate that the step exists in our step order
    if (!STEP_ORDER.includes(step)) {
      console.error(`Invalid step name: ${step}`);
      return;
    }
    
    // Reset states only if moving *backwards* or to a significantly different flow? 
    // For now, keep resetting on any navigation for simplicity, but this could be refined.
    setLoading(false);
    setError(null);
    
    // Set the current step
    setCurrentStep(step);
    
    // Update URL to reflect current step with localized parameter name (without reload)
    const url = new URL(window.location.href);
    const stepParam = getStepParamName(locale);
    
    // Remove both English and localized parameter names to avoid duplicates
    url.searchParams.delete('step');
    url.searchParams.delete('vaihe');
    url.searchParams.delete('steg');
    
    // Set the localized parameter
    url.searchParams.set(stepParam, step);
    window.history.replaceState({}, '', url.toString());

    // --- ADDED: Scroll to top on step change ---
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // --- NEW: Backward compatibility wrapper for child components that expect number-based navigation ---
  const goToStepByNumber = (stepNumber: number) => {
    const stepName = getStepName(stepNumber);
    if (stepName) {
      goToStep(stepName);
    } else {
      console.error(`Invalid step number: ${stepNumber}`);
    }
  };

  // Add a function to handle continuing with existing company
  const continueWithExistingCompany = () => {
    console.log('[continueWithExistingCompany] Clicked. Company Data:', companyData);
    if (companyData) {
      // Create a synthetic form event
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
      handleStep2Submit(fakeEvent);
    } else {
      console.log('[continueWithExistingCompany] Clicked but companyData is null.');
    }
  };

  // Render step 1 - Initial signup - Replaced with component call
  const renderStep1 = () => {
    // If user is already logged in, just show loading
    if (session && user && !authLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <Spinner className="h-10 w-10 text-blue-600" />
          <p className="ml-3 text-lg text-gray-600">{t('redirecting', { default: 'Redirecting...' })}</p>
        </div>
      );
    }

    // Render the Step1Signup component with necessary props
    // --- MODIFICATION: Ensure props passed match Step1SignupProps exactly ---
    return (
      <Step1Signup
        initialFormData={{
          firstName: initialFormData.firstName,
          lastName: initialFormData.lastName,
          phone: initialFormData.phone,
          email: initialFormData.email,
          consentMarketing: initialFormData.consentMarketing,
          consentAnalysis: initialFormData.consentAnalysis,
        }}
        loading={loading}
        error={error}
        turnstileToken={turnstileToken}
        locale={locale as string}
        handleInitialFormChange={handleInitialFormChange} // Pass the single, correct handler
        handleCheckboxChange={handleCheckboxChange} // Pass the single, correct handler
        handleStep1Submit={handleStep1Submit}
        setTurnstileToken={setTurnstileToken}
        setError={setError}
      />
    );
    // --- END MODIFICATION ---
  };

  // Render step 2 - Company Info - Refactored to use the component directly
  const renderStep2 = () => (
    <Step2CompanyInfo
      companyFormData={companyFormData}
      companySearchQuery={companySearchQuery}
      companySearchResults={companySearchResults}
      isCompanySearchLoading={isCompanySearchLoading}
      companyData={companyData}
      isAnalysisRunning={isAnalysisRunning}
      loading={loading}
      error={error}
      locale={locale as string} // Pass the locale from useParams
      selectedCountry={selectedCountry} // Pass the selected country state
      handleCompanyFormChange={handleCompanyFormChange}
      handleCompanySelection={handleCompanySelection}
      handleStep2Submit={handleStep2Submit}
      continueWithExistingCompany={continueWithExistingCompany}
      setCompanyData={setCompanyData}
      setCompanyId={setCompanyId}
      setCompanyFormData={setCompanyFormData}
      setCompanySearchQuery={setCompanySearchQuery}
      onCountryChange={setSelectedCountry}
      triggerImmediateEnrichment={triggerImmediateEnrichment}
    />
  );

  // Render step 3 - NEW: Conversational AI experience replacing steps 3–6
  const renderStep3 = () => {
    console.log('🔍 [OnboardingFlow] renderStep3 - Session:', session);
    console.log('🔍 [OnboardingFlow] renderStep3 - Access token:', session?.access_token);
    
    // Show loading if auth is still loading
    if (authLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <Spinner className="h-10 w-10 text-blue-600" />
          <p className="ml-3 text-lg text-gray-600">{t('loading', { default: 'Loading...' })}</p>
        </div>
      );
    }
    
    // Show error if no session
    if (!session) {
      return (
        <div className="flex flex-col justify-center items-center min-h-screen">
          <p className="text-lg text-red-600 mb-4">{t('authRequired', { default: 'Authentication required' })}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {t('refresh', { default: 'Refresh Page' })}
          </button>
        </div>
      );
    }
    
    return (
      <Step3AIConversation
      companyId={companyId}
      companyData={companyData}
      documents={documents}
      financialDataArray={financialDataArray}
      isFetchingFinancials={isFetchingFinancials}
      uploading={uploading}
      session={session}
      currentLocale={locale as string}
      handleFileUpload={handleFileUpload}
      fetchDocuments={fetchDocuments}
      onDone={() => {
        // Start background recommendation generation UX and move to summary (as new step 4)
        setIsGeneratingRecommendations(true);
        // Record start time for freshness filter in summary
        setAnalysisStartTimestamp(Date.now());
        goToStep(StepName.SUMMARY);
      }}
      onCompanyDataUpdate={(enrichedData) => {
        console.log('📥 [OnboardingFlow] Received enriched company data from Step3:', enrichedData);
        
        // Update the companyData state with the enriched information
        setCompanyData((prevData) => {
          if (!prevData) return prevData;
          
          const updatedData: CompanyRow = {
            ...prevData,
            ...enrichedData,
          } as CompanyRow;
          
          console.log('✅ [OnboardingFlow] Company data updated in parent:', {
            hasDescription: !!updatedData.description,
            hasProducts: !!updatedData.products,
            hasMarket: !!updatedData.market,
            enrichment_status: updatedData.enrichment_status,
          });
          
          return updatedData;
        });
        
        // Also update in userCompanies list if present
        if (companyId) {
          setUserCompanies((prevCompanies) => 
            prevCompanies.map((company) => 
              company.id === companyId 
                ? { ...company, ...enrichedData } as CompanyRow
                : company
            )
          );
        }
      }}
      onApplyRecommendation={(recommendationData) => {
        console.log('🚀 [OnboardingFlow] Applying recommendation:', recommendationData);
        
        // Navigate to the finance application flow - start from application details step
        const params = new URLSearchParams();
        params.set('step', 'application'); // Start from application details (not KYC directly)
        params.set('companyId', companyId || '');
        params.set('amount', recommendationData.amount?.toString() || '');
        params.set('termMonths', recommendationData.termMonths?.toString() || '');
        params.set('fundingType', recommendationData.fundingType || 'business_loan_unsecured');
        
        console.log('🚀 [OnboardingFlow] Navigating to finance application flow with params:', params.toString());
        
        // Navigate to the finance application flow starting from application details
        router.push(`/${locale}/finance-application?${params.toString()}`);
      }}
    />
    );
  };

  // Remove legacy Step4 from flow (consolidated into conversational step)

  // Render step 5 - Document Upload
  const renderStep5 = () => (
    <Step5DocumentUpload
      loading={loading}
      error={error}
      uploading={uploading}
      documents={documents}
      documentTypes={documentTypes}
      isDragging={isDragging}
      setIsDragging={setIsDragging}
      handleFileUpload={handleFileUpload}
      setUploadedFiles={setUploadedFiles}
      fetchDocuments={fetchDocuments}
      handleAnalyzeAndContinue={handleAnalyzeAndContinue}
      isGeneratingRecommendations={isGeneratingRecommendations}
      setIsGeneratingRecommendations={setIsGeneratingRecommendations}
      isAnalyzing={isAnalyzing}
      financialDataArray={financialDataArray}
      isFetchingFinancials={isFetchingFinancials}
      companyId={companyId}
      currentLocale={locale as string}
      handleFileSelect={handleFileSelect}
      goToStep={goToStepByNumber}
      supabase={supabase}
      setError={setError}
      userCompanies={userCompanies}
      handleCompanyChange={handleCompanyChange}
      isFetchingCompanies={isFetchingCompanies}
      setLoading={setLoading}
      session={session}
      handleDeleteDocument={handleDeleteDocument}
    />
  );

  // Render summary (now Step 4 in flow ordering)
  const renderStep6 = () => {
    return (
      <Step6Summary
        companyName={companyData?.name || companyFormData.name || 'Your Company'}
        fundingRecommendations={fundingRecommendations}
        isFetchingRecommendations={isFetchingRecommendations}
        error={error}
        goToStep={goToStepByNumber}
        goToDashboard={() => router.push(`/${locale}/dashboard`)}
        countryCode={companyData?.country_code}
        startApplication={(recommendationId?: string, fundingCategory?: string, amount?: number) => {
          // Build URL with application data
          const params = new URLSearchParams();
          params.set('step', 'kyc-ubo');  // Go to KYC step (user already filled company info)
          if (recommendationId) params.set('recommendationId', recommendationId);
          if (fundingCategory) params.set('fundingType', fundingCategory);
          if (amount) params.set('amount', amount.toString());
          if (companyId) params.set('companyId', companyId);
          
          // Navigate to the FinanceApplicationFlow
          router.push(`/${locale}/finance-application?${params.toString()}`);
        }}
        companyId={companyId}
        userCompanies={userCompanies}
        handleCompanyChange={handleCompanyChange}
        isFetchingCompanies={isFetchingCompanies}
        locale={locale as string} // Pass locale
        analysisStartTime={analysisStartTimestamp} // Pass the stored timestamp
      />
    );
  };

  // Render current step function
  const renderCurrentStep = () => {
    switch (currentStep) {
      case StepName.SIGNUP:
        return renderStep1();
      case StepName.COMPANY_INFO:
        return renderStep2();
      case StepName.AI_CONVERSATION:
        return renderStep3();
      case StepName.SUMMARY:
        return renderStep6();
      default:
        return <div>Invalid step</div>;
    }
  };

  // --- ADD Handler for Step 6 Funding Type ---
  const handleFundingTypeChange = (value: string) => {
    console.log("Funding type changed to:", value);
    setFundingType(value);
    // Optionally clear validation error when type is selected
    if (value) {
      setError(null); 
    }
  };
  // --- END ADD Handler ---

  // --- Handler for Step 6 Term Slider --- 
  const handleTermSliderChange = (value: number[]) => {
    // Slider typically returns an array, take the first element
    const term = value[0];
    setApplicationFormData(prev => ({
      ...prev,
      term_months: term
    }));
  };

  // --- Handler for Step 7 Form Submission ---
  const handleSaveDraftApplication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setNextStepTarget(null); // Clear any previous navigation intent

    // --- Validation ---
    if (!session?.user?.id) {
      console.error('DEBUG: No session.user.id found:', { session, user });
      setError(`DEBUG: User authentication required. Session: ${session ? 'exists' : 'missing'}, User ID: ${session?.user?.id || 'missing'}`);
      setLoading(false);
      // DISABLED REDIRECT FOR DEBUGGING - Don't redirect - let the user try again or they can navigate manually
      return;
    }

    if (!fundingType) {
      // Use t() to translate the error key
      setError(t('error.fundingTypeRequired', { default: 'Please select a funding type before continuing.' }));
      setLoading(false);
      return;
    }

    if (!companyId) {
      setError(t('error.companyRequired', { default: 'Company information is required.' }));
      setLoading(false);
      return;
    }

    console.log('DEBUG: All validations passed, proceeding with application save:', {
      userId: session.user.id,
      companyId,
      fundingType,
      applicationFormData
    });

    try {
      // Prepare the application data
      const applicationData = {
        company_id: companyId,
        user_id: session.user.id,
        type: fundingType,
        amount: Number(applicationFormData.amount),
        term_months: (fundingType === 'business_loan' || fundingType === 'business_loan_unsecured' || fundingType === 'business_loan_secured') ? Number(applicationFormData.term_months) : null,
        status: 'draft',
        funding_recommendation_id: applicationFormData.funding_recommendation_id || null
      };

      console.log('Saving draft application:', applicationData);

      // Call the API to save the draft application
      const response = await fetch('/api/onboarding/save-draft-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save application draft.');
      }

      const result = await response.json();
      console.log('Draft application saved successfully:', result);

      // Update the application ID in state
      setApplicationId(result.applicationId);

      // Navigate to the FinanceApplicationFlow KYC step
      router.push(`/${locale}/finance-application?step=kyc-ubo&applicationId=${result.applicationId}`);

    } catch (error) {
      console.error('Error saving draft application:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- MODIFIED: useEffect to fetch company data AND application ID ---
  useEffect(() => {
    const fetchData = async () => {
      if (companyId) {
        console.log(`🔄 [OnboardingFlow] Company ID changed or component mounted: ${companyId}. Fetching data...`);
        setLoading(true);
        setError(null);
        try {
          // Fetch company data using the memoized function
          const selectedCompany = await fetchSelectedCompanyData(companyId);
          setCompanyData(selectedCompany); // Set state with fetched data

          // --- ADDED: Fetch latest Application ID if missing or doesn't match company ---
          // Check if we need to fetch the application ID
          if (!applicationId) { // Fetch only if it's null
             console.log(`🔍 [OnboardingFlow] Application ID missing. Fetching latest for company: ${companyId}`);
             const { data: appData, error: appError } = await supabase
               .from('funding_applications')
               .select('id')
               .eq('company_id', companyId)
               .order('created_at', { ascending: false })
               .limit(1)
               .maybeSingle();

             if (appError) {
               console.error(`❌ [OnboardingFlow] Error fetching latest application ID:`, appError);
               // Decide if this error should be shown to the user
               // setError('Failed to load application status.');
             } else if (appData) {
               console.log(`✅ [OnboardingFlow] Found latest Application ID: ${appData.id}`);
               setApplicationId(appData.id);
             } else {
               console.log(`ℹ️ [OnboardingFlow] No existing application found for company ${companyId}.`);
               setApplicationId(null); // Explicitly set to null if none found
             }
           } else {
             // Optional: Verify if the existing applicationId belongs to the current companyId
             // This might be needed if the user switches companies mid-flow
             console.log(`ℹ️ [OnboardingFlow] Application ID already present: ${applicationId}. Skipping fetch.`);
           }
          // --- END: Fetch latest Application ID ---

        } catch (err: any) {
          console.error(`❌ [OnboardingFlow] Error in main fetchData useEffect for ${companyId}:`, err);
          setError(`Failed to load company/application data: ${err.message}`);
          setCompanyData(null);
          setApplicationId(null); // Reset application ID on error
        } finally {
          setLoading(false);
        }
      } else {
        // Reset data if companyId becomes null
        console.log('ℹ️ [OnboardingFlow] Company ID is null. Resetting related states.');
        setCompanyData(null);
        setFinancialDataArray([]);
        setFundingRecommendations([]);
        setApplicationId(null); // Reset application ID
        setApplicationFormData({ amount: '', term_months: '', funding_recommendation_id: null });
      }
    };

    fetchData();
    // Ensure fetchSelectedCompanyData is stable (memoized above)
  }, [companyId, supabase, applicationId, fetchSelectedCompanyData, refetchTrigger]); // Added refetchTrigger dependency

  // --- ADDED BACK: Handle initial form data change ---
  const handleInitialFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInitialFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  // --- END ADDED BACK ---

  // --- ADD: Document deletion function ---
  const handleDeleteDocument = useCallback(async (documentId: string, filePath: string | undefined | null) => {
    if (!session?.user || !supabase) {
      setError('Authentication or Supabase client not available');
      return;
    }
    
    if (!filePath) {
      console.error(`File path is missing for document ID: ${documentId}. Cannot delete from storage.`);
      setError(t('step3.errorMissingPath', { default: 'File path is missing, cannot delete from storage.' }));
      return;
    }

    try {
      console.log(`[OnboardingFlow] Attempting to delete document ID: ${documentId}, path: ${filePath}`);
      
      setLoading(true);
      
      // Call the delete API endpoint
      const response = await fetch(`/api/documents/delete/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          filePath: filePath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete document (HTTP ${response.status})`);
      }

      console.log('[OnboardingFlow] Document deleted successfully via API');
      
      // Refresh documents list
      await fetchDocuments();
      
      // Show success message
      toast({
        title: t('step3.deleteSuccessTitle', { default: 'Document Deleted' }),
        description: t('step3.deleteSuccessDesc', { default: 'Document has been successfully deleted.' }),
      });
      
    } catch (err) {
      console.error('[OnboardingFlow] Error deleting document:', err);
      setError(err instanceof Error ? err.message : t('step3.errorDeleteUnexpected', { default: 'An unexpected error occurred during deletion.' }));
    } finally {
      setLoading(false);
    }
  }, [session, supabase, t, toast, fetchDocuments]);

  // --- ADD: Missing handleFileSelect function ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[FileSelect] File input change event triggered");
    
    // Check if files were selected
    if (!e.target.files || e.target.files.length === 0) {
      console.log("[FileSelect] No files selected");
      setError(t('error.noFiles', { default: 'No files selected.' }));
      return;
    }

    // Convert FileList to array
    const files = Array.from(e.target.files) as File[];
    console.log(`[FileSelect] Selected ${files.length} files:`, files.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', '));

    // Basic validation before upload
    const maxFiles = 10;
    if (files.length > maxFiles) {
      setError(`Too many files selected. Maximum is ${maxFiles} files at once.`);
      e.target.value = ''; // Reset input
      return;
    }

    // Update state with selected files
    setUploadedFiles(files);
    setError(null); // Clear previous errors

    // Upload files
    handleFileUpload(files).catch(err => {
      console.error('[FileSelect] Error during upload:', err);
      setError(err instanceof Error ? err.message : 'File upload failed');
    }).finally(() => {
      // Reset file input after upload attempt
      e.target.value = '';
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- MOVED: File Handling Functions ---

  // --- ADD: Missing handleFileUpload function ---
  const handleFileUpload = async (files: File[], documentType?: string) => {
    console.log(`[FileUpload] Starting upload for ${files.length} files with documentType: ${documentType || 'auto-detect'}`);
    
    // Validate session and company
    if (!session?.user || !companyId) {
      const errorMsg = 'Kirjaudu sisään ja valitse yritys ennen tiedostojen lataamista';
      console.error('[FileUpload] Authentication error:', { hasSession: !!session?.user, hasCompanyId: !!companyId });
      setError(errorMsg);
      return;
    }
    
    // Validate files
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    for (const file of files) {
      if (file.size > maxFileSize) {
        setError(`Tiedosto "${file.name}" on liian suuri (${formatFileSize(file.size)}). Maksimikoko on 50MB.`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setError(`Tiedosto "${file.name}" ei ole tuettu tiedostotyyppi. Tuetut tyypit: PDF, DOC, DOCX, XLS, XLSX.`);
        return;
      }
    }
    
    setUploading(true);
    setError(null);
    const uploadedDocIds: string[] = [];
    const failedUploads: string[] = [];
    
    try {
      console.log('[FileUpload] Creating upload promises for files:', files.map(f => f.name).join(', '));
      
      const uploadPromises = files.map(async (file) => {
        try {
          console.log(`[FileUpload] Preparing to upload: ${file.name} (${formatFileSize(file.size)})`);
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('companyId', companyId);
          
          // Add manual document type if provided
          if (documentType) {
            console.log(`[FileUpload] Adding manual document type: ${documentType}`);
            formData.append('documentType', documentType);
          }
          
          // For financial statements, use last year instead of current year
          const currentYear = new Date().getFullYear();
          const lastYear = currentYear - 1;
          const fiscalYear = financialDataArray[0]?.fiscal_year?.toString() || lastYear.toString();
          const fiscalPeriod = financialDataArray[0]?.fiscal_period || 'annual';
          formData.append('fiscalYear', fiscalYear);
          formData.append('fiscalPeriod', fiscalPeriod);
          
          console.log(`[FileUpload] Sending request for ${file.name} to /api/documents/upload`);
          
          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
            body: formData
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[FileUpload] Upload failed for ${file.name}:`, { status: response.status, error: errorText });
            
            let errorMessage = `Tiedoston "${file.name}" lataus epäonnistui`;
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error) {
                errorMessage += `: ${errorData.error}`;
              }
            } catch {
              errorMessage += ` (HTTP ${response.status})`;
            }
            
            failedUploads.push(errorMessage);
            throw new Error(errorMessage);
          }
          
          const result = await response.json();
          console.log(`[FileUpload] Successfully uploaded ${file.name}:`, result);
          
          if (result.document?.id) {
            uploadedDocIds.push(result.document.id);
          } else if (result.data?.id) {
            uploadedDocIds.push(result.data.id);
          }
          
          return result;
        } catch (fileError) {
          console.error(`[FileUpload] Error uploading ${file.name}:`, fileError);
          throw fileError;
        }
      });
      
      console.log('[FileUpload] Waiting for all uploads to complete...');
      const uploadResults = await Promise.allSettled(uploadPromises);
      
      // Check results
      const successful = uploadResults.filter(result => result.status === 'fulfilled').length;
      const failed = uploadResults.filter(result => result.status === 'rejected').length;
      
      console.log(`[FileUpload] Upload summary: ${successful} successful, ${failed} failed`);
      
      if (failed > 0) {
        const rejectedReasons = uploadResults
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason.message)
          .join('; ');
        
        if (successful === 0) {
          throw new Error(`Kaikkien tiedostojen lataus epäonnistui: ${rejectedReasons}`);
        } else {
          setError(`Osittainen virhe: ${successful}/${files.length} tiedostoa ladattiin onnistuneesti. Virheet: ${rejectedReasons}`);
        }
      }
      
      // Refresh document list
      console.log('[FileUpload] Refreshing document list...');
      await fetchDocuments();
      
      // Note: Individual document uploads already trigger processing via the 'document/uploaded' Inngest event
      // No need to call /api/documents/analyze which would reset all documents to processing status
      
    } catch (err) {
      console.error('[FileUpload] Critical error in handleFileUpload:', err);
      setError(err instanceof Error ? err.message : 'Tiedostojen lataus epäonnistui odottamattoman virheen vuoksi');
    } finally {
      setUploading(false);
      setUploadedFiles([]); // Clear the selection
    }
  };

  // Handle step 2 form submission - company info
  const handleStep2Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Check if it's a real event before preventing default
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault(); 
    }

    console.log('[handleStep2Submit] Triggered. companyData:', companyData, 'selectedCompany:', companyFormData.selectedCompany);

    if (!session) {
      setError(t('error.notAuthenticated', { default: 'Authentication session missing. Please sign in again.' }));
      return;
    }
    
    // --- Added logic to handle the case where companyData already exists (Continue button) ---
    if (companyData && !companyFormData.selectedCompany) {
        console.log("[handleStep2Submit] Continuing with existing company data (condition met):");
        // Skip API call, directly use existing company data and analysis status
        if (companyData.id) {
            setCompanyId(companyData.id); // Ensure companyId is set
            await storeFinancialMetrics(companyData); // Ensure metrics are stored if needed
            // Check if analysis_status exists before accessing it
            if (companyData.analysis_status === 'pending') {
              setIsAnalyzing(true);
            } else if (companyData.analysis_status === 'completed') {
              setAnalysisResult(companyData.analysis_result);
            }
            console.log('[handleStep2Submit] Navigating to Step 3 (existing company case)...');
            goToStep(StepName.AI_CONVERSATION); // Navigate to the next step
            return; // Stop execution here
        } else {
            console.error('[handleStep2Submit] Existing company data is missing an ID.');
            setError("Existing company data is missing an ID.");
            return;
        }
    }
    // --- End added logic ---

    console.log('[handleStep2Submit] Proceeding with API call/validation logic...');
    setLoading(true);
    setError(null);

    // Require both name and code for all companies including Swedish companies
    if (!companyFormData.name || !companyFormData.code) {
      const errorMessage = t('error.companyInfoRequired', { default: 'Company name and code are required.' });
      setError(errorMessage);
      setLoading(false);
      return;
    }

    try {
      // Determine if we are CREATING a NEW company or UPDATING the selected one
      const isUpdating = !!companyId; // If a companyId is set, assume update
      console.log(`Step 2 Submit: ${isUpdating ? 'Updating' : 'Creating'} company...`);
      
      // Determine the appropriate locale based on selected country
      const apiLocale = selectedCountry === 'sweden' ? 'sv' : (locale as string);
      
      const payload: any = {
        name: companyFormData.name,
        business_id: companyFormData.code, // Include business_id for all companies including Swedish
        locale: apiLocale, // Pass the appropriate locale based on country selection
        // Include YTJ data ONLY if it was freshly selected via search during THIS step
        ...(companyFormData.selectedCompany && { 
            ...companyFormData.selectedCompany 
        })
      };
      
      // Adjust API call based on update/create
      const apiEndpoint = isUpdating ? `/api/companies/update/${companyId}` : '/api/companies/create';
      const apiMethod = isUpdating ? 'PUT' : 'POST';
      
      const companyResponse = await fetch(apiEndpoint, {
        method: apiMethod, 
        headers: getAuthHeaders(session),
        body: JSON.stringify(payload)
      });

      const responseText = await companyResponse.text();
      console.log('Raw API response text:', responseText);

      if (!companyResponse.ok) {
        // Handle errors (keep existing logic)
        if (companyResponse.status === 409) {
           // ... existing conflict error handling ...
            setError(t('error.companyConflict', { default: 'A company with this Business ID already exists.' }));
        } else {
           // ... existing generic error handling ...
          setError(t('error.saveCompany', { default: 'Could not save company information.' }));
        }
        setLoading(false);
        return;
      } 
      
      // Successfully saved/updated company
      console.log(`Company info ${isUpdating ? 'updated' : 'created/enriched'} successfully.`);
      const savedCompanyData = JSON.parse(responseText);
      
      if (savedCompanyData?.id) {
        // If CREATING, add to userCompanies list and set as selected
        if (!isUpdating) {
            setUserCompanies((prev: CompanyRow[]) => [...prev, savedCompanyData]); // Add new company to list
            setCompanyId(savedCompanyData.id); // Select the newly created company
            
            // Track company creation conversion (only for new companies, not updates)
            try {
              console.log('🎯 [OnboardingFlow] Tracking company_created conversion for company:', savedCompanyData.id)
              
              const result = await trackConversion('company_created', {
                companyId: savedCompanyData.id,
                userId: session.user?.id,
                metadata: {
                  company_name: savedCompanyData.name,
                  business_id: savedCompanyData.business_id,
                  created_via: 'onboarding_flow',
                  user_email: session.user?.email
                }
              })

              if (result.success && result.attributed) {
                console.log('✅ [OnboardingFlow] Company creation conversion tracked and attributed:', result.attribution)
              } else if (result.success) {
                console.log('ℹ️ [OnboardingFlow] Company creation conversion tracked (no attribution)')
              }
            } catch (conversionError) {
              console.warn('⚠️ [OnboardingFlow] Failed to track company_created conversion:', conversionError)
              // Don't fail the company creation flow if conversion tracking fails
            }
        } else {
            // If UPDATING, update the entry in userCompanies list
            setUserCompanies((prev: CompanyRow[]) => prev.map(comp => comp.id === savedCompanyData.id ? savedCompanyData : comp));
            // No need to setCompanyId again if updating the currently selected one
        }
        setCompanyData(savedCompanyData); // Update the detailed data for the selected company
        console.log('Stored/Updated company data:', savedCompanyData);
        
        await storeFinancialMetrics(savedCompanyData);
        
        // Check if analysis_status exists before accessing it
        if (savedCompanyData.analysis_status === 'pending') {
          setIsAnalyzing(true);
        } else if (savedCompanyData.analysis_status === 'completed') {
          setAnalysisResult(savedCompanyData.analysis_result);
        }
      } else {
        console.error('Company ID not available in response.');
        setError('Failed to get Company ID after saving.');
      }

      goToStep(StepName.AI_CONVERSATION);

    } catch (err) {
      // Re-determine isUpdating in the catch block for safety
      const isUpdatingInCatch = !!companyId;
      console.error(`Error during Step 2 ${isUpdatingInCatch ? 'update' : 'submission'}:`, err);
      setError(err instanceof Error ? err.message : t('error.step2Submit', { default: 'An unexpected error occurred.' }));
      setLoading(false);
    }
  };

  // Trigger immediate company enrichment
  const triggerImmediateEnrichment = async (companyId: string) => {
    if (!session?.access_token) {
      setError(t('error.notAuthenticated', { default: 'Authentication session missing. Please sign in again.' }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [Immediate Enrichment] Triggering research for company:', companyId);
      
      const response = await fetch(`/api/companies/${companyId}/retry-financial-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger enrichment');
      }

      const result = await response.json();
      console.log('✅ [Immediate Enrichment] Research triggered successfully:', result);
      
      setSuccessMessage(t('step2.researchTriggered', { 
        default: 'Company research started! This will take 1-2 minutes. You can continue to the next step.' 
      }));

      // Update company data to show enrichment is in progress
      if (companyData) {
        setCompanyData({
          ...companyData,
          enrichment_status: 'enriching',
          enrichment_started_at: new Date().toISOString()
        });
      }

    } catch (error: any) {
      console.error('❌ [Immediate Enrichment] Failed:', error);
      setError(t('step2.researchFailed', { 
        default: 'Failed to start company research. Please try again.' 
      }) + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let analysisTimeoutId: NodeJS.Timeout | null = null;
    
    if (isGeneratingRecommendations) {
      analysisTimeoutId = setTimeout(() => {
        console.log('Analysis timeout reached (120s) - stopping loader and redirecting to next step');
        setIsGeneratingRecommendations(false);
        goToStep(StepName.DOCUMENT_UPLOAD);
      }, 120000);
    }
    
    return () => {
      if (analysisTimeoutId) {
        clearTimeout(analysisTimeoutId);
      }
    };
  }, [isGeneratingRecommendations, goToStep]);

  // --- MODIFIED: Consolidated Realtime subscription for all events with improved stability and reconnection ---
  useEffect(() => {
    // Only run if supabase client and companyId are available
    if (!supabase || !companyId) return;

    console.log(`🔌 [RT Setup] Setting up consolidated Realtime channel for company: ${companyId}`);
    
    // Use a ref-like approach with a stable reference to prevent recreation
    const channelId = `consolidated-events-${companyId}`;
    let channelClosed = false;
    let retryCount = 0;
    const MAX_RETRIES = 3; // Reduced retries to fail faster
    const RETRY_DELAY_MS = 2000; // Shorter delay
    
    // Function to create a channel with all necessary subscriptions
    const createChannel = () => {
      console.log(`🔄 [RT Setup] Creating Realtime channel (attempt ${retryCount + 1})...`);
      
      // Use single channel for all events
      const channel = supabase
        .channel(channelId)
        // Document updates
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'documents',
            filter: `company_id=eq.${companyId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            if (channelClosed) return; // Skip if channel is being closed
            
            console.log('📄 [RT Documents] Document change received:', 
                        payload.new?.id, 
                        payload.new?.processing_status);
            
            // Update the local documents state if a change occurs
            setDocuments((currentDocs) =>
              currentDocs.map((doc) =>
                doc.id === payload.new.id ? { ...doc, ...payload.new } : doc
              )
            );

            // Trigger refetch if document status changes to 'processed'
            if (payload.old && 
                typeof payload.old === 'object' && 
                'processing_status' in payload.old && 
                payload.old?.processing_status !== 'completed' && 
                payload.new?.processing_status === 'completed') {
              console.log('📊 [RT Documents] Document processing completed, triggering financial data refetch');
              setRefetchTrigger(prev => prev + 1);
              fetchFinancialData();
            }
          }
        )
        // Funding recommendations - watch for both INSERT and UPDATE
        .on(
          'postgres_changes',
          {
            event: '*', // Watch all events to be safe
            schema: 'public',
            table: 'funding_recommendations',
            filter: `company_id=eq.${companyId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            if (channelClosed) return; // Skip if channel is being closed
            
            console.log(`💰 [RT Recommendations] Event received: ${payload.eventType}`, 
                        'ID:', payload.new?.id, 
                        'Company ID:', payload.new?.company_id);
            
            // Only react to new recommendations
            if (payload.eventType === 'INSERT' || 
               (payload.eventType === 'UPDATE' && 
                payload.old?.status !== 'completed' && 
                payload.new?.status === 'completed')) {
              
              console.log('✅ [RT Recommendations] New/completed recommendation detected! Stopping loader and queueing navigation.');
              
              // Reset loading state
              setIsGeneratingRecommendations(false);
              
              // Queue navigation to step 5
              setPendingRecommendationNavigation(true);
            }
          }
        )
        .subscribe((status: string, err?: any) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ [RT Setup] Successfully subscribed to consolidated channel!');
            // Reset retry count on successful subscription
            retryCount = 0;
            // Store the active channel in state once successfully subscribed
            setRealtimeChannel(channel);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            const errMessage = err ? 
              (typeof err === 'object' && err.message ? err.message : JSON.stringify(err)) : 
              '(No error details available)';
            
            console.error(`❌ [RT Setup] Realtime subscription error: ${status}`, errMessage);
            
            // Implement retry logic for reconnection
            if (retryCount < MAX_RETRIES && !channelClosed) {
              retryCount++;
              console.log(`🔄 [RT Retry] Attempting to reconnect (${retryCount}/${MAX_RETRIES}) in ${RETRY_DELAY_MS}ms`);
              
              // Try to remove the failed channel first
              try {
                supabase.removeChannel(channel);
              } catch (e) {
                console.warn('Could not remove failed channel:', e);
              }
              
              // Set a timeout to retry connection
              setTimeout(() => {
                if (!channelClosed) {
                  try {
                    // Create a new channel
                    const newChannel = createChannel();
                    // No need to set state here as it will be set on successful subscription
                  } catch (retryErr) {
                    console.error('[RT Retry] Failed to create new channel:', retryErr);
                  }
                }
              }, RETRY_DELAY_MS);
            } else if (!channelClosed) {
              // If max retries reached, show a user-friendly message but don't block the app
              console.error(`❌ [RT Error] Max retries (${MAX_RETRIES}) reached for Realtime connection`);
              console.log('🔄 [RT Fallback] Continuing without realtime updates - app will use polling instead');
              
              // Don't show error toast to user - just log it and continue
              // The app should work fine without realtime updates
              // toast({
              //   title: t('realtime.errorTitle'),
              //   description: t('realtime.errorMessage'),
              //   variant: 'destructive',
              // });
            }
          } else if (status === 'CLOSED') {
            console.log('🚪 [RT Setup] Channel closed');
            channelClosed = true;
            // Could implement reconnection here too if needed
          }
        });
      
      return channel;
    };
    
    // Initialize the channel
    const initialChannel = createChannel();

    // Cleanup function to remove the channel subscription
    return () => {
      console.log(`🧹 [RT Cleanup] Removing Realtime channel subscription for company ${companyId}`);
      channelClosed = true;
      if (initialChannel) {
        // Use try/catch to prevent unhandled errors during cleanup
        try {
          supabase.removeChannel(initialChannel);
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      }
    };
  }, [supabase, companyId, t]); // Minimized dependencies

  // --- MODIFIED: Recommendation polling fallback with improved stability ---
  useEffect(() => {
    // Only run polling if recommendations are being generated
    if (!isGeneratingRecommendations || !companyId || !session) return;
    
    console.log('⏱️ [Fallback] Starting recommendation polling fallback');
    const pollInterval = 5000; // Poll every 5 seconds
    const maxAttempts = 24; // Maximum 2 minutes of polling (24 * 5s = 120s)
    let attempts = 0;
    let stopped = false;
    
    const checkForRecommendations = async () => {
      if (stopped) return false;
      
      try {
        console.log(`🔍 [Fallback] Polling for recommendations (attempt ${attempts + 1}/${maxAttempts})`);
        
        // Check if we have recommendations for this company
        const { data, error } = await supabase
          .from('funding_recommendations')
          .select('id, created_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) {
          console.error('❌ [Fallback] Error checking recommendations:', error);
          return false;
        }
        
        if (stopped) return false; // Check if stopped after async operation
        
        if (data && data.length > 0) {
          // Found recommendation(s)
          const recommendationTime = new Date(data[0].created_at).getTime();
          const now = Date.now();
          const ageInSeconds = (now - recommendationTime) / 1000;
          
          console.log(`✅ [Fallback] Found recommendation! ID: ${data[0].id}, Age: ${ageInSeconds.toFixed(1)}s`);
          
          // Only consider it a match if it's relatively recent (created in the last 5 minutes)
          if (ageInSeconds < 300) {
            if (stopped) return false; // Check if stopped before state updates
            
            // Stop the generating indicator and queue navigation
            setIsGeneratingRecommendations(false);
            setPendingRecommendationNavigation(true);
            return true;
          } else {
            console.log(`⚠️ [Fallback] Found recommendation but it's too old (${ageInSeconds.toFixed(1)}s)`);
          }
        }
        
        return false;
      } catch (err) {
        console.error('❌ [Fallback] Unexpected error in recommendation polling:', err);
        return false;
      }
    };
    
    const intervalId = setInterval(async () => {
      if (stopped) {
        clearInterval(intervalId);
        return;
      }
      
      attempts++;
      const found = await checkForRecommendations();
      
      if (found || attempts >= maxAttempts) {
        console.log(`🛑 [Fallback] Stopping recommendation polling: ${found ? 'Found recommendation' : 'Max attempts reached'}`);
        clearInterval(intervalId);
        
        // If max attempts reached and still no recommendation, force navigation
        if (!found && attempts >= maxAttempts && !stopped) {
          console.warn('⚠️ [Fallback] Max polling attempts reached. Forcing navigation to Step 5.');
          setIsGeneratingRecommendations(false);
          goToStep(StepName.DOCUMENT_UPLOAD);
        }
      }
    }, pollInterval);
    
    // Initial check immediately - safely invoke async function
    void checkForRecommendations();
    
    // Cleanup
    return () => {
      stopped = true;
      clearInterval(intervalId);
      console.log('🧹 [Fallback] Cleanup: Stopped recommendation polling');
    };
  }, [isGeneratingRecommendations, companyId, session, supabase, goToStep]); // Removed function dependencies

  // --- MODIFIED: Timeout effect with improved stability ---
  useEffect(() => {
    let analysisTimeoutId: NodeJS.Timeout | null = null;
    let cancelled = false;
    
    if (isGeneratingRecommendations) {
      analysisTimeoutId = setTimeout(() => {
        if (cancelled) return;
        
        console.log('Analysis timeout reached (120s) - stopping loader and redirecting to next step');
        setIsGeneratingRecommendations(false);
        goToStep(StepName.DOCUMENT_UPLOAD);
      }, 120000);
    }
    
    return () => {
      cancelled = true;
      if (analysisTimeoutId) {
        clearTimeout(analysisTimeoutId);
      }
    };
  }, [isGeneratingRecommendations, goToStep]);

  // In the main OnboardingFlow component function, after the declaration of all state variables:

  // Add a custom event listener for recommendation readiness notifications from Step5Summary
  useEffect(() => {
    const handleRecommendationsReady = (event: CustomEvent<{companyId: string}>) => {
      const { companyId: eventCompanyId } = event.detail;
      console.log(`📣 [Event] Received recommendations-ready event for company: ${eventCompanyId}`);
      
      // Refresh the recommendations if this is for the current company
      if (eventCompanyId === companyId) {
        console.log('🔄 [OnboardingFlow] Refreshing recommendations after notification from Step5Summary');
        // Force the refresh regardless of whether we're already fetching
        setIsFetchingRecommendations(false);
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          fetchFundingRecommendations();
          // After successful fetch, turn off the generating indicator
          setIsGeneratingRecommendations(false);
        }, 300);
      }
    };

    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('recommendations-ready', handleRecommendationsReady as EventListener);
    }

    // Clean up
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('recommendations-ready', handleRecommendationsReady as EventListener);
      }
    };
  }, [companyId, fetchFundingRecommendations]);

  // Add a direct check for recommendations when appropriate
  useEffect(() => {
    // Only check if we're on step 5, generating recommendations, and no recommendations loaded yet
    const shouldCheckDirectly = 
      currentStep === StepName.DOCUMENT_UPLOAD && 
      isGeneratingRecommendations && 
      (!fundingRecommendations || fundingRecommendations.length === 0);
    
    if (shouldCheckDirectly && companyId && !isFetchingRecommendations) {
      console.log('🔍 [OnboardingFlow] Directly checking for recommendations on step 5');
      fetchFundingRecommendations();
      
      // Set up a polling interval as fallback
      const pollingInterval = setInterval(() => {
        if (!isGeneratingRecommendations || fundingRecommendations?.length > 0) {
          console.log('🛑 [OnboardingFlow] Stopping direct polling - recommendations found or generation stopped');
          clearInterval(pollingInterval);
          return;
        }
        
        console.log('🔄 [OnboardingFlow] Polling for recommendations directly');
        fetchFundingRecommendations();
      }, 10000); // Check every 10 seconds
      
      return () => {
        clearInterval(pollingInterval);
      };
    }
  }, [currentStep, companyId, isGeneratingRecommendations, fundingRecommendations, isFetchingRecommendations]);

  // Add a LocalStorage check as backup communication channel
  useEffect(() => {
    // Skip if we're not on Step 5 or not generating recommendations
    if (currentStep !== StepName.DOCUMENT_UPLOAD || !isGeneratingRecommendations || !companyId) {
      return;
    }
    
    // Check localStorage for recommendations readiness
    const checkLocalStorage = () => {
      if (!companyId) return;
      
      try {
        const signalStr = localStorage.getItem('recommendations_ready_signal');
        if (!signalStr) return;
        
        const signal = JSON.parse(signalStr);
        
        // Check if the signal is for the current company and is recent (within last 10 minutes)
        if (
          signal.companyId === companyId && 
          signal.timestamp > Date.now() - 10 * 60 * 1000
        ) {
          console.log('🔔 [OnboardingFlow] Detected recommendation readiness via localStorage');
          
          // Clear the signal to prevent reprocessing
          localStorage.removeItem('recommendations_ready_signal');
          
          // Force refresh recommendations
          fetchFundingRecommendations();
          setIsGeneratingRecommendations(false);
        }
      } catch (err) {
        console.error('❌ [OnboardingFlow] Error checking localStorage signal:', err);
      }
    };
    
    // Initial check
    checkLocalStorage();
    
    // Set up interval to check periodically
    const interval = setInterval(checkLocalStorage, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [currentStep, isGeneratingRecommendations, companyId, fetchFundingRecommendations]);

  // Add state for recommendation selection
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);

  // Handle step 4 submit (Funding Needs)
  const handleStep4Submit = async (questionnaireData: any): Promise<void> => {
    console.log("Received Questionnaire Data in OnboardingFlow (Step 4):", questionnaireData);

    if (!session || !companyId) {
      setError(t('error.notAuthenticated', { default: 'Authentication session or Company ID missing. Please sign in again or select a company.' }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use API route to store questionnaire responses (bypasses RLS issues)
      const response = await fetch('/api/financing-needs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyId: companyId,
          userId: session.user.id,
          questionnaire: questionnaireData // Pass the entire questionnaire data as-is
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save financing needs');
      }

      const result = await response.json();
      
      // Update state and proceed to next step
      setFinancingNeedsId(result.financingNeedsId);
      toast({
        title: t('step4.stage6.successTitle', { default: 'Information Submitted'}),
        description: t('step4.stage6.successDescription', { default: 'Your funding needs questionnaire has been saved.'}),
      });
      goToStep(StepName.DOCUMENT_UPLOAD);
    } catch (err) {
      console.error('Error submitting funding needs:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('error.genericTitle', { default: 'Submission Error'}),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler for application form changes
  const handleApplicationFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApplicationFormData(prev => ({
      ...prev,
      // Convert to number if the input is numeric, otherwise keep as string
      [name]: (name === 'amount' || name === 'term_months') && /^\d*\.?\d*$/.test(value) && value !== ''
              ? Number(value)
              : value
    }));
  };

  // Diagnostics component for debugging
  const renderDiagnostics = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-sm z-50">
        <h4 className="font-bold mb-2">🔧 Diagnostiikka</h4>
        <div className="space-y-1">
          <div>Session: {session ? '✅' : '❌'}</div>
          <div>User ID: {session?.user?.id || 'N/A'}</div>
          <div>Company ID: {companyId || 'N/A'}</div>
          <div>Company Data: {companyData ? '✅' : '❌'}</div>
          <div>Documents: {documents.length}</div>
          <div>Uploading: {uploading ? '🔄' : '✅'}</div>
          <div>Loading: {loading ? '🔄' : '✅'}</div>
          <div>Error: {error ? '❌' : '✅'}</div>
          <div>Step: {getStepIndex(currentStep)}/{STEP_ORDER.length}</div>
          <div>Supabase: {supabase ? '✅' : '❌'}</div>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-900 rounded text-red-200 text-xs">
            {error}
          </div>
        )}
      </div>
    );
  };

  // Test functions for debugging
  const testCompanySearch = async (query: string = 'LastBot') => {
    console.log(`[Test] Testing company search with query: "${query}"`);
    try {
      const response = await fetch(`/api/companies/search?query=${encodeURIComponent(query)}&limit=5`);
      const result = await response.json();
      console.log('[Test] Company search result:', result);
      return result;
    } catch (error) {
      console.error('[Test] Company search error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const testFileUpload = async (testFile?: File) => {
    console.log('[Test] Testing file upload...');
    
    if (!testFile) {
      // Create a test file
      const testContent = 'Test document content for upload testing';
      testFile = new File([testContent], 'test-document.txt', { type: 'text/plain' });
    }
    
    if (!session?.user || !companyId) {
      console.error('[Test] Cannot test upload: missing session or company ID');
      return { success: false, error: 'Missing session or company ID' };
    }
    
    try {
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('companyId', companyId);
      formData.append('fiscalYear', '2024');
      formData.append('fiscalPeriod', 'annual');
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData
      });
      
      const result = await response.json();
      console.log('[Test] File upload result:', result);
      return result;
    } catch (error) {
      console.error('[Test] File upload error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const testSupabaseConnection = async () => {
    console.log('[Test] Testing Supabase connection...');
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const { data, error } = await supabase.from('companies').select('count').limit(1);
      console.log('[Test] Supabase test result:', { data, error });
      return { success: !error, data, error };
    } catch (error) {
      console.error('[Test] Supabase connection error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Add test functions to window for console access in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).trustyDebug = {
        testCompanySearch,
        testFileUpload,
        testSupabaseConnection,
        state: {
          session: !!session,
          companyId,
          companyData: !!companyData,
          documents: documents.length,
          uploading,
          loading,
          error,
          currentStep
        }
      };
      console.log('🔧 Debug functions available at window.trustyDebug');
    }
  }, [session, companyId, companyData, documents.length, uploading, loading, error, currentStep]);



  return (
    <div className="min-h-[calc(100vh-213px)] bg-black text-gold-secondary flex flex-col">
      <InfoPopup
        isOpen={infoPopup.isOpen}
        title={infoPopup.title}
        onClose={closeInfoPopup}
      >
        {infoPopup.content}
      </InfoPopup>
      {/* --- FIX: Use isGeneratingRecommendations for loader visibility --- */}
      <ProgressBarLoader 
         isVisible={isGeneratingRecommendations} 
         message={t('step3.generatingRecommendationsLoader', { default: 'Analyzing Documents & Generating Recommendations...' })}
         estimatedDurationSeconds={40}
      />
      {/* --- END FIX --- */}

      {/* Kelluva etenemispalkki näytetään suoraan render-funktiossa, ei osana main-sisältöä */}
      {getStepIndex(currentStep) > 1 && renderStepIndicator()}

      {/* Header - only show on steps 2 and beyond */}
      {getStepIndex(currentStep) > 1 && (
        <header className="bg-black shadow-md shadow-gold-primary/10">
          {/* Header content */}
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Step content - Lisää marginaalia ylhäältä kelluvalle palkille */}
        <div className="flex-1 mt-[120px]">
          {renderCurrentStep()}
        </div>
      </main>

      {renderDiagnostics()}
    </div>
  );
} 