"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Upload, Info, Bot, User, ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";
import FinancialChartsDisplay, {
  YearlyFinancialData,
  CurrentFinancialRatios,
  ChartKey,
} from "@/components/financial/FinancialChartsDisplay";
import { createClient } from "@/utils/supabase/client";
import FormattedText from '@/components/ui/formatted-text';


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
}: Step3AIConversationProps) {
  const t = useTranslations("Onboarding");
  const supabase = createClient();

  const [expanded, setExpanded] = useState(false);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [hasLatestStatement, setHasLatestStatement] = useState(false);

  // Add comprehensive financial data state (from Step6Summary)
  const [yearlyFinancialData, setYearlyFinancialData] = useState<YearlyFinancialData[]>([]);
  const [latestFinancialRatios, setLatestFinancialRatios] = useState<CurrentFinancialRatios>({});
  const [isFetchingFinancialMetrics, setIsFetchingFinancialMetrics] = useState<boolean>(false);
  const [financialsError, setFinancialsError] = useState<string | null>(null);

  // Conversation state
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [optionType, setOptionType] = useState<"single" | "multi">("single");
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");
  const [cfoGuidance, setCfoGuidance] = useState<string>("");
  const [loadingNext, setLoadingNext] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [isConversationDone, setIsConversationDone] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  // Hardcoded to gemini-2.5-flash as requested
  const selectedModel = 'gemini-2.5-flash';
  const [recommendationsLoading, setRecommendationsLoading] = useState<boolean>(false);
  const [analysisType, setAnalysisType] = useState<"short" | "long" | null>(null);
  
  // New UI state
  const [conversationStarted, setConversationStarted] = useState<boolean>(false);
  const [recommendationsExpanded, setRecommendationsExpanded] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  // Hint to press continue after selecting options
  const [showPressHint, setShowPressHint] = useState<boolean>(false);
  const pressHintTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Prevent repeated financial data reloads
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchAtRef = useRef<number>(0);
  const completedDocIdsRef = useRef<Set<string>>(new Set());

  // Comprehensive financial data fetching function (from Step6Summary)
  const fetchFinancialMetrics = useCallback(async () => {
    if (!companyId) return;

    // Cooldown: avoid rapid re-fetch loops within 8s
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchAtRef.current < 8000) {
      return;
    }
    isFetchingRef.current = true;
    lastFetchAtRef.current = now;
    
    setIsFetchingFinancialMetrics(true);
    setFinancialsError(null);
    
    try {
      // Get current session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error('❌ Failed to get session or session invalid:', sessionError);
        throw new Error('Authentication session is invalid. Please sign in again.');
      }
      const token = session.access_token;
      
      // Fetch financial metrics from the API
      const response = await fetch(`/api/financial-metrics/list?companyId=${companyId}&order=fiscal_year&direction=desc`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error fetching financial data: ${response.status}`, errorText);
        throw new Error(`Failed to fetch financial data: ${response.status}`);
      }
      
      const { data } = await response.json();
      
      console.log('🔍 [Step3AI] Raw financial metrics from API:', data);
      console.log('🔍 [Step3AI] Data length:', data?.length);
      console.log('🔍 [Step3AI] First record sample:', data?.[0]);
      
      if (!data || data.length === 0) {
        console.log('No financial data available for this company');
        setYearlyFinancialData([]);
        setLatestFinancialRatios({});
        setIsFetchingFinancialMetrics(false);
        return;
      }
      
      // Process the financial metrics into the format expected by FinancialChartsDisplay
      const yearlyDataMapped: YearlyFinancialData[] = data.map((item: any) => ({
        fiscal_year: item.fiscal_year,
        revenue: item.revenue_current || item.revenue, // Use revenue_current from DB
        ebitda: item.ebitda || item.operational_cash_flow, // Use operational_cash_flow as fallback for ebitda
        roe: item.return_on_equity,
        debtToEquity: item.debt_to_equity_ratio,
        totalAssets: item.total_assets,
        totalEquity: item.total_equity,
        cashAndReceivables: item.cash_and_equivalents,
        dso: item.dso_days,
      }));
      
      // Set the latest financial ratios (from the most recent year - data is sorted desc by API)
      const latest = data[0]; 
      const latestRatios: CurrentFinancialRatios = {
        currentRatio: latest.current_ratio,
        quickRatio: latest.quick_ratio,
        debtToEquity: latest.debt_to_equity_ratio,
        roe: latest.return_on_equity,
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
    } catch (error) {
      console.error('❌ Unexpected error fetching financial data:', error);
      setFinancialsError(error instanceof Error ? error.message : 'Failed to load financial data');
    } finally {
      isFetchingRef.current = false;
      setIsFetchingFinancialMetrics(false);
    }
  }, [companyId, supabase]);

  // Handle applying a recommendation
  const handleApplyRecommendation = useCallback((item: any, itemIndex?: number) => {
    if (!onApplyRecommendation) {
      console.warn('onApplyRecommendation handler not provided');
      return;
    }

    // Map recommendation item to application form data
    const recommendationData = {
      fundingType: mapRecommendationTypeToFundingType(item.type),
      amount: item.amount || '',
      termMonths: item.termMonths || (item.type === 'business_loan' ? 12 : undefined),
      guaranteesRequired: item.guaranteesRequired,
      recommendationSource: {
        title: item.title,
        summary: item.summary,
        costNotes: item.costNotes,
      },
    };

    console.log('🚀 Applying recommendation:', recommendationData);
    onApplyRecommendation(recommendationData);
  }, [onApplyRecommendation]);

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
  useEffect(() => {
    if (companyId) {
      fetchFinancialMetrics();
    }
  }, [companyId, fetchFinancialMetrics]);

  // Refresh financial metrics when documents change (after upload/processing)
  useEffect(() => {
    if (!companyId || documents.length === 0) return;

    // Track newly completed documents to avoid re-trigger loops
    const newlyCompleted = documents.filter(doc => doc.processing_status === 'completed' && doc.extraction_data?.financial_data);
    const prev = completedDocIdsRef.current;
    const newIds: string[] = [];
    newlyCompleted.forEach(doc => {
      if (doc.id && !prev.has(doc.id)) newIds.push(doc.id);
    });

    if (newIds.length > 0) {
      newIds.forEach(id => prev.add(id));
      // Slight delay to allow DB updates to propagate, but only once per new completion
      const timer = setTimeout(() => {
        console.log('🔄 [Step3AI] Refreshing financial metrics after new completed document(s):', newIds);
        fetchFinancialMetrics();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [documents, companyId, fetchFinancialMetrics]);

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
    const description: string | undefined = companyData?.description;
    const products: string | undefined = companyData?.products;
    const market: string | undefined = companyData?.market;

    // Show detailed info in expanded section
    if (description) items.push({ label: t("company.description", { default: "Description" }), value: String(description) });
    if (products) items.push({ label: t("company.products", { default: "Products" }), value: String(products) });
    if (market) items.push({ label: t("company.market", { default: "Market" }), value: String(market) });
    return items;
  }, [companyData, t]);

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
      if (latestYearData.revenue) items.push({ key: "revenue", label: t("financial.revenue", { default: "Revenue" }), value: latestYearData.revenue, format: formatCurrency });
      if (latestYearData.ebitda) items.push({ key: "ebitda", label: t("financial.ebitda", { default: "EBITDA" }), value: latestYearData.ebitda, format: formatCurrency });
      if (latestYearData.totalAssets) items.push({ key: "totalAssets", label: t("financial.totalAssets", { default: "Total assets" }), value: latestYearData.totalAssets, format: formatCurrency });
      if (latestYearData.totalEquity) items.push({ key: "totalEquity", label: t("financial.equity", { default: "Equity" }), value: latestYearData.totalEquity, format: formatCurrency });
      if (latestYearData.cashAndReceivables) items.push({ key: "cash", label: t("financial.cash", { default: "Cash & Receivables" }), value: latestYearData.cashAndReceivables, format: formatCurrency });
    }
    
    // Add financial ratios if available
    if (latestFinancialRatios.currentRatio) items.push({ key: "currentRatio", label: t("financial.currentRatio", { default: "Current Ratio" }), value: latestFinancialRatios.currentRatio, format: formatRatio });
    if (latestFinancialRatios.roe) items.push({ key: "roe", label: t("financial.roe", { default: "ROE %" }), value: latestFinancialRatios.roe, format: formatPercent });
    
    // Fallback to basic metrics if comprehensive data not available
    if (items.length === 0 && latestMetrics) {
      const fallbackItems = [
        { key: "revenue_current", label: t("financial.revenue", { default: "Revenue" }), format: formatCurrency },
        { key: "operational_cash_flow", label: t("financial.netProfit", { default: "Net profit" }), format: formatCurrency },
        { key: "total_assets", label: t("financial.totalAssets", { default: "Total assets" }), format: formatCurrency },
        { key: "total_liabilities", label: t("financial.totalLiabilities", { default: "Total liabilities" }), format: formatCurrency },
        { key: "total_equity", label: t("financial.equity", { default: "Equity" }), format: formatCurrency },
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
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M €`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k €`;
      return formatCurrency(value);
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
            setConversationStarted(true);
            setRecommendationsExpanded(true);
          }
        }
      } finally {
        setRecommendationsLoading(false);
      }
    };
    fetchExisting();
  }, [companyId, supabase]);

  // Function to start the conversation after intro
  const startConversation = useCallback(async () => {
    setConversationStarted(true);
    setLoadingNext(true);
    
    // Add intro completion to turns
    const introMessage = t("chat.intro.startButton", { default: "Aloitetaan" });
    pushTurn({ role: "user", content: introMessage, timestamp: Date.now() });
    
    try {
      // Start with analysis type selection
      const initialOptions: OptionItem[] = [
        { 
          label: currentLocale === 'en' 
            ? "Quick analysis (2 min)"
            : currentLocale === 'sv'
            ? "Snabb analys (2 min)"
            : "Nopea analyysi (2 min)", 
          value: "short" 
        },
        { 
          label: currentLocale === 'en'
            ? "Comprehensive analysis (7 min)"
            : currentLocale === 'sv'
            ? "Omfattande analys (7 min)"
            : "Perusteellinen analyysi (7 min)", 
          value: "long" 
        },
      ];
      const initialQuestion = currentLocale === 'en'
        ? "Would you like a quick or comprehensive analysis?"
        : currentLocale === 'sv'
        ? "Vill du ha en snabb eller omfattande analys?"
        : "Haluatko nopean vai perusteellisen analyysin?";
      const initialGuidance = currentLocale === 'en'
        ? "Quick analysis gives you key recommendations in just a few minutes. Comprehensive analysis maps your company's situation in detail and provides more thorough recommendations."
        : currentLocale === 'sv'
        ? "Snabb analys ger dig huvudrekommendationer på några minuter. Omfattande analys kartlägger ditt företags situation mer noggrant och ger mer omfattande rekommendationer."
        : "Nopea analyysi antaa sinulle pääsuositukset muutamassa minuutissa. Perusteellinen analyysi kartoittaa tarkemmin yrityksesi tilanteen ja antaa kattavammat suositukset.";
      
      setQuestion(initialQuestion);
      setOptions(initialOptions);
      setOptionType("single");
      setCfoGuidance(initialGuidance);
      setAnalysisType(null);
      
      // Add assistant question and CFO guidance to turns
      pushTurn({ role: "assistant", content: initialQuestion, timestamp: Date.now() + 1 });
      pushTurn({ role: "cfo", content: initialGuidance, timestamp: Date.now() + 2 });
      
    } finally {
      setLoadingNext(false);
    }
  }, [currentLocale, t]);

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

  const handleOptionToggle = (value: string) => {
    if (optionType === "single") {
      setSelected([value]);
    } else {
      setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    }
  };

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

  // Unified submit function that handles both regular conversation and recommendations follow-up
  const submitMessage = async () => {
    const userInput = input?.trim();
    const hasSelection = selected.length > 0;
    const isRecommendationFollowUp = isConversationDone && recommendation && recommendation.items && recommendation.items.length > 0;
    
    if (!hasSelection && !userInput) return;

    // Hide hint on submit
    setShowPressHint(false);

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
      analysisType: analysisType || "short",
      isRecommendationFollowUp,
      currentRecommendations: isRecommendationFollowUp ? recommendation : undefined,
    };

    try {
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
        if (response.status === 401) {
          throw new Error('Authentication expired. Please refresh the page.');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (isRecommendationFollowUp) {
        // Handle recommendations follow-up
        if (data.cfoGuidance) {
          pushTurn({ role: "cfo", content: data.cfoGuidance, timestamp: Date.now() });
          setCfoGuidance(data.cfoGuidance);
        }

        if (data.updatedRecommendations) {
          setRecommendation(data.updatedRecommendations);
          const updateMessage = currentLocale === 'en' 
            ? '✨ Recommendations updated based on your preferences'
            : currentLocale === 'sv'
            ? '✨ Rekommendationer uppdaterade baserat på dina preferenser'
            : '✨ Suositukset päivitetty toiveidesi mukaan';
          pushTurn({ role: "assistant", content: updateMessage, timestamp: Date.now() + 1 });
        }
      } else {
        // Handle regular conversation
        if (data.nextQuestion) {
          setQuestion(data.nextQuestion);
          setOptions(data.options || []);
          setOptionType("multi");
          pushTurn({ role: "assistant", content: data.nextQuestion, timestamp: Date.now() });
          setAskedQuestions((prev) => [...prev, data.nextQuestion]);
        }

        if (data.cfoGuidance) {
          pushTurn({ role: "cfo", content: data.cfoGuidance, timestamp: Date.now() });
          setCfoGuidance(data.cfoGuidance);
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
      const errorMessage = isRecommendationFollowUp 
        ? t("chat.error.generic", { default: "Pahoittelut, en saanut vastausta kysymykseenne. Yritä uudelleen hetken kuluttua." })
        : t("chat.error.generic", { default: "Pahoittelut, en saanut seuraavaa kysymystä haettua. Yritä uudelleen hetken kuluttua." });
      
      pushTurn({
        role: isRecommendationFollowUp ? "cfo" : "assistant",
        content: errorMessage + (error?.message ? `\n(${error.message})` : ""),
        timestamp: Date.now(),
      });
    } finally {
      setLoadingNext(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Company summary card */}
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

              {/* Company info chips - more compact */}
              {basicInfoItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {basicInfoItems.slice(0, 4).map((it, idx) => (
                    <span
                      key={`${it.label}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-700/60 bg-black/40 px-2 py-0.5 text-xs text-gray-200"
                    >
                      <span className="text-gray-400">{it.label}:</span>
                      <span className="font-medium text-gray-100 max-w-[140px] truncate" title={String(it.value)}>
                        {it.value}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {/* Upload block at bottom of left column */}
              {!hasLatestStatement && (
                <div className="mt-1">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx" />
                  <p className="text-xs text-gray-400 mb-2 max-w-md">
                    {t("company.uploadDescription", { default: "Upload financial documents to analyse your company financials in detail." })}
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
                      : t("company.uploadLatest", { default: "Lisää uusin tilinpäätös" })}
                  </Button>
                </div>
              )}
            </div>

            {/* Right side - Financial indicators in denser grid */}
            <div className="flex-1">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {availableIndicators.slice(0, 6).map((it) => (
                  <div key={it.label} className="rounded-lg border border-gray-700/60 bg-black/40 p-2.5">
                    <div className="text-xs text-gray-400 leading-tight">{it.label}</div>
                    <div className="text-sm font-medium text-gray-100 leading-tight">{it.value}</div>
                  </div>
                ))}
              </div>
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
            {/* Expanded company details */}
            {expandedInfoItems.length > 0 && (
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {expandedInfoItems.map((it, idx) => (
                  <div key={`${it.label}-${idx}`} className="rounded-lg border border-gray-700/60 bg-black/40 p-3">
                    <div className="text-xs text-gray-400">{it.label}</div>
                    <div className="text-sm font-medium text-gray-100 break-words">{it.value as string}</div>
                  </div>
                ))}
              </div>
            )}

            {isFetchingFinancials ? (
              <div className="text-sm text-gray-400">{t("financial.loading", { default: "Ladataan taloustietoja..." })}</div>
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
                    { key: 'ebitda' as ChartKey, type: 'bar' as const, titleKey: 'ebitdaTitle' },
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
                      <div className="mb-4">
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
      <div className={`grid gap-6 ${
        recommendation && recommendation.items && recommendation.items.length > 0 
          ? recommendationsExpanded 
            ? "grid-cols-1 lg:grid-cols-3" // Chat narrower when recommendations expanded
            : "grid-cols-1 lg:grid-cols-4" // Chat wider when recommendations collapsed
          : "grid-cols-1" // Full width when no recommendations
      }`}>
        {/* Chat Area */}
        <div className={`space-y-4 ${
          recommendation && recommendation.items && recommendation.items.length > 0 
            ? recommendationsExpanded 
              ? "lg:col-span-2" // Narrower when recommendations expanded
              : "lg:col-span-3" // Wider when recommendations collapsed
            : "lg:col-span-1" // Full width when no recommendations
        }`}>
          {!conversationStarted ? (
            /* Welcome/Intro Screen */
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
              <Button
                onClick={startConversation}
                disabled={loadingNext}
                className="bg-gold-primary hover:bg-gold-primary/90 text-black font-medium py-3 px-8 rounded-lg transition-colors shadow-lg"
              >
                {loadingNext ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("chat.thinking", { default: "Pohditaan..." })}
                  </div>
                ) : (
                  t("chat.intro.startButton", { default: "Aloitetaan" })
                )}
              </Button>
            </Card>
          ) : (
            /* Chat Interface */
            <div className="space-y-4">
              {/* Chat History - Always Visible */}
              <Card className="bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/80 border border-gold-primary/30 text-gray-100 p-4 min-h-[400px] max-h-[600px] overflow-y-auto shadow-xl" ref={historyRef}>
                <div className="space-y-3">
                  {turns.map((turn, idx) => (
                    <div key={`${turn.role}-${idx}-${turn.timestamp}`} className={`flex gap-3 ${
                      (turn.role === "assistant" || turn.role === "cfo")
                        ? "bg-gradient-to-r from-gold-primary/5 to-transparent p-3 rounded-lg border-l-4 border-gold-primary/40" 
                        : "bg-gradient-to-l from-blue-500/5 to-transparent p-3 rounded-lg border-r-4 border-blue-400/40"
                    }`}>
                      <div className="flex-shrink-0 mt-1">
                        {turn.role === "assistant" ? (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold-primary/20 to-gold-secondary/20 border-2 border-gold-primary/60 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-gold-primary" />
                          </div>
                        ) : turn.role === "cfo" ? (
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
                          (turn.role === "assistant" || turn.role === "cfo") ? "text-gold-primary" : "text-blue-300"
                        }`}>
                          {turn.role === "assistant" 
                            ? (currentLocale === 'en' ? 'Assistant' : currentLocale === 'sv' ? 'Assistent' : 'Avustaja')
                            : turn.role === "cfo"
                            ? `CFO – ${t("chat.assistant", { default: "avustaja" })}`
                            : (currentLocale === 'en' ? 'You' : currentLocale === 'sv' ? 'Du' : 'Sinä')}
                        </div>
                        <div className="text-sm">
                          <FormattedText content={turn.content} />
                        </div>
                      </div>
                    </div>
                  ))}
                  
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

              {/* Current Question and Options (if conversation not done) */}
              {!isConversationDone && question && (
                <Card className="bg-gray-900/60 border border-gold-primary/30 text-gray-100 p-4">
                  <div className="text-sm text-gold-primary mb-3">{question}</div>
                  {options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {options.map((opt) => {
                        const active = selected.includes(opt.value);
                        const isAnalysisTypeSelection = !analysisType && (opt.value === "short" || opt.value === "long");
                        
                        return (
                          <button
                            key={opt.value}
                            className={cn(
                              "px-3 py-1.5 text-sm rounded-full border transition-colors inline-flex items-center",
                              active
                                ? "bg-gold-primary text-gray-900 border-gold-primary shadow-lg"
                                : "bg-gray-800/60 text-gray-100 border-gray-400 hover:bg-gold-primary/15 hover:border-gold-primary hover:text-white"
                            )}
                            onClick={async () => {
                              if (isAnalysisTypeSelection) {
                                // For analysis type, submit immediately on click
                                setSelected([opt.value]);
                                setAnalysisType(opt.value as "short" | "long");
                                await submitMessage();
                              } else {
                                // For other questions, use multi-select
                                handleOptionToggle(opt.value);
                              }
                            }}
                            aria-pressed={active}
                            role={isAnalysisTypeSelection ? "button" : "checkbox"}
                            aria-checked={!isAnalysisTypeSelection ? active : undefined}
                          >
                            {active && !isAnalysisTypeSelection && <Check className="h-3.5 w-3.5 mr-2" />}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}

              {/* Unified Input Field */}
              <div className="relative flex items-center gap-2">
                <input
                  className="flex-1 rounded-xl bg-white border-2 border-gold-primary/70 px-5 py-4 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-3 focus:ring-gold-primary/30 focus:border-gold-primary shadow-xl transition-all duration-300 hover:bg-white hover:border-gold-primary hover:shadow-2xl"
                  placeholder={
                    isConversationDone && recommendation && recommendation.items && recommendation.items.length > 0
                      ? (currentLocale === 'en' ? 'Ask questions about recommendations...' : currentLocale === 'sv' ? 'Ställ frågor om rekommendationer...' : 'Kysy lisäkysymyksiä suosituksista...')
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
                    "bg-gold-primary hover:bg-gold-primary/90 text-black font-medium py-3 px-6 rounded-lg transition-colors shadow-lg",
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
                      setAnalysisType(null);
                    }}
                  >
                    {currentLocale === 'en' ? 'Start New Analysis' : currentLocale === 'sv' ? 'Starta ny analys' : 'Aloita uusi analyysi'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations Sidebar */}
        {recommendation && recommendation.items && recommendation.items.length > 0 && (
          <div className={`${recommendationsExpanded ? "lg:col-span-1" : "lg:col-span-1"} space-y-4`}>
            <Card className="bg-gray-900/60 border border-gold-primary/30 text-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gold-primary flex items-center gap-2">
                  🎯 
                  {currentLocale === 'en' ? 'Recommendations' : currentLocale === 'sv' ? 'Rekommendationer' : 'Rahoitussuositukset'}
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
                  {recommendation.comparison && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                      <h4 className="font-medium text-blue-300 mb-2 text-sm">📊 
                        {currentLocale === 'en' ? 'Comparison' : currentLocale === 'sv' ? 'Jämförelse' : 'Vertailu'}
                      </h4>
                      <p className="text-xs text-gray-300">{recommendation.comparison}</p>
                    </div>
                  )}

                  {recommendation.items?.map((item: any, idx: number) => (
                    <div key={idx} className="bg-gray-800/40 border border-gold-primary/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-primary/20 flex items-center justify-center">
                          <span className="text-gold-primary font-semibold text-xs">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gold-primary mb-1 text-sm">{getRecommendationTypeLabel(item.type, item.title)}</h4>
                          <p className="text-gray-300 text-xs mb-2 line-clamp-3">{item.summary}</p>
                          
                          {(item.amount || item.termMonths) && (
                            <div className="space-y-1 mb-2">
                              {item.amount && (
                                <div className="text-xs text-gray-400">
                                  {currentLocale === 'en' ? 'Amount:' : currentLocale === 'sv' ? 'Belopp:' : 'Määrä:'} {formatCurrency(item.amount)}
                                </div>
                              )}
                              {item.termMonths && (
                                <div className="text-xs text-gray-400">
                                  {currentLocale === 'en' ? 'Term:' : currentLocale === 'sv' ? 'Tid:' : 'Aika:'} {Math.round(item.termMonths)} {currentLocale === 'en' ? 'months' : currentLocale === 'sv' ? 'månader' : 'kuukautta'}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <Button
                            onClick={() => handleApplyRecommendation(item, idx)}
                            size="sm"
                            className="w-full bg-gold-primary hover:bg-gold-highlight text-black font-medium text-xs py-1.5 px-2 rounded transition-colors"
                          >
                            🚀 {t("recommendations.apply", { default: "Hae tätä rahoitusta" })}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Collapsed Recommendations */
                <div className="space-y-2">
                  {recommendation.items?.slice(0, 3).map((item: any, idx: number) => (
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
                            {formatCurrency(item.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {recommendation.items && recommendation.items.length > 3 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{recommendation.items.length - 3} {currentLocale === 'en' ? 'more' : currentLocale === 'sv' ? 'fler' : 'lisää'}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
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
