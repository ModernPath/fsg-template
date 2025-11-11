'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon, DocumentArrowUpIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ApplicationFormData } from '../OnboardingFlow';
import { CompanyRow } from '../OnboardingFlow';
import CompanySelector from '@/components/ui/CompanySelector';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';

// Define supported funding types
const FUNDING_TYPES = [
  { value: 'business_loan_unsecured', labelKey: 'recommendationType.business_loan_unsecured' },
  { value: 'business_loan_secured', labelKey: 'recommendationType.business_loan_secured' },
  { value: 'credit_line', labelKey: 'recommendationType.credit_line' },
  { value: 'factoring_ar', labelKey: 'recommendationType.factoring_ar' },
  { value: 'leasing', labelKey: 'recommendationType.leasing' },
];

// Extended interface to include new application-specific questions
interface ExtendedApplicationFormData extends ApplicationFormData {
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
}

// Document types for collateral
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

type DocumentType = {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
};

interface Step7ApplicationProps {
  applicationFormData: ApplicationFormData;
  fundingType: string;
  handleFundingTypeChange: (value: string) => void;
  handleApplicationFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTermSliderChange: (value: number[]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToStep: (step: number) => void;
  loading: boolean;
  error: string | null;
  companyId: string | null;
  userCompanies: CompanyRow[];
  handleCompanyChange: (companyId: string) => void;
  isFetchingCompanies: boolean;
  appliedFundingTypes?: string[];
  // Document management props
  documents?: DocumentRow[];
  documentTypes?: DocumentType[];
  fetchDocuments?: () => Promise<void>;
  handleFileUpload?: (files: File[]) => Promise<void>;
  uploading?: boolean;
  isDragging?: boolean;
  setIsDragging?: (isDragging: boolean) => void;
  setUploadedFiles?: (files: File[]) => void;
}

const inputClasses = "w-full px-5 py-3 text-lg text-gold-primary bg-gray-very-dark border border-gray-dark rounded-lg focus:ring-gold-primary/20 focus:border-gold-primary focus:bg-black transition-colors placeholder-gray-medium";
const amountInputClasses = "w-full px-5 py-6 text-2xl text-gold-primary bg-gray-very-dark border-2 border-gold-primary/50 rounded-lg focus:ring-4 focus:ring-gold-primary/20 focus:border-gold-highlight focus:bg-black transition-all placeholder-gray-medium font-medium shadow-lg shadow-gold-primary/10 hover:shadow-gold-primary/20";

const Step7Application: React.FC<Step7ApplicationProps> = ({
  applicationFormData,
  fundingType,
  handleFundingTypeChange,
  handleApplicationFormChange,
  handleTermSliderChange,
  onSubmit,
  goToStep,
  loading,
  error,
  companyId,
  userCompanies,
  handleCompanyChange,
  appliedFundingTypes = [],
  isFetchingCompanies,
  // Document management props
  documents = [],
  documentTypes = [],
  fetchDocuments,
  handleFileUpload,
  uploading = false,
  isDragging = false,
  setIsDragging,
  setUploadedFiles,
}) => {
  const t = useTranslations('Onboarding');
  const { toast } = useToast();
  const supabase = createClient();

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 [Step7] Component initialized with props:', {
      companyId,
      applicationFormData,
      fundingType,
      hasSupabase: !!supabase
    });
  }, [companyId, applicationFormData, fundingType, supabase]);

  // Extended state to handle application-specific questions
  const [extendedFormData, setExtendedFormData] = React.useState<ExtendedApplicationFormData>({
    ...applicationFormData,
  });

  // Add state for funding recommendations
  const [fundingRecommendations, setFundingRecommendations] = React.useState<any[]>([]);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = React.useState(false);
  const [recommendationAmountRange, setRecommendationAmountRange] = React.useState<{
    min: number;
    max: number;
    currency: string;
  } | null>(null);

  // Function to fetch funding recommendations
  const fetchFundingRecommendations = React.useCallback(async () => {
    if (!companyId || !supabase) {
      console.log('🔍 [Step7] Cannot fetch - missing companyId or supabase:', { companyId, supabase: !!supabase });
      return;
    }
    
    setIsFetchingRecommendations(true);
    
    try {
      console.log(`🔍 [Step7] Fetching recommendations for company ${companyId}`);
      
      const { data: recommendations, error } = await supabase
        .from('funding_recommendations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [Step7] Error fetching recommendations:', error);
        return;
      }
      
      console.log(`🔍 [Step7] Raw recommendations data:`, recommendations);
      
      if (recommendations && recommendations.length > 0) {
        console.log(`✅ [Step7] Found ${recommendations.length} recommendations`);
        console.log(`🔍 [Step7] Recommendation details:`, recommendations[0].recommendation_details);
        setFundingRecommendations(recommendations);
        
        // Calculate amount range from recommendations
        const amountRange = calculateAmountRange(recommendations);
        console.log(`🔍 [Step7] Calculated amount range:`, amountRange);
        setRecommendationAmountRange(amountRange);
      } else {
        console.log('ℹ️ [Step7] No recommendations found');
        setFundingRecommendations([]);
        setRecommendationAmountRange(null);
      }
    } catch (err) {
      console.error('❌ [Step7] Unexpected error in fetchFundingRecommendations:', err);
    } finally {
      setIsFetchingRecommendations(false);
    }
  }, [companyId, supabase]);

  // Function to calculate amount range from recommendations
  const calculateAmountRange = (recommendations: any[]) => {
    if (!recommendations || recommendations.length === 0) {
      console.log('🔍 [Step7] No recommendations to calculate range from');
      return null;
    }

    const amounts: number[] = [];
    
    // Extract amounts from various fields in the recommendation data
    recommendations.forEach((rec, index) => {
      console.log(`🔍 [Step7] Processing recommendation ${index + 1}:`, rec);
      
      // Check action_plan field for amount mentions
      if (rec.action_plan) {
        const actionPlanAmounts = extractAmountsFromText(rec.action_plan);
        amounts.push(...actionPlanAmounts);
      }
      
      // Check analysis field for amount mentions
      if (rec.analysis) {
        const analysisAmounts = extractAmountsFromText(rec.analysis);
        amounts.push(...analysisAmounts);
      }
      
      // Check recommendation details for amount mentions
      if (rec.recommendation_details && Array.isArray(rec.recommendation_details)) {
        rec.recommendation_details.forEach((detail: any) => {
          if (detail.details) {
            const detailAmounts = extractAmountsFromText(detail.details);
            amounts.push(...detailAmounts);
          }
        });
      }
      
      // Legacy support: check for amount_suggestion field
      if (rec.amount_suggestion) {
        if (typeof rec.amount_suggestion === 'object' && rec.amount_suggestion.min && rec.amount_suggestion.max) {
          amounts.push(rec.amount_suggestion.min, rec.amount_suggestion.max);
        } else if (typeof rec.amount_suggestion === 'number') {
          amounts.push(rec.amount_suggestion);
        }
      }
    });

    console.log(`🔍 [Step7] Extracted amounts: [${amounts.join(', ')}]`);

    if (amounts.length === 0) {
      console.log('🔍 [Step7] No amounts found in recommendation data');
      return null;
    }

    // Round amounts to full thousands
    const roundedAmounts = amounts.map(amount => roundToThousands(amount));
    console.log(`🔍 [Step7] Rounded amounts: [${roundedAmounts.join(', ')}]`);

    // Calculate min and max from rounded amounts
    const min = Math.min(...roundedAmounts);
    const max = Math.max(...roundedAmounts);
    
    // If min and max are the same, create a reasonable range
    if (min === max) {
      const range = {
        min: Math.max(1000, min - 5000), // 5K lower, but at least 1000
        max: min + 5000 // 5K higher
      };
      console.log(`🔍 [Step7] Single amount detected, created range: ${range.min} - ${range.max}`);
      return range;
    }

    const range = { min, max };
    console.log(`🔍 [Step7] Amount range calculated: ${range.min} - ${range.max}`);
    return range;
  };

  // Helper function to round amounts to full thousands
  const roundToThousands = (amount: number): number => {
    if (amount < 1000) {
      return 1000; // Minimum 1K
    } else if (amount < 10000) {
      // Round to nearest 1000 (1K, 2K, 3K, etc.)
      return Math.round(amount / 1000) * 1000;
    } else if (amount < 100000) {
      // Round to nearest 5000 (5K, 10K, 15K, etc.)
      return Math.round(amount / 5000) * 5000;
    } else {
      // Round to nearest 10000 (10K, 20K, 30K, etc.)
      return Math.round(amount / 10000) * 10000;
    }
  };

  // Helper function to extract amounts from text
  const extractAmountsFromText = (text: string): number[] => {
    const amounts: number[] = [];
    
    // Regex patterns to match various amount formats
    const patterns = [
      // "50 000 euron", "50,000 EUR", "50.000 €"
      /(\d+(?:[\s,.]?\d{3})*)\s*(?:euron?|EUR|€)/gi,
      // "50 000", "50,000", "50.000" (when not followed by other units)
      /(\d+(?:[\s,.]?\d{3})*)\s*(?=\s|$|[^\d\w])/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extract just the number part
          const numberPart = match.replace(/[^\d\s,.]/g, '');
          // Convert to number (handle space, comma, dot separators)
          const cleanNumber = numberPart.replace(/[\s,.](?=\d{3})/g, '').replace(/[,.](?=\d{1,2}$)/, '.');
          const amount = parseFloat(cleanNumber);
          
          // Only include reasonable amounts (1K to 10M EUR)
          if (amount >= 1000 && amount <= 10000000) {
            amounts.push(amount);
          }
        });
      }
    });
    
    return amounts;
  };

  // Function to format currency
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fetch recommendations when component mounts or company changes
  React.useEffect(() => {
    if (companyId) {
      fetchFundingRecommendations();
    }
  }, [companyId, fetchFundingRecommendations]);

  // Update parent form data when basic fields change
  React.useEffect(() => {
    setExtendedFormData(prev => ({
      ...prev,
      ...applicationFormData
    }));
  }, [applicationFormData]);

  // Ensure term_months exists for business loans only (not credit lines)
  React.useEffect(() => {
    if (fundingType.includes('business_loan') && 
        (!applicationFormData.term_months || Number(applicationFormData.term_months) <= 0)) {
      const syntheticEvent = {
        target: {
          name: 'term_months',
          value: '12'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleApplicationFormChange(syntheticEvent);
    }
  }, [fundingType, applicationFormData.term_months]);
  
  // --- NEW: Add useEffect to sync formattedAmount with prop changes ---
  React.useEffect(() => {
    setFormattedAmount(formatAmountWithCurrency(applicationFormData.amount));
  }, [applicationFormData.amount]);

  const sliderValue = typeof applicationFormData.term_months === 'number' ? 
    applicationFormData.term_months : 
    (applicationFormData.term_months ? Number(applicationFormData.term_months) : 12);

  // State for validation and formatting
  const [amountError, setAmountError] = React.useState<string | null>(null);
  const [formattedAmount, setFormattedAmount] = React.useState<string>(() => {
    return applicationFormData.amount ? formatAmountWithCurrency(applicationFormData.amount) : '';
  });
  const [validationComplete, setValidationComplete] = React.useState<boolean>(() => {
    return Boolean(fundingType && applicationFormData.amount);
  });
  
  // Get collateral documents for secured loans
  const collateralDocuments = React.useMemo(() => {
    if (!documents || !documentTypes) return [];
    const collateralDocType = documentTypes.find(dt => dt.name === 'collateral_document');
    if (!collateralDocType) return [];
    
    return documents.filter(doc => doc.document_type_id === collateralDocType.id);
  }, [documents, documentTypes]);

  function formatAmountWithCurrency(value: string | number): string {
    if (!value && value !== 0) return '';
    
    const numericValue = typeof value === 'string' 
      ? value.replace(/[^\d]/g, '')
      : String(value);
    
    const parts = [];
    for (let i = numericValue.length; i > 0; i -= 3) {
      parts.unshift(numericValue.slice(Math.max(0, i - 3), i));
    }
    
    return parts.join(' ');
  }
  
  // Handle extended form data changes
  const handleExtendedFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExtendedFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle amount change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const numericValue = value.replace(/[^\d]/g, '');
    const numericAmount = Number(numericValue);
    
    setFormattedAmount(formatAmountWithCurrency(numericValue));
    
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'amount',
        value: numericValue
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleApplicationFormChange(syntheticEvent);
    
    if (numericValue === '') {
      setAmountError(t('step7.amountRequired', { default: 'Funding amount is required' }));
    } else if (numericAmount < 1000) {
      setAmountError(t('step7.amountTooSmall', { default: 'Minimum amount is 1,000 €' }));
    } else if (numericAmount > 5000000) {
      setAmountError(t('step7.amountTooLarge', { default: 'Maximum amount is 5,000,000 €' }));
    } else {
      setAmountError(null);
    }
    
    setValidationComplete(true);
  };

  // Handle collateral document upload
  const handleCollateralDocumentUpload = async (files: File[]) => {
    if (!handleFileUpload || !fetchDocuments) {
      console.error('Document upload handlers not available');
      return;
    }

    try {
      await handleFileUpload(files);
      await fetchDocuments();
      toast({
        title: t('step7.collateralUploadSuccess', { default: "Vakuudokumentti ladattu onnistuneesti" }),
        description: t('step7.collateralUploadSuccessDesc', { default: `Ladattiin ${files.length} dokumentti(a).` }),
      });
    } catch (error) {
      console.error("Error uploading collateral document:", error);
      toast({
        title: t('step7.collateralUploadError', { default: "Virhe dokumentin latauksessa" }),
        description: error instanceof Error ? error.message : "Tuntematon virhe",
        variant: "destructive",
      });
    }
  };

  // Handle drag and drop for collateral documents
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (setIsDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (setIsDragging) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (setIsDragging) setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)
    );

    if (files.length > 0) {
      handleCollateralDocumentUpload(files);
      if (setUploadedFiles) setUploadedFiles(files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      handleCollateralDocumentUpload(files);
      if (setUploadedFiles) setUploadedFiles(files);
      e.target.value = ''; // Reset input
    }
  };

  const validateAmount = (amount: string | number) => {
    if (!amount) {
      setAmountError(t('step7.amountRequired', { default: 'Funding amount is required' }));
      return false;
    }
    
    const numericAmount = Number(amount);
    if (numericAmount < 1000) {
      setAmountError(t('step7.amountTooSmall', { default: 'Minimum amount is 1,000 €' }));
      return false;
    } 
    if (numericAmount > 5000000) {
      setAmountError(t('step7.amountTooLarge', { default: 'Maximum amount is 5,000,000 €' }));
      return false;
    }
    
    setAmountError(null);
    return true;
  };
  
  React.useEffect(() => {
    if (applicationFormData.amount) {
      setFormattedAmount(formatAmountWithCurrency(applicationFormData.amount));
      validateAmount(applicationFormData.amount);
    }
    setValidationComplete(true);
  }, []);
  
  React.useEffect(() => {
    if (applicationFormData.amount) {
      setFormattedAmount(formatAmountWithCurrency(applicationFormData.amount));
      validateAmount(applicationFormData.amount);
    }
    setValidationComplete(true);
  }, [applicationFormData.amount, fundingType, applicationFormData.term_months, t]);

  const evaluateFormValidity = () => {
    const amountValue = Number(applicationFormData.amount);
    const termValue = Number(applicationFormData.term_months || sliderValue);
    const termRequired = fundingType.includes('business_loan'); // Only business loans require term, not credit lines
    
    const amountValid = amountValue >= 1000 && amountValue <= 5000000;
    const termValid = !termRequired || (termRequired && termValue > 0);
    
    const isValid = !!fundingType && amountValid && termValid && validationComplete;
    
    return isValid;
  };

  const isFormValid = React.useMemo(() => {
    return evaluateFormValidity();
  }, [fundingType, applicationFormData.amount, applicationFormData.term_months, validationComplete]);

  // Render funding type specific questions
  const renderFundingTypeQuestions = () => {
    switch (fundingType) {
      case 'business_loan_secured':
        return (
          <div className="space-y-4 border-t border-gray-dark pt-6 mt-6">
            <h3 className="text-lg font-medium text-gold-primary mb-4">
              {t('step7.securedLoan.title', { default: 'Vakuudelliset lainatiedot' })}
            </h3>
            <div>
              <Label htmlFor="secured_collateral" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.securedLoan.collateralLabel', { default: 'Vakuus' })}
              </Label>
              <Textarea
                id="secured_collateral"
                name="secured_collateral"
                placeholder={t('step7.securedLoan.collateralPlaceholder', { default: 'Kuvaile tarjottava vakuus (esim. kiinteistö, koneet, jne.)' })}
                value={extendedFormData.secured_collateral || ''}
                onChange={handleExtendedFormChange}
                className={inputClasses}
              />
            </div>

            {/* Collateral Document Upload Section */}
            <div className="mt-6">
              <Label className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.securedLoan.collateralDocumentLabel', { default: 'Vakuudokumentti (valinnainen)' })}
              </Label>
              <p className="text-xs text-gray-medium mb-3">
                {t('step7.securedLoan.collateralDocumentDesc', { default: 'Voit liittää dokumentin, joka kuvaa tarjottavaa vakuutta (esim. kiinteistöarvio, koneluettelo)' })}
              </p>

              {/* Show existing collateral documents */}
              {collateralDocuments.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gold-secondary mb-2">
                    {t('step7.securedLoan.existingCollateralDocs', { default: 'Liitetyt vakuudokumentit:' })}
                  </h5>
                  <ul className="space-y-2">
                    {collateralDocuments.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between py-2 px-3 bg-gray-dark rounded-lg">
                        <div className="flex items-center space-x-2">
                          <DocumentTextIcon className="w-4 h-4 text-gold-secondary" />
                          <span className="text-sm text-gray-light">{doc.name}</span>
                        </div>
                        <span className="text-xs text-green-400">
                          {t('step7.securedLoan.documentUploaded', { default: 'Ladattu' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Document upload area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-gold-primary bg-gray-dark'
                    : 'border-gray-dark hover:border-gold-primary/50 bg-black'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('collateral-file-upload')?.click()}
              >
                {uploading ? (
                  <Spinner className="mx-auto h-8 w-8 text-gold-primary" />
                ) : (
                  <DocumentArrowUpIcon className="mx-auto h-8 w-8 text-gold-primary/80" />
                )}
                <p className="mt-2 text-sm text-gray-light">
                  {t('step7.securedLoan.uploadCollateralPrompt', { default: 'Vedä ja pudota vakuudokumentti tähän tai klikkaa valitaksesi' })}
                </p>
                <p className="text-xs text-gray-medium mt-1">
                  {t('step3.supportedFormats', { default: 'Tuetut muodot: PDF, DOC, DOCX, XLS, XLSX' })}
                </p>

                <input
                  id="collateral-file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  disabled={uploading}
                />
              </div>
            </div>
          </div>
        );

      case 'credit_line':
        return (
          <div className="space-y-4 border-t border-gray-dark pt-6 mt-6">
            <h3 className="text-lg font-medium text-gold-primary mb-4">
              {t('step7.creditLine.title', { default: 'Yrityslimiittitiedot' })}
            </h3>
            <p className="text-sm text-gray-medium">
              {t('step7.creditLine.description', { default: 'Yrityslimiitti antaa joustavuutta kassanhallintaan. Maksat korkoa vain käyttämästäsi summasta.' })}
            </p>
          </div>
        );

      case 'factoring_ar':
        return (
          <div className="space-y-4 border-t border-gray-dark pt-6 mt-6">
            <h3 className="text-lg font-medium text-gold-primary mb-4">
              {t('step7.factoring.title', { default: 'Laskurahoitustiedot' })}
            </h3>
            
            <div>
              <Label htmlFor="factoring_totalFundingNeed" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.factoring.totalFundingNeedLabel', { default: 'Kokonaisrahoitustarve' })}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gold-primary">€</span>
                </div>
                <Input
                  id="factoring_totalFundingNeed"
                  name="factoring_totalFundingNeed"
                  type="text"
                  inputMode="numeric"
                  placeholder={t('step7.factoring.totalFundingNeedPlaceholder', { default: '250 000' })}
                  value={extendedFormData.factoring_totalFundingNeed || ''}
                  onChange={handleExtendedFormChange}
                  className={`${inputClasses} pl-8`}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="factoring_financingPercentage" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.factoring.financingPercentageLabel', { default: 'Rahoitusosuus (%)' })}
              </Label>
              <div className="relative">
                <Input
                  id="factoring_financingPercentage"
                  name="factoring_financingPercentage"
                  type="text"
                  inputMode="numeric"
                  placeholder={t('step7.factoring.financingPercentagePlaceholder', { default: '80' })}
                  value={extendedFormData.factoring_financingPercentage || ''}
                  onChange={handleExtendedFormChange}
                  className={`${inputClasses} pr-8`}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gold-primary">%</span>
              </div>
            </div>

            <div>
              <Label htmlFor="factoring_largestCustomers" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.factoring.largestCustomersLabel', { default: 'Isoimmat asiakkaat' })}
              </Label>
              <Textarea
                id="factoring_largestCustomers"
                name="factoring_largestCustomers"
                placeholder={t('step7.factoring.largestCustomersPlaceholder', { default: 'Listaa tärkeimmät asiakkaanne (yksi per rivi)' })}
                value={extendedFormData.factoring_largestCustomers || ''}
                onChange={handleExtendedFormChange}
                className={inputClasses}
              />
            </div>

            <div>
              <Label htmlFor="factoring_averagePaymentDays" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.factoring.averagePaymentDaysLabel', { default: 'Keskimääräinen maksuaika (päivää)' })}
              </Label>
              <Input
                id="factoring_averagePaymentDays"
                name="factoring_averagePaymentDays"
                type="text"
                inputMode="numeric"
                placeholder={t('step7.factoring.averagePaymentDaysPlaceholder', { default: '30' })}
                value={extendedFormData.factoring_averagePaymentDays || ''}
                onChange={handleExtendedFormChange}
                className={inputClasses}
              />
            </div>

            <div>
              <Label htmlFor="factoring_averageInvoiceAmount" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.factoring.averageInvoiceAmountLabel', { default: 'Laskun keskimääräinen summa' })}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gold-primary">€</span>
                </div>
                <Input
                  id="factoring_averageInvoiceAmount"
                  name="factoring_averageInvoiceAmount"
                  type="text"
                  inputMode="numeric"
                  placeholder={t('step7.factoring.averageInvoiceAmountPlaceholder', { default: '5 000' })}
                  value={extendedFormData.factoring_averageInvoiceAmount || ''}
                  onChange={handleExtendedFormChange}
                  className={`${inputClasses} pl-8`}
                />
              </div>
            </div>
          </div>
        );

      case 'leasing':
        return (
          <div className="space-y-4 border-t border-gray-dark pt-6 mt-6">
            <h3 className="text-lg font-medium text-gold-primary mb-4">
              {t('step7.leasing.title', { default: 'Leasingtiedot' })}
            </h3>
            
            <div>
              <Label htmlFor="leasing_asset" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.leasing.assetLabel', { default: 'Kohde' })}
              </Label>
              <Input
                id="leasing_asset"
                name="leasing_asset"
                placeholder={t('step7.leasing.assetPlaceholder', { default: 'Kuvaile leasattava kohde (esim. auto, kone, laite)' })}
                value={extendedFormData.leasing_asset || ''}
                onChange={handleExtendedFormChange}
                className={inputClasses}
              />
            </div>

            <div>
              <Label htmlFor="leasing_leaseTerm" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.leasing.leaseTermLabel', { default: 'Vuokra-aika (kuukausia)' })}
              </Label>
              <Input
                id="leasing_leaseTerm"
                name="leasing_leaseTerm"
                type="text"
                inputMode="numeric"
                placeholder={t('step7.leasing.leaseTermPlaceholder', { default: '36' })}
                value={extendedFormData.leasing_leaseTerm || ''}
                onChange={handleExtendedFormChange}
                className={inputClasses}
              />
            </div>

            <div>
              <Label htmlFor="leasing_finalPayment" className="block text-sm font-medium text-gold-secondary mb-2">
                {t('step7.leasing.finalPaymentLabel', { default: 'Viimeinen erä' })}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gold-primary">€</span>
                </div>
                <Input
                  id="leasing_finalPayment"
                  name="leasing_finalPayment"
                  type="text"
                  inputMode="numeric"
                  placeholder={t('step7.leasing.finalPaymentPlaceholder', { default: '1 000' })}
                  value={extendedFormData.leasing_finalPayment || ''}
                  onChange={handleExtendedFormChange}
                  className={`${inputClasses} pl-8`}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-gold-secondary">
      <div className="max-w-md mb-12">
        <CompanySelector
           companies={userCompanies}
           selectedCompanyId={companyId}
           onCompanyChange={handleCompanyChange}
           isLoading={isFetchingCompanies}
           label={t('step7.selectCompanyLabel', { default: 'Haetaan yritykselle' })}
        />
      </div>

      <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-center text-gold-primary">{t('step7.title', { default: 'Hakemuksen tiedot' })}</h2>
      <p className="text-lg text-center text-gray-light mb-10">
        {t('step7.description', { default: 'Valitse rahoitustyyppi ja anna tarkat tiedot.' })}
      </p>

      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }} className="space-y-8 bg-gray-very-dark p-8 md:p-12 rounded-lg shadow-lg border border-gray-dark">
        
        {/* Funding Type Selection */}
        <div>
          <Label className="block text-lg font-medium text-gold-primary mb-4">
            {t('step7.fundingTypeLabel', { default: 'Rahoitustyyppi' })}
          </Label>
          <RadioGroup 
            value={fundingType} 
            onValueChange={handleFundingTypeChange}
            className="space-y-3"
          >
            {FUNDING_TYPES.map((type) => {
              const isAlreadyApplied = appliedFundingTypes.includes(type.value);
              return (
                <div key={type.value} className={`flex items-center space-x-3 p-4 border rounded-md transition-colors border-gray-dark hover:bg-gray-dark/50`}>
                  <RadioGroupItem 
                    value={type.value} 
                    id={`type-${type.value}`} 
                    className="text-gold-primary border-gold-primary/50 data-[state=checked]:border-gold-highlight data-[state=checked]:text-gold-highlight" 
                  />
                  <Label 
                    htmlFor={`type-${type.value}`} 
                    className="flex-1 text-base cursor-pointer text-white"
                  >
                    {t(type.labelKey, { default: type.value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) })}
                    {isAlreadyApplied && (
                      <span className="ml-2 text-xs text-green-400 font-medium">
                        ✓ {t('step7.alreadyApplied', { default: '(Jo haettu)' })}
                      </span>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
          {!fundingType && (
             <p className="text-sm text-red-400 mt-2">{t('step7.validationErrorRequired', { default: 'Valitse rahoitustyyppi.' })}</p>
           )}
        </div>

        {/* Amount Input */}
        <div className="mt-10">
          <Label htmlFor="amount" className="block text-xl font-medium text-gold-primary mb-3">
            {fundingType === 'business_loan_unsecured' && t('step7.requestedLoanAmountLabel', { currency: 'EUR', default: 'Haettu lainamäärä (EUR)' })}
            {fundingType === 'business_loan_secured' && t('step7.requestedLoanAmountLabel', { currency: 'EUR', default: 'Haettu lainamäärä (EUR)' })}
            {fundingType === 'credit_line' && t('step7.requestedCreditLimitLabel', { currency: 'EUR', default: 'Haettu luottoraja (EUR)' })}
            {fundingType === 'factoring_ar' && t('step7.requestedFacilityLimitLabel', { currency: 'EUR', default: 'Haettu limiitti (EUR)' })}
            {fundingType === 'leasing' && t('step7.requestedLeaseAmountLabel', { currency: 'EUR', default: 'Leasingsumma (EUR)' })}
            {!fundingType && t('step7.fundingAmountLabel', { currency: 'EUR', default: 'Rahoitusmäärä (EUR)' })}
          </Label>
          <div className="relative rounded-lg shadow-lg mt-2">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <span className="text-2xl font-medium text-gold-primary">€</span>
            </div>
            
          <Input
            id="amount"
            name="amount"
              type="text"
              inputMode="numeric"
              value={formattedAmount}
              onChange={handleAmountChange}
              className={`${amountInputClasses} pl-10 ${amountError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder={t('step7.amountPlaceholder', { default: '50 000' })}
            required
              min="1000"
              max="5000000"
              aria-describedby="amount-description"
          />
          </div>
          
          {/* --- NEW: Add maximum amount suggestion --- */}
          <div className="mt-2 text-sm text-gray-400">
            <div>
              {isFetchingRecommendations ? (
                <>
                  <span className="inline-flex items-center">
                    <Spinner className="h-3 w-3 mr-2 text-gold-primary" />
                    {t('step7.loadingRecommendations', { default: 'Ladataan rahoitussuosituksia...' })}
                  </span>
                </>
              ) : recommendationAmountRange ? (
                <>
                  {t('step7.amountRangeSuggestion', { default: 'Perustuen analyysiin, suositeltu rahoitus on välillä' })}
                  <span className="font-bold text-gold-primary"> {formatCurrency(recommendationAmountRange.min)} - {formatCurrency(recommendationAmountRange.max)}</span>.
                </>
              ) : (
                <>
                  {t('step7.noRecommendationsAvailable', { default: 'Ei rahoitussuosituksia saatavilla tällä hetkellä.' })}
                  {/* Debug button - only show in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={fetchFundingRecommendations}
                      className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                      type="button"
                    >
                      Debug Fetch
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          {amountError && <p className="mt-2 text-sm text-red-500">{amountError}</p>}
          
          <div className="mt-4 px-2">
            <div className="relative h-1 bg-gray-dark rounded-full">
              <div 
                className="absolute h-1 bg-gradient-to-r from-gold-primary/30 to-gold-highlight/50 rounded-full"
                style={{ 
                  width: `${Math.min(100, Math.max(0, (Number(applicationFormData.amount) - 1000) / (5000000 - 1000) * 100))}%` 
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-medium">1K</span>
              <span className="text-xs text-gray-medium">5M</span>
            </div>
          </div>
        </div>

        {/* Term Slider for loans only (not credit lines) */}
        {fundingType.includes('business_loan') && (
          <div>
            <Label htmlFor="term_months" className="block text-lg font-medium text-gold-primary mb-3">
              {t('step7.termLabel', { default: 'Laina-aika' })}:
              <span className="text-gold-highlight font-semibold ml-2">{sliderValue} {t('step7.monthsUnit', { default: 'kk' })}</span>
            </Label>
            <Slider
              id="term_months"
              name="term_months"
              min={1}
              max={120}
              step={1}
              value={[sliderValue]}
              onValueChange={handleTermSliderChange}
              className="mt-4"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-medium">
              <span>{t('step7.minMonths', { count: 1, default: '1 kuukausi' })}</span>
              <span>{t('step7.maxMonths', { count: 120, default: '120 kuukautta' })}</span>
            </div>
          </div>
        )}

        {/* Funding Type Specific Questions */}
        {renderFundingTypeQuestions()}

        {error && (
          <div
            className="text-red-400 text-sm p-4 bg-red-900/30 border border-red-500/50 rounded-lg"
            dangerouslySetInnerHTML={{ __html: error }}
          />
        )}

        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            variant="outline"
            className="border-gray-dark text-gray-light hover:bg-gray-dark hover:text-gold-primary"
            onClick={() => goToStep(5)}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> {t('back', { default: 'Takaisin' })}
          </Button>

          <Button
            type="submit"
            disabled={loading || !isFormValid}
            className="inline-flex items-center px-6 py-3 text-base border border-transparent rounded-md shadow-sm font-medium text-black bg-gold-primary hover:bg-gold-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-primary/50 focus:ring-offset-black disabled:opacity-50 disabled:bg-gold-primary disabled:text-black"
          >
            {loading ? <Spinner className="h-5 w-5 mr-2 text-black" /> : null}
            {loading ? t('saving', { default: 'Tallennetaan...' }) : t('step7.continueButton', { default: 'Jatka vahvistukseen' })}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Step7Application; 