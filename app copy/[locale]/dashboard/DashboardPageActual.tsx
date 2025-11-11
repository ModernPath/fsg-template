'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboard } from './layout';
import { Spinner } from '@/components/ui/spinner';
import RecommendationViewer from './components/RecommendationViewer';
import FinancialChartsDisplay, { YearlyFinancialData, CurrentFinancialRatios, ChartKey } from '@/components/financial/FinancialChartsDisplay';
import FundabilityAnalysis from '@/components/dashboard/FundabilityAnalysis';
import { getCurrencyCode } from '@/lib/utils/currency-utils';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  LightbulbIcon,
  ArrowUpRight,
  Download,
  Share2,
  Loader2,
  BadgeCheck,
  Zap,
  BarChart3,
  Bookmark,
  ArrowRightCircle,
  Goal,
  Banknote,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileWarning
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Document interface
interface Document {
  id: string;
  name: string;
  mime_type: string;
  file_size: number;
  fiscal_year: number;
  fiscal_period: string;
  document_type: {
    name: string;
  };
  processed: boolean;
  processing_status: string;
  uploaded_at: string;
  extraction_data?: any;
}

// Updated Financial metrics interface based on CSV data
interface FinancialMetrics {
  id: string;
  company_id: string;
  fiscal_year: number;
  fiscal_period: string;
  return_on_equity?: number | null;
  debt_to_equity_ratio?: number | null;
  current_ratio?: number | null;
  quick_ratio?: number | null;
  ebitda?: number | null;
  revenue?: number | null;
  net_profit?: number | null;
  depreciation_amortization?: number | null;
  accounts_receivable?: number | null;
  current_assets?: number | null;
  current_liabilities?: number | null;
  total_equity?: number | null;
  total_liabilities?: number | null;
  dso_days?: number | null;
  fixed_asset_turnover_ratio?: number | null;
  total_assets?: number | null;
  fixed_assets?: number | null;
  cash_and_equivalents?: number | null;
  created_at: string;
}

// Funding Applications interface
interface LenderApplication {
  id: string;
  lender_id: string;
  status: string;
  submitted_at: string;
  last_polled_at?: string;
  lender_info?: {
    id: string;
    name: string;
    display_name?: string;
  };
}

// Define Financing Offer interface (add fields as needed based on query)
interface FinancingOffer {
  id: string;
  lender_id: string;
  offer_date: string;
  amount_offered: string;
  interest_rate: number | null;
  loan_term_months: number;
  status: string;
  lender_offer_reference: string;
  monthly_payment: string;
  total_repayment: string;
  fee_amount: string;
  fee_percentage: string;
  raw_offer_data?: any;
  lender_info?: {
    id: string;
    name: string;
    display_name?: string;
  };
}

interface FundingApplication {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  term_months: number;
  created_at: string;
  submitted_at?: string;
  lender_applications: LenderApplication[];
  financing_offers?: FinancingOffer[]; // Add offers array
}

// Updated Recommendations interface based on image/structure
interface FundingRecommendations {
  id: string;
  summary?: string | null;
  analysis?: string | null;
  recommendation_details?: { type?: string; details?: string; rationale?: string }[] | null; // Keep rationale just in case, adjust display logic
  action_plan?: string | null;
  outlook?: string | null;
  created_at: string;
  // Removed unused fields: optimal_funding_types, funding_justification, risk_mitigation_measures, liquidity_optimization_recommendations
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Dashboard');
  const tFinancials = useTranslations('Financials');
  const tCommon = useTranslations('Common');
  const { session, loading: authLoading } = useAuth();
  const { completedSteps, setCompletedSteps } = useDashboard();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [allFinancialMetrics, setAllFinancialMetrics] = useState<FinancialMetrics[]>([]);
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<FundingRecommendations | null>(null);
  const [fundingApplications, setFundingApplications] = useState<FundingApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const [approvingOfferId, setApprovingOfferId] = useState<string | null>(null);
  const [processingCapitalBoxOfferId, setProcessingCapitalBoxOfferId] = useState<string | null>(null);
  const locale = pathname.split('/')[1];

