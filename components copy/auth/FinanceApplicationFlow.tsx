'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Check as CheckIcon,
  FileText as PencilSquareIcon,
  Shield as IdentificationIcon,
  FileText
} from 'lucide-react';
import Step7Application from './onboarding/Step7Application';
import Step8DocumentUpload from './onboarding/Step8DocumentUpload';
import Step9KycUbo, { UboData } from './onboarding/Step9KycUbo';
import { toast } from '@/components/ui/use-toast';
import { CompanyRow } from './OnboardingFlow';

// Application flow specific step names
export enum ApplicationStepName {
  APPLICATION = 'application',
  DOCUMENTS = 'documents',
  KYC_UBO = 'kyc-ubo'
}

// Step order for application flow
const APPLICATION_STEP_ORDER: ApplicationStepName[] = [
  ApplicationStepName.APPLICATION,
  ApplicationStepName.DOCUMENTS,
  ApplicationStepName.KYC_UBO
];

// Helper functions for step management
const getStepIndex = (stepName: ApplicationStepName): number => {
  return APPLICATION_STEP_ORDER.indexOf(stepName) + 1;
};

const getStepName = (index: number): ApplicationStepName | null => {
  return APPLICATION_STEP_ORDER[index - 1] || null;
};

// Application form data type - Extended to include all funding type parameters
export type ApplicationFormData = {
  amount: number | string;
  term_months: number | string;
  funding_recommendation_id?: string | null;
  
  // Factoring-specific fields
  factoring_totalFundingNeed?: string;
  factoring_financingPercentage?: string;
  factoring_largestCustomers?: string;
  factoring_averagePaymentDays?: string;
  factoring_averageInvoiceAmount?: string;
  
  // Leasing-specific fields
  leasing_asset?: string;
  leasing_leaseTerm?: string;
  leasing_finalPayment?: string;
  
  // Secured loan specific
  secured_collateral?: string;
  
  // Recommendation metadata
  recommendationTitle?: string;
  recommendationSummary?: string;
  recommendationCostNotes?: string;
};

// KYC/UBO form data type
type KycUboFormData = {
  applicantNationalId: string;
  ubos: UboData[];
};

