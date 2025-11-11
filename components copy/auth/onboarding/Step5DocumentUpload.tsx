"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { 
  FileText, 
  FileUp, 
  Trash2, 
  CheckCircle, 
  AlertCircle as LucideAlertCircle,
  XCircle as LucideXCircle,
  Loader2,
  Mail as LucideMailIcon
} from 'lucide-react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  DocumentArrowUpIcon, 
  ArrowUpTrayIcon, 
  DocumentTextIcon, 
  EnvelopeIcon,
  ExclamationCircleIcon as HeroExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { CompanyRow } from '../OnboardingFlow';
import CompanySelector from '@/components/ui/CompanySelector';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { differenceInMonths } from 'date-fns';
import { useConfirm } from '@/hooks/useConfirm';

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

type FinancialData = {
  revenue?: number | null;
  operating_profit?: number | null;
  net_profit?: number | null;
  total_assets?: number | null;
  fixed_assets?: number | null;
  total_liabilities?: number | null;
  total_equity?: number | null;
  operational_cash_flow?: number | null;
  return_on_equity?: number | null;
  debt_to_equity_ratio?: number | null;
  current_ratio?: number | null;
  quick_ratio?: number | null;
  dso_days?: number | null;
  fixed_asset_turnover_ratio?: number | null;
  revenue_growth_rate_yoy?: number | null;
  fiscal_year?: number | null;
  fiscal_period?: string | null;
  [key: string]: any;
};

type EmailSendStatus = 'idle' | 'sending' | 'success' | 'error';

interface Step5DocumentUploadProps {
  documents: DocumentRow[];
  documentTypes: DocumentType[];
  financialDataArray: FinancialData[];
  isFetchingFinancials: boolean;
  uploading: boolean;
  loading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileUpload: (files: File[]) => Promise<void>;
  fetchDocuments: () => Promise<void>;
  handleAnalyzeAndContinue: (e: React.FormEvent) => Promise<void>;
  goToStep: (step: number) => void;
  supabase: any;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setUploadedFiles: (files: File[]) => void;
  companyId: string | null;
  userCompanies: CompanyRow[];
  handleCompanyChange: (companyId: string) => void;
  isFetchingCompanies: boolean;
  isGeneratingRecommendations: boolean;
  setIsGeneratingRecommendations: (isGenerating: boolean) => void;
  currentLocale: string;
  session: any | null;
  handleDeleteDocument: (documentId: string, filePath: string | undefined | null) => Promise<void>;
}

