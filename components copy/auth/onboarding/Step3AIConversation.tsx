"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Upload, Info, Bot, User, ChevronDown, ChevronUp, Check, Loader2, MessageSquare, Edit3 } from "lucide-react";
import FinancialChartsDisplay, {
  YearlyFinancialData,
  CurrentFinancialRatios,
  ChartKey,
} from "@/components/financial/FinancialChartsDisplay";
import FinancialInsights from "@/components/financial/FinancialInsights";
import { createClient } from "@/utils/supabase/client";
import SwedishLendersComingSoonPopup from "@/components/swedish-trial/SwedishLendersComingSoonPopup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import FormattedText from '@/components/ui/formatted-text';
import { showQuickFeedback, getFeedbackManager } from '@/lib/utils/ui-feedback';
import ManualFinancialInput from './ManualFinancialInput';
import FinancialDataTransparency from '@/components/financial/FinancialDataTransparency';


type CompanyRow = {
  id: string;
  name?: string | null;
  business_id?: string | null;
  [key: string]: any;
};

type FinancialMetric = {
  revenue?: number | null;
  net_profit?: number | null;
  total_assets?: number | null;
  total_liabilities?: number | null;
  equity?: number | null;
  fiscal_year?: number | null;
  fiscal_period?: string | null;
  [key: string]: any;
};

type UploadedDocument = {
  id: string;
  name: string;
  document_type_id?: string | null;
  document_types?: { name: string } | null;
  processing_status?: "pending" | "processing" | "completed" | "failed" | null;
  file_path: string;
  [key: string]: any;
};

type OptionItem = {
  label: string;
  value: string;
};

type ConversationTurn = {
  role: "user" | "assistant" | "cfo";
  content: string;
  timestamp: number;
  hasError?: boolean;
  canRetry?: boolean;
  isRetrying?: boolean;
};

type ConversationResponse = {
  nextQuestion: string;
  optionType: "single" | "multi";
  options: OptionItem[];
  cfoGuidance: string;
  category?: "A" | "B" | "C" | "D";
  done?: boolean;
  collected?: { summary: string; answers: { key: string; value: string }[] };
  recommendation?: {
    items: Array<{
      type: string;
      title: string;
      summary: string;
      amount?: number | null;
      termMonths?: number | null;
      guaranteesRequired?: boolean | null;
      costNotes?: string | null;
    }>;
    comparison?: string;
  };
};

export interface Step3AIConversationProps {
  companyId: string | null;
  companyData: CompanyRow | null;
  documents: UploadedDocument[];
  financialDataArray: FinancialMetric[];
  isFetchingFinancials: boolean;
  uploading: boolean;
  session: any | null;
  currentLocale: string;
  // Reuse existing handlers from parent to avoid duplicating logic
  handleFileUpload: (files: File[], documentType?: string) => Promise<void>;
  fetchDocuments: () => Promise<void>;
  onDone?: () => void;
  onApplyRecommendation?: (recommendationData: any) => void;
  onCompanyDataUpdate?: (enrichedData: Partial<CompanyRow>) => void;
}