// Document interface
interface UploadedDocument {
  id: string;
  name: string;
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

// Document type interface for FinanceApplicationFlow (matching Step8KycUbo)
interface DocumentType {
  id: string;
  name: string;
  description: string;
  required_for_analysis?: boolean;
}

// Step data type
type StepData = {
  name: ApplicationStepName;
  title: string;
  icon: React.ElementType;
  description: string;
};

export default function FinanceApplicationFlow() {
  const router = useRouter();
  const { locale } = useParams();
  const t = useTranslations('Onboarding');
  const { session, user, loading: authLoading } = useAuth();
  const supabase = createClient();

  // State management
  const [currentStep, setCurrentStep] = useState<ApplicationStepName>(ApplicationStepName.APPLICATION);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<CompanyRow | null>(null);
  const [userCompanies, setUserCompanies] = useState<CompanyRow[]>([]);
  const [isFetchingCompanies, setIsFetchingCompanies] = useState<boolean>(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [existingApplications, setExistingApplications] = useState<any[]>([]);
  const [appliedFundingTypes, setAppliedFundingTypes] = useState<string[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [uploading, setUploading] = useState(false);
  const [refreshingDocuments, setRefreshingDocuments] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Form data states
  const [applicationFormData, setApplicationFormData] = useState<ApplicationFormData>({
    amount: '',
    term_months: '',
    funding_recommendation_id: null,
  });
  
  const [kycUboFormData, setKycUboFormData] = useState<KycUboFormData>({
    applicantNationalId: '',
    ubos: [],
  });

  const [fundingType, setFundingType] = useState<string>('business_loan_unsecured');
  const [fundingFormData] = useState<any>({}); // Placeholder for funding form data

  // Step definitions
  const steps: StepData[] = [
    {
      name: ApplicationStepName.APPLICATION,
      title: t('application.title', { default: 'Application Details' }),
      icon: PencilSquareIcon,
      description: t('application.description', { default: 'Specify application amount and term.' }),
    },
    {
      name: ApplicationStepName.DOCUMENTS,
      title: t('documents.title', { default: 'Required Documents' }),
      icon: FileText,
      description: t('documents.description', { default: 'Upload required documentation.' }),
    },
    {
      name: ApplicationStepName.KYC_UBO,
      title: t('verification.title', { default: 'Verification & Submit' }),
      icon: IdentificationIcon,
      description: t('verification.description', { default: 'Confirm details and submit.' }),
    },
  ];

  // Initialize from URL parameters
  useEffect(() => {
    if (authLoading) return;
    
    const params = new URLSearchParams(window.location.search);
    
    // Extract step parameter
    const stepParam = params.get('step');
    let initialStep: ApplicationStepName = ApplicationStepName.APPLICATION;
    
    if (stepParam && Object.values(ApplicationStepName).includes(stepParam as ApplicationStepName)) {
      initialStep = stepParam as ApplicationStepName;
    }
    
    setCurrentStep(initialStep);
    
    // Extract all parameters
    const recommendationId = params.get('recommendationId');
    const fundingTypeParam = params.get('fundingType');
    const companyIdParam = params.get('companyId');
    const applicationIdParam = params.get('applicationId');
    const amountParam = params.get('amount');
    const termMonthsParam = params.get('termMonths');
    
    // Factoring parameters
    const factoringTotalFundingNeed = params.get('factoring_totalFundingNeed');
    const factoringFinancingPercentage = params.get('factoring_financingPercentage');
    const factoringAveragePaymentDays = params.get('factoring_averagePaymentDays');
    
    // Leasing parameters
    const leasingAsset = params.get('leasing_asset');
    const leasingLeaseTerm = params.get('leasing_leaseTerm');
    
    // Secured loan parameters
    const securedCollateral = params.get('secured_collateral');
    
    // Recommendation metadata
    const recommendationTitle = params.get('recommendationTitle');
    const recommendationSummary = params.get('recommendationSummary');
    const recommendationCostNotes = params.get('recommendationCostNotes');
    
    console.log('[FinanceApplicationFlow] URL Parameters:', {
      step: stepParam,
      recommendationId,
      fundingType: fundingTypeParam,
      companyId: companyIdParam,
      applicationId: applicationIdParam,
      amount: amountParam,
      termMonths: termMonthsParam,
      factoringParams: { factoringTotalFundingNeed, factoringFinancingPercentage, factoringAveragePaymentDays },
      leasingParams: { leasingAsset, leasingLeaseTerm },
      securedParams: { securedCollateral },
      recommendationMetadata: { recommendationTitle, recommendationSummary, recommendationCostNotes }
    });
    
    // Set funding type if provided
    if (fundingTypeParam) {
      setFundingType(fundingTypeParam);
    }
    
    // Set company ID if provided
    if (companyIdParam) {
      setCompanyId(companyIdParam);
    }
    
    // Set application ID if provided
    if (applicationIdParam) {
      setApplicationId(applicationIdParam);
    }
    
    // Set application form data with all parameters
    const hasAnyParams = recommendationId || amountParam || termMonthsParam || 
                        factoringTotalFundingNeed || factoringFinancingPercentage || factoringAveragePaymentDays ||
                        leasingAsset || leasingLeaseTerm || securedCollateral ||
                        recommendationTitle || recommendationSummary || recommendationCostNotes;
                        
    if (hasAnyParams) {
      setApplicationFormData(prev => ({
        ...prev,
        funding_recommendation_id: recommendationId || null,
        amount: amountParam || prev.amount,
        term_months: termMonthsParam || prev.term_months,
        
        // Factoring fields
        factoring_totalFundingNeed: factoringTotalFundingNeed || prev.factoring_totalFundingNeed,
        factoring_financingPercentage: factoringFinancingPercentage || prev.factoring_financingPercentage,
        factoring_averagePaymentDays: factoringAveragePaymentDays || prev.factoring_averagePaymentDays,
        
        // Leasing fields
        leasing_asset: leasingAsset || prev.leasing_asset,
        leasing_leaseTerm: leasingLeaseTerm || prev.leasing_leaseTerm,
        
        // Secured loan fields
        secured_collateral: securedCollateral || prev.secured_collateral,
        
        // Recommendation metadata
        recommendationTitle: recommendationTitle || prev.recommendationTitle,
        recommendationSummary: recommendationSummary || prev.recommendationSummary,
        recommendationCostNotes: recommendationCostNotes || prev.recommendationCostNotes,
      }));
    }
  }, [authLoading]);

  // Authentication check
  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      console.log('Unauthenticated user trying to access application flow. Redirecting to login.');
      const currentPath = window.location.pathname + window.location.search;
      const signInUrl = `/${locale}/auth/sign-in?next=${encodeURIComponent(currentPath)}`;
      router.replace(signInUrl);
    }
  }, [authLoading, session, locale, router]);