export const Step3DocumentUpload: React.FC<Step5DocumentUploadProps> = ({
  documents,
  documentTypes,
  financialDataArray,
  isFetchingFinancials,
  uploading,
  loading,
  isAnalyzing,
  error,
  isDragging,
  setIsDragging,
  handleFileSelect,
  handleFileUpload,
  fetchDocuments,
  handleAnalyzeAndContinue,
  goToStep,
  supabase,
  setError,
  setLoading,
  setUploadedFiles,
  companyId,
  userCompanies,
  handleCompanyChange,
  isFetchingCompanies,
  isGeneratingRecommendations,
  setIsGeneratingRecommendations,
  currentLocale,
  session,
  handleDeleteDocument,
}) => {
  const t = useTranslations('Onboarding');
  const { confirm, ConfirmComponent } = useConfirm();

  const [currentYearIndex, setCurrentYearIndex] = useState(0);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [bookkeeperEmail, setBookkeeperEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [emailSendStatus, setEmailSendStatus] = useState<EmailSendStatus>('idle');
  const [emailSendError, setEmailSendError] = useState<string | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [requiredDocsStatus, setRequiredDocsStatus] = useState<{
    lastYearFinancials: RequiredDocStatus;
    currentYearDraft: RequiredDocStatus;
    collateralDoc: RequiredDocStatus;
  }>({
    lastYearFinancials: 'loading',
    currentYearDraft: 'loading',
    collateralDoc: 'not_required',
  });
  const [isCheckingDocs, setIsCheckingDocs] = useState<boolean>(false);
  const [collateralRequired, setCollateralRequired] = useState<boolean>(false);

  useEffect(() => {
    let analysisTimeoutId: NodeJS.Timeout | null = null;
    
    if (isGeneratingRecommendations) {
      analysisTimeoutId = setTimeout(() => {
        console.log('Analysis timeout reached (120s) - stopping loader and redirecting to next step');
        setIsGeneratingRecommendations(false);
        goToStep(5);
      }, 120000);
    }
    
    return () => {
      if (analysisTimeoutId) {
        clearTimeout(analysisTimeoutId);
      }
    };
  }, [isGeneratingRecommendations, goToStep]);

  React.useEffect(() => {
    if (financialDataArray && financialDataArray.length > 0) {
      setCurrentYearIndex(0);
    }
  }, [financialDataArray]);

  useEffect(() => {
    const checkRequiredDocuments = async () => {
      // Estä tarpeeton suoritus jos tarvittavat tiedot puuttuvat
      if (!supabase || !documentTypes || documentTypes.length === 0) {
        console.log('[Step5DocUpload] Skipping checkRequiredDocuments - missing dependencies');
        return;
      }

              console.log('[Step5DocUpload] Running checkRequiredDocuments useEffect... Dependencies:', { companyId, hasSession: !!session, supabaseExists: !!supabase, docTypesLength: documentTypes?.length, tExists: !!t });
      setIsCheckingDocs(true);

      let currentCompanyId = companyId;

              if (!currentCompanyId && session?.user?.id) {
        console.log('[Step5DocUpload DEBUG] companyId prop is null. Attempting to fetch first company for user:', session.user.id);
        console.log('[Step5DocUpload DEBUG] Session state:', {
          hasUser: !!session?.user,
          userId: session?.user?.id,
          hasToken: !!session?.access_token,
          tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
        });
        
        try {
          if (!supabase) {
            throw new Error('Supabase client is not available');
          }

          // First check if session is valid by making a simple query
          try {
            console.log('[Step5DocUpload DEBUG] Testing supabase connection with simple query...');
            const { data: testData, error: testError } = await supabase
              .from('companies')
              .select('count')
              .limit(1);
            
            if (testError) {
              console.error('[Step5DocUpload DEBUG] Supabase connection test failed:', 
                testError.message || testError.code || JSON.stringify(testError));
              throw new Error(`Supabase connection test failed: ${testError.message || 'Unknown error'}`);
            } else {
              console.log('[Step5DocUpload DEBUG] Supabase connection test successful');
            }
          } catch (testErr) {
            console.error('[Step5DocUpload DEBUG] Supabase connection test exception:', testErr);
          }

          let retryCount = 0;
          const MAX_RETRIES = 2;
          let userCompaniesData = null;
          let userCompaniesError = null;

          while (retryCount <= MAX_RETRIES && !userCompaniesData) {
            try {
              console.log(`[Step5DocUpload DEBUG] Attempt ${retryCount + 1}/${MAX_RETRIES + 1} to fetch companies...`);
              
              // Use API route instead of direct Supabase query to avoid RLS issues
              const response = await fetch('/api/companies', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              let result;
              if (response.ok) {
                const apiResult = await response.json();
                const companies = apiResult.companies || [];
                result = {
                  data: companies.slice(0, 1), // Limit to 1 like the original query
                  error: null
                };
              } else {
                result = {
                  data: null,
                  error: { message: `API request failed: ${response.status}` }
                };
              }

              if (result.error) {
                userCompaniesError = result.error;
                console.error(`[Step5DocUpload DEBUG] Error fetching user companies (try ${retryCount}):`, 
                  userCompaniesError.message || userCompaniesError.code || JSON.stringify(userCompaniesError));
                
                // Try alternative relationship through profiles table
                console.log('[Step5DocUpload DEBUG] Trying alternative query through profiles table...');
                const profileResult = await supabase
                  .from('profiles')
                  .select('company_id, companies(id, name)')
                  .eq('id', session.user.id)
                  .not('company_id', 'is', null)
                  .limit(1);
                  
                if (profileResult.error) {
                  console.error('[Step5DocUpload DEBUG] Error in profiles fallback query:', profileResult.error);
                } else if (profileResult.data && profileResult.data.length > 0 && profileResult.data[0].company_id) {
                  // Convert to expected format
                  userCompaniesData = [{
                    id: profileResult.data[0].company_id,
                    name: profileResult.data[0].companies?.name || 'Unknown Company'
                  }];
                  console.log('[Step5DocUpload DEBUG] Successfully fetched company through profiles relationship:', userCompaniesData);
                }
              } else {
                userCompaniesData = result.data;
                console.log(`[Step5DocUpload DEBUG] Successfully fetched user companies (try ${retryCount}):`, userCompaniesData);
              }
            } catch (err) {
              userCompaniesError = err;
              console.error(`[Step5DocUpload DEBUG] Exception fetching user companies (try ${retryCount}):`, 
                err instanceof Error ? err.message : typeof err === 'object' ? JSON.stringify(err) : err);
            }

            retryCount++;

            if (!userCompaniesData && retryCount <= MAX_RETRIES) {
              console.log(`[Step5DocUpload DEBUG] Will retry in 1 second (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          // Try a fallback method if needed using a different approach
          if (!userCompaniesData && session?.access_token) {
            try {
              console.log('[Step5DocUpload DEBUG] Trying fallback method - fetching via API route');
              const response = await fetch(`/api/companies/list?userId=${session.user.id}`, {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                }
              });
              
              if (response.ok) {
                const result = await response.json();
                if (result.data && result.data.length > 0) {
                  userCompaniesData = result.data;
                  console.log('[Step5DocUpload DEBUG] Fallback fetched companies successfully:', userCompaniesData);
                } else {
                  console.log('[Step5DocUpload DEBUG] Fallback API returned no companies');
                }
              } else {
                console.error('[Step5DocUpload DEBUG] Fallback API failed:', response.status, await response.text());
              }
            } catch (fallbackErr) {
              console.error('[Step5DocUpload DEBUG] Fallback API exception:', fallbackErr);
            }
          }

          if (userCompaniesData && userCompaniesData.length > 0) {
            currentCompanyId = userCompaniesData[0].id;
            console.log(`[Step5DocUpload DEBUG] Found first company for user: ID = ${currentCompanyId}, Name = ${userCompaniesData[0].name}`);
          } else {
            console.log('[Step5DocUpload DEBUG] No companies found for user:', session.user.id);
            setRequiredDocsStatus({
              lastYearFinancials: 'missing',
              currentYearDraft: 'not_required',
              collateralDoc: 'not_required',
            });
            setIsCheckingDocs(false);
            return;
          }
        } catch (err) {
          console.error('[Step5DocUpload DEBUG] Top-level exception fetching user companies:', 
            err instanceof Error ? err.message : typeof err === 'object' ? JSON.stringify(err) : err);
          setRequiredDocsStatus({
            lastYearFinancials: 'missing',
            currentYearDraft: 'not_required',
            collateralDoc: 'not_required',
          });
          setIsCheckingDocs(false);
          return;
        }
      }

      console.log('[Step5DocUpload DEBUG] Effective companyId for document check:', currentCompanyId);
      console.log('[Step5DocUpload DEBUG] Received documentTypes prop:', JSON.stringify(documentTypes, null, 2));

      if (!currentCompanyId) {
        console.warn('[Step5DocUpload] companyId is still null after check/fetch. Aborting document fetch.');
        setRequiredDocsStatus({
          lastYearFinancials: 'missing',
          currentYearDraft: 'not_required',
          collateralDoc: 'not_required',
        });
        setIsCheckingDocs(false);
        return;
      }

      if (!documentTypes || documentTypes.length === 0) {
        console.warn('[Step5DocUpload] documentTypes array is empty. Aborting document check.');
        setRequiredDocsStatus({
            lastYearFinancials: 'loading',
            currentYearDraft: 'loading',
            collateralDoc: 'loading',
          });
        setIsCheckingDocs(false);
        return;
      }

      // Use the documents prop directly instead of fetching separately
      const docsToCheck = documents || [];
      console.log(`[Step5DocUpload DEBUG] Using documents prop for status check: ${docsToCheck.length} documents`);

      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      const yearBeforeLast = currentYear - 2;
      console.log(`[Step5DocUpload DEBUG] Current Year: ${currentYear}, Last Year: ${lastYear}, Year Before Last: ${yearBeforeLast}`);

      const financialStatementId = documentTypes.find(dt => dt.name === 'financial_statements')?.id;
      const incomeStatementId = documentTypes.find(dt => dt.name === 'income_statement')?.id;
      const balanceSheetId = documentTypes.find(dt => dt.name === 'balance_sheet')?.id;
      const draftIncomeStatementId = documentTypes.find(dt => dt.name === 'draft_income_statement')?.id;
      const draftBalanceSheetId = documentTypes.find(dt => dt.name === 'draft_balance_sheet')?.id;
      const collateralDocTypeId = documentTypes.find(dt => dt.name === 'collateral_document')?.id;
      const assetInfoDocTypeId = documentTypes.find(dt => dt.name === 'asset_information_document')?.id;
      console.log(`[Step5DocUpload DEBUG] Type IDs: financialStatement=${financialStatementId}, income=${incomeStatementId}, balance=${balanceSheetId}, draftIncome=${draftIncomeStatementId}, draftBalance=${draftBalanceSheetId}, collateral=${collateralDocTypeId}, assetInfo=${assetInfoDocTypeId}`);

      let statusLastYear: RequiredDocStatus = 'missing';
      let statusCurrentDraft: RequiredDocStatus = 'missing';
      let statusCollateral: RequiredDocStatus = 'not_required';
      let collateralIsActuallyRequired = false;
      setCollateralRequired(false);
      console.log(`[Step5DocUpload] Collateral check skipped in Step 5.`);

      let foundLastYearFinancialStatement = false;
      let foundLastYearIncomeStatement = false;
      let foundLastYearBalanceSheet = false;
      let foundCurrentDraftIncome = false;
      let foundCurrentDraftBalance = false;
      let foundCollateral = false;

      console.log(`[Step5DocUpload DEBUG] Checking ${docsToCheck.length} documents for status...`);
      docsToCheck.forEach(doc => {
        const docType = doc.document_type_id;
        const docYear = doc.fiscal_year;
        const docCreatedAt = new Date(doc.created_at);
        const monthsDiff = differenceInMonths(new Date(), docCreatedAt);
        console.log(`[Step5DocUpload DEBUG] - Doc: ${doc.name}, Year: ${docYear}, TypeID: ${docType}, Created: ${doc.created_at}`);

        // Check for financial statements from current year, last year, or year before last (more flexible)
        if (docYear === currentYear || docYear === lastYear || docYear === yearBeforeLast) {
          console.log(`[Step5DocUpload DEBUG]   -> Matches relevant year (${docYear}). Checking types...`);
                      if (docType === financialStatementId) {
                console.log(`[Step5DocUpload DEBUG]     -> Matched financialStatementId.`);
                foundLastYearFinancialStatement = true;
            }
            if (docType === incomeStatementId) {
                console.log(`[Step5DocUpload DEBUG]     -> Matched incomeStatementId.`);
                foundLastYearIncomeStatement = true;
            }
            if (docType === balanceSheetId) {
                console.log(`[Step5DocUpload DEBUG]     -> Matched balanceSheetId.`);
                foundLastYearBalanceSheet = true;
            }
        }

        // For current year drafts, keep the existing logic with recency check
        if (docYear === currentYear && monthsDiff < 2) {
          console.log(`[Step5DocUpload DEBUG]   -> Matches currentYear (${currentYear}) and is recent (${monthsDiff} months old). Checking draft types...`);
          if (docType === draftIncomeStatementId || docType === incomeStatementId) {
              console.log(`[Step5DocUpload DEBUG]     -> Matched relevant income type (Draft: ${draftIncomeStatementId}, Regular: ${incomeStatementId}). DocType: ${docType}`);
              foundCurrentDraftIncome = true;
          }
          if (docType === draftBalanceSheetId || docType === balanceSheetId) {
               console.log(`[Step5DocUpload DEBUG]     -> Matched relevant balance type (Draft: ${draftBalanceSheetId}, Regular: ${balanceSheetId}). DocType: ${docType}`);
              foundCurrentDraftBalance = true;
          }
        }
      });

      console.log(`[Step5DocUpload DEBUG] Final Flags: lastYearFinancial=${foundLastYearFinancialStatement}, lastYearIncome=${foundLastYearIncomeStatement}, lastYearBalance=${foundLastYearBalanceSheet}, draftIncome=${foundCurrentDraftIncome}, draftBalance=${foundCurrentDraftBalance}, collateral=${foundCollateral}`);

      // For Step 5, we need either:
      // 1. A complete financial statement (tilinpäätös), OR 
      // 2. Both income statement AND balance sheet, OR
      // 3. Just a balance sheet (tase) which often contains both income and balance info in Finnish financial statements
      if (foundLastYearFinancialStatement || (foundLastYearIncomeStatement && foundLastYearBalanceSheet) || foundLastYearBalanceSheet) {
        console.log(`[Step5DocUpload DEBUG] -> Setting statusLastYear to 'present' (found adequate financial documents)`);
        statusLastYear = 'present';
      } else {
          console.log(`[Step5DocUpload DEBUG] -> Keeping statusLastYear as 'missing'`);
      }

      // In Step 5, current year drafts are not required - only historical data
      statusCurrentDraft = 'not_required';
      console.log(`[Step5DocUpload DEBUG] -> Setting statusCurrentDraft to 'not_required' (Step 5 doesn't require current year)`);

      statusCollateral = 'not_required';
      console.log(`[Step5DocUpload DEBUG] -> Setting statusCollateral to 'not_required' (Step 5 default)`);

      console.log('[Step5DocUpload] Required Docs Status (Calculated):', {
          lastYearFinancials: statusLastYear,
          currentYearDraft: statusCurrentDraft,
          collateralDoc: statusCollateral,
      });

      setRequiredDocsStatus({
        lastYearFinancials: statusLastYear,
        currentYearDraft: statusCurrentDraft,
        collateralDoc: statusCollateral,
      });

      setIsCheckingDocs(false);
    };

    // Vain suorita jos kaikki tarvittavat dependencyt ovat saatavilla
    if (supabase && documentTypes && documentTypes.length > 0) {
      checkRequiredDocuments();
    }
  }, [companyId, session?.user?.id, supabase, documentTypes?.length, documents.length]);

  const areAllRequiredDocsPresent = useCallback(() => {
    if (isCheckingDocs) return false;
    return (
      requiredDocsStatus.lastYearFinancials === 'present' &&
      // Note: currentYearDraft not required in Step 5, only historical data needed
      (requiredDocsStatus.collateralDoc === 'present' || requiredDocsStatus.collateralDoc === 'not_required')
    );
  }, [isCheckingDocs, requiredDocsStatus]);

  const handlePreviousYear = () => {
    if (financialDataArray) {
      setCurrentYearIndex((prevIndex) => Math.min(financialDataArray.length - 1, prevIndex + 1));
    }
  };

  const handleNextYear = () => {
    if (financialDataArray) {
      setCurrentYearIndex((prevIndex) => Math.max(0, prevIndex - 1));
    }
  };

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

  const handleSendEmailRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSendStatus === 'sending' || !companyId) {
      if (!companyId) {
        console.error("Company ID is missing, cannot send request.");
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
      console.error("[Step5DocUpload] Error sending document request email via API:", error);
      setEmailSendError(error instanceof Error ? error.message : t('step3.errorSendingEmailRequest', { default: 'Failed to send email request.' }));
      setEmailSendStatus('error');
    }
  };

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
    setError(null);
    
    const files = Array.from(e.dataTransfer.files).filter(file =>
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)
    );

    if (files.length > 0) {
      console.log(`[Step5DocUpload] Dropped ${files.length} valid files:`, files.map(f => f.name).join(', '));
      setUploadedFiles(files);
      
      try {
        setLoading(true);
        await handleFileUpload(files);
        toast({
          title: t('step3.uploadSuccessTitle', { default: "Upload Successful" }),
          description: t('step3.uploadSuccessDesc', { default: `Uploaded ${files.length} document(s).` }),
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchDocuments();

      } catch (err) {
        console.error("[Step5DocUpload] Error handling dropped files:", err);
        setError(err instanceof Error ? err.message : "Failed to process dropped files");
      } finally {
         setLoading(false);
      }
    } else if (e.dataTransfer.files.length > 0) {
        console.warn("[Step5DocUpload] Dropped files contain unsupported types.");
        setError(t('step3.unsupportedFileTypeError', { default: 'One or more dropped files have unsupported types. Please upload PDF, DOC(X), or XLS(X).' }));
    } else {
        console.log("[Step5DocUpload] No files in drop event");
    }
  };

  const handleStep4FileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      console.log(`[Step5DocUpload] Selected ${files.length} files via input:`, files.map(f => f.name).join(', '));
      setUploadedFiles(files);

      try {
        setLoading(true);
        await handleFileUpload(files);
        toast({
          title: t('step3.uploadSuccessTitle', { default: "Upload Successful" }),
          description: t('step3.uploadSuccessDesc', { default: `Uploaded ${files.length} document(s).` }),
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchDocuments();

      } catch (err) {
        console.error("[Step5DocUpload] Error handling selected files:", err);
        setError(err instanceof Error ? err.message : "Failed to process selected files");
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    } else {
              console.log("[Step5DocUpload] No files selected in file input");
    }
  };

  const formatFileSize = (bytes: number | undefined | null) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAvailableDocumentTypes = () => {
    // Palautetaan VAIN uudet määritellyt dokumentin tyypit järjestyksessä
    // Käytetään käännöksiä suoraan eikä luoteta documentTypes propiin
    return [
      { 
        id: 'financial_statement', 
        name: 'financial_statement', 
        description: t('step5.documentType.financial_statement', { default: 'Tilinpäätös (viimeisin vahvistettu)' })
      },
      { 
        id: 'balance_income_interim', 
        name: 'balance_income_interim', 
        description: t('step5.documentType.balance_income_interim', { default: 'Tase/tulos (välitilinpäätös, maks. 2kk vanha)' })
      },
      { 
        id: 'leasing_document', 
        name: 'leasing_document', 
        description: t('step5.documentType.leasing_document', { default: 'Leasing-dokumentti (tarjous, ehdotus, lasku tms.)' })
      },
      { 
        id: 'collateral_document', 
        name: 'collateral_document', 
        description: t('step5.documentType.collateral_document', { default: 'Vakuusasiakirja (kiinteistöarvio, koneluettelo tms.)' })
      },
      { 
        id: 'other', 
        name: 'other', 
        description: t('step5.documentType.other', { default: 'Muu dokumentti' })
      }
    ];
  };

  const renderFinancialSummary = () => {
     if (isFetchingFinancials) {
         return (
           <div className="mt-8 p-4 bg-gray-very-dark rounded-lg border border-gray-dark flex items-center justify-center">
                           <Loader2 className="h-6 w-6 text-white mr-2 animate-spin" />
             <p className="text-sm text-gray-light">{t('step3.loadingFinancials', { default: 'Loading Financials...' })}</p>
           </div>
         );
     }
      
     if (!financialDataArray || financialDataArray.length === 0) {
       return (
         <div className="mt-8 p-4 bg-gray-very-dark rounded-lg border border-gray-dark">
           <p className="text-center text-sm text-gray-light">{t('step3.noFinancialsYet', { default: 'Financial summary will appear here after analysis.' })}</p>
         </div>
       );
     }

     const currentFinancialData = financialDataArray[currentYearIndex];

     if (!currentFinancialData) {
        return (
          <div className="mt-8 p-4 bg-gray-very-dark rounded-lg border border-gray-dark">
            <p className="text-center text-sm text-red-400">{t('step3.errorDisplayingYear', { default: 'Error displaying financial data for the selected year.' })}</p>
          </div>
        );
     }
     
     const formatCurrency = (value: number | null | undefined): string => {
       const numericValue = (typeof value === 'number' && isFinite(value)) ? value : 0;
       return new Intl.NumberFormat('fi-FI', { 
         style: 'currency', 
         currency: 'EUR', 
         maximumFractionDigits: 0
       }).format(numericValue);
     };
     
     const summaryYear = currentFinancialData.fiscal_year ?? 'N/A';
     const summaryPeriod = currentFinancialData.fiscal_period || 'annual';
     const summaryTitleBase = t('step3.financialSummary', { default: 'Financial Summary' });

     return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePreviousYear}
            disabled={currentYearIndex === financialDataArray.length - 1}
            className="p-2 rounded-md text-gold-primary hover:bg-gold-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t('step3.previousYearAria', { default: 'Previous financial year' })}
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
          <h3 className="text-lg font-semibold text-gold-primary text-center">
            {summaryTitleBase} - {summaryYear} ({summaryPeriod})
          </h3>
          <button
            onClick={handleNextYear}
            disabled={currentYearIndex === 0}
            className="p-2 rounded-md text-gold-primary hover:bg-gold-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t('step3.nextYearAria', { default: 'Next financial year' })}
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-dark rounded-lg border border-gray-medium/30">
            <p className="text-xs text-gray-light">{t('step3.revenue', { default: 'Revenue' })}</p>
            <p className="text-base font-medium text-gold-primary">
               {formatCurrency(currentFinancialData.revenue)}
            </p>
          </div>
          
          <div className="p-3 bg-gray-dark rounded-lg border border-gray-medium/30">
            <p className="text-xs text-gray-light">{t('step3.operatingProfit', { default: 'Operating Profit (EBIT)' })}</p>
            <p className="text-base font-medium text-gold-primary">
               {formatCurrency(currentFinancialData.operating_profit)}
            </p>
          </div>

          <div className="p-3 bg-gray-dark rounded-lg border border-gray-medium/30">
            <p className="text-xs text-gray-light">{t('step3.operationalCashFlow', { default: 'Operational Cash Flow' })}</p>
            <p className="text-base font-medium text-gold-primary">
               {formatCurrency(currentFinancialData.operational_cash_flow)}
            </p>
          </div>
          
          <div className="p-3 bg-gray-dark rounded-lg border border-gray-medium/30">
            <p className="text-xs text-gray-light">{t('step3.totalAssets', { default: 'Total Assets' })}</p>
            <p className="text-base font-medium text-gold-primary">
               {formatCurrency(currentFinancialData.total_assets)}
            </p>
          </div>

          <div className="p-3 bg-gray-dark rounded-lg border border-gray-medium/30">
            <p className="text-xs text-gray-light">{t('step3.totalLiabilities', { default: 'Total Liabilities' })}</p>
            <p className="text-base font-medium text-gold-primary">
               {formatCurrency(currentFinancialData.total_liabilities)}
            </p>
          </div>

          <div className="p-3 bg-gray-dark rounded-lg border border-gray-medium/30">
            <p className="text-xs text-gray-light">{t('step3.totalEquity', { default: 'Total Equity' })}</p>
            <p className="text-base font-medium text-gold-primary">
               {formatCurrency(currentFinancialData.total_equity)}
            </p>
          </div>
        </div>
      </div>
     );
  };

  const renderRequiredDocsSection = () => {
    const allDocsPresent = areAllRequiredDocsPresent();

    const getStatusIcon = (status: RequiredDocStatus) => {
      switch (status) {
        case 'present': return <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0" />;
        case 'missing': return <XCircleIcon className="h-6 w-6 text-red-400 flex-shrink-0" />;
        case 'loading': return <Loader2 className="h-6 w-6 text-amber-400 animate-spin flex-shrink-0" />;
        default: return null;
      }
    };

    const getStatusTextClass = (status: RequiredDocStatus) => {
      switch (status) {
        case 'present': return "text-green-400 font-semibold";
        case 'missing': return "text-red-400 font-semibold";
        case 'loading': return "text-amber-400 font-medium";
        default: return "text-gray-400";
      }
    };

    const getStatusBgClass = (status: RequiredDocStatus) => {
      switch (status) {
        case 'present': return "bg-green-500/10 border-green-500/30";
        case 'missing': return "bg-red-500/10 border-red-500/30";
        case 'loading': return "bg-amber-500/10 border-amber-500/30";
        default: return "bg-gray-500/10 border-gray-500/30";
      }
    };

    const getStatusText = (status: RequiredDocStatus) => {
      switch (status) {
        case 'present': return t('step8.docStatusPresent', { default: 'Löydetty' });
        case 'missing': return t('step8.docStatusMissing', { default: 'Puuttuu' });
        case 'loading': return t('step8.docStatusLoading', { default: 'Tarkistetaan...' });
        case 'not_required': return t('step8.docStatusNotRequired', { default: 'Ei pakollinen' });
        default: return '';
      }
    };

    return (
      <div id="required-docs-section" className="space-y-6 p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/60 border border-gray-700 rounded-xl mb-8 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <DocumentTextIcon className="h-8 w-8 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">
            {t('step8.requiredDocsTitle', { default: 'Vaaditut asiakirjat' })}
          </h3>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          {t('step8.requiredDocsDesc', { default: 'Seuraavat asiakirjat vaaditaan hakemuksen käsittelyä varten:' })}
        </p>

        <div className="space-y-3">
          <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStatusBgClass(requiredDocsStatus.lastYearFinancials)} hover:shadow-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(requiredDocsStatus.lastYearFinancials)}
                <div>
                  <span className="text-sm font-medium text-white">{t('step8.reqDocLastYear', { default: 'Tilinpäätös (viimeisin vahvistettu)' })}</span>
                  <p className="text-xs text-gray-400 mt-1">Edellisvuoden virallinen tilinpäätös</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm px-3 py-1 rounded-full ${getStatusTextClass(requiredDocsStatus.lastYearFinancials)} ${getStatusBgClass(requiredDocsStatus.lastYearFinancials)}`}>
                  {getStatusText(requiredDocsStatus.lastYearFinancials)}
                </span>
                {requiredDocsStatus.lastYearFinancials === 'missing' && (
                  <span className="text-xs text-red-300 mt-1 animate-pulse">⚠️ Pakollinen</span>
                )}
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStatusBgClass(requiredDocsStatus.currentYearDraft)} hover:shadow-lg opacity-75`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {requiredDocsStatus.currentYearDraft === 'not_required' ? (
                  <InformationCircleIcon className="h-6 w-6 text-blue-400 flex-shrink-0" />
                ) : (
                  getStatusIcon(requiredDocsStatus.currentYearDraft)
                )}
                <div>
                  <span className="text-sm font-medium text-gray-300">{t('step8.reqDocCurrentDraft', { default: 'Välitilinpäätös (alle 2kk vanha)' })}</span>
                  <p className="text-xs text-gray-500 mt-1">Kuluvan vuoden välitilinpäätös (valinnainen)</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm px-3 py-1 rounded-full text-blue-400 bg-blue-500/10 border border-blue-500/30">
                  {t('step8.docStatusNotRequired', { default: 'Valinnainen' })}
                </span>
              </div>
            </div>
          </div>

          {collateralRequired && (
             <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStatusBgClass(requiredDocsStatus.collateralDoc)} hover:shadow-lg`}>
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   {getStatusIcon(requiredDocsStatus.collateralDoc)}
                   <div>
                     <span className="text-sm font-medium text-white">{t('step8.reqDocCollateral', { default: 'Vakuusasiakirja' })}</span>
                     <p className="text-xs text-gray-400 mt-1">Vakuuden arvon määrittämiseksi</p>
                   </div>
                 </div>
                 <div className="flex flex-col items-end">
                   <span className={`text-sm px-3 py-1 rounded-full ${getStatusTextClass(requiredDocsStatus.collateralDoc)} ${getStatusBgClass(requiredDocsStatus.collateralDoc)}`}>
                     {getStatusText(requiredDocsStatus.collateralDoc)}
                   </span>
                   {requiredDocsStatus.collateralDoc === 'missing' && (
                     <span className="text-xs text-red-300 mt-1 animate-pulse">⚠️ Pakollinen</span>
                   )}
                 </div>
               </div>
             </div>
          )}
        </div>

        {!areAllRequiredDocsPresent() && (
          <div className="mt-4 p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/40 rounded-lg">
            <div className="flex items-center space-x-2">
              <HeroExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300 font-medium">
                Lataa puuttuvat pakolliset asiakirjat jatkaaksesi analyysiä
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-gray-600 pt-6">
          {/* Document Type Selection */}
          <div className="mb-4">
            <Label htmlFor="document-type-select" className="text-sm font-medium mb-2 text-blue-300 flex items-center space-x-2">
              <FileUp className="h-4 w-4" />
              <span>{t('step5.selectDocumentType', { default: 'Dokumentin tyyppi (valinnainen)' })}</span>
            </Label>
            <select
              id="document-type-select"
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="" className="bg-gray-800 text-white">{t('step5.autoDetectType', { default: 'Tunnista automaattisesti' })}</option>
              {getAvailableDocumentTypes().map((docType) => (
                <option key={docType.id} value={docType.name} className="bg-gray-800 text-white">
                  {docType.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2 flex items-center space-x-1">
              <InformationCircleIcon className="h-3 w-3" />
              <span>{t('step5.documentTypeHint', { default: 'Automaattinen tunnistus toimii hyvin useimmissa tapauksissa' })}</span>
            </p>
          </div>

          <label
            htmlFor="step4-file-upload"
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-400 bg-blue-500/10 scale-105 shadow-lg' 
                  : 'border-gray-600 bg-gray-800/50 hover:border-blue-500 hover:bg-blue-500/5'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="mx-auto h-12 w-12 text-blue-400 animate-spin" />
                  <p className="text-sm text-blue-300 font-medium">Ladataan asiakirjoja...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <DocumentArrowUpIcon className="mx-auto h-16 w-16 text-blue-400" />
                    {isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 border-4 border-blue-400 border-dashed rounded-full animate-ping"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white mb-2">
                      {isDragging ? 'Pudota tiedostot tähän' : 'Lataa puuttuvat asiakirjat'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {t('step3.supportedFormats', { default: 'Tuetut tiedostotyypit: PDF, DOC, DOCX, XLS, XLSX' })}
                    </p>
                  </div>
                </div>
              )}

              <input
                id="step4-file-upload"
                name="files"
                type="file"
                multiple
                className="hidden"
                onChange={handleStep4FileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                disabled={uploading || loading}
              />

             {!uploading && (
               <div className="mt-6">
                 <div className="inline-flex items-center px-6 py-3 text-sm border border-blue-500 shadow-sm font-medium rounded-lg text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition-colors">
                   <FileUp className="mr-2 h-4 w-4" />
                   {t('step3.selectFiles', { default: 'Valitse tiedostot' })}
                  </div>
               </div>
             )}
            </label>
                </div>

        <div className="mt-8 pt-6 border-t border-gray-600">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-base font-medium text-purple-300 mb-3 flex items-center space-x-2">
                <LucideMailIcon className="h-5 w-5" />
                <span>{t('step3.cantFindDocsTitle', { default: 'Tarvitsetko apua asiakirjojen hankkimisessa?' })}</span>
              </h3>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                {t('step3.cantFindDocsDesc', { default: "Etkö löydä tarvittavia asiakirjoja? Pyydä kirjanpitäjääsi lähettämään ne suoraan meille turvallisen linkin kautta." })}
              </p>
              <Button
                type="button"
                onClick={openRequestModal}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900"
              >
                <LucideMailIcon className="mr-2 h-4 w-4" />
                {t('step3.sendRequestButton', { default: 'Lähetä asiakirjapyyntö' })}
              </Button>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full text-foreground max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-md mb-6">
        <CompanySelector
           companies={userCompanies}
           selectedCompanyId={companyId}
           onCompanyChange={handleCompanyChange}
           isLoading={isFetchingCompanies}
           label={t('step3.selectCompanyLabel', { default: 'Selected Company' })}
        />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          {t('step3.title', { default: 'Upload Financial Documents' })}
        </h2>
      </div>
      
      <p className="text-gray-light text-lg mb-6">
        Lataa viimeisin vahvistettu tilinpäätös analysoitavaksi. Tarvitsemme sen analyysiä varten. Voit myös pyytää asiakirjan toimitusta ASIAKIRJAPYYNNÖLLÄ. (<a href="#" onClick={(e) => { e.preventDefault(); openRequestModal(); }} className="text-gold-primary hover:text-gold-highlight underline">lähetä asiakirjapyyntöön</a>)
      </p>
      
      <div className="bg-gray-very-dark rounded-xl shadow-sm overflow-hidden border border-gray-dark max-w-2xl mx-auto">
        <div className="p-8">
          {renderRequiredDocsSection()}
          
          {error && (
            <div 
              className="mt-6 p-4 bg-red-900/30 text-red-400 rounded-md border border-red-500/50"
              dangerouslySetInnerHTML={{ __html: error }}
            />
          )}

          {documents.length > 0 && (
            <div className="mt-8">
              <h4 className="text-base font-medium text-foreground mb-3">{t('step3.uploadedDocuments', { default: 'Uploaded Documents' })}</h4>
              <ul className="mt-3 divide-y divide-gray-dark max-h-60 overflow-y-auto border border-gray-dark/50 rounded-md bg-gray-very-dark p-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="py-2 flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2 mr-2 overflow-hidden min-w-0">
                      {doc.processing_status === 'failed' ? (
                        <LucideXCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      ) : doc.processing_status === 'processing' || doc.processing_status === 'pending' ? (
                        <Loader2 className="w-5 h-5 text-gold-primary animate-spin flex-shrink-0" />
                      ) : doc.processing_status === 'completed' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-gold-primary flex-shrink-0" />
                      )}
                      <div className="overflow-hidden min-w-0">
                        <span className="text-sm text-gray-light truncate block" title={doc.name}>{doc.name}</span>
                        <p className="text-xs text-gray-medium">
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
                      disabled={uploading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-gray-dark text-center">
            {documents.some(doc => doc.processing_status === 'pending' || doc.processing_status === 'processing') && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                <p className="text-sm text-yellow-300">
                  Odota että asiakirjat on käsitelty ennen analyysin aloittamista.
                </p>
              </div>
            )}
            {documents.length === 0 && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-300">
                  <strong>Lataa vähintään yksi asiakirja</strong> ennen analyysin aloittamista. Voit ladata tilinpäätöksen, tuloslaskelman tai taseen.
                </p>
              </div>
            )}
            {documents.length > 0 && !areAllRequiredDocsPresent() && documents.every(doc => doc.processing_status !== 'pending' && doc.processing_status !== 'processing') && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-300">
                  Lataa vaaditut asiakirjat ennen analyysin aloittamista.
                </p>
              </div>
            )}
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await handleAnalyzeAndContinue(e);
                // handleAnalyzeAndContinue already handles navigation to step 5
              } catch (error) {
                console.error("Error during analysis:", error);
                // Handle error if needed
              }
            }} className="w-full">
              <Button
                type="submit"
                disabled={
                  isAnalyzing || 
                  uploading || 
                  documents.length === 0 || 
                  isGeneratingRecommendations ||
                  !areAllRequiredDocsPresent() ||
                  documents.some(doc => doc.processing_status === 'pending' || doc.processing_status === 'processing')
                } 
                className="w-full max-w-md mx-auto px-5 py-3 bg-gold-primary text-black rounded-lg font-medium text-base hover:bg-gold-highlight disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center disabled:bg-gold-primary disabled:text-black"
              >
                {isGeneratingRecommendations ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                     {t('step3.generatingRecommendationsLoaderShort', { default: 'Generating...' })} 
                   </>
                ) : isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                    {t('step3.analysisInProgress', { default: 'Analysis in progress...' })}
                  </>
                ) : (
                  'Analysoi & Jatka'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

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
                  <LucideXCircle className="h-6 w-6" />
                </button>
             </div>

             <form onSubmit={handleSendEmailRequest} className="space-y-4">
                <div>
                  <Label htmlFor="bookkeeper-email" className="block text-sm font-medium text-gold-secondary mb-1">
                    {t('step3.requestModalEmailLabel', { default: 'Bookkeeper\'s Email Address' })}
                  </Label>
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
                  <Label htmlFor="personal-message" className="block text-sm font-medium text-gold-secondary mb-1">
                    {t('step3.requestModalMessageLabel', { default: 'Personal Message (Optional)' })}
                  </Label>
                  <textarea
                    id="personal-message"
                    rows={4}
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-gray-dark rounded-md text-gray-light focus:outline-none focus:ring-1 focus:ring-gold-primary focus:border-gold-primary"
                    placeholder={t('step3.requestModalMessagePlaceholder', { default: 'e.g., Hi [Bookkeeper Name], could you please upload the latest financial statements using the link in this email? Thanks!' })}
                  ></textarea>
                </div>

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
                {emailSendStatus === 'error' && emailSendError && !companyId && (
                   <div className="flex items-center text-sm text-red-400">
                     <LucideAlertCircle className="mr-2 h-4 w-4" />
                     {t('step3.errorMissingCompanyId', { default: 'Cannot send request without a selected company.' })}
                   </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    type="button"
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
                       <EnvelopeIcon className="mr-2 h-4 w-4" /> 
                     )}
                    {t('step3.requestModalSendButton', { default: 'Send Request' })}
                  </Button>
                </div>
             </form>
           </div>
         </div>
       )}

      <ConfirmComponent />
    </div>
  );
};

export default Step3DocumentUpload; 