export default function Step3AIConversation({
  companyId,
  companyData,
  documents,
  financialDataArray,
  isFetchingFinancials,
  uploading,
  session,
  currentLocale,
  handleFileUpload,
  fetchDocuments,
  onDone,
  onApplyRecommendation,
  onCompanyDataUpdate,
}: Step3AIConversationProps) {
  const t = useTranslations("Onboarding");
  const supabase = createClient();

  // Get context from URL parameters to determine currency
  const [urlContext, setUrlContext] = useState<{source?: string, context?: string}>({});
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const source = params.get('source');
      const context = params.get('context');
      const referrer = document.referrer;
      
      // Check if coming from Swedish Trial page
      const isFromSwedishTrial = referrer.includes('/swedish-trial') || source === 'swedish-trial' || context === 'swedish-trial';
      
      setUrlContext({
        source: isFromSwedishTrial ? 'swedish-trial' : source || undefined,
        context: isFromSwedishTrial ? 'swedish-trial' : context || undefined
      });
    }
  }, []);

  const [expanded, setExpanded] = useState(false);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [hasLatestStatement, setHasLatestStatement] = useState(false);
  const [isRetryingFetch, setIsRetryingFetch] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  // Add comprehensive financial data state (from Step6Summary)
  const [yearlyFinancialData, setYearlyFinancialData] = useState<YearlyFinancialData[]>([]);
  const [latestFinancialRatios, setLatestFinancialRatios] = useState<CurrentFinancialRatios>({});
  const [isFetchingFinancialMetrics, setIsFetchingFinancialMetrics] = useState<boolean>(false);
  const [financialsError, setFinancialsError] = useState<string | null>(null);

  // Map financialDataArray to yearlyFinancialData format
  useEffect(() => {
    if (financialDataArray && financialDataArray.length > 0) {
      console.log(`📊 [Step3AI] Mapping ${financialDataArray.length} financial metrics to yearly data`);
      
      const mapped: YearlyFinancialData[] = financialDataArray.map((metric: FinancialMetric) => ({
        fiscal_year: metric.fiscal_year || (metric as any).year || 0, // Fallback to 0 if no year
        // Core metrics
        revenue: metric.revenue_current || metric.revenue || null,
        revenue_growth_pct: metric.revenue_growth_pct || null,
        ebitda: metric.ebitda || null,
        // Profitability
        operating_profit: metric.operating_profit || null,
        operating_profit_pct: metric.operating_profit_pct || null,
        net_result: metric.net_result || null,
        gross_margin: metric.gross_margin || null,
        gross_margin_pct: metric.gross_margin_pct || null,
        // Balance sheet
        totalAssets: metric.total_assets || null,
        total_assets: metric.total_assets || null,
        totalEquity: metric.total_equity || metric.equity || null,
        equity: metric.equity || null,
        cashAndReceivables: metric.cash_and_equivalents || metric.current_assets || null,
        // Ratios
        roe: metric.return_on_equity || metric.return_on_equity_pct || null,
        roa: metric.return_on_assets_pct || null,
        return_on_equity_pct: metric.return_on_equity_pct || null,
        return_on_assets_pct: metric.return_on_assets_pct || null,
        debtToEquity: metric.debt_to_equity_ratio || null,
        equity_ratio_pct: metric.equity_ratio_pct || null,
        debt_ratio_pct: metric.debt_ratio_pct || null,
        quick_ratio: metric.quick_ratio || null,
        current_ratio: metric.current_ratio || null,
        // Other
        dso: metric.dso_days || null,
        employees: metric.employees || null,
        fiscal_period_months: metric.fiscal_period_months || null,
      }));
      
      console.log('📊 [Step3AI] Mapped yearly data with extended metrics:', mapped);
      setYearlyFinancialData(mapped);
      
      // Also set latest ratios from the most recent metrics (with all new fields)
      if (financialDataArray.length > 0) {
        const latest = financialDataArray[financialDataArray.length - 1];
        const ratios: CurrentFinancialRatios = {
          currentRatio: latest.current_ratio || null,
          quickRatio: latest.quick_ratio || null,
          equityRatio: latest.equity_ratio_pct || null,
          debtRatio: latest.debt_ratio_pct || null,
          roe: latest.return_on_equity || latest.return_on_equity_pct || null,
          roa: latest.return_on_assets_pct || null,
        };
        console.log('📊 [Step3AI] Setting latest ratios with extended metrics:', ratios);
        setLatestFinancialRatios(ratios);
      }
    } else {
      console.log('⚠️ [Step3AI] No financial data array available');
      setYearlyFinancialData([]);
      setLatestFinancialRatios({});
    }
  }, [financialDataArray]);

  // Conversation state
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [optionType, setOptionType] = useState<"single" | "multi">("multi");
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");
  const [cfoGuidance, setCfoGuidance] = useState<string>("");
  const [loadingNext, setLoadingNext] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [isConversationDone, setIsConversationDone] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  
  // Persistent recommendations state - ensures recommendations stay visible
  // See: docs/development/features/ONBOARDING_RECOMMENDATIONS_PERSISTENCE.md
  const [hasReceivedRecommendations, setHasReceivedRecommendations] = useState(false);
  const [persistedRecommendations, setPersistedRecommendations] = useState<any>(null);
  
  // Track the current question separately from history
  const [currentQuestionTurn, setCurrentQuestionTurn] = useState<ConversationTurn | null>(null);
  // Track retry count for automatic retries on overload errors
  const retryCountRef = useRef(0);
  // Track failed requests that can be retried manually
  const [lastFailedRequest, setLastFailedRequest] = useState<{userInput: string, optionResults: string[], timestamp: number} | null>(null);
  // Track auto-retry state
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  // Track company data refetch state
  const [isRefetchingCompanyData, setIsRefetchingCompanyData] = useState(false);
  const [companyDataError, setCompanyDataError] = useState<string | null>(null);
  // Dynamic conversation height based on content
  const [conversationHeight, setConversationHeight] = useState<string>("min-h-[200px]");
  // Hardcoded to gemini-2.5-flash as requested
  const selectedModel = 'gemini-2.5-flash';

  // Manual retry function
  const handleManualRetry = useCallback(() => {
    if (!lastFailedRequest) return;
    
    console.log('🔄 [Step3AI] Manual retry triggered');
    setLastFailedRequest(null); // Clear the failed request
    retryCountRef.current = 0; // Reset auto-retry count
    
    // Retry the last failed request
    setInput(lastFailedRequest.userInput);
    setSelected(lastFailedRequest.optionResults);
    // Call submit on next tick to allow state updates
    setTimeout(() => submitMessage(), 0);
  }, [lastFailedRequest]);

  // Auto retry with countdown
  const startAutoRetry = useCallback((userInput: string, optionResults: string[], delay: number = 3000) => {
    setIsAutoRetrying(true);
    
    setTimeout(() => {
      setIsAutoRetrying(false);
      setInput(userInput);
      setSelected(optionResults);
      // Call submit on next tick to allow state updates
      setTimeout(() => submitMessage(), 0);
    }, delay);
  }, []);

  // Function to refetch company data by triggering enhanced analysis
  const refetchCompanyData = useCallback(async () => {
    if (!session?.user?.id || !session?.access_token) {
      setCompanyDataError(t('ui.sessionMissing', { default: 'Kirjautumisistunto puuttuu. Kirjaudu sisään uudelleen.' }));
      return;
    }

    setIsRefetchingCompanyData(true);
    setCompanyDataError(null);

    try {
      console.log('🔄 [Step3AI] Triggering enhanced analysis for companyId:', companyId);
      
      // Trigger enhanced analysis to re-enrich company data
      const response = await fetch('/api/onboarding/enhanced-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyId,
          locale: currentLocale
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ [Step3AI] Enhanced analysis failed:', response.status, errorData);
        throw new Error(t('ui.companyDataFetchFailed', { default: 'Yrityksen tietojen haku epäonnistui.' }));
      }

      const analysisResult = await response.json();
      console.log('✅ [Step3AI] Enhanced analysis completed successfully:', analysisResult);
      
      // Wait a moment and then refetch company data to see if enriched_data is now available
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: refreshedCompany, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ [Step3AI] Error fetching refreshed company data:', fetchError);
        throw new Error(t('ui.companyDataFetchFailed', { default: 'Yrityksen tietojen haku epäonnistui.' }));
      }

      if (!refreshedCompany) {
        throw new Error(t('ui.companyNotFound', { default: 'Yritystä ei löytynyt.' }));
      }

      // Check if enriched data or enhanced analysis is now available
      const hasEnrichedData = refreshedCompany.metadata?.enriched_data;
      const hasEnhancedAnalysis = refreshedCompany.metadata?.enhanced_analysis;
      
      if (!hasEnrichedData && !hasEnhancedAnalysis) {
        console.warn('⚠️ [Step3AI] Enhanced data still missing after analysis');
        throw new Error(t('ui.companyDataStillMissing', { default: 'Yrityksen rikastetut tiedot puuttuvat edelleen. Yritä uudelleen hetken kuluttua.' }));
      }
      
      console.log('✅ [Step3AI] Company data successfully enriched and refetched');
      setCompanyDataError(null);
      
      // Suggest page refresh to get the updated data
      if (window.confirm(t('ui.refreshPageToSeeUpdates', { default: 'Tiedot on päivitetty onnistuneesti. Päivitä sivu nähdäksesi muutokset?' }))) {
        window.location.reload();
      }
      
    } catch (error: any) {
      console.error('❌ [Step3AI] Company data refetch failed:', error);
      setCompanyDataError(error.message || t('ui.companyDataError', { default: 'Tietojen haussa tapahtui virhe.' }));
    } finally {
      setIsRefetchingCompanyData(false);
    }
  }, [companyId, session?.user?.id, session?.access_token, supabase, currentLocale, t]);
  const [recommendationsLoading, setRecommendationsLoading] = useState<boolean>(false);
  // Analysis type removed - LLM directly determines first question
  
  // New UI state
  const [conversationStarted, setConversationStarted] = useState<boolean>(false);
  const [recommendationsExpanded, setRecommendationsExpanded] = useState<boolean>(true);
  // Vakiona kaikki suositukset ovat laajennettuja - käyttäjä voi supistaa halutessaan
  const [collapsedRecommendations, setCollapsedRecommendations] = useState<Set<number>>(new Set());
  
  // Swedish trial specific state
  const [showSwedishLendersPopup, setShowSwedishLendersPopup] = useState<boolean>(false);
  const [selectedRecommendationForPopup, setSelectedRecommendationForPopup] = useState<any>(null);
  
  // Tooltip state for funding options
  const [hoveredFundingType, setHoveredFundingType] = useState<string | null>(null);
  
  // Persistent recommendations effect
  // Ensures recommendations stay visible during conversation but can be updated
  // See: docs/development/features/ONBOARDING_RECOMMENDATIONS_PERSISTENCE.md
  useEffect(() => {
    // If recommendation contains items, update persisted state
    if (recommendation && recommendation.items && recommendation.items.length > 0) {
      console.log('🔄 [Recommendations Persistence] Updating persisted recommendations', {
        itemCount: recommendation.items.length,
        previouslyHadRecommendations: hasReceivedRecommendations
      });
      
      // Mark that recommendations have been received
      setHasReceivedRecommendations(true);
      
      // Update persisted recommendations to latest version
      // This allows recommendations to be updated during conversation
      setPersistedRecommendations(recommendation);
    }
    // NOTE: If recommendation is null or empty, we DO NOT clear persistedRecommendations
    // This ensures recommendations stay visible even when not in current API response
  }, [recommendation, hasReceivedRecommendations]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const recommendationsRef = useRef<HTMLDivElement | null>(null);
  // Hint to press continue after selecting options
  const [showPressHint, setShowPressHint] = useState<boolean>(false);
  const pressHintTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Prevent repeated financial data reloads
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchAtRef = useRef<number>(0);
  const completedDocIdsRef = useRef<Set<string>>(new Set());

  // Comprehensive financial data fetching function with retry logic
  const fetchFinancialMetrics = useCallback(async () => {
    if (!companyId) return;

    // NOTE: We DO fetch financial metrics even if status is 'pending_documents'
    // because documents may have been processed and metrics may be available
    console.log('🔄 [Step3AI] Starting financial metrics fetch for company:', companyId);

    // Cooldown: avoid rapid re-fetch loops within 8s (BUT allow initial fetch or manual refetch)
    const now = Date.now();
    if (isFetchingRef.current || (now - lastFetchAtRef.current < 8000 && lastFetchAtRef.current > 0)) {
      console.log('⏸️ [Step3AI] Fetch skipped due to cooldown');
      return;
    }
    isFetchingRef.current = true;
    lastFetchAtRef.current = now;
    
    setIsFetchingFinancialMetrics(true);
    setFinancialsError(null);
    
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let data: any = null;
    let hasData = false;
    
    while (retryCount < MAX_RETRIES && !hasData) {
      try {
        console.log(`🔄 [Step3AI] Fetching financial data (attempt ${retryCount + 1}/${MAX_RETRIES}) for company ${companyId}`);
        
        // Get current session token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          console.error('❌ Failed to get session or session invalid:', sessionError);
          throw new Error('Authentication session is invalid. Please sign in again.');
        }
        const token = session.access_token;
        
        // Fetch financial metrics from the API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await fetch(`/api/financial-metrics/list?companyId=${companyId}&order=fiscal_year&direction=desc`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error fetching financial data: ${response.status}`, errorText);
            throw new Error(`Failed to fetch financial data: ${response.status} - ${errorText}`);
          }
          
          const responseData = await response.json();
          data = responseData.data;
      
          console.log('🔍 [Step3AI-Updated] Raw financial metrics from API:', data);
          console.log('🔍 [Step3AI-Updated] Data length:', data?.length);
          console.log('🔍 [Step3AI-Updated] First record sample:', data?.[0]);
          
          // Check if we got data
          if (data && data.length > 0) {
            hasData = true;
            console.log(`✅ [Step3AI] Financial data found: ${data.length} records`);
          } else {
            console.log(`⚠️ [Step3AI] No financial data yet (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            
            // Increment retry counter
            retryCount++;
            
            // If no data and not last retry, wait and try again
            if (retryCount < MAX_RETRIES) {
              const delay = 2000; // 2 seconds between retries
              console.log(`⏳ [Step3AI] Data not ready yet. Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              // Last retry failed, exit loop
              console.log(`❌ [Step3AI] No financial data after ${MAX_RETRIES} attempts`);
              break;
            }
          }
          
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        retryCount++;
        console.error(`❌ [Step3AI] Error fetching financial data (attempt ${retryCount}/${MAX_RETRIES}):`, error);
        
        if (retryCount >= MAX_RETRIES) {
          // All retries failed
          const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
          console.error(`❌ [Step3AI] Failed to fetch financial data after ${MAX_RETRIES} attempts`);
          setFinancialsError(`Yritystietojen haku epäonnistui ${MAX_RETRIES} yrityksen jälkeen. ${errorMessage}`);
          isFetchingRef.current = false;
          setIsFetchingFinancialMetrics(false);
          return;
        } else {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          console.log(`⏳ [Step3AI] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    try {
      if (!data || data.length === 0) {
        console.log('ℹ️ [Step3AI] No financial data available for this company');
        setYearlyFinancialData([]);
        setLatestFinancialRatios({});
        // Don't return here - let finally block execute to reset flags
      } else {
        // Process the financial metrics into the format expected by FinancialChartsDisplay
        const yearlyDataMapped: YearlyFinancialData[] = data.map((item: any) => ({
        fiscal_year: item.fiscal_year || item.year || 0, // Fallback to 0 if no year
        // Core metrics - Check new field names first for document-extracted data
        revenue: item.revenue || item.revenue_current,
        revenue_growth_pct: item.revenue_growth_pct || null,
        ebitda: item.ebitda || (item.operating_profit && item.revenue && item.operating_profit < item.revenue ? item.operating_profit : null) || (item.operational_cash_flow && item.revenue && item.operational_cash_flow < item.revenue ? item.operational_cash_flow : null), // Use operating_profit as fallback ONLY if it's valid (< revenue)d .
        // Profitability
        operating_profit: item.operating_profit || null,
        operatingProfit: item.operating_profit || null, // Alias for chart key
        operating_profit_pct: item.operating_profit_pct || null,
        net_result: item.net_result || null,
        netProfit: item.net_profit || item.net_result || null,
        netResult: item.net_profit || item.net_result || null, // Alias for chart key
        gross_margin: item.gross_margin || null,
        gross_margin_pct: item.gross_margin_pct || null,
        // Balance sheet
        totalAssets: item.total_assets,
        total_assets: item.total_assets,
        totalEquity: item.total_equity || item.equity,
        totalLiabilities: item.total_liabilities,
        equity: item.equity,
        cashAndReceivables: item.cash_and_equivalents,
        // Ratios
        roe: item.return_on_equity || item.return_on_equity_pct,
        roa: item.return_on_assets_pct || null,
        return_on_equity_pct: item.return_on_equity_pct || null,
        return_on_assets_pct: item.return_on_assets_pct || null,
        debtToEquity: item.debt_to_equity_ratio,
        equity_ratio_pct: item.equity_ratio_pct || null,
        debt_ratio_pct: item.debt_ratio_pct || null,
        quick_ratio: item.quick_ratio || null,
        current_ratio: item.current_ratio || null,
        // Other
        dso: item.dso_days,
        employees: item.employees || null,
        fiscal_period_months: item.fiscal_period_months || null,
      }));
      
      // Set the latest financial ratios (from the most recent year - data is sorted desc by API)
      const latest = data[0]; 
      const latestRatios: CurrentFinancialRatios = {
        currentRatio: latest.current_ratio || null,
        quickRatio: latest.quick_ratio || null,
        equityRatio: latest.equity_ratio_pct || null,
        debtRatio: latest.debt_ratio_pct || null,
        roe: latest.return_on_equity || latest.return_on_equity_pct || null,
        roa: latest.return_on_assets_pct || null,
      };
      
      setLatestFinancialRatios(latestRatios);
      // Reverse the mapped array for display from oldest to newest
      setYearlyFinancialData(yearlyDataMapped.reverse()); 
      
      console.log('✅ Financial data loaded and reversed:', yearlyDataMapped.length, 'years');
      console.log('📊 [Step3AI] Yearly data sample:', yearlyDataMapped[0]);
      console.log('📊 [Step3AI] Latest ratios:', latestRatios);
      console.log('📊 [Step3AI] Raw API data sample:', data[0]);
      
      // Debug specific ratio fields
      const latestRecord = data[0];
      console.log('🔍 [Step3AI] Ratio field analysis:');
      console.log('  - net_profit:', latestRecord.net_profit, typeof latestRecord.net_profit);
      console.log('  - total_equity:', latestRecord.total_equity, typeof latestRecord.total_equity);
      console.log('  - current_assets:', latestRecord.current_assets, typeof latestRecord.current_assets);
      console.log('  - current_liabilities:', latestRecord.current_liabilities, typeof latestRecord.current_liabilities);
      console.log('  - inventory:', latestRecord.inventory, typeof latestRecord.inventory);
      console.log('  - total_liabilities:', latestRecord.total_liabilities, typeof latestRecord.total_liabilities);
      console.log('  - return_on_equity:', latestRecord.return_on_equity, typeof latestRecord.return_on_equity);
      console.log('  - current_ratio:', latestRecord.current_ratio, typeof latestRecord.current_ratio);
      console.log('  - quick_ratio:', latestRecord.quick_ratio, typeof latestRecord.quick_ratio);
      console.log('  - debt_to_equity_ratio:', latestRecord.debt_to_equity_ratio, typeof latestRecord.debt_to_equity_ratio);
      
      // Success case - clear any previous errors
      setFinancialsError(null);
      }
      
    } catch (error) {
      console.error('❌ Unexpected error processing financial data:', error);
      setFinancialsError(error instanceof Error ? error.message : 'Taloustietojen käsittelyssä tapahtui virhe');
    } finally {
      isFetchingRef.current = false;
      setIsFetchingFinancialMetrics(false);
    }
  }, [companyId, supabase]);

  // Track local enrichment status
  const [localEnrichmentStatus, setLocalEnrichmentStatus] = useState<string | null>(
    companyData?.enrichment_status || null
  );

  // Trigger enrichment if not started
  const triggerEnrichmentIfNeeded = useCallback(async () => {
    if (!companyId || !companyData) return;

    const status = localEnrichmentStatus || companyData?.enrichment_status;
    
    // If status is null or 'pending' and we haven't started enrichment, trigger it
    if (!status || status === 'pending') {
      console.log('🚀 [Step3AI] Enrichment not started, triggering now...');
      
      try {
        const response = await fetch(`/api/companies/${companyId}/retry-financial-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to trigger enrichment');
        }

        const result = await response.json();
        console.log('✅ [Step3AI] Enrichment triggered successfully:', result);
        
        // Update local status to enriching
        setLocalEnrichmentStatus('enriching');
        
      } catch (error) {
        console.error('❌ [Step3AI] Failed to trigger enrichment:', error);
      }
    }
  }, [companyId, companyData, localEnrichmentStatus, session?.access_token]);
  
  // Track enrichment timeout
  const [enrichmentTimedOut, setEnrichmentTimedOut] = useState<boolean>(false);

  // Track locally fetched company data (enriched fields)
  const [localCompanyData, setLocalCompanyData] = useState<{
    description?: string | null;
    products?: string | null;
    market?: string | null;
  } | null>(null);

  // Auto-refresh financial metrics when a document completes processing
  useEffect(() => {
    if (!companyId || documents.length === 0) return;

    // Check if any document just completed processing
    const hasCompletedDocs = documents.some(
      doc => doc.processing_status === 'completed'
    );

    if (hasCompletedDocs) {
      console.log('📄 [Step3AI] Detected completed document, refreshing financial metrics...');
      // Small delay to ensure database has propagated
      const timer = setTimeout(() => {
        fetchFinancialMetrics();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [documents, companyId, fetchFinancialMetrics]);

  // Trigger enrichment if needed when component mounts
  useEffect(() => {
    triggerEnrichmentIfNeeded();
  }, [triggerEnrichmentIfNeeded]);

  // Poll for company enrichment status changes
  useEffect(() => {
    if (!companyId) return;

    const status = localEnrichmentStatus || companyData?.enrichment_status;

    // If status is pending_documents, fetch the enriched data ONE MORE TIME before stopping polling
    // This ensures we get the final enriched data (description, products, market)
    if (status === 'pending_documents') {
      console.log('📄 [Step3AI] Status is pending_documents - fetching final enriched data before stopping polling');
      
      (async () => {
        try {
          const { data: company, error } = await supabase
            .from('companies')
            .select('enrichment_status, enrichment_confidence, description, products, market')
            .eq('id', companyId)
            .single();

          if (error) {
            console.error('❌ [Step3AI] Error fetching final enriched data:', error);
            return;
          }

          if (company) {
            console.log('✅ [Step3AI] Final enriched data fetched:', {
              hasDescription: !!company.description,
              hasProducts: !!company.products,
              hasMarket: !!company.market,
            });

            // Update local company data with enriched info
            const enrichedData = {
              description: company.description,
              products: company.products,
              market: company.market,
              enrichment_status: company.enrichment_status,
              enrichment_confidence: company.enrichment_confidence,
            };
            
            setLocalCompanyData(enrichedData);
            
            // Notify parent component about the enriched data
            if (onCompanyDataUpdate) {
              console.log('📤 [Step3AI] Notifying parent about enriched data');
              onCompanyDataUpdate(enrichedData);
            }
          }
        } catch (error) {
          console.error('❌ [Step3AI] Error in final data fetch:', error);
        }
      })();
      
      return; // Stop polling
    }

    // Stop polling for other final statuses
    if (status !== 'pending' && status !== 'enriching') {
      console.log(`🛑 [Step3AI] Status is ${status} - stopping polling`);
      return;
    }

    console.log(`📡 [Step3AI] Starting company status polling (current: ${status})...`);

    // Set timeout for enrichment - if not completed in 30 seconds, allow user to continue
    const enrichmentTimeout = setTimeout(() => {
      console.warn('⏱️ [Step3AI] Enrichment timeout reached (30s) - allowing user to proceed anyway');
      setEnrichmentTimedOut(true);
    }, 30000); // 30 seconds

    const pollInterval = setInterval(async () => {
      console.log('🔄 [Step3AI] Polling for company status updates...');

      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('enrichment_status, enrichment_confidence, description, products, market')
          .eq('id', companyId)
          .single();

        if (error) {
          console.error('❌ [Step3AI] Error fetching company status:', error);
          return;
        }

        if (company && company.enrichment_status !== localEnrichmentStatus) {
          console.log(`✨ [Step3AI] Status changed: ${localEnrichmentStatus} → ${company.enrichment_status}`);
          setLocalEnrichmentStatus(company.enrichment_status);

          // Update local company data with enriched info
          const enrichedCompanyData = {
            description: company.description,
            products: company.products,
            market: company.market,
            enrichment_status: company.enrichment_status,
            enrichment_confidence: company.enrichment_confidence,
          };

          console.log('📝 [Step3AI] Enriched company data:', {
            hasDescription: !!enrichedCompanyData.description,
            hasProducts: !!enrichedCompanyData.products,
            hasMarket: !!enrichedCompanyData.market,
          });

          setLocalCompanyData(enrichedCompanyData);

          // Notify parent component about the enriched data
          if (onCompanyDataUpdate) {
            console.log('📤 [Step3AI] Notifying parent about enriched data');
            onCompanyDataUpdate(enrichedCompanyData);
          }

          // If enrichment completed with 'enriched' status (old legacy status), fetch financial metrics
          // If enrichment completed with 'pending_documents' (new status), DON'T fetch - user must upload docs
          if (company.enrichment_status === 'enriched') {
            console.log('🎉 [Step3AI] Enrichment complete with financial data! Fetching final data...');
            await fetchFinancialMetrics();
          } else if (company.enrichment_status === 'pending_documents') {
            console.log('📄 [Step3AI] Company background enriched. Financial data awaiting document upload.');
            // Don't fetch financial metrics - user needs to upload documents
          }
        }
      } catch (error) {
        console.error('❌ [Step3AI] Error polling company status:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log('🛑 [Step3AI] Stopping company status polling');
      clearTimeout(enrichmentTimeout);
      clearInterval(pollInterval);
    };
  }, [companyId, localEnrichmentStatus, companyData?.enrichment_status, supabase, fetchFinancialMetrics]);

  // Poll for financial data when enrichment is in progress
  // Poll documents status when waiting for document processing
  // This ensures UI updates when Inngest finishes processing uploaded documents
  useEffect(() => {
    if (!companyId) return;
    
    const status = localEnrichmentStatus || companyData?.enrichment_status;
    
    // Check if we have documents being processed
    const hasProcessingDocs = (documents || []).some(doc => 
      doc.processing_status === 'processing' || doc.processing_status === 'pending'
    );
    
    // Start polling if:
    // 1. Company is enriching OR
    // 2. We have documents being processed (Inngest is working on them)
    const shouldPoll = status === 'enriching' || hasProcessingDocs;
    
    if (!shouldPoll) {
      if (status === 'pending_documents' && !hasProcessingDocs) {
        console.log('📄 [Step3AI] Awaiting financial document upload. No active processing.');
      }
      return; 
    }

    console.log('📡 [Step3AI] Starting polling...', {
      status,
      hasProcessingDocs,
      documentsCount: documents?.length || 0
    });

    const pollInterval = setInterval(async () => {
      console.log('🔄 [Step3AI] Polling for updates...');
      
      // Poll financial metrics (in case they were added)
      if (status === 'enriching') {
        await fetchFinancialMetrics();
      }
      
      // Poll documents status (to detect when processing completes)
      if (hasProcessingDocs) {
        console.log('📄 [Step3AI] Refreshing documents to check processing status...');
        await fetchDocuments();
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup
    return () => {
      console.log('🛑 [Step3AI] Stopping polling');
      clearInterval(pollInterval);
    };
  }, [localEnrichmentStatus, companyData?.enrichment_status, documents, fetchFinancialMetrics, fetchDocuments, companyId]);

  // Handle applying a recommendation
  const handleApplyRecommendation = useCallback((item: any, itemIndex?: number) => {
    if (!session?.user?.id || !companyId) {
      console.warn('Missing session or companyId for recommendation application');
      return;
    }

    // For Swedish users, show coming soon popup instead of direct application
    if (currentLocale === 'sv') {
      setSelectedRecommendationForPopup(item);
      setShowSwedishLendersPopup(true);
      return;
    }

    // Original application flow for other locales
    // Map recommendation item to application form data with all funding type parameters
    const fundingType = mapRecommendationTypeToFundingType(item.type);
    
    // Build URL parameters for FinanceApplicationFlow
    // Provide a sensible default amount if not specified in recommendation
    const defaultAmount = item.amount || 50000; // Default to €50,000 if no amount specified
    
    const params = new URLSearchParams({
      step: 'application',  // Start from application details step
      fundingType: fundingType,
      companyId: companyId,
      amount: String(defaultAmount),
    });

    // Add term months for business loans (with validation)
    if (fundingType.includes('business_loan') && item.termMonths) {
      // Validate and round termMonths to prevent floating point errors
      const termMonths = Math.round(Number(item.termMonths));
      if (Number.isFinite(termMonths) && termMonths > 0 && termMonths <= 360) {
        params.set('termMonths', String(termMonths));
      } else {
        console.warn(`⚠️ Invalid termMonths value: ${item.termMonths}, using default 12`);
        params.set('termMonths', '12'); // Default fallback
      }
    }

    // Add funding type specific parameters (with validation)
    if (fundingType === 'factoring_ar') {
      // Factoring parameters
      const totalNeed = Math.round(Number(defaultAmount));
      if (Number.isFinite(totalNeed) && totalNeed > 0) {
        params.set('factoring_totalFundingNeed', String(totalNeed));
      }
      
      // Financing percentage (default 80%, range 50-90%)
      const finPercent = item.guaranteesRequired !== null ? 
        (item.guaranteesRequired ? 80 : 70) : 80;
      if (finPercent >= 50 && finPercent <= 90) {
        params.set('factoring_financingPercentage', String(finPercent));
      }
      
      // Payment days (default 30, range 7-90)
      params.set('factoring_averagePaymentDays', '30');
      
    } else if (fundingType === 'leasing') {
      // Leasing parameters (with validation)
      if (item.termMonths) {
        const leaseTerm = Math.round(Number(item.termMonths));
        if (Number.isFinite(leaseTerm) && leaseTerm > 0 && leaseTerm <= 360) {
          params.set('leasing_leaseTerm', String(leaseTerm));
        } else {
          console.warn(`⚠️ Invalid lease term: ${item.termMonths}, using default 24`);
          params.set('leasing_leaseTerm', '24'); // Default 24 months for leasing
        }
      } else {
        params.set('leasing_leaseTerm', '24'); // Default if not provided
      }
      
      // Asset description from title or type
      const assetDesc = item.title || (item.type === 'leasing' ? 'Equipment' : 'Asset');
      params.set('leasing_asset', assetDesc);
      
    } else if (fundingType === 'business_loan_secured') {
      // Secured loan parameters
      // Collateral description from summary or default
      const collateral = item.summary || 'Real estate or equipment';
      params.set('secured_collateral', collateral);
      
    } else if (fundingType === 'credit_line') {
      // Credit line - no special parameters needed
      // Amount is already set as main amount parameter
    }

    // Add recommendation metadata
    if (item.title) {
      params.set('recommendationTitle', item.title);
    }
    if (item.summary) {
      params.set('recommendationSummary', item.summary);
    }
    if (item.costNotes) {
      params.set('recommendationCostNotes', item.costNotes);
    }

    // Navigate to FinanceApplicationFlow
    const applicationUrl = `/${currentLocale}/apply?${params.toString()}`;
    console.log('🚀 Navigating to application flow:', applicationUrl);
    
    // Use window.location to navigate to the application flow
    window.location.href = applicationUrl;
  }, [session?.user?.id, companyId, currentLocale]);

  // Map recommendation types to Step 7 funding types
  const mapRecommendationTypeToFundingType = (type: string): string => {
    switch (type) {
      case 'business_loan':
        return 'business_loan_unsecured';
      case 'business_loan_secured':
        return 'business_loan_secured';
      case 'factoring_ar':
        return 'factoring_ar';
      case 'credit_line':
        return 'credit_line';
      case 'leasing':
        return 'leasing';
      default:
        return 'business_loan_unsecured';
    }
  };

  // Function to get explanation why funding option is not recommended
  const getNotRecommendedReason = (type: string): string => {
    return t(`notRecommendedReasons.${type}`, {
      default: t('notRecommendedReasons.default')
    });
  };

  // Localize recommendation headings based on type
  const getRecommendationTypeLabel = (type: string, fallback?: string): string => {
    const normalized = (type || '').toLowerCase();
    switch (normalized) {
      case 'business_loan':
      case 'business_loan_unsecured':
        return t('recommendationType.business_loan_unsecured', { default: 'Yrityslaina (vakuudeton)' });
      case 'business_loan_secured':
        return t('recommendationType.business_loan_secured', { default: 'Yrityslaina (vakuudellinen)' });
      case 'credit_line':
        return t('recommendationType.credit_line', { default: 'Yrityslimiitti' });
      case 'factoring_ar':
        return t('recommendationType.factoring_ar', { default: 'Laskurahoitus (myyntisaamiset)' });
      case 'leasing':
        return t('recommendationType.leasing', { default: 'Leasing' });
      default:
        return fallback || type || '';
    }
  };

  // Determine if we already have a suitable financial statement
  useEffect(() => {
    // Heuristic: if any processed document exists with extraction_data.financial_data
    const processedHasFinancials = (documents || []).some((doc) =>
      (doc.processing_status === "completed" || doc.processed === true) &&
      !!doc.extraction_data?.financial_data
    );
    setHasLatestStatement(processedHasFinancials);
  }, [documents]);

  // Fetch comprehensive financial metrics when companyId changes
  // Fetch regardless of status - if documents are processed, metrics will be available
  useEffect(() => {
    if (!companyId) return;
    
    console.log('🔄 [Step3AI-useEffect] Triggering initial financial metrics fetch for company:', companyId);
    fetchFinancialMetrics();
  }, [companyId, fetchFinancialMetrics]);

  // Refresh financial metrics when documents change (after upload/processing)
  useEffect(() => {
    if (!companyId || documents.length === 0) return;

    // Track newly completed documents to avoid re-trigger loops
    const newlyCompleted = documents.filter(doc => doc.processing_status === 'completed');
    const prev = completedDocIdsRef.current;
    const newIds: string[] = [];
    newlyCompleted.forEach(doc => {
      if (doc.id && !prev.has(doc.id)) newIds.push(doc.id);
    });

    if (newIds.length > 0) {
      newIds.forEach(id => prev.add(id));
      // Slight delay to allow DB updates to propagate, but only once per new completion
      const timer = setTimeout(() => {
        console.log('🔄 [Step3AI] Refreshing financial metrics and documents after completed document(s):', newIds);
        fetchFinancialMetrics();
        fetchDocuments(); // Also refresh documents list to update UI
      }, 2000); // Increased delay to 2s for DB propagation
      return () => clearTimeout(timer);
    }
  }, [documents, companyId, fetchFinancialMetrics, fetchDocuments]);

  const latestMetrics: FinancialMetric | null = useMemo(() => {
    // Prioritize data from comprehensive financial metrics (yearlyFinancialData)
    if (yearlyFinancialData && yearlyFinancialData.length > 0) {
      const latest = yearlyFinancialData[yearlyFinancialData.length - 1];
      return {
        revenue_current: latest.revenue,
        operational_cash_flow: latest.ebitda, // Using ebitda field which maps to operational_cash_flow
        total_assets: latest.totalAssets,
        total_equity: latest.totalEquity,
        fiscal_year: latest.fiscal_year,
        fiscal_period: 'annual',
      } as any;
    }
    
    // Fallback to original financialDataArray
    if (!financialDataArray || financialDataArray.length === 0) return null;
    return financialDataArray[0];
  }, [yearlyFinancialData, financialDataArray]);

  // Public company details from step 2 (enriched/public data)
  const enrichedData = useMemo(() => companyData?.metadata?.enriched_data || {}, [companyData]);
  const publicFinancialData = useMemo(() => companyData?.metadata?.financial_data || {}, [companyData]);
  const publicYearly = useMemo<any[]>(() => Array.isArray(publicFinancialData?.yearly) ? publicFinancialData.yearly : [], [publicFinancialData]);
  
  // Get currency from company financial data or default to EUR
  const companyCurrency = useMemo(() => {
    // Try to get currency from financial_data metadata first
    if (publicFinancialData?.currency) {
      return publicFinancialData.currency;
    }
    
    // Determine by company country_code (NOT locale)
    if (companyData?.country_code) {
      if (companyData.country_code === 'SE') return 'SEK';
      if (companyData.country_code === 'NO') return 'NOK';  
      if (companyData.country_code === 'DK') return 'DKK';
    }
    
    // Fallback: detect from business_id
    if (companyData?.business_id) {
      // Finnish: 1234567-8
      if (/^\d{7}-[\dA-Za-z]$/.test(companyData.business_id)) return 'EUR';
      // Swedish: 556677-8899
      if (/^\d{6}-\d{4}$/.test(companyData.business_id)) return 'SEK';
      // Norwegian: 123456789
      if (/^\d{9}$/.test(companyData.business_id)) return 'NOK';
      // Danish: 12345678
      if (/^\d{8}$/.test(companyData.business_id)) return 'DKK';
    }
    
    return 'EUR'; // Default to EUR
  }, [publicFinancialData, companyData]);
  

  const basicInfoItems = useMemo(() => {
    const items: { label: string; value?: string | number | null }[] = [];
    
    // Get basic company info for chips (NOT duplicated in expanded section)
    const industry: string | undefined = enrichedData.industry || companyData?.business_area || companyData?.industry;
    const employees: number | string | undefined =
      enrichedData.personnel?.count || companyData?.employee_count || companyData?.employees;
    const registrationDate: string | undefined = companyData?.registration_date || companyData?.registrationDate;
    const website: string | undefined = companyData?.website || enrichedData.website;

    // Show basic info chips only
    if (industry) items.push({ label: t("company.industry", { default: "Industry" }), value: String(industry) });
    if (employees)
      items.push({ label: t("company.employees", { default: "Employees" }), value: String(employees) });
    if (registrationDate)
      items.push({ label: t("step2.registrationDateLabel", { default: "Registration Date" }), value: registrationDate });
    if (website) items.push({ label: t("step2.websiteLabel", { default: "Website" }), value: website });
    return items;
  }, [companyData, enrichedData, t]);

  // Separate array for EXPANDED section details
  const expandedInfoItems = useMemo(() => {
    const items: { label: string; value?: string | number | null }[] = [];

    // Get detailed company info for EXPANDED section only
    // Prioritize locally fetched enriched data over prop-based data
    const description: string | undefined = localCompanyData?.description || companyData?.description;
    const productsRaw: any = localCompanyData?.products || companyData?.products;
    const market: string | undefined = localCompanyData?.market || companyData?.market;

    // Show detailed info in expanded section
    if (description) {
      items.push({ label: t("company.description", { default: "Description" }), value: String(description) });
    }
    
    // Handle products - can be array or string
    if (productsRaw) {
      let productsValue: string;
      if (Array.isArray(productsRaw)) {
        productsValue = productsRaw.join(', ');
      } else if (typeof productsRaw === 'string') {
        productsValue = productsRaw;
      } else {
        productsValue = String(productsRaw);
      }
      items.push({ label: t("company.products", { default: "Products" }), value: productsValue });
    }
    
    if (market) {
      items.push({ label: t("company.market", { default: "Market" }), value: String(market) });
    }
    
    return items;
  }, [companyData, localCompanyData, t]);

  const availableIndicators = useMemo(() => {
    console.log('🔍 [Step3AI] availableIndicators calculation:', {
      yearlyFinancialDataLength: yearlyFinancialData.length,
      latestFinancialRatios: latestFinancialRatios,
      latestMetrics: latestMetrics
    });
    
    // Prioritize comprehensive financial data from yearlyFinancialData and ratios
    const latestYearData = yearlyFinancialData[yearlyFinancialData.length - 1];
    
    const items: { key: string; label: string; value: number | null; format?: (n: number) => string }[] = [];
    
    // Add comprehensive financial indicators if available
    if (latestYearData) {
      if (latestYearData.revenue) items.push({ key: "revenue", label: t("financial.revenue", { default: "Revenue" }), value: latestYearData.revenue, format: (value: number) => formatCurrency(value, companyCurrency) });
      if (latestYearData.ebitda) items.push({ key: "ebitda", label: t("financial.ebitda", { default: "EBITDA" }), value: latestYearData.ebitda, format: (value: number) => formatCurrency(value, companyCurrency) });
      if (latestYearData.totalAssets) items.push({ key: "totalAssets", label: t("financial.totalAssets", { default: "Total assets" }), value: latestYearData.totalAssets, format: (value: number) => formatCurrency(value, companyCurrency) });
      if (latestYearData.totalEquity) items.push({ key: "totalEquity", label: t("financial.equity", { default: "Equity" }), value: latestYearData.totalEquity, format: (value: number) => formatCurrency(value, companyCurrency) });
      if (latestYearData.cashAndReceivables) items.push({ key: "cash", label: t("financial.cash", { default: "Cash & Receivables" }), value: latestYearData.cashAndReceivables, format: (value: number) => formatCurrency(value, companyCurrency) });
    }
    
    // Add financial ratios if available
    if (latestFinancialRatios.currentRatio) items.push({ key: "currentRatio", label: t("financial.currentRatio", { default: "Current Ratio" }), value: latestFinancialRatios.currentRatio, format: formatRatio });
    if (latestFinancialRatios.roe) items.push({ key: "roe", label: t("financial.roe", { default: "ROE %" }), value: latestFinancialRatios.roe, format: formatPercent });
    
    // Fallback to basic metrics if comprehensive data not available
    if (items.length === 0 && latestMetrics) {
      const fallbackItems = [
        { key: "revenue_current", label: t("financial.revenue", { default: "Revenue" }), format: (value: number) => formatCurrency(value, companyCurrency) },
        { key: "operational_cash_flow", label: t("financial.netProfit", { default: "Net profit" }), format: (value: number) => formatCurrency(value, companyCurrency) },
        { key: "total_assets", label: t("financial.totalAssets", { default: "Total assets" }), format: (value: number) => formatCurrency(value, companyCurrency) },
        { key: "total_liabilities", label: t("financial.totalLiabilities", { default: "Total liabilities" }), format: (value: number) => formatCurrency(value, companyCurrency) },
        { key: "total_equity", label: t("financial.equity", { default: "Equity" }), format: (value: number) => formatCurrency(value, companyCurrency) },
      ];
      return fallbackItems
        .map(({ key, label, format }) => {
          const raw = latestMetrics[key] as unknown as number | null | undefined;
          if (raw === null || raw === undefined) return null;
          const parsedValue = typeof raw === "string" ? parseFloat(raw) : raw;
          if (typeof parsedValue !== "number" || isNaN(parsedValue)) return null;
          const text = format ? format(parsedValue) : String(parsedValue);
          return { label, value: text };
        })
        .filter(Boolean) as { label: string; value: string }[];
    }
    
    return items
      .map(({ label, value, format }) => {
        if (value === null || value === undefined) return null;
        const text = typeof value === "number" ? (format ? format(value) : String(value)) : String(value);
        return { label, value: text };
      })
      .filter(Boolean) as { label: string; value: string }[];
  }, [latestMetrics, yearlyFinancialData, latestFinancialRatios, t]);

  // Extract transparency data from latest financial metrics
  const financialTransparencyData = useMemo(() => {
    const latestMetric = financialDataArray && financialDataArray.length > 0 
      ? financialDataArray[financialDataArray.length - 1] 
      : null;

    if (!latestMetric) return null;

    return {
      confidence: latestMetric.data_confidence || null,
      sources: latestMetric.data_sources || null,
      dataSource: latestMetric.data_source || null,
      lastUpdated: latestMetric.updated_at || null,
    };
  }, [financialDataArray]);

  // Helpers to parse/format numbers from public data
  const parseFinancialValue = (value: any): number | null => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value !== "Not available") {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ""));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };
  const formatNumber = (value: number): string => {
    try {
      const currencySymbol = companyCurrency === 'SEK' ? 'kr' : companyCurrency === 'NOK' ? 'kr' : companyCurrency === 'DKK' ? 'kr' : '€';
      
      // For SEK, use different thresholds since values are ~10x larger than EUR
      const millionThreshold = companyCurrency === 'SEK' ? 10_000_000 : 1_000_000;
      const thousandThreshold = companyCurrency === 'SEK' ? 10_000 : 1_000;
      
      if (value >= millionThreshold) {
        const millions = value / millionThreshold;
        return `${millions.toFixed(1)}M ${currencySymbol}`;
      }
      if (value >= thousandThreshold) {
        const thousands = value / thousandThreshold;
        return `${thousands.toFixed(0)}k ${currencySymbol}`;
      }
      return formatCurrency(value, companyCurrency);
    } catch {
      return `${value}`;
    }
  };

  // Fetch existing recommendations on load and show them instead of chat
  useEffect(() => {
    const fetchExisting = async () => {
      if (!companyId) return;
      try {
        setRecommendationsLoading(true);
        const { data: recs, error } = await supabase
          .from('funding_recommendations')
          .select('id, recommendation_details, analysis, summary, created_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) {
          console.error('Error fetching existing recommendations:', error);
          return;
        }
        if (recs && recs.length > 0) {
          const latest = recs[0];
          const items = Array.isArray(latest.recommendation_details)
            ? latest.recommendation_details.map((d: any) => ({
                type: d.type,
                title: d.title || d.type,
                summary: d.suitability_rationale || d.details || '',
                amount: d.amount || undefined,
                termMonths: d.termMonths || undefined,
                guaranteesRequired: d.guaranteesRequired ?? undefined,
                costNotes: d.costNotes || undefined,
              }))
            : [];
          if (items.length > 0) {
            setRecommendation({ items, comparison: latest.analysis || '' });
            setIsConversationDone(true);
            // Don't set conversationStarted(true) here - this will show recommendations with start new analysis button
            setRecommendationsExpanded(true);
          }
        }
      } finally {
        setRecommendationsLoading(false);
      }
    };
    fetchExisting();
  }, [companyId, supabase]);

  // Check if company data is missing critical information
  useEffect(() => {
    if (companyData && companyId) {
      // DON'T show error if enrichment is in progress
      const status = localEnrichmentStatus || companyData.enrichment_status;
      if (status === 'pending' || status === 'enriching') {
        setCompanyDataError(null);
        return;
      }

      // Check if enriched data or enhanced analysis is missing
      const hasEnrichedData = companyData.metadata?.enriched_data;
      const hasEnhancedAnalysis = companyData.metadata?.enhanced_analysis;

      // Only show error if enrichment is complete/failed AND no data
      if (!hasEnrichedData && !hasEnhancedAnalysis && (localEnrichmentStatus === 'failed' || companyData.enrichment_status === 'failed')) {
        setCompanyDataError(t('ui.companyDataMissing', { default: 'Yrityksen perustiedot puuttuvat tai niiden haku on kesken.' }));
      } else {
        setCompanyDataError(null); // Clear error if data is found or still enriching
      }
    }
  }, [companyData, companyId, localEnrichmentStatus, t]);

  // Function to start the conversation after intro
  const startConversation = useCallback(async () => {
    setConversationStarted(true);
    setLoadingNext(true);
    
    // Add intro completion to turns
    const introMessage = t("chat.intro.startButton", { default: "Aloitetaan" });
    pushTurn({ role: "user", content: introMessage, timestamp: Date.now() });
    
    try {
      console.log('🚀 [startConversation] Session object:', session);
      console.log('🚀 [startConversation] Access token:', session?.access_token);
      
      // Check if session and access token exist
      if (!session?.access_token) {
        console.error('🚀 [startConversation] No access token available');
        throw new Error('Authentication expired. Please refresh the page and sign in again.');
      }
      
      // Make API call to get the first real question (financing needs options)
      const response = await fetch("/api/onboarding/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          locale: currentLocale,
          companyId,
          userMessage: introMessage,
          selectedValues: [],
          history: [], // Start fresh history for the API call
          avoidQuestions: [],
          provider: selectedModel.startsWith('gemini') ? 'google' : 'openai',
          model: selectedModel,
          // No analysisType sent - LLM will determine first question directly
          source: urlContext.source,
          context: urlContext.context,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.nextQuestion) {
        setQuestion(data.nextQuestion);
        setOptions(data.options || []);
        setOptionType("multi"); // Always use multi-select
        setCfoGuidance(data.cfoGuidance || "");
        
        // Add CFO guidance to history, but keep question separate
        if (data.cfoGuidance) {
          pushTurn({ role: "assistant", content: data.cfoGuidance, timestamp: Date.now() + 1 });
        }
        // Store the question separately, not in history yet
        setCurrentQuestionTurn({ 
          role: "assistant", 
          content: data.nextQuestion, 
          timestamp: Date.now() + 2
        });
      }
      
    } catch (error) {
      console.error("Failed to start conversation:", error);
      // Fallback to a basic question if API fails
      const fallbackQuestion = t('ui.primaryFinancingNeed', {
        default: "What is your primary financing need?"
      });
      
      setQuestion(fallbackQuestion);
      setOptions([]);
      setOptionType("multi"); // Always use multi-select
      setCfoGuidance("");
      
      // Store fallback question separately, not in history yet
      setCurrentQuestionTurn({ role: "assistant", content: fallbackQuestion, timestamp: Date.now() + 1 });
    } finally {
      setLoadingNext(false);
    }
  }, [currentLocale, t, companyId, session?.access_token, selectedModel]);

  // No automatic initialization - wait for user to click start button

  const onUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setIsUploadingLocal(true);
      try {
        await handleFileUpload([file]);
        await fetchDocuments();
        
        // Wait a moment for document processing to complete, then refresh financial metrics
        setTimeout(async () => {
          console.log('🔄 [Step3AI] Refreshing financial metrics after document processing...');
          await fetchFinancialMetrics();
        }, 2000);
      } finally {
        setIsUploadingLocal(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [handleFileUpload, fetchDocuments]
  );

  // Retry financial data fetching
  const handleRetryFinancialFetch = useCallback(async () => {
    if (!companyId || isRetryingFetch) return;
    
    console.log('🔄 [Step3AI] Retrying financial data fetch for company:', companyId);
    setIsRetryingFetch(true);
    
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`/api/companies/${companyId}/retry-financial-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry fetch');
      }

      console.log('✅ [Step3AI] Retry triggered successfully');
      
      // Show success feedback
      showQuickFeedback(
        'success',
        t('financial.retryStarted', { default: 'Aloitettu talouslukujen uudelleenhaku taustalla...' }),
        '',
        4000
      );

      // Wait a bit and then refresh financial metrics
      setTimeout(async () => {
        console.log('🔄 [Step3AI] Refreshing financial metrics after retry...');
        await fetchFinancialMetrics();
      }, 3000);

    } catch (error: any) {
      console.error('❌ [Step3AI] Failed to retry fetch:', error);
      showQuickFeedback(
        'error',
        t('financial.retryFailed', { default: 'Uudelleenhaun aloitus epäonnistui' }),
        error.message || '',
        4000
      );
    } finally {
      setIsRetryingFetch(false);
    }
  }, [companyId, isRetryingFetch, supabase, t, fetchFinancialMetrics]);

  // Handle manual financial input success
  const handleManualInputSuccess = useCallback(async (data: any) => {
    console.log('✅ [Step3AI] Manual financial data saved successfully:', data);
    
    // Hide manual input form
    setShowManualInput(false);
    
    // Refresh financial metrics to show new data
    setTimeout(async () => {
      console.log('🔄 [Step3AI] Refreshing financial metrics after manual input...');
      await fetchFinancialMetrics();
    }, 1000);
  }, [fetchFinancialMetrics]);

  const handleOptionToggle = (value: string) => {
    if (optionType === "single") {
      setSelected([value]);
    } else {
      setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    }
  };

  const toggleRecommendationCollapse = (index: number) => {
    setCollapsedRecommendations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        // Jos oli supistettu, poista supistettujen listalta (eli laajenna)
        newSet.delete(index);
      } else {
        // Jos oli laajennettu, lisää supistettujen listalle (eli supista)
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Handle feedback navigation for Swedish users - redirect to survey
  const handleFeedbackNavigation = useCallback(async () => {
    try {
      // Create public survey invitation and redirect
      const response = await fetch('/api/surveys/invitations/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'swedish-trial', email: null, language: currentLocale })
      });
      
      const data = await response.json();
      if (data.invitation?.token) {
        window.open(`/${currentLocale}/survey/${data.invitation.token}`, '_blank');
      }
    } catch (error) {
      console.error('Error creating survey invitation:', error);
    }
  }, [currentLocale]);

  // Show a subtle hint to press continue when user has selected options but not submitted
  useEffect(() => {
    if (selected.length > 0 && !loadingNext) {
      setShowPressHint(true);
      if (pressHintTimerRef.current) clearTimeout(pressHintTimerRef.current);
      pressHintTimerRef.current = setTimeout(() => setShowPressHint(false), 5000);
    } else {
      setShowPressHint(false);
    }
    return () => {
      if (pressHintTimerRef.current) clearTimeout(pressHintTimerRef.current);
    };
  }, [selected, loadingNext]);

  const pushTurn = (turn: ConversationTurn) => setTurns((prev) => [...prev, turn]);

  // Auto-scroll CFO history to the bottom whenever turns change
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [turns]);

  // Dynamic conversation height based on content length
  const [recommendationsHeight, setRecommendationsHeight] = useState<string>("min-h-[200px]");
  
  useEffect(() => {
    const totalTurns = turns.length;
    let chatHeight, recHeight;
    
    if (totalTurns === 0) {
      chatHeight = "min-h-[200px]";
      recHeight = "min-h-[200px]";
    } else if (totalTurns <= 2) {
      chatHeight = "min-h-[250px] max-h-[350px]";
      recHeight = "min-h-[350px]"; // Match max-height, allow growth
    } else if (totalTurns <= 4) {
      chatHeight = "min-h-[300px] max-h-[450px]";
      recHeight = "min-h-[450px]";
    } else if (totalTurns <= 6) {
      chatHeight = "min-h-[400px] max-h-[550px]";
      recHeight = "min-h-[550px]";
    } else {
      chatHeight = "min-h-[450px] max-h-[600px]";
      recHeight = "min-h-[600px]";
    }
    
    setConversationHeight(chatHeight);
    setRecommendationsHeight(recHeight);
  }, [turns.length]);

  // Unified submit function that handles both regular conversation and recommendations follow-up
  const submitMessage = async () => {
    const userInput = input?.trim();
    const hasSelection = selected.length > 0;
    const isRecommendationFollowUp = isConversationDone && shouldShowRecommendations && displayRecommendations && displayRecommendations.items && displayRecommendations.items.length > 0;
    
    if (!hasSelection && !userInput) return;

    // Hide hint on submit
    setShowPressHint(false);
    
    // Reset retry count for new user action
    retryCountRef.current = 0;

    // Aloita feedback-prosessi
    const feedbackManager = getFeedbackManager(currentLocale);
    const processId = `conversation-${Date.now()}`;
    
    feedbackManager.startProcess(processId, 'AI-keskustelu', {
      canCancel: false,
      canRetry: true,
      estimatedDuration: 15000 // 15 sekuntia
    });

    // Move current question to history before adding user response
    if (currentQuestionTurn) {
      pushTurn(currentQuestionTurn);
      setCurrentQuestionTurn(null);
    }

    // Add user message to conversation
    const text = isRecommendationFollowUp 
      ? userInput // For recommendations, just use the input text
      : [selected.map((s) => options.find((o) => o.value === s)?.label).filter(Boolean).join(", "), userInput]
          .filter(Boolean)
          .join("; ");
    
    pushTurn({ role: "user", content: text, timestamp: Date.now() });
    setInput("");
    setSelected([]);
    setLoadingNext(true);

    // Determine provider from model name
    const provider = selectedModel.startsWith('gemini') ? 'google' : 
                     selectedModel.startsWith('gpt') ? 'openai' : 'auto';

    const requestBodyBase = {
      locale: currentLocale,
      companyId,
      userMessage: text,
      selectedValues: selected,
      history: turns,
      avoidQuestions: turns.filter((t) => t.role === "assistant").map((t) => t.content),
      provider,
      model: selectedModel,
      // analysisType removed - LLM determines flow directly
      isRecommendationFollowUp,
      currentRecommendations: isRecommendationFollowUp ? recommendation : undefined,
      // Phase 4 parameters for continued CFO conversation after recommendations
      isPhase4: isRecommendationFollowUp,
      phase4Action: isRecommendationFollowUp ? 'follow_up_question' : undefined,
      phase4Message: isRecommendationFollowUp ? text : undefined,
      // Context parameters for currency detection
      source: urlContext.source,
      context: urlContext.context,
    };

    try {
      console.log('🚀 [submitMessage] Session object:', session);
      console.log('🚀 [submitMessage] Access token:', session?.access_token);
      
      // Check if session and access token exist
      if (!session?.access_token) {
        console.error('🚀 [submitMessage] No access token available');
        feedbackManager.error.network(processId);
        throw new Error('Authentication expired. Please refresh the page and sign in again.');
      }
      
      console.log('🚀 [submitMessage] Request body:', requestBodyBase);
      
      // Päivitä feedback: aloitetaan AI-analyysi
      feedbackManager.ai.analyzing(processId, 25);
      
      const response = await fetch("/api/onboarding/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify(requestBodyBase),
      });

      if (!response.ok) {
        console.error('❌ Conversation API error:', response.status, response.statusText);
        
        // Enhanced error handling for different status codes
        if (response.status === 401) {
          feedbackManager.error.network(processId);
          throw new Error(t('ui.authExpired'));
        } else if (response.status === 502) {
          feedbackManager.error.temporary(processId, 'CFO väliaikaisesti poissa käytöstä');
          throw new Error(t('ui.cfoTempUnavailable'));
        } else if (response.status === 503) {
          const errorData = await response.json().catch(() => null);
          const retryAfter = errorData?.retryAfter || 30;
          const errorMessage = errorData?.error || t('ui.cfoOverloaded', { retryAfter });
          feedbackManager.error.overload(processId, retryAfter * 1000);
          throw new Error(errorMessage);
        } else if (response.status === 504) {
          feedbackManager.ai.timeout(processId);
          throw new Error(t('ui.connectionLost'));
        } else if (response.status >= 500) {
          feedbackManager.error.temporary(processId, 'Tekninen vika palvelimella');
          throw new Error(t('ui.cfoTechnicalIssue'));
        } else if (response.status === 429) {
          feedbackManager.error.overload(processId, 60000); // 1 minuutti
          throw new Error(t('ui.tooManyRequests'));
        } else {
          feedbackManager.error.network(processId);
          throw new Error(t('ui.networkErrorGeneric', { status: response.status }));
        }
      }

      // Päivitä feedback: vastaus saatu
      feedbackManager.updateProgress(processId, 75);

      const data = await response.json();

      console.log('📥 [Step3AI] Received conversation response:', {
        hasNextQuestion: !!data.nextQuestion,
        hasOptions: !!data.options,
        optionsCount: data.options?.length,
        hasCfoGuidance: !!data.cfoGuidance,
        isDone: data.done,
        hasRecommendation: !!data.recommendation
      });

      if (isRecommendationFollowUp) {
        // Handle recommendations follow-up - unified assistant role
        if (data.cfoGuidance) {
          pushTurn({ role: "assistant", content: data.cfoGuidance, timestamp: Date.now() });
          setCfoGuidance(data.cfoGuidance);
        }

        if (data.updatedRecommendations) {
          setRecommendation(data.updatedRecommendations);
          const updateMessage = t('ui.recommendationsUpdated');
          pushTurn({ role: "assistant", content: updateMessage, timestamp: Date.now() + 1 });
        }
        
        // Merkitse prosessi onnistuneeksi
        feedbackManager.completeProcess(processId, true, 'Suositukset päivitetty');
      } else {
        // Handle regular conversation - CFO guidance first, then question
        if (data.cfoGuidance) {
          pushTurn({ role: "assistant", content: data.cfoGuidance, timestamp: Date.now() });
          setCfoGuidance(data.cfoGuidance);
        }
        
        if (data.nextQuestion) {
          setQuestion(data.nextQuestion);
          setOptions(data.options || []);
          setOptionType("multi"); // Always use multi-select
          // Store question separately, not in history yet
          setCurrentQuestionTurn({ role: "assistant", content: data.nextQuestion, timestamp: Date.now() + 1 });
          setAskedQuestions((prev) => [...prev, data.nextQuestion]);
          
          // Merkitse prosessi onnistuneeksi
          feedbackManager.completeProcess(processId, true, 'Seuraava kysymys saatu');
        }

        // Check for conversation completion with recommendations
        const hasValidRecommendations = data.recommendation && 
          data.recommendation.items && 
          data.recommendation.items.length > 0;
        
        if (data.done || hasValidRecommendations) {
          setIsConversationDone(true);
          setRecommendation(data.recommendation);
          // Auto-expand recommendations when they first appear
          if (hasValidRecommendations) {
            setRecommendationsExpanded(true);
          }
          
          // Save financing needs data
          try {
            const payload = {
              summary: data.collected?.summary || "",
              answers: data.collected?.answers || [],
            };
            if (session?.access_token && companyId) {
              const saveRes = await fetch("/api/financing-needs", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  companyId,
                  userId: session.user?.id,
                  questionnaire: payload,
                }),
              });
              if (!saveRes.ok) {
                console.warn("Failed to save financing needs from conversation");
              }
            }
          } catch (e) {
            console.warn("Finalize flow error:", e);
          }
        }
      }

    } catch (error: any) {
      console.error('❌ [Step3AI] Conversation API error:', error);
      
      // Merkitse prosessi epäonnistuneeksi
      feedbackManager.completeProcess(processId, false, error.message);
      
      // Check if it's a 503 overload error that we should retry automatically
      const isOverloadError = error?.message?.includes('överbelastad') || 
                              error?.message?.includes('överbelastat') || 
                              error?.message?.includes('overloaded') ||
                              error?.message?.includes('timeout');
      
      if (isOverloadError && retryCountRef.current < 2) { // Allow up to 2 retries for overload errors
        retryCountRef.current++;
        console.log(`🔄 [Step3AI] Retrying conversation (attempt ${retryCountRef.current}/2) after overload error`);
        
        // Päivitä feedback uudelleenyrityksestä
        feedbackManager.ai.retrying(processId, retryCountRef.current, 2);
        
        // Show user that we're retrying with countdown
        const retryDelay = 3000;
        pushTurn({
          role: "assistant",
          content: t("ui.retryingAfterOverload", { 
            default: "CFO-assistenten är överbelastad. Försöker igen automatiskt om 3 sekunder..." 
          }),
          timestamp: Date.now(),
          isRetrying: true,
        });
        
        // Start auto retry
        startAutoRetry(userInput, selected, retryDelay);
        return;
      }
      
      // Store the failed request for manual retry
      setLastFailedRequest({
        userInput,
        optionResults: selected,
        timestamp: Date.now()
      });
      
      // Reset retry count for next user action
      retryCountRef.current = 0;
      
      const errorMessage = isRecommendationFollowUp 
        ? t("chat.error.generic", { default: "Pahoittelut, en saanut vastausta kysymykseenne. Tekninen vika - voit yrittää uudelleen." })
        : t("chat.error.generic", { default: "Pahoittelut, en saanut seuraavaa kysymystä haettua. Tekninen vika - voit yrittää uudelleen." });
      
      pushTurn({
        role: "assistant",
        content: errorMessage,
        timestamp: Date.now(),
        hasError: true,
        canRetry: true,
      });
    } finally {
      setLoadingNext(false);
    }
  };


  // Display logic for recommendations - use persisted version if available
  // See: docs/development/features/ONBOARDING_RECOMMENDATIONS_PERSISTENCE.md
  const displayRecommendations = persistedRecommendations;
  const shouldShowRecommendations = hasReceivedRecommendations;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* CFO Conversation - Primary interaction point */}
      <div className={`grid gap-6 items-stretch ${
        shouldShowRecommendations && displayRecommendations && displayRecommendations.items && displayRecommendations.items.length > 0 
          ? recommendationsExpanded 
            ? "grid-cols-1 xl:grid-cols-5" // Chat narrower when recommendations expanded (2 cols for chat, 3 for recommendations)
            : "grid-cols-1 lg:grid-cols-4" // Chat wider when recommendations collapsed
          : "grid-cols-1" // Full width when no recommendations
      }`}>
        {/* Chat Area */}
        <div className={`space-y-4 flex flex-col ${
          shouldShowRecommendations && displayRecommendations && displayRecommendations.items && displayRecommendations.items.length > 0 
            ? recommendationsExpanded 
              ? "lg:col-span-2" // Chat takes 2 cols when recommendations expanded (2 + 3 = 5)
              : "lg:col-span-3" // Chat takes 3 cols when recommendations collapsed (3 + 1 = 4)
            : "lg:col-span-1" // Full width when no recommendations
        }`}>
          {!conversationStarted ? (
            /* Welcome/Intro Screen or Recommendations Summary */
            shouldShowRecommendations && displayRecommendations && displayRecommendations.items && displayRecommendations.items.length > 0 ? (
              /* Show existing recommendations with start new analysis button */
              <Card className="bg-gray-900/60 border border-gold-primary/30 text-gray-100 p-6">
                <div className="text-center mb-6">
                  <div className="relative h-12 w-12 mx-auto mb-3 rounded-full overflow-hidden border border-gold-primary/40">
                    <Image
                      src="/images/mascots/sloth-magnifying-glass-optimized.webp"
                      alt="CFO Assistant"
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gold-primary mb-2">
                    {t('ui.analysisComplete')}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {t('ui.analysisCompleteDescription', {
                      default: 'Your financing recommendations are ready. You can review them on the right and apply directly, or start a new analysis.'
                    })}
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      // Reset all conversation state to start fresh
                      setConversationStarted(false);
                      setIsConversationDone(false);
                      setRecommendation(null);
                      setTurns([]);
                      setAskedQuestions([]);
                      setQuestion("");
                      setOptions([]);
                      setSelected([]);
                      setInput("");
                      setCfoGuidance("");
                      setLoadingNext(false);
                      setCurrentQuestionTurn(null);
                      // Start the conversation
                      startConversation();
                    }}
                    className="bg-gold-primary hover:bg-gold-primary/90 text-black font-medium py-3 px-6 rounded-lg transition-colors shadow-lg"
                  >
                    {t('ui.startNewAnalysis')}
                  </Button>
                </div>
              </Card>
            ) : (
              /* Welcome/Intro Screen for first time */
              <Card className="bg-gray-900/60 border border-gold-primary/30 text-gray-100 p-8 text-center">
                <div className="relative h-16 w-16 mx-auto mb-4 rounded-full overflow-hidden border border-gold-primary/40">
                  <Image
                    src="/images/mascots/sloth-magnifying-glass-optimized.webp"
                    alt="CFO Assistant"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gold-primary mb-4">
                  CFO – {t("chat.assistant", { default: "avustaja" })}
                </h3>
                <p className="text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
                  {t("chat.intro.greeting", { 
                    default: "Hei! Olen Trusty Financen kokenut rahoitusasiantuntija. Teen sinulle nopean rahoituskartoituksen muutamalla kysymyksellä. Aloitetaanko?" 
                  })}
                </p>
                
                {/* Show warning if enrichment timed out */}
                {enrichmentTimedOut && (localEnrichmentStatus === 'enriching' || localEnrichmentStatus === 'pending') && (
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-200">
                        {t("company.enrichmentTimeout", { 
                          default: "Yrityksen taustatietojen haku kestää odotettua kauemmin. Voit silti aloittaa keskustelun - tiedot haetaan taustalla." 
                        })}
                      </div>
                    </div>
                  </div>
                )}
                <Button
                  onClick={startConversation}
                  disabled={
                    loadingNext || 
                    documents.some(d => d.processing_status === 'processing' || d.processing_status === 'pending') ||
                    (!enrichmentTimedOut && 
                     localEnrichmentStatus !== 'pending_documents' && 
                     companyData?.enrichment_status !== 'pending_documents' && (
                      localEnrichmentStatus === 'enriching' ||
                      localEnrichmentStatus === 'pending' ||
                      companyData?.enrichment_status === 'enriching' ||
                      companyData?.enrichment_status === 'pending'
                    ))
                  }
                  className="bg-gold-primary hover:bg-gold-primary/90 text-black font-medium py-3 px-8 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {documents.some(d => d.processing_status === 'processing' || d.processing_status === 'pending') ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("chat.analyzing", { default: "Analysoidaan tilinpäätöstä..." })}
                    </div>
                  ) : loadingNext ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("chat.thinking", { default: "Pohditaan..." })}
                    </div>
                  ) : (
                    t("chat.intro.startButton", { default: "Aloitetaan" })
                  )}
                </Button>
              </Card>
            )
          ) : (
            /* Chat Interface */
            <div className="space-y-4">
              {/* Unified Conversation History - All questions and answers in one place */}
              <Card className={`bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/80 border border-gold-primary/30 text-gray-100 p-4 ${conversationHeight} overflow-y-auto flex-1 shadow-xl`} ref={historyRef}>
                <div className="space-y-3">
                  {/* Show all conversation turns */}
                  {turns.map((turn, idx) => (
                    <div key={`${turn.role}-${idx}-${turn.timestamp}`} className={`flex gap-3 ${
                      turn.role === "assistant" 
                        ? "bg-gradient-to-r from-gold-primary/5 to-transparent p-3 rounded-lg border-l-4 border-gold-primary/40" 
                        : "bg-gradient-to-l from-blue-500/5 to-transparent p-3 rounded-lg border-r-4 border-blue-400/40"
                    }`}>
                      <div className="flex-shrink-0 mt-1">
                        {turn.role === "assistant" ? (
                          <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-gold-primary/60 shadow-lg bg-gradient-to-br from-gold-primary/20 to-gold-secondary/20">
                            <Image
                              src="/images/mascots/sloth-magnifying-glass-optimized.webp"
                              alt="CFO Assistant"
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-400/60 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold mb-2 ${
                          turn.role === "assistant" ? "text-gold-primary" : "text-blue-300"
                        }`}>
                          {turn.role === "assistant" 
                            ? `CFO – ${t("chat.assistant", { default: "avustaja" })}`
                            : t('ui.you')}
                        </div>
                        <div className="text-sm">
                          <FormattedText content={turn.content} />
                        </div>
                        {/* Retry button for failed messages */}
                        {turn.hasError && turn.canRetry && lastFailedRequest && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleManualRetry}
                              className="bg-red-900/20 border-red-400/30 text-red-300 hover:bg-red-900/30 hover:border-red-400/50"
                              disabled={loadingNext || isAutoRetrying}
                            >
                              {loadingNext || isAutoRetrying ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  {t("ui.retrying", { default: "Yritetään uudelleen..." })}
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {t("ui.tryAgain", { default: "Kokeile uudelleen" })}
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        {/* Auto-retry indicator */}
                        {turn.isRetrying && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t("ui.autoRetrying", { default: "Yritetään automaattisesti uudelleen..." })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Show current question inline if not completed and not loading */}
                  {!isConversationDone && (question || currentQuestionTurn) && !loadingNext && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="relative h-5 w-5 rounded-full overflow-hidden border border-gold-primary/40">
                          <Image
                            src="/images/mascots/sloth-magnifying-glass-optimized.webp"
                            alt="CFO Assistant"
                            fill
                            sizes="20px"
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gold-primary mb-1">
                          CFO – {t("chat.assistant", { default: "avustaja" })}
                        </div>
                        <div className="text-sm text-gray-300 whitespace-pre-line">
                          {question || currentQuestionTurn?.content}
                        </div>
                        
                        {/* Multi-select options directly in the conversation */}
                        {options.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs text-gray-400 mb-2">
                              {t('ui.selectAllThatApply')}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {options.map((opt) => {
                                const active = selected.includes(opt.value);
                                
                                return (
                                  <button
                                    key={opt.value}
                                    className={cn(
                                      "px-4 py-3 text-sm rounded-lg border transition-all duration-200 text-left",
                                      "flex items-center justify-between min-h-[48px] sm:min-h-[44px]",
                                      active
                                        ? "bg-gold-primary/25 text-gold-primary border-gold-primary shadow-lg ring-2 ring-gold-primary/40"
                                        : "bg-gray-800/60 text-gray-100 border-gray-400 hover:bg-gold-primary/15 hover:border-gold-primary hover:text-white"
                                    )}
                                    onClick={() => handleOptionToggle(opt.value)}
                                    aria-pressed={active}
                                    role="checkbox"
                                    aria-checked={active}
                                  >
                                    <span className="flex-1">{opt.label}</span>
                                    <div className={cn(
                                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shadow-sm",
                                      active 
                                        ? "bg-gold-primary border-gold-primary" 
                                        : "border-gray-300 bg-gray-700"
                                    )}>
                                      {active && <Check className="h-3 w-3 text-gray-900 font-bold" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Thinking indicator */}
                  {loadingNext && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Loader2 className="h-5 w-5 animate-spin text-gold-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gold-primary mb-1">
                          CFO – {t("chat.assistant", { default: "avustaja" })}
                        </div>
                        <div className="text-sm text-gray-300">
                          {t("chat.thinking", { default: "Pohditaan..." })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Swedish Feedback Button - visible during conversation */}
              {currentLocale === 'sv' && conversationStarted && (
                <div className="flex justify-center mb-4">
                  <Button
                    onClick={handleFeedbackNavigation}
                    variant="outline"
                    className="border-gold-primary/40 text-gold-primary hover:bg-gold-primary/10 text-sm px-4 py-2"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t('chat.giveSurveyFeedback', { default: 'Ge feedback via enkät' })}
                  </Button>
                </div>
              )}

              {/* Financial Data Input Hint - Show when financial data is missing */}
              {availableIndicators.length === 0 && (
                <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-200">
                      💡 {t("financial.canProvideDirectly", { 
                        default: "Voit kertoa taloustietosi suoraan CFO-avustajalle keskustelussa. Esim: 'Liikevaihto oli 500 000 €, liikevoitto 50 000 €. Tilikausi 2024.'" 
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Unified Input Field */}
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  className="flex-1 rounded-xl bg-white border-2 border-gold-primary/70 px-5 py-4 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-3 focus:ring-gold-primary/30 focus:border-gold-primary shadow-xl transition-all duration-300 hover:bg-white hover:border-gold-primary hover:shadow-2xl"
                  placeholder={
                    isConversationDone && shouldShowRecommendations && displayRecommendations && displayRecommendations.items && displayRecommendations.items.length > 0
                      ? t("phase4.conversationPlaceholder", { default: "Esimerkiksi: Miten tämä rahoitusratkaisu sopii yritykseemme pitkäaikaiseen strategiaan? Mitä riskejä tulisi huomioida mainittujen kassavirtavaihtelujen kanssa? Kuinka nopeasti pääsemme aloittamaan?" })
                      : t("chat.placeholder", { default: "Vapaa tekstikenttä" })
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitMessage();
                    }
                  }}
                />
                <Button 
                  className={cn(
                    "bg-gold-primary hover:bg-gold-primary/90 text-black font-medium py-3 px-6 rounded-lg transition-colors shadow-lg w-full sm:w-auto",
                    showPressHint && "ring-2 ring-gold-primary/50 animate-pulse"
                  )}
                  disabled={loadingNext || (!isConversationDone && selected.length === 0 && !input.trim()) || (isConversationDone && !input.trim())}
                  onClick={submitMessage}
                >
                  {loadingNext ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("chat.thinking", { default: "Pohditaan..." })}
                    </div>
                  ) : (
                    t("chat.send", { default: "Jatka" })
                  )}
                </Button>
                {showPressHint && (
                  <div className="pointer-events-none absolute -top-5 right-0 flex items-center gap-1 text-xs text-gold-primary animate-bounce">
                    <span>{t('chat.pressContinueHint', { default: 'Paina Jatka' })}</span>
                    <span className="translate-y-0.5">👇</span>
                  </div>
                )}
              </div>

              {/* New Analysis Button (when conversation is done) */}
              {isConversationDone && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="border-gold-primary/40 text-gold-primary hover:bg-gold-primary/10"
                    onClick={() => {
                      // Reset all conversation state to start fresh
                      setConversationStarted(false);
                      setIsConversationDone(false);
                      setRecommendation(null);
                      setTurns([]);
                      setAskedQuestions([]);
                      setQuestion("");
                      setOptions([]);
                      setSelected([]);
                      setInput("");
                      setCfoGuidance("");
                      setLoadingNext(false);
                      setCurrentQuestionTurn(null);
                      // Analysis type removed - no longer needed
                    }}
                  >
                    {t('ui.startNewAnalysis')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations Sidebar */}
        {shouldShowRecommendations && displayRecommendations && displayRecommendations.items && displayRecommendations.items.length > 0 && (
          <div className={`${recommendationsExpanded ? "lg:col-span-3" : "lg:col-span-1"} space-y-4 flex flex-col`}>
            <Card 
              className={`bg-gray-900/60 border border-gold-primary/30 text-gray-100 p-4 ${recommendationsHeight} overflow-y-auto flex-1`}
              ref={recommendationsRef}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gold-primary flex items-center gap-2">
                  🎯 
                  {t('ui.recommendations')}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gold-primary hover:text-gold-primary/80"
                  onClick={() => setRecommendationsExpanded(!recommendationsExpanded)}
                >
                  {recommendationsExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {recommendationsExpanded ? (
                /* Expanded Recommendations */
                <div className="space-y-4">
                  {displayRecommendations.comparison && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                      <h4 className="font-medium text-blue-300 mb-2 text-sm">📊 
                        {t('ui.comparison')}
                      </h4>
                      <p className="text-xs text-gray-300">{displayRecommendations.comparison}</p>
                    </div>
                  )}

                  {displayRecommendations.items?.map((item: any, idx: number) => {
                    const isCollapsed = collapsedRecommendations.has(idx);
                    return (
                      <div key={idx} className="bg-gray-800/40 border border-gold-primary/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-primary/20 flex items-center justify-center">
                            <span className="text-gold-primary font-semibold text-xs">{idx + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gold-primary text-sm">{getRecommendationTypeLabel(item.type, item.title)}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRecommendationCollapse(idx)}
                                className="text-gold-primary hover:text-gold-primary/80 p-1 h-6 w-6"
                              >
                                {isCollapsed ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronUp className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            
                            <p className={`text-gray-300 text-xs mb-2 ${isCollapsed ? 'line-clamp-2' : ''}`}>
                              {item.summary}
                            </p>
                            
                            {(item.amount || item.termMonths) && (
                              <div className="space-y-1 mb-2">
                                {item.amount && (
                                  <div className="text-xs text-gray-400">
                                    {t('ui.amount')} {formatCurrency(item.amount, companyCurrency)}
                                  </div>
                                )}
                                {item.termMonths && (
                                  <div className="text-xs text-gray-400">
                                    {t('ui.term')} {Math.round(item.termMonths)} {t('ui.months')}
                                  </div>
                                )}
                              </div>
                            )}

                            {!isCollapsed && item.costNotes && (
                              <div className="mb-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-gray-300">
                                <strong className="text-blue-300">{t('ui.details')}</strong> {item.costNotes}
                              </div>
                            )}
                            
                            <Button
                              onClick={() => {
                                if (currentLocale === 'sv') {
                                  // For Swedish users, create unique survey link
                                  handleFeedbackNavigation();
                                } else {
                                  handleApplyRecommendation(item, idx);
                                }
                              }}
                              size="sm"
                              className="w-full bg-gold-primary hover:bg-gold-highlight text-black font-medium text-xs py-1.5 px-2 rounded transition-colors"
                            >
                              {currentLocale === 'sv' ? (
                                <>{"📝 "}{t("recommendations.giveFeedback", { default: "Ge feedback via enkät" })}</>
                              ) : (
                                <>🚀 {t("recommendations.apply", { default: "Hae tätä rahoitusta" })}</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Collapsed Recommendations */
                <div className="space-y-2">
                  {displayRecommendations.items?.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-800/40 rounded border border-gold-primary/20">
                      <div className="w-4 h-4 rounded-full bg-gold-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold-primary font-semibold text-xs">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gold-primary truncate">
                          {getRecommendationTypeLabel(item.type, item.title)}
                        </div>
                        {item.amount && (
                          <div className="text-xs text-gray-400 truncate">
                            {formatCurrency(item.amount, companyCurrency)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {displayRecommendations.items && displayRecommendations.items.length > 3 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{displayRecommendations.items.length - 3} {t('ui.more')}
                    </div>
                  )}
                </div>
              )}
            </Card>


            {/* Other Funding Options Section */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h3 className="text-lg font-medium text-gold-primary mb-4">
                {t('ui.otherFundingOptions')}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {t('ui.otherFundingOptionsDesc')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* All available funding types */}
                {[
                  { type: 'business_loan_unsecured', label: getRecommendationTypeLabel('business_loan_unsecured'), icon: '💼' },
                  { type: 'business_loan_secured', label: getRecommendationTypeLabel('business_loan_secured'), icon: '🏛️' },
                  { type: 'credit_line', label: getRecommendationTypeLabel('credit_line'), icon: '💳' },
                  { type: 'factoring_ar', label: getRecommendationTypeLabel('factoring_ar'), icon: '📄' },
                  { type: 'leasing', label: getRecommendationTypeLabel('leasing'), icon: '🚗' },
                ].map((option) => {
                  // Check if this option is already in recommendations
                  const isRecommended = displayRecommendations?.items?.some((item: any) => 
                    item.type === option.type || 
                    (item.type === 'business_loan' && option.type === 'business_loan_unsecured')
                  );
                  
                  return (
                    <TooltipProvider key={option.type}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Card 
                            className={`
                              bg-gray-900/40 border transition-all cursor-pointer relative
                              ${isRecommended 
                                ? 'border-gold-primary/20 opacity-60' 
                                : 'border-gray-700 hover:border-gold-primary/50 hover:bg-gray-900/60'
                              }
                            `}
                            onClick={() => {
                              if (!isRecommended) {
                                // Create a basic recommendation object for this funding type
                                const basicRecommendation = {
                                  type: option.type,
                                  title: option.label,
                                  summary: currentLocale === 'en'
                                    ? 'User-selected funding option'
                                    : currentLocale === 'sv'
                                    ? 'Användarval finansieringsalternativ'
                                    : 'Käyttäjän valitsema rahoitusvaihtoehto',
                                  amount: 50000, // Default amount for user-selected funding options
                                  termMonths: option.type.includes('business_loan') ? 12 : null,
                                  guaranteesRequired: option.type === 'business_loan_secured' ? true : null,
                                  costNotes: null,
                                };
                                handleApplyRecommendation(basicRecommendation);
                              }
                            }}
                          >
                            <div className="p-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{option.icon}</span>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-200">
                                    {option.label}
                                  </h4>
                                  {isRecommended && (
                                    <span className="text-xs text-gold-primary">
                                      {t('ui.recommended')}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isRecommended && (
                                    <InformationCircleIcon className="h-4 w-4 text-gray-400 hover:text-gold-primary" />
                                  )}
                                  {!isRecommended && (
                                    <div className="text-gold-primary/60">
                                      →
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </TooltipTrigger>
                        {!isRecommended && (
                          <TooltipContent 
                            className="bg-gray-900 border-gray-700 text-gray-200 max-w-sm p-3"
                            side="top"
                            align="center"
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-gold-primary text-sm">
                                {t('ui.whyNotRecommended')}
                              </p>
                              <p className="text-xs text-gray-300">
                                {getNotRecommendedReason(option.type)}
                              </p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  {t('ui.tipClickOption')}
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Company Information - Supporting details */}
      <Card className="bg-gray-900/60 border border-gold-primary/30 text-gray-100">
        <div className="p-4">
          <div className="flex gap-4">
            {/* Left side - Company info and upload */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gold-primary mb-1">
                {companyData?.name || t("company.unknown", { default: "Yritys" })}
              </h2>
              <p className="text-sm text-gray-400 mb-3">
                {t("company.businessId", { default: "Y-tunnus" })}: {companyData?.business_id || "-"}
              </p>
              
              {/* Company Data Error/Refetch - Only show if NOT enriching */}
              {companyDataError && localEnrichmentStatus !== 'pending' && localEnrichmentStatus !== 'enriching' && companyData?.enrichment_status !== 'pending' && companyData?.enrichment_status !== 'enriching' && (
                <div className="flex items-start space-x-3 p-3 mb-3 bg-red-900/20 rounded-lg border border-red-500/30">
                  <div className="h-4 w-4 mt-0.5 rounded-full bg-red-500 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-red-300 leading-relaxed">
                      {t('ui.companyDataError', { default: 'Tietojen haussa tapahtui virhe.' })}
                    </div>
                    <div className="text-xs text-red-400 mt-1">
                      {companyDataError}
                    </div>
                    <div className="mt-2">
                      <Button
                        onClick={refetchCompanyData}
                        disabled={isRefetchingCompanyData}
                        size="sm"
                        className="text-xs bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isRefetchingCompanyData ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            {t('ui.refetching', { default: 'Haetaan...' })}
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {t('ui.refetchCompanyData', { default: 'Hae yrityksen tiedot uudelleen' })}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Documents Alert - Company background enriched, awaiting financial docs */}
              {(localEnrichmentStatus === 'pending_documents' || companyData?.enrichment_status === 'pending_documents') && availableIndicators.length === 0 && (
                <div className="space-y-4 mb-3">
                  {/* Background info success */}
                  <div className="flex items-start space-x-3 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="h-5 w-5 mt-0.5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-green-200 mb-1">
                        {t('company.backgroundEnriched', { default: '✅ Yrityksen taustatiedot haettu onnistuneesti' })}
                      </div>
                      <div className="text-xs text-green-300/80">
                        {t('company.pendingDocumentsMessage', { 
                          default: 'Yrityksen taustatiedot (toimiala, tuotteet, markkinat) on haettu onnistuneesti. Taloustietoja ei haeta automaattisesti, koska julkiset lähteet eivät ole riittävän luotettavia tarkkaan analyysiin.' 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Primary method: Upload document */}
                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <div className="flex items-start space-x-3 mb-3">
                      <Info className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-orange-200 mb-2">
                          {t('company.uploadRequired', { default: 'ENSISIJAINEN TAPA: Lataa tilinpäätös' })}
                        </div>
                        <div className="text-xs text-orange-300/90 mb-3">
                          {t('company.whyUploadTitle', { default: 'Miksi liittää tilinpäätös?' })}
                        </div>
                        <ul className="text-xs text-orange-300/80 space-y-1 mb-3 ml-4 list-none">
                          <li>{t('company.whyUpload1', { default: '✅ Tarkat luvut virallisesta dokumentista' })}</li>
                          <li>{t('company.whyUpload2', { default: '✅ Kattava rahoitusanalyysi ja tunnusluvut' })}</li>
                          <li>{t('company.whyUpload3', { default: '✅ Luotettavat rahoitussuositukset' })}</li>
                          <li>{t('company.whyUpload4', { default: '✅ Paras mahdollinen hakukelpoisuusarvio' })}</li>
                        </ul>
                        <Button
                          type="button"
                          size="sm"
                          className="text-xs bg-orange-500/20 border border-orange-500/40 text-orange-200 hover:bg-orange-500/30 font-semibold"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-3 w-3 mr-1.5" />
                          {(yearlyFinancialData.length > 0 || documents.some(d => d.processing_status === 'completed'))
                            ? t('company.uploadAdditional', { default: 'Lataa lisätietoja' })
                            : t('company.uploadLatest', { default: 'Lataa tilinpäätös' })
                          }
                        </Button>
                      </div>
                    </div>
                    
                    {/* Alternative method: Provide manually */}
                    <div className="pt-3 border-t border-orange-500/20">
                      <div className="text-xs font-semibold text-orange-200 mb-2">
                        {t('company.alternativeInputTitle', { default: 'VAIHTOEHTOINEN TAPA: Anna tiedot CFO:lle' })}
                      </div>
                      <div className="text-xs text-orange-300/80 mb-2">
                        {t('company.alternativeInputMessage', { 
                          default: 'Voit myös kertoa talousluvut (liikevaihto, tulos, varat, velat) suoraan CFO-avustajalle alapuolella olevassa chatissa. Tämä on nopeampi tapa, mutta analyysi ei ole yhtä kattava kuin tilinpäätöksestä.' 
                        })}
                      </div>
                      <div className="text-xs text-orange-400/90 italic">
                        {t('company.alternativeInputNote', { 
                          default: '💡 Huom: Manuaalisesti annetut luvut ovat vähemmän luotettavia kuin tilinpäätöksestä poimitut luvut.' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Data Error Indicator */}
              {financialsError && (
                <div className="flex items-start space-x-3 p-3 mb-3 bg-red-900/20 rounded-lg border border-red-500/30">
                  <div className="h-4 w-4 mt-0.5 rounded-full bg-red-500 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-red-300 leading-relaxed">
                      {financialsError}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="text-xs text-red-400">
                        {t('ui.financialDataError')}
                      </div>
                      <Button
                        onClick={() => {
                          setFinancialsError(null);
                          fetchFinancialMetrics();
                        }}
                        disabled={isFetchingFinancialMetrics}
                        className="text-xs py-1 px-2 h-6 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {t('ui.retryButton')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload block at bottom of left column */}
              {!hasLatestStatement && (
                <div className="mt-1">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx" />

                  {/* Show enriching status if currently enriching */}
                  {(localEnrichmentStatus === 'pending' || localEnrichmentStatus === 'enriching') && (availableIndicators.length === 0 ||
                    (financialTransparencyData?.confidence !== null && financialTransparencyData?.confidence !== undefined && financialTransparencyData.confidence < 50)) && (
                    <div className="mb-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Loader2 className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0 animate-spin" />
                        <div className="flex-1">
                          <div className="text-xs text-blue-200 space-y-2">
                            <p className="font-semibold text-sm">
                              {t("company.backgroundEnrichingTitle", { default: "Haetaan yrityksen taustatietoja..." })}
                            </p>
                            <p className="text-blue-300/80">
                              {t("company.backgroundEnrichingMessage", { default: "Haemme yrityksesi taustatiedot (toimiala, tuotteet, markkinat) julkisista lähteistä. Tämä kestää noin 10-20 sekuntia." })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show warning if no financial data or low confidence AND not currently enriching AND not pending_documents */}
                  {localEnrichmentStatus !== 'pending' && localEnrichmentStatus !== 'enriching' && localEnrichmentStatus !== 'pending_documents' && 
                   companyData?.enrichment_status !== 'pending' && companyData?.enrichment_status !== 'enriching' && companyData?.enrichment_status !== 'pending_documents' && 
                   (availableIndicators.length === 0 || (financialTransparencyData?.confidence !== null && financialTransparencyData?.confidence !== undefined && financialTransparencyData.confidence < 50)) && (
                    <div className="mb-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-amber-200 space-y-3">
                            {/* Title */}
                            <p className="font-semibold text-sm">
                              {t("company.financialDataMissing", { default: "Talousluvut puuttuvat" })}
                            </p>
                            
                            {/* Recommendation */}
                            <div>
                              <p className="font-semibold text-amber-300 mb-1">
                                {t("company.uploadRequired", { default: "ENSISIJAINEN TAPA: Lataa tilinpäätös" })}
                              </p>
                              <p className="text-amber-300/80">
                                {t("company.uploadRecommendation", { default: "Suosittelemme vahvasti lataamaan tilinpäätöksen parhaan mahdollisen analyysin varmistamiseksi." })}
                              </p>
                            </div>
                            
                            {/* Alternative */}
                            <div>
                              <p className="font-semibold text-amber-300 mb-1">
                                {t("company.alternativeInputTitle", { default: "VAIHTOEHTOINEN TAPA: Anna tiedot CFO:lle" })}
                              </p>
                              <p className="text-amber-300/80">
                                {t("company.alternativeInputMessage", { default: "Voit myös kertoa talousluvut (liikevaihto, tulos, varat, velat) suoraan CFO-avustajalle alapuolella olevassa chatissa. Tämä on nopeampi tapa, mutta analyysi ei ole yhtä kattava kuin tilinpäätöksestä." })}
                              </p>
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex gap-2 mt-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-xs bg-amber-500/20 border-amber-500/40 text-amber-200 hover:bg-amber-500/30"
                              disabled={isRetryingFetch || isFetchingFinancials}
                              onClick={handleRetryFinancialFetch}
                            >
                              {isRetryingFetch ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                  {t("company.retrying", { default: "Yritetään uudelleen..." })}
                                </>
                              ) : (
                                <>
                                  <Info className="h-3 w-3 mr-1.5" />
                                  {t("company.retryFetch", { default: "Yritä hakea taloustiedot uudelleen" })}
                                </>
                              )}
                            </Button>
                            
                            {/* Manual input button hidden - CFO now asks for financial data directly in conversation */}
                            {false && ( 
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-xs bg-blue-500/20 border-blue-500/40 text-blue-200 hover:bg-blue-500/30"
                                onClick={() => setShowManualInput(!showManualInput)}
                              >
                                <Edit3 className="h-3 w-3 mr-1.5" />
                                {showManualInput 
                                  ? t("financial.hideManualInput", { default: "Piilota" })
                                  : t("financial.showManualInput", { default: "Kerro taloustiedot" })
                                }
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Manual Financial Input Form */}
                  {showManualInput && !hasLatestStatement && (
                    <ManualFinancialInput
                      companyId={companyId || ''}
                      session={session}
                      onSuccess={handleManualInputSuccess}
                      onCancel={() => setShowManualInput(false)}
                    />
                  )}
                  
                  <p className="text-xs text-gray-400 mb-2 max-w-md">
                    {(yearlyFinancialData.length > 0 || documents.some(d => d.processing_status === 'completed'))
                      ? t("company.uploadAdditionalDescription", { default: "Lataa lisätietoja saadaksesi vielä tarkemman ja kattavamman, sekä ajankohtaisemman analyysin." })
                      : t("company.uploadDescription", { default: "Lataa tilinpäätöksesi saadaksesi tarkat talousluvut ja kattavan analyysin." })
                    }
                  </p>
                  <Button
                    type="button"
                    className="onboarding-btn-primary"
                    disabled={uploading || isUploadingLocal || !companyId}
                    onClick={onUploadClick}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading || isUploadingLocal
                      ? t("company.uploading", { default: "Lähetetään..." })
                      : (yearlyFinancialData.length > 0 || documents.some(d => d.processing_status === 'completed'))
                        ? t("company.uploadAdditional", { default: "Lataa lisätietoja" })
                        : t("company.uploadLatest", { default: "Lataa tilinpäätös" })
                    }
                  </Button>
                </div>
              )}
            </div>

            {/* Right side - Financial indicators */}
            <div className="flex-1">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {availableIndicators.slice(0, 6).map((it) => (
                  <div key={it.label} className="rounded-lg border border-gray-700/60 bg-black/40 p-2.5">
                    <div className="text-xs text-gray-400 leading-tight">{it.label}</div>
                    <div className="text-sm font-medium text-gray-100 leading-tight">{it.value}</div>
                  </div>
                ))}
              </div>
              
              {/* Financial Data Transparency Badge (Compact) */}
              {financialTransparencyData && (
                <div className="mt-2 flex items-center justify-end gap-3">
                  <FinancialDataTransparency
                    confidence={financialTransparencyData.confidence}
                    sources={financialTransparencyData.sources}
                    dataSource={financialTransparencyData.dataSource}
                    lastUpdated={financialTransparencyData.lastUpdated}
                    compact={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* More details button - centered at bottom */}
          <div className="flex justify-center mt-3">
            <Button
              type="button"
              variant="ghost"
              className="text-gold-primary hover:text-gold-primary/80 text-sm"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <span className="inline-flex items-center gap-2">
                  <ChevronUp className="h-4 w-4" />
                  {t("company.hide", { default: "Piilota" })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ChevronDown className="h-4 w-4" />
                  {t("company.more", { default: "Lisätiedot" })}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Expanded financial details */}
        {expanded && (
          <div className="px-4 pb-4">
            {/* Company Background Information - Modern Layout */}
            {/* Check both metadata.enriched_data AND direct fields for backward compatibility */}
            {(companyData?.metadata?.enriched_data || companyData?.description || companyData?.products || companyData?.market) && (
              <div className="mb-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gold-primary flex items-center gap-2">
                    <span>🏢</span>
                    {t('step2.enriched.title', { default: 'Yrityksen taustatiedot' })}
                  </h3>
                  
                  {/* Check if new 3x3 fields are missing and show re-enrichment option */}
                  {(() => {
                    const enrichedData = companyData?.metadata?.enriched_data || {};
                    const hasNewFields = enrichedData.industry_info || enrichedData.competitive_landscape || 
                                       enrichedData.growth_opportunities || enrichedData.business_model || 
                                       enrichedData.ai_assessment;
                    const isEnriching = localEnrichmentStatus === 'enriching' || localEnrichmentStatus === 'pending' ||
                                       companyData?.enrichment_status === 'enriching' || companyData?.enrichment_status === 'pending';
                    
                    if (!hasNewFields && !isEnriching && companyData?.enrichment_status === 'enriched') {
                      return (
                        <button
                          onClick={async () => {
                            if (!companyId || !session?.access_token) return;
                            try {
                              const response = await fetch(`/api/companies/${companyId}/retry-financial-data`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${session.access_token}`,
                                },
                              });
                              if (response.ok) {
                                setLocalEnrichmentStatus('enriching');
                                // Refresh company data after a delay
                                setTimeout(() => {
                                  window.location.reload();
                                }, 3000);
                              }
                            } catch (error) {
                              console.error('Failed to re-enrich:', error);
                            }
                          }}
                          className="text-xs px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/30 rounded-lg transition-colors"
                        >
                          🔄 Päivitä tiedot
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* 3x3 Grid Layout - All Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Row 1 - Top Summary */}
                  {/* 1. Overview / Kuvaus */}
                  {(companyData.metadata?.enriched_data?.overview || companyData?.description || localCompanyData?.description) && (
                    <div className="rounded-lg border border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-transparent p-5 hover:border-blue-400/50 transition-colors">
                      <h4 className="text-base font-bold text-blue-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">✨</span>
                        {t('step2.enriched.overview', { default: 'Kuvaus' })}
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {companyData.metadata?.enriched_data?.overview || companyData?.description || localCompanyData?.description}
                      </p>
                    </div>
                  )}

                  {/* 2. Products / Tuotteet */}
                  {((companyData.metadata?.enriched_data?.products && Array.isArray(companyData.metadata.enriched_data.products) && companyData.metadata.enriched_data.products.length > 0) ||
                    (companyData?.products && Array.isArray(companyData.products) && companyData.products.length > 0) ||
                    (localCompanyData?.products && Array.isArray(localCompanyData.products) && localCompanyData.products.length > 0)) && (
                    <div className="rounded-lg border border-purple-400/30 bg-gradient-to-br from-purple-500/10 to-transparent p-5 hover:border-purple-400/50 transition-colors">
                      <h4 className="text-base font-bold text-purple-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">📦</span>
                        {t('step2.enriched.products', { default: 'Tuotteet' })}
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-2 list-none">
                        {(companyData.metadata?.enriched_data?.products || companyData?.products || localCompanyData?.products || []).map((product: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5 font-bold">•</span>
                            <span>{product}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Market Position / Markkina-alue */}
                  {(companyData.metadata?.enriched_data?.market || companyData?.market || localCompanyData?.market) && (
                    <div className="rounded-lg border border-green-400/30 bg-gradient-to-br from-green-500/10 to-transparent p-5 hover:border-green-400/50 transition-colors">
                      <h4 className="text-base font-bold text-green-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        {t('step2.enriched.marketPosition', { default: 'Markkina-alue' })}
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {companyData.metadata?.enriched_data?.market || companyData?.market || localCompanyData?.market}
                      </p>
                    </div>
                  )}

                  {/* Row 2 - Enhanced Fields */}
                  {/* 4. Industry / Toimiala */}
                  {(companyData.metadata?.enriched_data?.industry || companyData?.industry) && (
                    <div className="rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-transparent p-5 hover:border-orange-400/50 transition-colors">
                      <h4 className="text-base font-bold text-orange-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🏭</span>
                        {t('step2.enriched.industry', { default: 'Toimiala' })}
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {companyData.metadata?.enriched_data?.industry || companyData?.industry}
                      </p>
                    </div>
                  )}

                  {/* 5. Strengths / Vahvuudet */}
                  {companyData.metadata?.enriched_data?.strengths && Array.isArray(companyData.metadata?.enriched_data?.strengths) && companyData.metadata?.enriched_data?.strengths?.length > 0 && (
                    <div className="rounded-lg border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 hover:border-emerald-400/50 transition-colors">
                      <h4 className="text-base font-bold text-emerald-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">💪</span>
                        {t('step2.enriched.strengths', { default: 'Vahvuudet' })}
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-2 list-none">
                        {companyData.metadata?.enriched_data?.strengths?.map((strength: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 6. Key Competitors / Kilpailijat */}
                  {companyData.metadata?.enriched_data?.key_competitors && Array.isArray(companyData.metadata?.enriched_data?.key_competitors) && companyData.metadata?.enriched_data?.key_competitors?.length > 0 && (
                    <div className="rounded-lg border border-red-400/30 bg-gradient-to-br from-red-500/10 to-transparent p-5 hover:border-red-400/50 transition-colors">
                      <h4 className="text-base font-bold text-red-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        {t('step2.enriched.competitors', { default: 'Kilpailijat' })}
                      </h4>
                      <div className="space-y-3">
                        {companyData.metadata?.enriched_data?.key_competitors?.map((competitor: any, idx: number) => (
                          <div key={idx} className="bg-red-500/5 rounded-md p-3 border border-red-500/20">
                            <div className="font-medium text-red-200 text-sm mb-1">{competitor.name}</div>
                            <div className="text-xs text-gray-300 mb-1">{competitor.description}</div>
                            <div className="text-xs text-red-300">{competitor.market_position}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ROW 2 - ORIGINAL 3x3 GRID FIELDS */}
                  {/* 7. Industry Info / Toimialan tila */}
                  {companyData.metadata?.enriched_data?.industry_info && (
                    <div className="rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-transparent p-5 hover:border-orange-400/50 transition-colors">
                      <h4 className="text-base font-bold text-orange-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        {t('step2.enriched.industryInfo', { default: 'Toimialan tila' })}
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {companyData.metadata?.enriched_data?.industry_info}
                      </p>
                    </div>
                  )}

                  {/* 8. Competitive Landscape / Kilpailuasetelma */}
                  {companyData.metadata?.enriched_data?.competitive_landscape && (
                    <div className="rounded-lg border border-red-400/30 bg-gradient-to-br from-red-500/10 to-transparent p-5 hover:border-red-400/50 transition-colors">
                      <h4 className="text-base font-bold text-red-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">⚔️</span>
                        {t('step2.enriched.competitiveLandscape', { default: 'Kilpailuasetelma' })}
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {companyData.metadata?.enriched_data?.competitive_landscape}
                      </p>
                    </div>
                  )}

                  {/* ROW 3 - ORIGINAL 3x3 GRID FIELDS */}
                  {/* 9. Growth Opportunities / Kasvumahdollisuudet */}
                  {companyData.metadata?.enriched_data?.growth_opportunities && Array.isArray(companyData.metadata?.enriched_data?.growth_opportunities) && companyData.metadata?.enriched_data?.growth_opportunities?.length > 0 && (
                    <div className="rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-5 hover:border-cyan-400/50 transition-colors">
                      <h4 className="text-base font-bold text-cyan-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🚀</span>
                        {t('step2.enriched.growthOpportunities', { default: 'Kasvumahdollisuudet' })}
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-2 list-none">
                        {companyData.metadata?.enriched_data?.growth_opportunities?.map((opportunity: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-400 mt-0.5 font-bold">•</span>
                            <span>{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 10. Business Model / Liiketoimintamalli */}
                  {companyData.metadata?.enriched_data?.business_model && (
                    <div className="rounded-lg border border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 to-transparent p-5 hover:border-yellow-400/50 transition-colors">
                      <h4 className="text-base font-bold text-yellow-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        {t('step2.enriched.businessModel', { default: 'Liiketoimintamalli' })}
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {companyData.metadata?.enriched_data?.business_model}
                      </p>
                    </div>
                  )}

                  {/* 11. AI Assessment / AI-arvio */}
                  {companyData.metadata?.enriched_data?.ai_assessment && (
                    <div className="rounded-lg border border-gold-400/30 bg-gradient-to-br from-yellow-600/20 to-transparent p-5 hover:border-gold-400/50 transition-colors ring-2 ring-gold-400/20">
                      <h4 className="text-base font-bold text-yellow-200 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        {t('step2.enriched.aiAssessment', { default: 'AI-arvio' })}
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {companyData.metadata?.enriched_data?.ai_assessment}
                      </p>
                    </div>
                  )}

                  {/* Row 3 - Team & Personnel */}
                  {/* 7. Team / Tiimi */}
                  {companyData.metadata?.enriched_data?.team && Array.isArray(companyData.metadata?.enriched_data?.team) && companyData.metadata?.enriched_data?.team?.length > 0 && (
                    <div className="rounded-lg border border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-transparent p-5 hover:border-blue-400/50 transition-colors">
                      <h4 className="text-base font-bold text-blue-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">👥</span>
                        {t('step2.enriched.team', { default: 'Tiimi' })}
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-2 list-none">
                        {companyData.metadata?.enriched_data?.team?.map((member: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5 font-bold">•</span>
                            <span>{member}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 8. Personnel Info / Henkilöstötiedot */}
                  {companyData.metadata?.enriched_data?.personnel && (companyData.metadata?.enriched_data?.personnel?.count || companyData.metadata?.enriched_data?.personnel?.trend) && (
                    <div className="rounded-lg border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-transparent p-5 hover:border-indigo-400/50 transition-colors">
                      <h4 className="text-base font-bold text-indigo-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">👤</span>
                        {t('step2.enriched.personnel', { default: 'Henkilöstö' })}
                      </h4>
                      <div className="space-y-2 text-sm text-gray-300">
                        {companyData.metadata?.enriched_data?.personnel?.count && (
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400 font-bold">Määrä:</span>
                            <span>{companyData.metadata?.enriched_data?.personnel?.count} henkilöä</span>
                          </div>
                        )}
                        {companyData.metadata?.enriched_data?.personnel?.trend && (
                          <div className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold">Trendi:</span>
                            <span>{companyData.metadata?.enriched_data?.personnel?.trend}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 9. Financial Health / Taloudellinen tila */}
                  {companyData.metadata?.enriched_data?.financial_health && (companyData.metadata?.enriched_data?.financial_health?.rating !== 'Not available' || companyData.metadata?.enriched_data?.financial_health?.stability) && (
                    <div className="rounded-lg border border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 to-transparent p-5 hover:border-yellow-400/50 transition-colors">
                      <h4 className="text-base font-bold text-yellow-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        {t('step2.enriched.financialHealth', { default: 'Taloudellinen tila' })}
                      </h4>
                      <div className="space-y-2 text-sm text-gray-300">
                        {companyData.metadata?.enriched_data?.financial_health?.rating !== 'Not available' && (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 font-bold">Luottoluokitus:</span>
                            <span>{companyData.metadata?.enriched_data?.financial_health?.rating}</span>
                          </div>
                        )}
                        {companyData.metadata?.enriched_data?.financial_health?.stability && (
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-400 font-bold">Vakaus:</span>
                            <span>{companyData.metadata?.enriched_data?.financial_health?.stability}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Row 4 - Market Analysis */}
                  {/* 10. Market Analysis / Markkina-analyysi */}
                  {companyData.metadata?.enriched_data?.market_analysis && (
                    companyData.metadata?.enriched_data?.market_analysis?.industry_trends?.length > 0 ||
                    companyData.metadata?.enriched_data?.market_analysis?.growth_opportunities?.length > 0 ||
                    companyData.metadata?.enriched_data?.market_analysis?.challenges?.length > 0
                  ) && (
                    <div className="rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-5 hover:border-cyan-400/50 transition-colors">
                      <h4 className="text-base font-bold text-cyan-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">📈</span>
                        {t('step2.enriched.marketAnalysis', { default: 'Markkina-analyysi' })}
                      </h4>
                      <div className="space-y-3">
                        {companyData.metadata?.enriched_data?.market_analysis?.industry_trends?.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-cyan-400 mb-1">Toimialan trendit:</div>
                            <ul className="text-xs text-gray-300 space-y-1">
                              {companyData.metadata?.enriched_data?.market_analysis?.industry_trends?.map((trend: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-cyan-400 mt-0.5">→</span>
                                  <span>{trend}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {companyData.metadata?.enriched_data?.market_analysis?.growth_opportunities?.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-green-400 mb-1">Kasvumahdollisuudet:</div>
                            <ul className="text-xs text-gray-300 space-y-1">
                              {companyData.metadata?.enriched_data?.market_analysis?.growth_opportunities?.map((opportunity: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-green-400 mt-0.5">+</span>
                                  <span>{opportunity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {companyData.metadata?.enriched_data?.market_analysis?.challenges?.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-red-400 mb-1">Haasteet:</div>
                            <ul className="text-xs text-gray-300 space-y-1">
                              {companyData.metadata?.enriched_data?.market_analysis?.challenges?.map((challenge: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-red-400 mt-0.5">!</span>
                                  <span>{challenge}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 11. Recent News / Uutiset */}
                  {companyData.metadata?.enriched_data?.recent_news && Array.isArray(companyData.metadata?.enriched_data?.recent_news) && companyData.metadata?.enriched_data?.recent_news?.length > 0 && (
                    <div className="rounded-lg border border-purple-400/30 bg-gradient-to-br from-purple-500/10 to-transparent p-5 hover:border-purple-400/50 transition-colors">
                      <h4 className="text-base font-bold text-purple-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">📰</span>
                        {t('step2.enriched.recentNews', { default: 'Uutiset' })}
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-2 list-none">
                        {companyData.metadata?.enriched_data?.recent_news?.map((news: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5 font-bold">•</span>
                            <span>{news}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 12. Website / Verkkosivusto */}
                  {(companyData.metadata?.enriched_data?.website || companyData?.website) && (
                    <div className="rounded-lg border border-gray-400/30 bg-gradient-to-br from-gray-500/10 to-transparent p-5 hover:border-gray-400/50 transition-colors">
                      <h4 className="text-base font-bold text-gray-300 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🌐</span>
                        {t('step2.enriched.website', { default: 'Verkkosivusto' })}
                      </h4>
                      <a 
                        href={companyData.metadata?.enriched_data?.website || companyData?.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                      >
                        {companyData.metadata?.enriched_data?.website || companyData?.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isFetchingFinancials ? (
              <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-200 mb-2">
                      {t("financial.fetchingBackground", { default: "Haetaan talousdataa taustalla julkisista lähteistä..." })}
                    </p>
                    <p className="text-xs text-blue-300/80 mb-3">
                      {t("financial.fetchingNote", { default: "Pyrimme hakemaan yrityksen talousluvut Kauppalehti.fi, Finder.fi ja Asiakastieto.fi -palveluista." })}
                    </p>
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
                      <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-200">
                        <p className="font-medium mb-1">
                          {t("financial.uploadRecommended", { default: "Suosittelemme tilinpäätöksen liittämistä" })}
                        </p>
                        <p className="text-amber-300/80">
                          {t("financial.uploadBenefits", { default: "Tilinpäätöksellä saat tarkemman analyysin ja paremmat rahoitussuositukset. Julkisista lähteistä saatavat tiedot voivat olla puutteellisia tai vanhoja." })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* If we have latestMetrics, show indicator cards */}
                {latestMetrics && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {availableIndicators.map((it) => (
                      <div key={it.label} className="rounded-lg border border-gray-700/60 bg-black/40 p-4">
                        <div className="text-sm text-gray-400">{it.label}</div>
                        <div className="text-base font-semibold text-gray-100">{it.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Financial Data Transparency Card (Full) */}
                {financialTransparencyData && (
                  <div className="mb-4">
                    <FinancialDataTransparency
                      confidence={financialTransparencyData.confidence}
                      sources={financialTransparencyData.sources}
                      dataSource={financialTransparencyData.dataSource}
                      lastUpdated={financialTransparencyData.lastUpdated}
                      compact={false}
                    />
                  </div>
                )}

                {/* Comprehensive Financial Charts Display (from Step6Summary) */}
                {(() => {
                  // Filter out null/undefined values from latestRatios
                  const filteredRatios: CurrentFinancialRatios = {};
                  Object.entries(latestFinancialRatios).forEach(([key, value]) => {
                    if (value !== null && value !== undefined && value !== '') {
                      (filteredRatios as any)[key] = value;
                    }
                  });

                  // Filter yearlyData to only include years with actual data
                  const filteredYearlyData = yearlyFinancialData.filter(yearData => 
                    Object.values(yearData).some(value => value !== null && value !== undefined && value !== '')
                  );

                  const allCharts = [
                    { key: 'revenue' as ChartKey, type: 'bar' as const, titleKey: 'revenueTitle' },
                    { key: 'operatingProfit' as ChartKey, type: 'bar' as const, titleKey: 'operatingProfitTitle' },
                    { key: 'ebitda' as ChartKey, type: 'bar' as const, titleKey: 'ebitdaTitle' },
                    { key: 'netResult' as ChartKey, type: 'bar' as const, titleKey: 'netResultTitle' },
                    { key: 'roe' as ChartKey, type: 'bar' as const, titleKey: 'roeTitle' },
                    { key: 'debtToEquity' as ChartKey, type: 'bar' as const, titleKey: 'debtToEquityTitle' },
                    { key: 'currentRatio' as ChartKey, type: 'gauge' as const, titleKey: 'currentRatioTitle' },
                    { key: 'quickRatio' as ChartKey, type: 'gauge' as const, titleKey: 'quickRatioTitle' },
                    { key: 'totalAssets' as ChartKey, type: 'bar' as const, titleKey: 'totalAssetsTitle' }, 
                    { key: 'equityAndAssetsCombo' as ChartKey, type: 'combo' as const, titleKey: 'equityAndAssetsComboTitle' },
                    { key: 'cashAndReceivables' as ChartKey, type: 'line' as const, titleKey: 'cashAndReceivablesTitle' },
                    { key: 'dso' as ChartKey, type: 'line' as const, titleKey: 'dsoTitle' },
                  ];

                  const filteredCharts = allCharts.filter(chart => {
                    // Show chart only if there's data for it
                    if (chart.key === 'currentRatio' || chart.key === 'quickRatio') {
                      const hasData = filteredRatios[chart.key as keyof CurrentFinancialRatios] !== undefined;
                      console.log(`📊 [Step3AI] Chart ${chart.key} (ratio): hasData=${hasData}, value=${filteredRatios[chart.key as keyof CurrentFinancialRatios]}`);
                      return hasData;
                    }
                    const hasData = filteredYearlyData.some(data => (data as any)[chart.key] !== null && (data as any)[chart.key] !== undefined);
                    console.log(`📊 [Step3AI] Chart ${chart.key} (yearly): hasData=${hasData}`);
                    if (hasData) {
                      console.log(`📊 [Step3AI] Chart ${chart.key} sample values:`, filteredYearlyData.map(d => (d as any)[chart.key]));
                    }
                    return hasData;
                  });
                  
                  console.log('📊 [Step3AI] All available charts:', allCharts.map(c => c.key));
                  console.log('📊 [Step3AI] Filtered charts (with data):', filteredCharts.map(c => c.key));

                  // If we have comprehensive financial data, show it; otherwise fallback to public data
                  if (filteredYearlyData.length > 0 || Object.keys(filteredRatios).length > 0) {
                    return (
                      <div className="mb-4 space-y-4">
                        {/* Financial Insights - Show AI-powered insights based on financial data */}
                        {filteredYearlyData.length > 1 && (
                          <FinancialInsights
                            data={filteredYearlyData.map(d => ({
                              fiscal_year: d.fiscal_year || 0,
                              revenue: d.revenue || null,
                              ebitda: d.ebitda || null,
                              net_profit: d.netProfit || null,
                              total_assets: d.totalAssets || null,
                              total_equity: d.totalEquity || null,
                              total_liabilities: d.totalLiabilities || null,
                              current_ratio: filteredRatios.currentRatio ?? null,
                              debt_to_equity_ratio: filteredRatios.debtToEquity ?? null,
                            }))}
                            companyName={companyData?.name || undefined}
                          />
                        )}

                        {/* Financial Charts */}
                        <FinancialChartsDisplay
                          title={t("financialHighlightsTitle", { default: "Taloudelliset tunnusluvut" })}
                          yearlyData={filteredYearlyData}
                          latestRatios={filteredRatios}
                          isLoading={isFetchingFinancialMetrics}
                          error={financialsError}
                          locale={currentLocale}
                          currency={companyCurrency}
                          defaultChartsToShow={expanded ? 10 : 6}
                          chartHeight={expanded ? 250 : 200}
                          chartKeysAndTypes={filteredCharts}
                        />
                      </div>
                    );
                  }

                  // Fallback to public data if no comprehensive data available
                  if (publicYearly && publicYearly.length > 0) {
                    return (
                      <div className="mb-4">
                        <FinancialChartsDisplay
                          title={t("financialHighlightsTitle", { default: "Taloudelliset tunnusluvut" })}
                          yearlyData={publicYearly
                            .slice(-5)
                            .map((y: any) => ({
                              fiscal_year: y.year || y.fiscal_year,
                              revenue: parseFinancialValue(y.revenue) || null,
                              ebitda: null,
                              roe: null,
                              debtToEquity: null,
                              totalAssets: null,
                              totalEquity: null,
                              cashAndReceivables: null,
                              dso: null,
                            }))}
                          latestRatios={{}}
                          isLoading={isFetchingFinancials}
                          error={null}
                          locale={currentLocale}
                          defaultChartsToShow={2}
                          chartHeight={200}
                          chartKeysAndTypes={[
                            { key: 'revenue' as ChartKey, type: 'bar', titleKey: 'revenueTitle' },
                            { key: 'ebitda' as ChartKey, type: 'bar', titleKey: 'netProfitTitle' },
                          ]}
                        />
                      </div>
                    );
                  }

                  return (
                    <div className="text-sm text-gray-400">
                      {isFetchingFinancialMetrics 
                        ? t("financial.loading", { default: "Ladataan taloustietoja..." })
                        : t("financial.noData", { default: "Taloustietoja ei ole vielä saatavilla." })
                      }
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Main conversation area */}

      {/* CTA Section - Scroll Back to CFO Conversation */}
      <div className="flex justify-center mt-12 mb-8">
        <Button
          onClick={() => {
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // If conversation hasn't started yet, start it automatically
            if (!conversationStarted) {
              // Small delay to let the scroll animation start
              setTimeout(() => {
                startConversation();
              }, 300);
            }
          }}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-primary/90 hover:to-gold-secondary/90 text-black font-bold text-lg py-6 px-10 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
        >
          <MessageSquare className="h-6 w-6" />
          {t('cta.startCfoAnalysis', { default: 'Aloita CFO-avustajan kanssa analyysi' })}
        </Button>
      </div>

      {/* Swedish Lenders Coming Soon Popup */}
      <SwedishLendersComingSoonPopup
        isOpen={showSwedishLendersPopup}
        onClose={() => {
          setShowSwedishLendersPopup(false);
          setSelectedRecommendationForPopup(null);
        }}
        onFeedback={() => {
          setShowSwedishLendersPopup(false);
          setSelectedRecommendationForPopup(null);
          handleFeedbackNavigation();
        }}
        recommendationType={selectedRecommendationForPopup?.type}
        recommendationTitle={selectedRecommendationForPopup?.title}
      />
    </div>
  );
}

function formatCurrency(value: number, currency: string = 'EUR'): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency, maximumFractionDigits: 0 }).format(
      value || 0
    );
  } catch {
    return `${value}`;
  }
}

function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${Number(value).toFixed(2)}x`;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${Number(value).toFixed(1)}%`;
}
