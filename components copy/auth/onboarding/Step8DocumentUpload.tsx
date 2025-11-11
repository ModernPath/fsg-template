"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { differenceInMonths } from 'date-fns';
import { Loader2, AlertCircle as LucideAlertCircle, Mail as LucideMailIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Types
type DocumentType = {
  id: string;
  name: string;
  description: string;
  required_for_analysis?: boolean;
};

type DocumentRow = {
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
  [key: string]: any;
};

type RequiredDocStatus = 'loading' | 'present' | 'missing' | 'not_required';

type EmailSendStatus = 'idle' | 'sending' | 'success' | 'error';

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

interface Step8DocumentUploadProps {
  loading: boolean;
  error: string | null;
  applicationId: string | null;
  companyId: string | null;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  documents: DocumentRow[];
  documentTypes: DocumentType[];
  fetchDocuments: () => Promise<void>;
  handleFileUpload: (files: File[], documentType?: string) => Promise<void>;
  uploading: boolean;
  refreshingDocuments?: boolean;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  setUploadedFiles: (files: File[]) => void;
  handleDeleteDocument: (documentId: string, filePath: string | undefined | null) => Promise<void>;
  currentLocale: string;
  onContinue: () => void;
  onBack: () => void;
}

export const Step8DocumentUpload: React.FC<Step8DocumentUploadProps> = ({
  loading: parentLoading,
  error: parentError,
  applicationId,
  companyId,
  setError: setParentError,
  setLoading: setParentLoading,
  documents,
  documentTypes,
  fetchDocuments,
  handleFileUpload,
  uploading,
  refreshingDocuments = false,
  isDragging,
  setIsDragging,
  setUploadedFiles,
  handleDeleteDocument,
  currentLocale,
  onContinue,
  onBack,
}) => {
  const t = useTranslations('Onboarding');
  const { session } = useAuth();
  const supabase = createClient();

  // State for fetched application data
  const [fetchedApplicationData, setFetchedApplicationData] = useState<FetchedApplicationData | null>(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // State for Required Document Checks
  const [requiredDocsStatus, setRequiredDocsStatus] = useState<{
    lastYearFinancials: RequiredDocStatus;
    currentYearDraft: RequiredDocStatus;
    collateralDoc: RequiredDocStatus;
  }>({
    lastYearFinancials: 'loading',
    currentYearDraft: 'loading',
    collateralDoc: 'loading',
  });
  const [isCheckingDocs, setIsCheckingDocs] = useState<boolean>(true);
  const [collateralRequired, setCollateralRequired] = useState<boolean>(false);

  // State for Bookkeeper Email Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [bookkeeperEmail, setBookkeeperEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [emailSendStatus, setEmailSendStatus] = useState<EmailSendStatus>('idle');
  const [emailSendError, setEmailSendError] = useState<string | null>(null);

  // State for manual document type selection
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');

  // Refs to prevent repeated fetches
  const completedDocIdsRef = useRef<Set<string>>(new Set());

  // Fetch application data
  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!applicationId || !session?.access_token) {
        setFetchedApplicationData(null);
        return;
      }

      console.log(`[Step8DocumentUpload] Fetching summary & financing_needs data for applicationId: ${applicationId}`);
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
          console.error('[Step8DocumentUpload] Error fetching summary/needs data:', error);
          throw new Error(t('step8.error.fetchSummaryFailed', { default: 'Failed to load application summary.' }));
        }

        if (data) {
          console.log('[Step8DocumentUpload] Summary & financing_needs data fetched:', data);
          const mappedData = {
            ...data,
            financing_needs: data.financing_needs && !Array.isArray(data.financing_needs)
                               ? data.financing_needs
                               : null
          };
          setFetchedApplicationData(mappedData as FetchedApplicationData);
        } else {
          console.warn(`[Step8DocumentUpload] Application not found for ID: ${applicationId}`);
          setFetchedApplicationData(null);
          throw new Error(t('step8.error.applicationNotFound', { default: 'Application data not found.' }));
        }

      } catch (err: any) {
        console.error('[Step8DocumentUpload] Catch block fetching summary/needs data:', err);
        setSummaryError(err.message || t('error.generic'));
        setFetchedApplicationData(null);
      } finally {
        setIsFetchingSummary(false);
      }
    };

    fetchSummaryData();
  }, [applicationId, supabase, session?.access_token, t]);

  // Check Required Documents
  useEffect(() => {
    console.log('[Step8DocumentUpload] Checking required documents using props...');
    setIsCheckingDocs(true);
    setParentError(null);

    console.log('[Step8DocumentUpload DEBUG] Using documents prop:', documents.length);
    console.log('[Step8DocumentUpload DEBUG] Using documentTypes prop:', documentTypes.length);
    console.log('[Step8DocumentUpload DEBUG] DocumentTypes available:', documentTypes.map(dt => dt.name));
    console.log('[Step8DocumentUpload DEBUG] FetchedApplicationData type:', fetchedApplicationData?.type);

    if (!documentTypes || documentTypes.length === 0) {
      console.warn('[Step8DocumentUpload] documentTypes array is empty. Setting isCheckingDocs to false.');
      setRequiredDocsStatus({
          lastYearFinancials: 'not_required',
          currentYearDraft: 'not_required',
          collateralDoc: 'not_required',
        });
      setIsCheckingDocs(false);
      return;
    }

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const yearBeforeLast = currentYear - 2;
    console.log(`[Step8DocumentUpload DEBUG] Current Year: ${currentYear}, Last Year: ${lastYear}, Year Before Last: ${yearBeforeLast}`);

    // Find document type IDs
    const financialStatementId = documentTypes.find(dt => dt.name === 'financial_statements')?.id;
    const incomeStatementId = documentTypes.find(dt => dt.name === 'income_statement')?.id;
    const balanceSheetId = documentTypes.find(dt => dt.name === 'balance_sheet')?.id;
    const draftIncomeStatementId = documentTypes.find(dt => dt.name === 'draft_income_statement')?.id;
    const draftBalanceSheetId = documentTypes.find(dt => dt.name === 'draft_balance_sheet')?.id;
    const collateralDocTypeId = documentTypes.find(dt => dt.name === 'collateral_document')?.id;
    const assetInfoDocTypeId = documentTypes.find(dt => dt.name === 'asset_information_document')?.id;

    console.log(`[Step8DocumentUpload] Type IDs: financialStatement=${financialStatementId}, income=${incomeStatementId}, balance=${balanceSheetId}, draftIncome=${draftIncomeStatementId}, draftBalance=${draftBalanceSheetId}, collateral=${collateralDocTypeId}, assetInfo=${assetInfoDocTypeId}`);

    let statusLastYear: RequiredDocStatus = 'missing';
    let statusCurrentDraft: RequiredDocStatus = 'missing';  
    let statusCollateral: RequiredDocStatus = 'not_required';
    let collateralIsActuallyRequired = false;

    // Check if collateral/asset documents are required based on funding type
    if (fetchedApplicationData?.type === 'business_loan_secured') {
      statusCollateral = 'missing';
      collateralIsActuallyRequired = true;
      setCollateralRequired(true);
    } else if (fetchedApplicationData?.type === 'leasing') {
      statusCollateral = 'missing';
      collateralIsActuallyRequired = true;
      setCollateralRequired(true);
    } else {
      setCollateralRequired(false);
    }

    // Check documents
    let foundLastYearFinancialStatement = false;
    let foundLastYearIncomeStatement = false;
    let foundLastYearBalanceSheet = false;
    let foundCurrentDraftIncome = false;
    let foundCurrentDraftBalance = false;
    let foundCollateral = false;

    documents.forEach(doc => {
      const docType = doc.document_type_id;
      const docYear = doc.fiscal_year;
      const docCreatedAt = new Date(doc.created_at);
      const monthsDiff = differenceInMonths(new Date(), docCreatedAt);
      console.log(`[Step8DocumentUpload DEBUG] - Doc: ${doc.name}, Year: ${docYear}, TypeID: ${docType}, Created: ${doc.created_at}`);
      
      // Check for financial statements from current year, last year, or year before last (more flexible)
      if (docYear === currentYear || docYear === lastYear || docYear === yearBeforeLast) {
        console.log(`[Step8DocumentUpload DEBUG]   -> Matches relevant year (${docYear}). Checking types...`);
        if (docType === financialStatementId) {
            console.log(`[Step8DocumentUpload DEBUG]     -> Matched financialStatementId.`);
            foundLastYearFinancialStatement = true;
        }
        if (docType === incomeStatementId) {
            console.log(`[Step8DocumentUpload DEBUG]     -> Matched incomeStatementId.`);
            foundLastYearIncomeStatement = true;
        }
        if (docType === balanceSheetId) {
            console.log(`[Step8DocumentUpload DEBUG]     -> Matched balanceSheetId.`);
            foundLastYearBalanceSheet = true;
        }
      }
      
      // For current year drafts, keep the existing logic with recency check
      if (docYear === currentYear && monthsDiff < 2) {
        console.log(`[Step8DocumentUpload DEBUG]   -> Matches currentYear (${currentYear}) and is recent (${monthsDiff} months old). Checking draft types...`);
        if (docType === draftIncomeStatementId || docType === incomeStatementId) {
            console.log(`[Step8DocumentUpload DEBUG]     -> Matched relevant income type (Draft: ${draftIncomeStatementId}, Regular: ${incomeStatementId}). DocType: ${docType}`);
            foundCurrentDraftIncome = true;
        }
        if (docType === draftBalanceSheetId || docType === balanceSheetId) {
             console.log(`[Step8DocumentUpload DEBUG]     -> Matched relevant balance type (Draft: ${draftBalanceSheetId}, Regular: ${balanceSheetId}). DocType: ${docType}`);
            foundCurrentDraftBalance = true;
        }
      }
      
      // Check for required asset/collateral documents based on funding type
      if (collateralIsActuallyRequired) {
        if (fetchedApplicationData?.type === 'business_loan_secured') {
          // For secured loans, check for collateral documents
          if (docType === collateralDocTypeId || docType === assetInfoDocTypeId) {
            console.log(`[Step8DocumentUpload DEBUG]     -> Found collateral document for secured loan`);
            foundCollateral = true;
          }
        } else if (fetchedApplicationData?.type === 'leasing') {
          // For leasing, check for leasing documents specifically
          const leasingDocTypeId = documentTypes.find(dt => dt.name === 'leasing_document')?.id;
          if (docType === leasingDocTypeId || docType === assetInfoDocTypeId) {
            console.log(`[Step8DocumentUpload DEBUG]     -> Found leasing document for leasing application`);
            foundCollateral = true;
          }
        }
      }
    });

    console.log(`[Step8DocumentUpload DEBUG] Final Flags: lastYearFinancial=${foundLastYearFinancialStatement}, lastYearIncome=${foundLastYearIncomeStatement}, lastYearBalance=${foundLastYearBalanceSheet}, draftIncome=${foundCurrentDraftIncome}, draftBalance=${foundCurrentDraftBalance}, collateral=${foundCollateral}`);

    // Set final statuses
    if (foundLastYearFinancialStatement || (foundLastYearIncomeStatement && foundLastYearBalanceSheet)) {
      console.log(`[Step8DocumentUpload DEBUG] -> Setting statusLastYear to 'present'`);
      statusLastYear = 'present';
    } else {
        console.log(`[Step8DocumentUpload DEBUG] -> Keeping statusLastYear as 'missing'`);
        statusLastYear = 'missing';
    }

    if (foundCurrentDraftIncome || foundCurrentDraftBalance) {
      console.log(`[Step8DocumentUpload DEBUG] -> Setting statusCurrentDraft to 'present' (found income OR balance document for current year)`);
      statusCurrentDraft = 'present';
    } else {
      console.log(`[Step8DocumentUpload DEBUG] No current year draft documents found. Setting as 'missing' for Step 8.`);
      statusCurrentDraft = 'missing';
    }
    
    if (collateralIsActuallyRequired) {
      statusCollateral = foundCollateral ? 'present' : 'missing';
    }

    console.log('[Step8DocumentUpload] Final status:', { statusLastYear, statusCurrentDraft, statusCollateral });

    setRequiredDocsStatus({
      lastYearFinancials: statusLastYear,
      currentYearDraft: statusCurrentDraft,
      collateralDoc: statusCollateral,
    });
    
    console.log('[Step8DocumentUpload] Document checking complete - setting isCheckingDocs to false');
    setIsCheckingDocs(false);

  }, [documents, documentTypes, fetchedApplicationData?.type, setParentError]);

  // Helper function to check if all required docs are present
  const areAllRequiredDocsPresent = useCallback(() => {
    if (isCheckingDocs) return false;
    const lastYearOk = requiredDocsStatus.lastYearFinancials === 'present';
    const currentYearOk = requiredDocsStatus.currentYearDraft === 'present' || requiredDocsStatus.currentYearDraft === 'not_required';
    const collateralOk = requiredDocsStatus.collateralDoc === 'present' || requiredDocsStatus.collateralDoc === 'not_required';
    return lastYearOk && currentYearOk && collateralOk;
  }, [isCheckingDocs, requiredDocsStatus]);

  // Auto-scroll to upload area if docs are missing - DISABLED: Documents are now optional, not required
  // useEffect(() => {
  //   if (!isCheckingDocs && !areAllRequiredDocsPresent()) {
  //     const timer = setTimeout(() => {
  //       const uploadArea = document.getElementById('upload-area-step8');
  //       if (uploadArea) {
  //         uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //       }
  //     }, 500);
  //     return () => clearTimeout(timer);
  //   }
  // }, [isCheckingDocs, areAllRequiredDocsPresent]);

  // Helper function for file size formatting
  const formatFileSize = (bytes: number | undefined | null) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get available document types for manual selection
  const getAvailableDocumentTypes = () => {
    return [
      { 
        id: 'financial_statements', 
        name: 'financial_statements', 
        description: t('step8.documentType.financial_statements', { default: 'Tilinpäätös (viimeisin vahvistettu)' })
      },
      { 
        id: 'balance_income_interim', 
        name: 'balance_income_interim', 
        description: t('step8.documentType.balance_income_interim', { default: 'Tase/tulos (välitilinpäätös, maks. 2kk vanha)' })
      },
      { 
        id: 'leasing_document', 
        name: 'leasing_document', 
        description: t('step8.documentType.leasing_document', { default: 'Leasing-dokumentti (tarjous, ehdotus, lasku tms.)' })
      },
      { 
        id: 'collateral_document', 
        name: 'collateral_document', 
        description: t('step8.documentType.collateral_document', { default: 'Vakuusasiakirja (kiinteistöarvio, koneluettelo tms.)' })
      },
      { 
        id: 'other', 
        name: 'other', 
        description: t('step8.documentType.other', { default: 'Muu dokumentti' })
      }
    ];
  };

  // Enhanced file upload function with manual document type
  const handleFileUploadWithType = async (files: File[]) => {
    if (handleFileUpload && files.length > 0) {
      try {
        const documentTypeToPass = selectedDocumentType || undefined;
        console.log(`[Step8DocumentUpload] Uploading with document type: ${documentTypeToPass || 'auto-detect'}`);
        await handleFileUpload(files, documentTypeToPass);
        
        setSelectedDocumentType('');
      } catch (error) {
        console.error('File upload error:', error);
      }
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    } else if (!e.relatedTarget) {
       setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setParentError(null);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)
    );

    if (files.length > 0) {
      console.log(`[Step8DocumentUpload] Dropped ${files.length} valid files:`, files.map(f => f.name).join(', '));
      setUploadedFiles(files);

      try {
        setParentLoading(true);
        await handleFileUploadWithType(files);
        toast({
          title: t('step3.uploadSuccessTitle', { default: "Upload Successful" }),
          description: t('step3.uploadSuccessDesc', { default: `Uploaded ${files.length} document(s).` }),
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        fetchDocuments();
      } catch (err) {
        console.error("[Step8DocumentUpload] Error handling dropped files:", err);
        setParentError(err instanceof Error ? err.message : "Failed to process dropped files");
      } finally {
         setParentLoading(false);
      }
    } else if (e.dataTransfer.files.length > 0) {
        console.warn("[Step8DocumentUpload] Dropped files contain unsupported types.");
        setParentError(t('step3.unsupportedFileTypeError', { default: 'One or more dropped files have unsupported types. Please upload PDF, DOC(X), or XLS(X).' }));
    } else {
        console.log("[Step8DocumentUpload] No files in drop event");
    }
  };

  // File Input Change Handler
  const handleStep8FileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setParentError(null);
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      console.log(`[Step8DocumentUpload] Selected ${files.length} files:`, files.map(f => f.name).join(', '));
      setUploadedFiles(files);

      try {
        setParentLoading(true);
        await handleFileUploadWithType(files);
        toast({
          title: t('step3.uploadSuccessTitle', { default: "Upload Successful" }),
          description: t('step3.uploadSuccessDesc', { default: `Uploaded ${files.length} document(s).` }),
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        fetchDocuments();
      } catch (err) {
        console.error("[Step8DocumentUpload] Error handling selected files:", err);
        setParentError(err instanceof Error ? err.message : "Failed to process selected files");
      } finally {
        setParentLoading(false);
        e.target.value = '';
      }
    } else {
      console.log("[Step8DocumentUpload] No files selected in file input");
    }
  };

  // Modal Control Functions
  const openRequestModal = () => {
    setBookkeeperEmail('');
    setPersonalMessage('');
    setEmailSendStatus('idle');
    setEmailSendError(null);
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
  };

  // Function to handle email request submission
  const handleSendEmailRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSendStatus === 'sending' || !companyId) {
      if (!companyId) {
        console.error("[Step8DocumentUpload] Company ID is missing, cannot send request.");
        setEmailSendError(t('step3.errorMissingCompanyId', { default: 'Cannot send request without a selected company.' }));
        setEmailSendStatus('error');
      }
      return;
    }

    setEmailSendStatus('sending');
    setEmailSendError(null);

    try {
      if (!session?.access_token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch('/api/send-document-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookkeeperEmail,
          personalMessage,
          companyId,
          locale: currentLocale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error(errorData.error || t('step3.errorUnauthorized', { default: 'Authentication error. Please sign in again.' }));
        } else if (response.status === 403) {
          throw new Error(errorData.error || t('step3.errorForbidden', { default: 'You do not have permission to access this company.' }));
        } else {
          throw new Error(errorData.error || `${t('step3.errorHttpStatus', { default: 'Error:' })} ${response.status}`);
        }
      }

      setEmailSendStatus('success');
      setTimeout(() => {
        closeRequestModal();
      }, 2500);

    } catch (error) {
      console.error("[Step8DocumentUpload] Error sending document request email via API:", error);
      setEmailSendError(error instanceof Error ? error.message : t('step3.errorSendingEmailRequest', { default: 'Failed to send email request.' }));
      setEmailSendStatus('error');
    }
  };

  // Render Required Documents Status and Upload
  const renderRequiredDocsSection = () => {
    const fundingType = fetchedApplicationData?.type;
    
    const getStatusIcon = (status: RequiredDocStatus) => {
      switch (status) {
        case 'present': return <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />;
        case 'missing': return <InformationCircleIcon className="h-6 w-6 text-yellow-500 flex-shrink-0" />;
        case 'loading': return <Loader2 className="h-6 w-6 text-gold-primary animate-spin flex-shrink-0" />;
        case 'not_required': return <InformationCircleIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />;
        default: return null;
      }
    };

    const getStatusTextClass = (status: RequiredDocStatus) => {
      switch (status) {
        case 'present': return "text-green-400";
        case 'missing': return "text-yellow-400";
        case 'loading': return "text-gold-secondary";
        case 'not_required': return "text-gray-light";
        default: return "text-gray-light";
      }
    };

    const getStatusText = (status: RequiredDocStatus, type: string) => {
      switch (status) {
        case 'present': return t('step8.docStatusPresent', { default: 'Liitetty' });
        case 'missing': return t('step8.docStatusRecommended', { default: 'Suositellaan' });
        case 'loading': return t('step8.docStatusLoading', { default: 'Tarkistetaan...' });
        case 'not_required': return t('step8.docStatusNotRequired', { default: 'Ei vaadita' });
        default: return '';
      }
    };

    return (
      <div id="required-docs-section" className="space-y-6 p-6 bg-gray-very-dark/50 border border-gray-dark rounded-lg">
        <h3 className="text-xl font-semibold text-gold-primary">
          {t('step8.recommendedDocsTitle', { default: 'Suositellut asiakirjat' })}
        </h3>
        <p className="text-sm text-gray-light">
          {t('step8.recommendedDocsDesc', { default: 'Näiden asiakirjojen lataaminen nopeuttaa hakemuksesi käsittelyä ja voi parantaa rahoitusehtoja.' })}
        </p>

        <ul className="space-y-4">
          {/* Last Year Financials */}
          <li className="flex items-center space-x-3">
            {getStatusIcon(requiredDocsStatus.lastYearFinancials)}
            <span className="text-sm text-gold-secondary flex-1">{t('step8.reqDocLastYear', { default: 'Financial Statements (Last Fiscal Year)' })}</span>
            <span className={`text-sm font-medium ${getStatusTextClass(requiredDocsStatus.lastYearFinancials)}`}>
              {getStatusText(requiredDocsStatus.lastYearFinancials, 'lastYear')}
            </span>
          </li>
          {/* Current Year Draft */}
          <li className="flex items-center space-x-3">
            {getStatusIcon(requiredDocsStatus.currentYearDraft)}
            <span className="text-sm text-gold-secondary flex-1">{t('step8.reqDocCurrentDraft', { default: 'Draft Financials (Current Year, < 2 months old)' })}</span>
            <span className={`text-sm font-medium ${getStatusTextClass(requiredDocsStatus.currentYearDraft)}`}>
              {getStatusText(requiredDocsStatus.currentYearDraft, 'currentDraft')}
            </span>
          </li>
          {/* Collateral Document (Conditional) */}
          {collateralRequired && (
             <li className="flex items-center space-x-3">
               {getStatusIcon(requiredDocsStatus.collateralDoc)}
               <span className="text-sm text-gold-secondary flex-1">
                 {fundingType === 'business_loan_secured' && t('step8.reqDocCollateralSecured', { default: 'Vakuudokumentti (kiinteistöarvio, koneluettelo tms.)' })}
                 {fundingType === 'leasing' && t('step8.reqDocCollateralLeasing', { default: 'Omaisuustietodokumentti' })}
                 {fundingType !== 'business_loan_secured' && fundingType !== 'leasing' && t('step8.reqDocCollateral', { default: 'Vakuudokumentti' })}
               </span>
               <span className={`text-sm font-medium ${getStatusTextClass(requiredDocsStatus.collateralDoc)}`}>
                 {getStatusText(requiredDocsStatus.collateralDoc, 'collateral')}
               </span>
             </li>
          )}
        </ul>

        {/* Upload Area - with prominent highlighting if docs are missing */}
        <div 
          id="upload-area-step8" 
          className={`mt-6 border-t pt-6 ${
            !areAllRequiredDocsPresent() && !isCheckingDocs 
              ? 'border-yellow-500/50 bg-yellow-900/10 p-4 rounded-lg' 
              : 'border-gray-dark'
          }`}
        >
            {/* Recommendation banner if docs are missing */}
            {!areAllRequiredDocsPresent() && !isCheckingDocs && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <InformationCircleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-400">
                      {t('step8.recommendDocsTitle', { default: 'Suosittelemme asiakirjojen lataamista' })}
                    </p>
                    <p className="text-xs text-yellow-300 mt-1">
                      {t('step8.recommendDocsDesc', { default: 'Asiakirjojen lataaminen nopeuttaa käsittelyä ja parantaa rahoitusehtoja. Voit myös jatkaa ilman niitä.' })}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Manual Document Type Selection */}
            <div className="mb-4">
              <Label htmlFor="document-type-select" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step8.selectDocumentType', { default: 'Dokumentin tyyppi (valinnainen)' })}
              </Label>
              <select
                id="document-type-select"
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-gold-primary focus:border-transparent [&>option]:bg-gray-800 [&>option]:text-white"
              >
                <option value="">{t('step8.autoDetectType', { default: 'Tunnista automaattisesti' })}</option>
                {getAvailableDocumentTypes().map((docType) => (
                  <option key={docType.id} value={docType.name}>
                    {docType.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-medium mt-1">
                {t('step8.documentTypeHint', { default: 'Automaattinen tunnistus toimii hyvin useimmissa tapauksissa' })}
              </p>
            </div>

            <label
              htmlFor="step8-file-upload"
              className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-gold-primary bg-gray-800'
                  : !areAllRequiredDocsPresent() && !isCheckingDocs
                  ? 'border-yellow-500 hover:border-yellow-400 bg-gray-900 ring-2 ring-yellow-500/20'
                  : 'border-gray-600 hover:border-gold-primary/50 bg-gray-900'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploading ? (
                <Loader2 className="mx-auto h-10 w-10 text-gold-primary animate-spin" />
              ) : (
                <DocumentArrowUpIcon className={`mx-auto h-10 w-10 ${
                  !areAllRequiredDocsPresent() && !isCheckingDocs ? 'text-yellow-400' : 'text-gold-primary/80'
                }`} />
              )}
              <p className="mt-2 text-sm font-semibold text-gray-light">
                {t('step8.uploadMissingPrompt', { default: 'Raahaa tiedostot tähän tai klikkaa valitaksesi' })}
              </p>
              <p className="text-xs text-gray-medium mt-1">{t('step3.supportedFormats', { default: 'Tuetut muodot: PDF, DOC, DOCX, XLS, XLSX' })}</p>

              <input
                id="step8-file-upload"
                name="files"
                type="file"
                multiple
                className="hidden"
                onChange={handleStep8FileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                disabled={uploading || parentLoading}
              />

             {!uploading && (
               <div className={`mt-4 inline-flex items-center px-4 py-2 text-sm border shadow-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary/50 focus:ring-offset-gray-900 transition-all ${
                 !areAllRequiredDocsPresent() && !isCheckingDocs
                   ? 'border-yellow-500 text-yellow-300 bg-yellow-900/30 hover:bg-yellow-900/50'
                   : 'border-gray-600 text-gold-secondary bg-gray-800 hover:bg-gray-700'
               }`}>
                 {t('step3.selectFiles', { default: 'Tai valitse tiedostot' })}
               </div>
             )}
            </label>
          </div>

        {/* Show uploaded documents if any */}
        {documents.length > 0 && (
          <div className="mt-6 border-t border-gray-dark pt-6">
            <h4 className="text-base font-semibold text-gold-primary mb-3">{t('step3.uploadedDocuments', { default: 'Valitut tiedostot' })}</h4>
            <ul className="mt-3 divide-y divide-gray-600 max-h-60 overflow-y-auto border border-gray-600/50 rounded-md bg-gray-very-dark p-2">
              {documents.map((doc) => (
                <li key={doc.id} className="py-3 flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-3 mr-2 overflow-hidden min-w-0">
                    {doc.processing_status === 'failed' ? (
                      <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : doc.processing_status === 'processing' || doc.processing_status === 'pending' ? (
                      <Loader2 className="w-5 h-5 text-gold-primary animate-spin flex-shrink-0" />
                    ) : doc.processing_status === 'completed' ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <DocumentTextIcon className="w-5 h-5 text-gold-primary flex-shrink-0" />
                    )}
                    <div className="overflow-hidden min-w-0">
                      <span className="text-sm text-gold-secondary font-medium truncate block" title={doc.name}>{doc.name}</span>
                      <p className="text-xs text-gray-light">
                        {doc.processing_status === 'failed' ? t('step3.statusFailed', { default: 'Processing Failed' })
                         : doc.processing_status === 'processing' ? t('step3.statusProcessing', { default: 'Processing...' })
                         : doc.processing_status === 'completed' ? t('step3.statusCompleted', { default: 'Completed' })
                        : doc.processing_status === 'pending' ? t('step3.statusPending', { default: 'Pending Upload' })
                        : doc.processing_status
                        }
                        {doc.file_size ? ` - ${formatFileSize(doc.file_size)}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed p-1`}
                    onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                    disabled={uploading || parentLoading}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bookkeeper Email Request Section */}
        <div className="mt-8 pt-6 border-t border-gray-dark">
            <h3 className="text-base font-medium text-gold-primary mb-3">
              {t('step3.cantFindDocsTitle', { default: 'Need Help Getting Documents?' })}
            </h3>
            <p className="text-sm text-gray-light mb-4">
              {t('step3.cantFindDocsDesc', { default: "Can't find the required documents? Ask your bookkeeper to send them directly to us via a secure link." })}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={openRequestModal}
              className="inline-flex items-center px-4 py-2 border-gray-600 text-sm font-medium rounded-md shadow-sm text-gold-secondary bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary/50 focus:ring-offset-gray-900"
            >
              <LucideMailIcon className="mr-2 h-4 w-4" />
              {t('step3.sendRequestButton', { default: 'Send Document Request' })}
            </Button>
          </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-gold-secondary">
      <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-center text-gold-primary">
        {t('step8.title', { default: 'Required Documents' })}
      </h2>
      <p className="text-lg text-center text-gray-light mb-10">
        {t('step8.description', { default: 'Upload the required documents for your funding application.' })}
      </p>

      {/* Data Handling Disclaimer */}
      <div className="onboarding-info-card mb-8">
        <InformationCircleIcon className="onboarding-info-icon" />
        <div>
          <h3 className="onboarding-info-title">
            {t('step8.note', { default: 'Note:' })}
          </h3>
          <p className="onboarding-info-text">
            {t('step8.dataHandlingDisclaimer', { default: 'All uploaded documents are processed securely and used only for funding analysis.' })}
          </p>
        </div>
      </div>

      {/* Required Docs Section */}
      {renderRequiredDocsSection()}

      {/* Error Display */}
      {parentError && (
        <div className="onboarding-error mt-6"
             dangerouslySetInnerHTML={{ __html: parentError }} />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-dark mt-8">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="onboarding-btn-secondary"
          disabled={parentLoading || uploading}
        >
          {t('back', { default: 'Back' })}
        </Button>
        
        <div className="flex flex-col items-end gap-2">
          {!areAllRequiredDocsPresent() && !isCheckingDocs && (
            <p className="text-xs text-yellow-400">
              {t('step8.optionalDocsHint', { default: 'Voit jatkaa ilman asiakirjoja, mutta suosittelemme niiden lataamista' })}
            </p>
          )}
          <Button
            type="button"
            onClick={onContinue}
            disabled={parentLoading || uploading}
            className="onboarding-btn-primary"
          >
            {t('continue', { default: 'Continue to Verification' })}
          </Button>
        </div>
      </div>

      {/* Bookkeeper Email Request Modal */}
      {isRequestModalOpen && (
         <div 
             className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
             onClick={closeRequestModal}
         >
           <div 
             className="bg-gray-very-dark rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-dark" 
             onClick={(e) => e.stopPropagation()}
           >
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gold-primary">
                  {t('step3.requestModalTitle', { default: 'Request Documents via Email' })}
                </h3>
                <button onClick={closeRequestModal} className="text-gray-light hover:text-gold-primary">
                  <XCircleIcon className="h-6 w-6" />
                </button>
             </div>

             <form onSubmit={handleSendEmailRequest} className="space-y-4">
                <div>
                  <label htmlFor="bookkeeper-email" className="block text-sm font-medium text-gold-secondary mb-1">
                    {t('step3.requestModalEmailLabel', { default: "Bookkeeper's Email Address" })}
                  </label>
                  <Input
                    type="email"
                    id="bookkeeper-email"
                    value={bookkeeperEmail}
                    onChange={(e) => setBookkeeperEmail(e.target.value)}
                    required
                    className="w-full"
                    placeholder={t('step3.requestModalEmailPlaceholder', { default: 'bookkeeper@example.com' })}
                  />
                </div>
                <div>
                  <label htmlFor="personal-message" className="block text-sm font-medium text-gold-secondary mb-1">
                    {t('step3.requestModalMessageLabel', { default: 'Personal Message (Optional)' })}
                  </label>
                  <textarea
                    id="personal-message"
                    rows={4}
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gold-primary focus:border-gold-primary"
                    placeholder={t('step3.requestModalMessagePlaceholder', { default: 'e.g., Hi [Bookkeeper Name], could you please upload the latest financial statements using the link in this email? Thanks!' })}
                  ></textarea>
                </div>

                {/* Status Messages */}
                {emailSendStatus === 'sending' && (
                  <div className="flex items-center text-sm text-gold-secondary">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('step3.requestModalSending', { default: 'Sending email...' })}
                  </div>
                )}
                {emailSendStatus === 'success' && (
                  <div className="flex items-center text-sm text-green-400">
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                    {t('step3.requestModalSuccess', { default: 'Email request sent successfully!' })}
                  </div>
                )}
                {emailSendStatus === 'error' && emailSendError && (
                  <div className="flex items-center text-sm text-red-400">
                    <LucideAlertCircle className="mr-2 h-4 w-4" />
                    {emailSendError}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={closeRequestModal}
                    className="mr-3"
                    disabled={emailSendStatus === 'sending'}
                  >
                    {t('step3.requestModalCancel', { default: 'Cancel' })}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={emailSendStatus === 'sending' || !bookkeeperEmail || !companyId} 
                  >
                     {emailSendStatus === 'sending' ? (
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                       <LucideMailIcon className="mr-2 h-4 w-4" />
                     )}
                    {t('step3.requestModalSendButton', { default: 'Send Request' })}
                  </Button>
                </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default Step8DocumentUpload;