  const [yearlyFinancialDataForCharts, setYearlyFinancialDataForCharts] = useState<YearlyFinancialData[]>([]);
  const [latestFinancialRatiosForCharts, setLatestFinancialRatiosForCharts] = useState<CurrentFinancialRatios>({});
  const [isFetchingChartData, setIsFetchingChartData] = useState<boolean>(true);
  const [chartDataError, setChartDataError] = useState<string | null>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!session?.access_token || !isClient) return;
    
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setIsFetchingChartData(true);
      setChartDataError(null);
      try {
        const response = await fetch('/api/dashboard?allMetrics=true', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            const currentLocale = window.location.pathname.split('/')[1];
            router.push(`/${currentLocale}/auth/sign-in`);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Company ID is optional for dashboard - users can use without a company
        if (!data.company_id) {
          console.log('No company ID found, but continuing to show dashboard');
          // Don't redirect to onboarding, just continue with empty company data
        }
        
        setCompanyId(data.company_id);
        setCompany(data.company);
        setRecentDocuments(data.documents || []);
        const sortedMetrics: FinancialMetrics[] = (data.metrics || []).sort((a: FinancialMetrics, b: FinancialMetrics) => b.fiscal_year - a.fiscal_year);
        setAllFinancialMetrics(sortedMetrics);
        setSelectedYearIndex(0);
        setRecommendations(data.recommendations);
        setFundingApplications(data.funding_applications || []);

        if (sortedMetrics.length > 0) {
          const yearlyDataForChartsProcessed: YearlyFinancialData[] = sortedMetrics.map((item: any) => ({
            fiscal_year: item.fiscal_year,
            revenue: item.revenue,
            ebitda: item.ebitda || (item.operating_profit && item.revenue && item.operating_profit < item.revenue ? item.operating_profit : null), // Use operating_profit as fallback ONLY if it's valid (< revenue)
            roe: item.return_on_equity,
            debtToEquity: item.debt_to_equity_ratio,
            totalAssets: item.total_assets,
            totalEquity: item.total_equity,
            cashAndReceivables: item.cash_and_equivalents,
            dso: item.dso_days,
          })).sort((a: YearlyFinancialData, b: YearlyFinancialData) => a.fiscal_year - b.fiscal_year);

          const latestMetricForChart = sortedMetrics[0];
          const latestRatiosForChartProcessed: CurrentFinancialRatios = {
            currentRatio: latestMetricForChart.current_ratio,
            quickRatio: latestMetricForChart.quick_ratio,
            debtToEquity: latestMetricForChart.debt_to_equity_ratio,
            roe: latestMetricForChart.return_on_equity,
          };
          setYearlyFinancialDataForCharts(yearlyDataForChartsProcessed);
          setLatestFinancialRatiosForCharts(latestRatiosForChartProcessed);
          setChartDataError(null);
        } else {
          setYearlyFinancialDataForCharts([]);
          setLatestFinancialRatiosForCharts({});
          setChartDataError(tCommon('errors.noDataForCharts', {default: 'No financial data available to display charts.'}));
        }

        if (sortedMetrics.length > 0 && !completedSteps.includes('financial-dashboard')) {
          setCompletedSteps([...completedSteps, 'financial-dashboard']);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setAllFinancialMetrics([]);
        setSelectedYearIndex(0);
        setRecommendations(null);
        setFundingApplications([]);
        setYearlyFinancialDataForCharts([]);
        setLatestFinancialRatiosForCharts({});
        setChartDataError(error instanceof Error ? error.message : tCommon('errors.loadDataFailed', {default: 'Failed to load dashboard data.'}));
      } finally {
        setIsLoading(false);
        setIsFetchingChartData(false);
      }
    };
    
    fetchDashboardData();
  }, [session?.access_token, isClient, router, completedSteps, setCompletedSteps, t, locale, tCommon]);

  // Function to refresh dashboard data after an action
  const refreshDashboardData = useCallback(async () => {
    if (!session?.access_token || !isClient) return;
    // Simplified refetch logic - consider abstracting if fetchDashboardData becomes complex
    console.log('Refreshing dashboard data...');
    setIsLoading(true); // Indicate loading during refresh
    try {
      const response = await fetch('/api/dashboard?allMetrics=true', { // Assuming same endpoint
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      // Update all relevant states to ensure everything is fresh
      setFundingApplications(data.funding_applications || []); 
      setRecommendations(data.recommendations);
      setAllFinancialMetrics(data.metrics || []);
      // If metrics were updated, update chart data too
      if (data.metrics && data.metrics.length > 0) {
        const sortedMetrics = data.metrics.sort((a: FinancialMetrics, b: FinancialMetrics) => b.fiscal_year - a.fiscal_year);
        const yearlyDataForChartsProcessed = sortedMetrics.map((item: any) => ({
          fiscal_year: item.fiscal_year,
          revenue: item.revenue,
          ebitda: item.ebitda || (item.operating_profit && item.revenue && item.operating_profit < item.revenue ? item.operating_profit : null), // Use operating_profit as fallback ONLY if it's valid (< revenue)
          roe: item.return_on_equity,
          debtToEquity: item.debt_to_equity_ratio,
          totalAssets: item.total_assets,
          totalEquity: item.total_equity,
          cashAndReceivables: item.cash_and_equivalents,
          dso: item.dso_days,
        })).sort((a: YearlyFinancialData, b: YearlyFinancialData) => a.fiscal_year - b.fiscal_year);
        setYearlyFinancialDataForCharts(yearlyDataForChartsProcessed);
      }
      console.log('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      toast.error(tCommon('errors.refreshFailed', { default: 'Failed to refresh data.'}));
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, isClient, setIsLoading, setFundingApplications, setRecommendations, setAllFinancialMetrics, setYearlyFinancialDataForCharts, tCommon]);

  // Handler for CapitalBox Offer Actions (Accept/Reject)
  const handleCapitalBoxOfferAction = useCallback(async (offerUuid: string, action: 'ACCEPTED' | 'REJECTED') => {
    if (!session?.access_token || processingCapitalBoxOfferId) return; // Prevent multiple clicks

    setProcessingCapitalBoxOfferId(offerUuid); // Set loading state for this specific offer
    console.log(`Attempting to ${action} CapitalBox offer: ${offerUuid}`);
    toast.loading(tCommon('messages.processing', { default: 'Processing...'}), { id: `offer-action-${offerUuid}` });

    try {
      const response = await fetch(`/api/capitalbox/offers/${offerUuid}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action.toLowerCase()} offer`);
      }

      toast.success(t('fundingApplications.offerActionSuccess', { action: action.toLowerCase() }), { id: `offer-action-${offerUuid}` });
      console.log(`Successfully ${action} CapitalBox offer ${offerUuid}:`, result);
      
      // Update local state to reflect the change immediately
      setFundingApplications((prevApps) =>
        prevApps.map((app) => ({
          ...app,
          financing_offers: app.financing_offers?.map((offer) =>
            offer.lender_offer_reference === offerUuid
              ? { ...offer, status: action.toLowerCase() }
              : offer
          ),
        }))
      );

      // Refresh data to ensure we have the latest state
      await refreshDashboardData(); 

    } catch (error: any) {
      console.error(`Error ${action.toLowerCase()}ing CapitalBox offer ${offerUuid}:`, error);
      toast.error(t('fundingApplications.offerActionError', { action: action.toLowerCase(), message: error.message }), { id: `offer-action-${offerUuid}` });
    } finally {
      // Always reset the processing state, regardless of success or failure
      setProcessingCapitalBoxOfferId(null);
    }
  }, [session?.access_token, processingCapitalBoxOfferId, refreshDashboardData, t, tCommon]);

  const selectedFinancialMetric = useMemo(() => {
    if (allFinancialMetrics.length > 0 && selectedYearIndex >= 0 && selectedYearIndex < allFinancialMetrics.length) {
      return allFinancialMetrics[selectedYearIndex];
    }
    return null;
  }, [allFinancialMetrics, selectedYearIndex]);

  const formatCurrency = useCallback((value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(Number(value))) return 'N/A';
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(value);
  }, [locale]);
  
  const formatPercent = useCallback((value: number | undefined | null, multiply = true) => {
    if (value === undefined || value === null) return 'N/A';
    const displayValue = multiply ? value * 100 : value;
    return `${displayValue.toFixed(1)}%`;
  }, []);
  
  const formatRatio = useCallback((value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(2);
  }, []);

  const formatDays = useCallback((value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(0)} ${t('days', { default: 'days' })}`;
  }, [t]);

  const getHealthColor = useCallback((value: number | undefined | null) => {
    if (value === undefined || value === null) return "text-gold-secondary";
    return value >= 0 ? "text-gold-secondary" : "text-crimson";
  }, []);

  const handleYearChange = useCallback((direction: 'prev' | 'next') => {
    setSelectedYearIndex(prevIndex => {
      const newIndex = direction === 'prev' ? prevIndex + 1 : prevIndex - 1; 
      if (newIndex >= 0 && newIndex < allFinancialMetrics.length) {
        return newIndex;
      }
      return prevIndex; 
    });
  }, [allFinancialMetrics.length]);

  const handleApproveOffer = useCallback(async (offer: FinancingOffer) => {
     if (!offer || approvingOfferId === offer.id || offer.status === 'accepted') return;
     if (!session?.access_token) {
        toast.error(tCommon('errors.authMissing', { default: 'Authentication token missing. Please log in again.' }));
        return;
     }
     setApprovingOfferId(offer.id);
     const offerId = offer.id;
     toast.info(t('offerApprovingToast', { default: 'Attempting to approve offer...' }));
     try {
       const response = await fetch(`/api/offers/${offerId}/accept`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
       });
       const result = await response.json();
       if (!response.ok) {
         console.error('Failed to approve offer:', result);
         throw new Error(result.error || `HTTP error! status: ${response.status}`);
       }
       toast.success(t('offerApprovedSuccessToast', { default: 'Offer approved successfully!' }));
       setFundingApplications((prevApps) =>
         prevApps.map((app) => {
           if (app.financing_offers?.some(o => o.id === offerId)) {
             return { ...app, financing_offers: app.financing_offers.map((o) => o.id === offerId ? { ...o, status: 'accepted' } : o)};
           }
           return app;
         })
       );
     } catch (error: any) {
       console.error('Error approving offer:', error);
       toast.error(tCommon('errors.actionFailed', { action: t('approveOfferButton'), message: error.message }));
     } finally {
       setApprovingOfferId(null);
     }
  }, [approvingOfferId, t, session, tCommon]);

  const MetricsSection = () => {
    if (isLoading) return <div className="h-60 flex justify-center items-center"><Spinner className="text-gold-primary"/></div>;
    if (!selectedFinancialMetric) {
      return (
        <section className="mb-12 p-6 bg-gray-very-dark rounded-lg shadow-lg border border-gray-dark text-center">
          <FileWarning className="h-10 w-10 text-gold-primary/70 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-gold-primary mb-2">{t('noMetricsTitle')}</h3>
          <p className="text-gold-secondary/80">{t('noMetricsForYear', {default: 'No financial metrics available for the selected year.'})}</p>
        </section>
      );
    }
    return (
      <section className="mb-12 p-6 bg-gray-very-dark rounded-lg shadow-lg border border-gray-dark">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gold-primary flex items-center">
            <CalendarDays className="h-6 w-6 mr-3 text-gold-primary/80" /> 
            {t('yearlyFinancialHighlights')}
          </h2>
          {allFinancialMetrics.length > 1 && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleYearChange('prev')} disabled={selectedYearIndex >= allFinancialMetrics.length - 1} className="border-gold-primary text-gold-primary hover:bg-gold-primary/10">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-gold-secondary font-medium tabular-nums">
                {selectedFinancialMetric.fiscal_year}
              </span>
              <Button variant="outline" size="sm" onClick={() => handleYearChange('next')} disabled={selectedYearIndex <= 0} className="border-gold-primary text-gold-primary hover:bg-gold-primary/10">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries({
            revenue: selectedFinancialMetric.revenue,
            netProfit: selectedFinancialMetric.net_profit,
            ebitda: selectedFinancialMetric.ebitda,
            roe: selectedFinancialMetric.return_on_equity,
            debtToEquity: selectedFinancialMetric.debt_to_equity_ratio,
            currentRatio: selectedFinancialMetric.current_ratio,
            quickRatio: selectedFinancialMetric.quick_ratio,
            dso: selectedFinancialMetric.dso_days,
          }).map(([key, value]) => (
            <div key={key} className="p-4 bg-black/30 rounded-md border border-gray-dark/50">
              <h4 className="text-sm font-medium text-gold-secondary/80 mb-1 capitalize">{tFinancials(`${key}Title`, {default: key.replace(/([A-Z])/g, ' $1')})}</h4>
              <p className={`text-2xl font-semibold ${key === 'roe' || key === 'netProfit' || key === 'ebitda' ? getHealthColor(value as number) : 'text-gold-primary'}`}>
                {key === 'roe' ? formatPercent(value as number) :
                 key === 'debtToEquity' || key === 'currentRatio' || key === 'quickRatio' ? formatRatio(value as number) :
                 key === 'dso' ? formatDays(value as number) :
                 formatCurrency(value as number)}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const RecommendationsSection = () => { 
    if (isLoading && !recommendations) return <div className="h-60 flex justify-center items-center"><Spinner className="text-gold-primary"/></div>;
    if (!recommendations) {
      return (
        <section className="mb-12 p-6 bg-gray-very-dark rounded-lg shadow-lg border border-gray-dark text-center">
          <Goal className="h-10 w-10 text-gold-primary/70 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-gold-primary mb-2">{t('noRecommendationsTitle')}</h3>
          <p className="text-gold-secondary/80 mb-6">{t('noRecommendationsAvailable', {default: 'No funding recommendations are available at this time.'})}</p>
          <Link href={`/${locale}/onboarding?step=pre-analysis`} passHref>
            <Button className="bg-gold-primary text-black hover:bg-gold-highlight focus-visible:ring-gold-primary py-2.5 px-6 font-semibold">
              {t('performNewAnalysis')} <ArrowRightCircle className="ml-2 h-5 w-5"/>
            </Button>
          </Link>
        </section>
      );
    }

    // Erota avoimet rahoitussuositukset erilliseen osioon
    const openRecommendations = recommendations.recommendation_details?.filter(detail => 
      detail.type && !fundingApplications.some(app => app.type === detail.type)
    ) || [];

    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gold-primary flex items-center">
            <LightbulbIcon className="h-6 w-6 mr-3 text-gold-primary/80" /> 
            {t('fundingRecommendations')}
          </h2>
          <div className="flex gap-3">
            <Link href={`/${locale}/onboarding?step=summary`} passHref>
              <Button className="bg-gray-dark text-gold-primary border border-gold-primary hover:bg-gold-primary hover:text-black focus-visible:ring-gold-primary py-2.5 px-6 font-semibold">
                {t('continueOnboarding')} <ArrowRightCircle className="ml-2 h-5 w-5"/>
              </Button>
            </Link>
            <Link href={`/${locale}/onboarding?step=pre-analysis`} passHref>
              <Button className="bg-gold-primary text-black hover:bg-gold-highlight focus-visible:ring-gold-primary py-2.5 px-6 font-semibold">
                {t('performNewAnalysis')} <ArrowRightCircle className="ml-2 h-5 w-5"/>
              </Button>
            </Link>
          </div>
        </div>

        {/* Avoimet rahoitussuositukset osio */}
        {openRecommendations.length > 0 && (
          <section className="mb-8 p-6 bg-gray-very-dark rounded-lg shadow-lg border border-gray-dark">
            <h3 className="text-xl font-semibold text-gold-primary mb-4 flex items-center">
              <Bookmark className="h-5 w-5 mr-2" />
              {t('recommendationsTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openRecommendations.map((recommendation, index) => {
                const typeKey = recommendation.type || 'unknown';
                const tOnboarding = useTranslations('Onboarding');
                const typeDisplayName = tOnboarding(`recommendationType.${typeKey}`, { 
                  default: typeKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                });

                return (
                  <div key={index} className="p-4 bg-black/30 rounded-lg border border-gray-dark/50 hover:border-gold-primary/50 transition-colors">
                    <h4 className="font-semibold text-gold-primary mb-2">{typeDisplayName}</h4>
                    <p className="text-sm text-gold-secondary/80 mb-3">{recommendation.details}</p>
                    <Link href={`/${locale}/finance-application?step=kyc-ubo&fundingType=${typeKey}`} passHref>
                      <Button size="sm" className="bg-gold-primary text-black hover:bg-gold-highlight text-xs">
                        {t('seeDetails')} <ArrowUpRight className="ml-1 h-3 w-3"/>
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Suppea yhteenveto ilman analyysiä */}
        <section className="p-6 bg-gray-very-dark rounded-lg shadow-lg border border-gray-dark">
          <h3 className="text-xl font-semibold text-gold-primary mb-4">{t('recommendationsSummary')}</h3>
          <p className="text-gold-secondary mb-4">{recommendations.summary || 'Ei yhteenvetoa saatavilla.'}</p>
          
          {/* Näytä vain toimintasuunnitelma ja näkymät */}
          {recommendations.action_plan && (
            <div className="mb-4">
              <h4 className="font-semibold text-gold-secondary mb-2">{t('actionPlan')}</h4>
              <p className="text-sm text-gold-secondary/80">{recommendations.action_plan}</p>
            </div>
          )}
          
          {recommendations.outlook && (
            <div className="mb-4">
              <h4 className="font-semibold text-gold-secondary mb-2">{t('outlook')}</h4>
              <p className="text-sm text-gold-secondary/80">{recommendations.outlook}</p>
            </div>
          )}
        </section>
      </div>
    );
  };

  const FundingApplicationsSection = () => {
    const tOnboarding = useTranslations('Onboarding');
    if (isLoading && fundingApplications.length === 0) return <div className="h-60 flex justify-center items-center"><Spinner className="text-gold-primary"/></div>;

    if (fundingApplications.length === 0) {
      return (
        <section className="mb-12 p-8 bg-gray-very-dark rounded-lg shadow-lg border border-gray-dark">
          <div className="text-center">
            <Briefcase className="h-12 w-12 text-gold-primary/70 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gold-primary mb-2">{t('noFundingApplicationsTitle')}</h3>
            <p className="text-gold-secondary/80 mb-6">{t('noFundingApplicationsText')}</p>
            <Link href={`/${locale}/finance-application?step=kyc-ubo`} passHref>
              <Button className="bg-gold-primary text-black hover:bg-gold-highlight focus-visible:ring-gold-primary py-2.5 px-6 font-semibold">
                {t('startNewApplication', {default: 'Start New Application'})} <ArrowRightCircle className="ml-2 h-5 w-5"/>
              </Button>
            </Link>
          </div>
        </section>
      );
    }

    const formatFundingType = (type: string) => {
        try {
          return tOnboarding(`recommendationType.${type}`);
        } catch (err) {
          return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    };

    const getStatusBadgeColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        case 'submitted':
        case 'processing': 
        case 'offer_processing_failed': // Treat processing failed similar to processing
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'offers_received':
        case 'pending_contract':
        case 'contract_ready': 
        case 'accepted': // Qred specific?
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'approved': // Qred specific?
        case 'contract_signed':
        case 'disbursed':
        case 'funded':
        case 'completed':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'rejected':
        case 'declined':
        case 'withdrawn':
        case 'no_offers':
        case 'offer_rejected':
        case 'contract_failed':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      }
    };

    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gold-primary flex items-center">
                <Banknote className="h-6 w-6 mr-3 text-gold-primary/80" /> 
                {t('fundingApplicationsTitle')}
            </h2>
            <Link href={`/${locale}/finance-application?step=kyc-ubo`} passHref>
              <Button className="bg-gold-primary text-black hover:bg-gold-highlight focus-visible:ring-gold-primary py-2.5 px-6 font-semibold">
                {t('applyNewFunding')} <ArrowRightCircle className="ml-2 h-5 w-5"/>
              </Button>
            </Link>
        </div>
      <div className="space-y-6">
        {fundingApplications.map((app) => (
            <div key={app.id} className="bg-gray-very-dark shadow-lg rounded-lg p-6 border border-gray-dark hover:border-gold-primary/30 transition-colors duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-dark/50">
                <div>
                  <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('applicationType')}</p>
                  <p className="font-semibold text-gold-primary text-sm">{formatFundingType(app.type)}</p>
                </div>
                <div>
                  <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('applicationAmount')}</p>
                  <p className="font-semibold text-gold-primary text-sm">{formatCurrency(app.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('applicationStatus')}</p>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(app.status)} inline-block`}>
                    {t(`applicationStatusValues.${app.status?.toLowerCase()}`, { default: app.status })}
                </span>
            </div>
                <div>
                  <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('applicationSubmitted')}</p>
                  <p className="font-semibold text-gold-primary text-sm">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A'}</p>
                </div>
              </div>
              
              {app.lender_applications && app.lender_applications.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gold-secondary mb-2">{t('lenderSubmissionsTitle')}</h4>
                  <div className="space-y-2">
                    {app.lender_applications.map(la => (
                        <div key={la.id} className="flex justify-between items-center p-3 bg-black/30 rounded-md text-xs border border-gray-dark/50">
                            <span className="text-gold-secondary">{la.lender_info?.display_name || la.lender_info?.name || tCommon('unknownLender')}</span>
                            <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusBadgeColor(la.status)}`}>
                                {t(`applicationStatusValues.${la.status?.toLowerCase()}`, { default: la.status })}
                            </span>
                      </div>
                  ))}
                  </div>
                </div>
              )}

              {app.financing_offers && app.financing_offers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-dark/50">
                  <h4 className="text-sm font-medium text-gold-secondary mb-3">{t('receivedOffersTitle')}</h4>
                  <div className="space-y-4">
                    {app.financing_offers.map((offer) => {
                       const isApproving = approvingOfferId === offer.id;
                       const isProcessingCapitalBox = processingCapitalBoxOfferId === offer.id;
                       const isAccepted = offer.status === 'accepted';
                       const isQredOffer = offer.lender_info?.name?.toLowerCase() === 'qred';
                       const isCapitalBoxOffer = offer.lender_info?.name?.toLowerCase()?.includes('capital box');
                       const canApproveQred = offer.status === 'offered' && !isAccepted && isQredOffer;
                       const canApproveCapitalBox = offer.status === 'offered' && !isAccepted && isCapitalBoxOffer;
                       
                       // Format offer date for display
                       const formattedOfferDate = offer.offer_date ? 
                         new Date(offer.offer_date).toLocaleDateString(locale, {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A';
                       
                       // Get raw offer data for CapitalBox specific fields
                       const rawOfferData = isCapitalBoxOffer && offer.raw_offer_data ? offer.raw_offer_data : null;
                       
                       // Format expiration date if available
                       const formattedExpirationDate = rawOfferData?.offerExpires ? 
                         new Date(rawOfferData.offerExpires).toLocaleDateString(locale, {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A';

                      return (
                         <div key={offer.id} className="flex flex-col p-4 bg-black/30 rounded-md border border-gray-dark/70 hover:border-gold-primary/50 transition-colors duration-200">
                           <div className="flex flex-col md:flex-row justify-between items-start mb-4 pb-3 border-b border-gray-dark/50">
                             <div className="mb-3 md:mb-0">
                               <p className="font-semibold text-gold-primary text-lg">
                                 {offer.lender_info?.display_name || offer.lender_info?.name || tCommon('unknownLender')}
                               </p>
                               <p className="text-sm text-gold-secondary/80">
                                 {t('offerReceivedDate')}: {formattedOfferDate}
                               </p>
                               {isCapitalBoxOffer && rawOfferData && (
                                 <p className="text-sm text-gold-secondary/80 mt-1">
                                   {t('offerExpiresDate')}: {formattedExpirationDate}
                                 </p>
                               )}
                             </div>
                             
                             <div className="flex flex-col items-end">
                               <p className="text-2xl font-bold text-gold-primary">
                                 {formatCurrency(parseFloat(offer.amount_offered))}
                               </p>
                               <p className="text-sm text-gold-secondary/80">
                                 {t('loanTermMonths', {default: 'Term: {term} months', term: offer.loan_term_months})}
                               </p>
                             </div>
                           </div>
                           
                           {/* Expanded offer details */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                             <div className="bg-black/20 p-3 rounded-md">
                               <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('monthlyPayment', {default: 'Monthly Payment'})}</p>
                               <p className="text-lg font-semibold text-gold-primary">
                                 {offer.monthly_payment ? formatCurrency(parseFloat(offer.monthly_payment)) : 'N/A'}
                               </p>
                             </div>
                             
                             <div className="bg-black/20 p-3 rounded-md">
                               <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('totalRepayment', {default: 'Total Repayment'})}</p>
                               <p className="text-lg font-semibold text-gold-primary">
                                 {offer.total_repayment ? formatCurrency(parseFloat(offer.total_repayment)) : 'N/A'}
                               </p>
                             </div>
                             
                             <div className="bg-black/20 p-3 rounded-md">
                               <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('monthlyFee', {default: 'Monthly Fee'})}</p>
                               <p className="text-lg font-semibold text-gold-primary">
                                 {rawOfferData?.monthlyFee ? formatPercent(parseFloat(rawOfferData.monthlyFee), false) : 'N/A'}
                               </p>
                             </div>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                             <div className="bg-black/20 p-3 rounded-md">
                               <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('setupFee', {default: 'Setup Fee'})}</p>
                               <p className="text-lg font-semibold text-gold-primary">
                                 {rawOfferData?.setupFee ? formatCurrency(parseFloat(rawOfferData.setupFee)) : 'N/A'}
                               </p>
                             </div>
                             
                             <div className="bg-black/20 p-3 rounded-md">
                               <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('adminFee', {default: 'Admin Fee'})}</p>
                               <p className="text-lg font-semibold text-gold-primary">
                                 {rawOfferData?.adminFee ? formatCurrency(parseFloat(rawOfferData.adminFee)) : 'N/A'}
                               </p>
                             </div>
                             
                             <div className="bg-black/20 p-3 rounded-md">
                               <p className="text-xs text-gold-secondary/70 uppercase tracking-wider">{t('repaymentType', {default: 'Repayment Type'})}</p>
                               <p className="text-lg font-semibold text-gold-primary">
                                 {rawOfferData?.repaymentType ? t(`repaymentTypes.${rawOfferData.repaymentType}`, { default: rawOfferData.repaymentType }) : 'N/A'}
                               </p>
                             </div>
                           </div>

                           {/* Additional requirements section */}
                           {isCapitalBoxOffer && rawOfferData && (
                             <div className="mb-4 p-3 bg-black/20 rounded-md">
                               <p className="text-xs text-gold-secondary/70 uppercase tracking-wider mb-2">{t('additionalRequirements', {default: 'Additional Requirements'})}</p>
                               <ul className="space-y-1">
                                 {rawOfferData.requireDocBalanceSheetPLA && (
                                   <li className="text-sm text-gold-secondary flex items-center">
                                     <AlertCircle className="h-4 w-4 mr-2 text-gold-primary/70" />
                                     {t('requireDocBalanceSheetPLA', {default: 'Balance Sheet PLA Document Required'})}
                                   </li>
                                 )}
                                 {rawOfferData.requireGuarantors && (
                                   <li className="text-sm text-gold-secondary flex items-center">
                                     <AlertCircle className="h-4 w-4 mr-2 text-gold-primary/70" />
                                     {t('requireGuarantors', {default: 'Additional Guarantors Required'})}
                                   </li>
                                 )}
                                 {rawOfferData.requireUBOGuarantors && (
                                   <li className="text-sm text-gold-secondary flex items-center">
                                     <AlertCircle className="h-4 w-4 mr-2 text-gold-primary/70" />
                                     {t('requireUBOGuarantors', {default: 'UBO Guarantors Required'})}
                                   </li>
                                 )}
                               </ul>
                             </div>
                           )}

                           <div className="flex justify-end mt-2">
                             {(isQredOffer || isCapitalBoxOffer || isAccepted) && (
                                <Button 
                                  size="sm"
                                 variant={isAccepted ? "ghost" : "default"} 
                                 className={`py-2 px-4 text-sm min-w-[120px] whitespace-nowrap ${isAccepted ? 'border-purple-500/50 bg-purple-600/30 text-purple-300 cursor-default hover:bg-purple-600/40' : 'bg-gold-primary text-black hover:bg-gold-highlight focus-visible:ring-gold-highlight'}`}
                                 onClick={() => {
                                   if (isCapitalBoxOffer && !isAccepted) {
                                     handleCapitalBoxOfferAction(offer.lender_offer_reference, 'ACCEPTED');
                                   } else if (isQredOffer && !isAccepted) {
                                     handleApproveOffer(offer);
                                   }
                                 }}
                                 disabled={isApproving || isProcessingCapitalBox || !(canApproveQred || canApproveCapitalBox) || isAccepted}
                               >
                                 {isProcessingCapitalBox ? (
                                   <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> {t('approvingOfferButton')}</>
                                 ) : isApproving ? (
                                   <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> {t('approvingOfferButton')}</>
                                 ) : isAccepted ? (
                                   <><CheckCircle className="mr-1.5 h-4 w-4" /> {t('offerAcceptedButton')}</>
                                  ) : (
                                   <>{t('approveOfferButton')} <ArrowRightCircle className="ml-1.5 h-4 w-4" /></>
                                  )}
                                </Button>
                            )}
                          </div>
                        </div>
                      );
                  })}
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>
      </section>
    );
  };

  if (authLoading || (isLoading && !isClient)) {
    return <div className="fixed inset-0 bg-black flex justify-center items-center z-[200]"><Spinner className="h-16 w-16 text-gold-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-black text-gold-secondary p-4 sm:p-6 lg:p-8">
      <header className="mb-10 flex justify-between items-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gold-primary tracking-tight">{t('dashboardTitle')}</h1>
        <Link href={`/${locale}`} passHref>
          <Button variant="outline" className="border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-black">
            {t('backToHome', { default: 'Takaisin etusivulle' })}
          </Button>
        </Link>
      </header>

      {isLoading && isClient && (
        <div className="flex justify-center items-center py-20"><Spinner className="h-12 w-12 text-gold-primary" /></div>
      )}

      {!isLoading && (
        <>
          {companyId ? (
            <>
              <RecommendationsSection />
              <FundingApplicationsSection />
              
              <section className="mb-12">
                <FinancialChartsDisplay
                  title={tFinancials('financialHighlightsTitle')}
                  yearlyData={yearlyFinancialDataForCharts}
                  latestRatios={latestFinancialRatiosForCharts}
                  isLoading={isFetchingChartData}
                  error={chartDataError}
                  locale={locale}
                  currency={getCurrencyCode(locale)}
                  defaultChartsToShow={3} 
                  chartKeysAndTypes={[
                    { key: 'revenue', type: 'bar', titleKey: 'revenueTitle' },
                    { key: 'ebitda', type: 'bar', titleKey: 'ebitdaTitle' },
                    { key: 'roe', type: 'bar', titleKey: 'roeTitle' },
                    { key: 'debtToEquity', type: 'bar', titleKey: 'debtToEquityTitle' },
                    { key: 'currentRatio', type: 'gauge', titleKey: 'currentRatioTitle' },
                    { key: 'quickRatio', type: 'gauge', titleKey: 'quickRatioTitle' },
                    { key: 'totalAssets', type: 'bar', titleKey: 'totalAssetsTitle' }, 
                    { key: 'equityAndAssetsCombo', type: 'combo', titleKey: 'equityAndAssetsComboTitle' },
                    { key: 'cashAndReceivables', type: 'line', titleKey: 'cashAndReceivablesTitle' },
                    { key: 'dso', type: 'line', titleKey: 'dsoTitle' },
                  ]}
                />
              </section>

              <section className="mb-12">
                <FundabilityAnalysis
                  company={company}
                  latestMetrics={allFinancialMetrics[0] || null}
                  hasFinancialData={allFinancialMetrics.length > 0}
                />
              </section>

              <MetricsSection />
            </>
          ) : (
            <section className="mb-12 text-center py-20">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-gold-primary mb-4">
                  {t('noCompanyDataTitle', { default: 'Yritystietoja ei löytynyt' })}
                </h2>
                <p className="text-gold-secondary mb-6">
                  {t('noCompanyDataText', { default: 'Tiliisi ei ole yhdistetty yritystä. Jatka käyttöönottoprosessia päästäksesi hallintapaneeliin.' })}
                </p>
                <button
                  onClick={() => router.push(`/${locale}/onboarding`)}
                  className="px-6 py-3 bg-gold-primary text-black font-semibold rounded-lg hover:bg-gold-highlight transition-colors"
                >
                  {t('navigateToOnboarding', { default: 'Siirry käyttöönottoon' })}
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
} 