  // Fetch existing applications for the company
  const fetchExistingApplications = useCallback(async () => {
    if (!companyId || !session?.access_token) return;
    
    try {
      console.log('[FinanceApplicationFlow] Fetching existing applications for company:', companyId);
      
      const { data: applications, error } = await supabase
        .from('funding_applications')
        .select('id, type, status, created_at')
        .eq('company_id', companyId)
        .in('status', ['draft', 'pending_review', 'under_review', 'approved', 'processing'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[FinanceApplicationFlow] Error fetching existing applications:', error);
        return;
      }
      
      console.log('[FinanceApplicationFlow] Found existing applications:', applications);
      setExistingApplications(applications || []);
      
      // Extract funding types that are SUBMITTED (not draft) - draft is NOT "already applied"
      // Only mark as "already applied" if the application has been submitted (pending_review, under_review, approved, processing)
      const appliedTypes = (applications || [])
        .filter(app => {
          // Draft is NOT applied yet - user can still apply
          // Only submitted applications (pending_review onwards) count as "applied"
          const isSubmitted = ['pending_review', 'under_review', 'approved', 'processing'].includes(app.status);
          return isSubmitted;
        })
        .map(app => app.type);
      
      const uniqueAppliedTypes = Array.from(new Set(appliedTypes));
      console.log('[FinanceApplicationFlow] Already SUBMITTED funding types:', uniqueAppliedTypes);
      setAppliedFundingTypes(uniqueAppliedTypes);
      
    } catch (error) {
      console.error('[FinanceApplicationFlow] Error fetching existing applications:', error);
    }
  }, [companyId, session?.access_token, supabase]);

  // Fetch user companies
  const fetchUserCompanies = useCallback(async () => {
    if (!session?.user?.id || !session?.access_token) return;
    
    setIsFetchingCompanies(true);
    
    try {
      console.log('[FinanceApplicationFlow] Fetching user companies via API...');
      
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
        console.error('[FinanceApplicationFlow] API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      const companies = result.companies || [];
      
      console.log(`[FinanceApplicationFlow] Found ${companies.length} companies`);
      setUserCompanies(companies);
      
      // If we have a companyId from URL parameters, find and set that company
      if (companyId && companies) {
        const selectedCompany = companies.find((company: CompanyRow) => company.id === companyId);
        if (selectedCompany) {
          setCompanyData(selectedCompany);
          console.log('[FinanceApplicationFlow] Found company from URL:', selectedCompany.name);
        } else {
          console.warn('[FinanceApplicationFlow] Company from URL not found in user companies:', companyId);
        }
      } else if (companies && companies.length > 0 && !companyId) {
        // Only set default company if no companyId was provided in URL
        const firstCompany = companies[0];
        setCompanyId(firstCompany.id);
        setCompanyData(firstCompany);
        console.log('[FinanceApplicationFlow] Using default company:', firstCompany.name);
      }
      
    } catch (error) {
      console.error('Error fetching user companies:', error);
      setError('Failed to load your companies');
    } finally {
      setIsFetchingCompanies(false);
    }
  }, [session?.user?.id, session?.access_token, companyId]);

  // Fetch companies on component mount
  useEffect(() => {
    if (session && user) {
      fetchUserCompanies();
    }
  }, [session, user, fetchUserCompanies]);

  // Fetch existing applications when companyId changes
  useEffect(() => {
    if (companyId && session?.access_token) {
      fetchExistingApplications();
    }
  }, [companyId, session?.access_token, fetchExistingApplications]);

  // Handle company change
  const handleCompanyChange = useCallback((selectedCompanyId: string) => {
    console.log('[FinanceApplicationFlow] Company changed to:', selectedCompanyId);
    setCompanyId(selectedCompanyId);
    const selectedCompany = userCompanies.find(company => company.id === selectedCompanyId);
    if (selectedCompany) {
      setCompanyData(selectedCompany);
    }
    
    // Clear old applied funding types and fetch new ones for the selected company
    setAppliedFundingTypes([]);
    setExistingApplications([]);
    
    // Fetch existing applications for the new company will happen via useEffect
    console.log('[FinanceApplicationFlow] Cleared old applications, will fetch new ones for:', selectedCompanyId);
  }, [userCompanies]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!session?.access_token || !companyId) {
      console.log('[FinanceApplicationFlow] Missing token or companyId for fetchDocuments');
      return;
    }

    console.log('[FinanceApplicationFlow] Starting fetchDocuments for company:', companyId);
    setRefreshingDocuments(true);
    
    try {
      const response = await fetch(`/api/documents/list?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API responded with status: ${response.status} - ${errorText}`);
      }
      
      const apiData = await response.json();
      console.log('[FinanceApplicationFlow] fetchDocuments response:', apiData);
      
      if (apiData.data && Array.isArray(apiData.data)) {
        const processedDocuments = apiData.data.map((doc: any) => ({
          ...doc,
          document_type: doc.document_types || null
        }));
        console.log('[FinanceApplicationFlow] Setting', processedDocuments.length, 'documents');
        setDocuments(processedDocuments);
      } else {
        console.log('[FinanceApplicationFlow] No documents found, setting empty array');
        setDocuments([]);
      }
    } catch (err) {
      console.error('[FinanceApplicationFlow] Error refreshing documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh documents');
    } finally {
      setRefreshingDocuments(false);
    }
  }, [companyId, session]);

  // Fetch document types on component mount
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      if (!session?.access_token) {
        console.log('[FinanceApplicationFlow] No access token available for fetching document types');
        return;
      }

      console.log('[FinanceApplicationFlow] Fetching document types...');
      try {
        const response = await fetch('/api/documents/types', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch document types: ${response.status}`);
        }

        const data = await response.json();
        console.log('[FinanceApplicationFlow] Document types fetched:', data);
        setDocumentTypes(data.document_types || []);
      } catch (err) {
        console.error('[FinanceApplicationFlow] Error fetching document types:', err);
        // Provide fallback document types to prevent Step8 from breaking
        console.log('[FinanceApplicationFlow] Using fallback document types');
        setDocumentTypes([
          { id: 'financial_statements', name: 'financial_statements', description: 'Financial Statements' },
          { id: 'income_statement', name: 'income_statement', description: 'Income Statement' },
          { id: 'balance_sheet', name: 'balance_sheet', description: 'Balance Sheet' },
          { id: 'draft_income_statement', name: 'draft_income_statement', description: 'Draft Income Statement' },
          { id: 'draft_balance_sheet', name: 'draft_balance_sheet', description: 'Draft Balance Sheet' },
          { id: 'collateral_document', name: 'collateral_document', description: 'Collateral Document' },
          { id: 'asset_information_document', name: 'asset_information_document', description: 'Asset Information Document' },
          { id: 'leasing_document', name: 'leasing_document', description: 'Leasing Document' }
        ]);
      }
    };

    if (session?.access_token) {
      fetchDocumentTypes();
    }
  }, [session?.access_token]);

  // Fetch application data when applicationId is available
  const fetchApplicationData = useCallback(async () => {
    if (!applicationId || !session?.access_token) return;

    console.log('[FinanceApplicationFlow] Fetching application data for:', applicationId);
    try {
      const response = await fetch(`/api/onboarding/save-draft-application?applicationId=${applicationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch application: ${response.status}`);
      }

      const appData = await response.json();
      console.log('[FinanceApplicationFlow] Application data fetched:', appData);
      
      // Update application form data with fetched data
      if (appData.amount || appData.term_months) {
        setApplicationFormData(prev => ({
          ...prev,
          amount: appData.amount || prev.amount,
          term_months: appData.term_months || prev.term_months,
          funding_recommendation_id: appData.funding_recommendation_id || prev.funding_recommendation_id
        }));
      }

      // Update funding type if available
      if (appData.type) {
        setFundingType(appData.type);
      }

    } catch (err) {
      console.error('[FinanceApplicationFlow] Error fetching application data:', err);
      // Don't set error here as it's not critical - the form can still be used
    }
  }, [applicationId, session?.access_token]);

  // Look up most recent draft application if no applicationId provided
  const lookupDraftApplication = useCallback(async () => {
    if (applicationId || !companyId || !session?.access_token || currentStep !== ApplicationStepName.KYC_UBO) {
      console.log('[FinanceApplicationFlow] Skipping lookup - conditions not met:', {
        hasApplicationId: !!applicationId,
        hasCompanyId: !!companyId,
        hasAccessToken: !!session?.access_token,
        isKYCStep: currentStep === ApplicationStepName.KYC_UBO
      });
      return;
    }

    console.log('[FinanceApplicationFlow] Looking up draft application for company:', companyId);
    console.log('[FinanceApplicationFlow] Using session:', {
      userId: session?.user?.id,
      tokenLength: session?.access_token?.length
    });

    try {
      const response = await fetch(`/api/onboarding/save-draft-application?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('[FinanceApplicationFlow] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FinanceApplicationFlow] API error response:', errorText);
        throw new Error(`Failed to lookup draft application: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[FinanceApplicationFlow] Draft application lookup result:', data);
      
      if (data.applications && data.applications.length > 0) {
        const draftApp = data.applications[0];
        console.log('[FinanceApplicationFlow] Found draft application:', draftApp.id);
        setApplicationId(draftApp.id);
        
        // Update URL to include applicationId
        const url = new URL(window.location.href);
        url.searchParams.set('applicationId', draftApp.id);
        window.history.replaceState({}, '', url.toString());
      } else {
        console.log('[FinanceApplicationFlow] No draft application found for company');
      }

    } catch (err) {
      console.error('[FinanceApplicationFlow] Error looking up draft application:', err);
      console.error('[FinanceApplicationFlow] Full error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      // Don't set error here as it's not critical, but log it thoroughly
    }
  }, [applicationId, companyId, session?.access_token, currentStep]);

  // Look up draft application when on KYC step without applicationId
  useEffect(() => {
    if (currentStep === ApplicationStepName.KYC_UBO && companyId && session?.access_token && !applicationId) {
      // Add a small delay to ensure authentication is fully ready
      const timer = setTimeout(() => {
        lookupDraftApplication();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, companyId, session?.access_token, applicationId, lookupDraftApplication]);

  // Fetch application data when applicationId changes
  useEffect(() => {
    if (applicationId && session?.access_token) {
      fetchApplicationData();
    }
  }, [applicationId, session?.access_token, fetchApplicationData]);

  // Fetch documents when companyId changes or on initial load
  useEffect(() => {
    if (companyId && session?.access_token) {
      console.log('[FinanceApplicationFlow] Fetching documents for company:', companyId);
      fetchDocuments();
    }
  }, [companyId, session?.access_token, fetchDocuments]);

  // Handle file upload
  const handleFileUpload = async (files: File[], documentType?: string) => {
    if (!session?.user || !companyId) {
      setError('Authentication required');
      return;
    }
    
    console.log('[FinanceApplicationFlow] Starting file upload for', files.length, 'files');
    setUploading(true);
    setError(null);
    
    try {
      const uploadPromises = files.map(async (file) => {
        console.log('[FinanceApplicationFlow] Uploading file:', file.name);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('companyId', companyId);
        
        if (documentType) {
          formData.append('documentType', documentType);
          console.log('[FinanceApplicationFlow] Using document type:', documentType);
        }
        
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed for ${file.name}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('[FinanceApplicationFlow] Upload successful for:', file.name, result);
        return result;
      });
      
      const results = await Promise.all(uploadPromises);
      console.log('[FinanceApplicationFlow] All uploads completed, refreshing documents...');
      
      // Small delay to ensure database has processed the uploads
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh documents list
      await fetchDocuments();
      console.log('[FinanceApplicationFlow] Documents list refreshed');
      
      // Show success notification
      toast({
        title: 'Upload Successful',
        description: `Successfully uploaded ${files.length} document${files.length > 1 ? 's' : ''}`,
      });
      
    } catch (err) {
      console.error('[FinanceApplicationFlow] File upload error:', err);
      setError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setUploading(false);
      setUploadedFiles([]);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = useCallback(async (documentId: string, filePath: string | undefined | null) => {
    if (!session?.user || !supabase || !filePath) {
      setError('Cannot delete document');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/documents/delete/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      await fetchDocuments();
      
      toast({
        title: 'Document Deleted',
        description: 'Document has been successfully deleted.',
      });
      
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  }, [session, supabase, fetchDocuments]);

  // Navigation functions
  const goToStep = (step: ApplicationStepName) => {
    if (!APPLICATION_STEP_ORDER.includes(step)) {
      console.error(`Invalid step name: ${step}`);
      return;
    }
    
    setLoading(false);
    setError(null);
    setCurrentStep(step);
    
    const url = new URL(window.location.href);
    url.searchParams.set('step', step);
    window.history.replaceState({}, '', url.toString());
  };

  const goToStepByNumber = (stepNumber: number) => {
    const stepName = getStepName(stepNumber);
    if (stepName) {
      goToStep(stepName);
    }
  };

  // Navigation to onboarding flow
  const goToOnboardingStep = (stepNumber: number) => {
    const onboardingStepNames = ['signup', 'company-info', 'pre-analysis', 'funding-needs', 'document-upload', 'summary'];
    const stepName = onboardingStepNames[stepNumber - 1];
    if (stepName) {
      router.push(`/${locale}/onboarding?step=${stepName}`);
    }
  };

  // Form handlers
  const handleApplicationFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApplicationFormData(prev => ({
      ...prev,
      [name]: (name === 'amount' || name === 'term_months') && /^\d*\.?\d*$/.test(value) && value !== ''
              ? Number(value)
              : value
    }));
  };

  const handleTermSliderChange = (value: number[]) => {
    const term = value[0];
    setApplicationFormData(prev => ({
      ...prev,
      term_months: term
    }));
  };

  const handleFundingTypeChange = (value: string) => {
    setFundingType(value);
    if (value) {
      setError(null); 
    }
  };

  // Handle Step 7 form submission
  const handleSaveDraftApplication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!session?.user?.id) {
      setError('User authentication required. Please sign in again.');
      setLoading(false);
      return;
    }

    if (!fundingType) {
      setError('Please select a funding type before continuing.');
      setLoading(false);
      return;
    }

    if (!companyId) {
      setError('Company information is required.');
      setLoading(false);
      return;
    }

    try {
      const applicationData = {
        company_id: companyId,
        user_id: session.user.id,
        type: fundingType,
        amount: Number(applicationFormData.amount),
        term_months: (fundingType === 'business_loan' || fundingType === 'business_loan_unsecured' || fundingType === 'business_loan_secured') ? Number(applicationFormData.term_months) : null,
        status: 'draft',
        funding_recommendation_id: applicationFormData.funding_recommendation_id || null
      };

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
      const newApplicationId = result.applicationId;
      setApplicationId(newApplicationId);
      
      // Update URL with applicationId
      const url = new URL(window.location.href);
      url.searchParams.set('applicationId', newApplicationId);
      url.searchParams.set('step', ApplicationStepName.DOCUMENTS);
      window.history.replaceState({}, '', url.toString());
      
      // Navigate to next step
      setCurrentStep(ApplicationStepName.DOCUMENTS);
      setLoading(false);
      setError(null);

    } catch (error) {
      console.error('Error saving draft application:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Render compact step indicator for 2-step flow
  const renderStepIndicator = () => (
    <div className="fixed top-[60px] left-0 right-0 z-10 bg-black/90 backdrop-blur-sm py-4 px-4 border-b border-gold-primary/30 shadow-lg">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-3">
          <span className="text-sm text-gold-secondary/70 font-medium">
            {t('applicationFlow.title', { default: 'Funding Application' })}
          </span>
        </div>
        <nav className="flex items-center justify-center space-x-8" aria-label="Progress">
          {steps.map((step, index) => (
            <React.Fragment key={step.name}>
              <div className="relative flex flex-col items-center group">
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 cursor-pointer 
                    ${getStepIndex(currentStep) > index + 1
                      ? 'bg-gold-primary border-gold-primary text-black hover:bg-gold-secondary' // Completed
                      : currentStep === step.name
                        ? 'bg-transparent border-gold-primary text-gold-primary hover:bg-gold-primary/10' // Active
                        : 'bg-transparent border-gray-medium text-gray-medium hover:border-gray-light' // Pending
                    }
                  `}
                  onClick={() => goToStep(step.name)}
                  role="button"
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                  tabIndex={0}
                >
                  {getStepIndex(currentStep) > index + 1 ? (
                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span className="font-semibold text-sm">
                      {index + 1}
                    </span>
                  )}
                </div>
                <span 
                  className={`mt-2 text-sm font-medium text-center cursor-pointer transition-colors duration-300 group-hover:opacity-80 whitespace-nowrap ${
                    currentStep === step.name ? 'text-gold-primary' :
                    getStepIndex(currentStep) > index + 1 ? 'text-gold-primary' :
                    'text-gray-medium'
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
                <div className={`h-0.5 w-20 transition-colors duration-300 ${
                  getStepIndex(currentStep) > index + 1 ? 'bg-gold-primary' : 'bg-gray-dark'
                }`} />
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case ApplicationStepName.APPLICATION:
        return (
          <Step7Application
            loading={loading}
            error={error}
            applicationFormData={applicationFormData}
            handleApplicationFormChange={handleApplicationFormChange}
            handleTermSliderChange={handleTermSliderChange}
            onSubmit={handleSaveDraftApplication}
            goToStep={goToOnboardingStep} // Pass onboarding navigation
            companyId={companyId}
            userCompanies={userCompanies}
            handleCompanyChange={handleCompanyChange}
            isFetchingCompanies={isFetchingCompanies}
            fundingType={fundingType}
            handleFundingTypeChange={handleFundingTypeChange}
            appliedFundingTypes={appliedFundingTypes}
            documents={documents}
            documentTypes={documentTypes}
            fetchDocuments={fetchDocuments}
            handleFileUpload={handleFileUpload}
            uploading={uploading}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            setUploadedFiles={setUploadedFiles}
          />
        );
      case ApplicationStepName.DOCUMENTS:
        return (
          <Step8DocumentUpload
            loading={loading}
            error={error}
            applicationId={applicationId}
            companyId={companyId}
            setError={setError}
            setLoading={setLoading}
            documents={documents}
            documentTypes={documentTypes}
            fetchDocuments={fetchDocuments}
            handleFileUpload={handleFileUpload}
            uploading={uploading}
            refreshingDocuments={refreshingDocuments}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            setUploadedFiles={setUploadedFiles}
            handleDeleteDocument={handleDeleteDocument}
            currentLocale={locale as string}
            onContinue={() => goToStep(ApplicationStepName.KYC_UBO)}
            onBack={() => goToStep(ApplicationStepName.APPLICATION)}
          />
        );
      case ApplicationStepName.KYC_UBO:
        return (
          <Step9KycUbo
            loading={loading}
            error={error}
            applicantNationalId={kycUboFormData.applicantNationalId}
            setApplicantNationalId={(id) => setKycUboFormData(prev => ({...prev, applicantNationalId: id}))}
            ubos={kycUboFormData.ubos}
            setUbos={(newUbos) => setKycUboFormData(prev => ({...prev, ubos: newUbos}))}
            applicationId={applicationId}
            onBack={() => goToStep(ApplicationStepName.DOCUMENTS)}
            companyId={companyId}
            applicationFormData={applicationFormData}
            fundingFormData={fundingFormData}
            setError={setError}
            setLoading={setLoading}
            currentLocale={locale as string}
          />
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-213px)] bg-black text-gold-secondary flex flex-col">
      {renderStepIndicator()}

      <main className="flex-1 flex flex-col">
        <div className="flex-1 mt-[140px]"> {/* Adjusted margin for compact application flow indicator */}
          {renderCurrentStep()}
        </div>
      </main>
    </div>
  );
} 