'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, ArrowLeftIcon, HomeIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CompanyRow } from '../OnboardingFlow';
import CompanySelector from '@/components/ui/CompanySelector';
import { PresentationChartBarIcon } from '@heroicons/react/24/solid';
import FinancialChartsDisplay, { YearlyFinancialData, CurrentFinancialRatios, ChartKey } from '@/components/financial/FinancialChartsDisplay';
import { createClient } from '@/utils/supabase/client';
import FullAnalysisView from '@/components/charts/FullAnalysisView';
import { AlertCircle } from 'lucide-react';
import FinancialDataTransparency from '@/components/financial/FinancialDataTransparency';

// Recommendation interfaces (keep as they are needed for props and logic)
interface RecommendationDetail {
  type?: string;
  details?: string;
  suitability_rationale?: string;
  amount_suggestion?: number;
}
interface Recommendation {
  id: string;
  summary?: string | null;
  analysis?: string | null;
  recommendation_details?: RecommendationDetail[] | null;
  action_plan?: string | null;
  outlook?: string | null;
  created_at: string; // Assuming created_at exists for RecommendationViewer
}

interface Step5SummaryProps {
  companyName: string;
  fundingRecommendations: Recommendation[];
  isFetchingRecommendations: boolean;
  error: string | null;
  goToStep: (step: number) => void;
  goToDashboard: () => void;
  startApplication: (recommendationId?: string, fundingType?: string, amount?: number) => void;
  companyId: string | null;
  userCompanies: CompanyRow[];
  handleCompanyChange: (companyId: string) => void;
  isFetchingCompanies: boolean;
  locale: string;
  // Optional prop to track when the analysis was initiated (timestamp)
  analysisStartTime?: number;
  // Company country code for determining currency, business ID format, etc.
  countryCode?: string | null;
}

// Define the funding types TrustyFinance supports for direct application (keep)
const allowedFundingTypes = ['business_loan', 'business_loan_unsecured', 'business_loan_secured', 'credit_line', 'factoring_ar', 'leasing'];

// Max minutes to look back when considering recommendations "fresh"
const MAX_FRESHNESS_MINUTES = 2; // 2 minutes

// Default waiting time for recommendations after analysis in milliseconds
const WAIT_FOR_ANALYSIS_MS = 60000; // 1 minute. Keep this as it's a separate fallback.

// NEW: Set the total progress duration to 40 seconds
const PROGRESS_DURATION_MS = 40000; // 40 seconds
const POLLING_INTERVAL_MS = 5000; // 5 seconds per polling attempt
// MAX_POLLING_ATTEMPTS will recalculate based on the new PROGRESS_DURATION_MS
const MAX_POLLING_ATTEMPTS = Math.ceil(PROGRESS_DURATION_MS / POLLING_INTERVAL_MS); // ~8 attempts

const Step5Summary: React.FC<Step5SummaryProps> = ({
  companyName,
  fundingRecommendations,
  isFetchingRecommendations,
  error,
  goToStep,
  goToDashboard,
  startApplication,
  companyId,
  userCompanies,
  handleCompanyChange,
  isFetchingCompanies,
  locale,
  analysisStartTime,
  countryCode,
}) => {
  const t = useTranslations('Onboarding');
  const tFinancials = useTranslations('Financials');
  const viewerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Calculate freshness threshold when component mounts and store it
  const now = Date.now();
  
  // If analysisStartTime is provided, we're coming from Step4 analysis
  const isFromAnalysis = !!analysisStartTime;
  
  // Store the component mount time
  const mountTimeRef = useRef<number>(now);
  
  // Use analysis start time if provided, otherwise use a fallback (e.g., mount time minus 2 minutes)
  const freshnessThresholdRef = useRef<number>(
    analysisStartTime || 
    (now - (MAX_FRESHNESS_MINUTES * 60 * 1000))
  );
  
  // Only filter for fresh recommendations if coming directly from analysis
  const [shouldShowFreshRecommendationsOnly, setShouldShowFreshRecommendationsOnly] =
    useState<boolean>(isFromAnalysis);
  
  // Track whether we're still in the waiting period after analysis
  const [isWaitingForAnalysis, setIsWaitingForAnalysis] = useState<boolean>(isFromAnalysis); // Only wait if coming from analysis
  
  // Set a timeout to stop waiting for analysis
  useEffect(() => {
    if (isWaitingForAnalysis) {
      console.log(`⏱️ [Step5] Waiting for new recommendations after analysis. Will show existing recommendations in ${WAIT_FOR_ANALYSIS_MS/1000} seconds if none are found`);
      
      const timeoutId = setTimeout(() => {
        console.log(`⏱️ [Step5] Wait period for fresh recommendations has expired. Showing all available recommendations.`);
        setIsWaitingForAnalysis(false);
        setShouldShowFreshRecommendationsOnly(false);
      }, WAIT_FOR_ANALYSIS_MS);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isWaitingForAnalysis]);
  
  // Log the exact threshold at component mount time
  useEffect(() => {
    if (isFromAnalysis) {
      console.log(`🔥 [Step5] Coming directly from analysis initiated at ${new Date(analysisStartTime!).toISOString()}`);
      console.log(`🕒 [Step5] Applying strict freshness check - only showing recommendations newer than analysis start`);
    } else {
      console.log(`🕒 [Step5] Direct access or reload - showing all available recommendations without freshness filtering`);
    }
  }, [isFromAnalysis, analysisStartTime]);
  
  // Track polling timeout state
  const [hasPollingTimedOut, setHasPollingTimedOut] = useState<boolean>(false);
  
  // Extract the primary recommendation (considering the timestamp filter)
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
  const primaryRecommendation = filteredRecommendations?.[0];

  // Add state for financial data
  const [yearlyFinancialData, setYearlyFinancialData] = useState<YearlyFinancialData[]>([]);
  const [latestFinancialRatios, setLatestFinancialRatios] = useState<CurrentFinancialRatios>({});
  const [isFetchingFinancials, setIsFetchingFinancials] = useState<boolean>(false);
  const [financialsError, setFinancialsError] = useState<string | null>(null);
  const [financialTransparencyData, setFinancialTransparencyData] = useState<{
    confidence: number | null;
    sources: string[] | null;
    dataSource: string | null;
    lastUpdated: string | null;
  } | null>(null);
  const [isPollingRecommendations, setIsPollingRecommendations] = useState<boolean>(false);
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  
  // State for RecommendationViewer
  const [showRecommendationViewer, setShowRecommendationViewer] = useState<boolean>(false);
  
  // Tooltip-related state
  const [hoveredRecommendationType, setHoveredRecommendationType] = useState<string | null>(null);

  // Function to get tooltip content for funding types
  const getRecommendationTooltip = (type: string, details?: string, suitability?: string): string => {
    // Return full suitability rationale or details without shortening
    if (suitability) {
      return suitability;
    }
    if (details) {
      return details;
    }
    
    // Default tooltips based on funding type
    const fundingTypeDescriptions: Record<string, string> = {
      'business_loan': 'Sopii yrityksille, jotka tarvitsevat pitkäaikaista rahoitusta investointeihin tai kasvuun.',
      'business_loan_unsecured': 'Vakuudeton yrityslaina sopii yrityksille, joilla on hyvä luottoluokitus ja vakaa kassavirta.',
      'business_loan_secured': 'Vakuudellinen yrityslaina tarjoaa paremmat korot vakuutta vastaan.',
      'credit_line': 'Joustava rahoitusratkaisu kassavirran hallintaan. Maksat korkoa vain käyttämästäsi summasta.',
      'factoring_ar': 'Muuta myyntisaamisesi välittömästi käteiseksi parantaaksesi kassavirtaa.',
      'leasing': 'Rahoita laitteet ja koneet ilman suurta alkuinvestointia.'
    };
    
    return fundingTypeDescriptions[type] || 'Rahoitussuositus yrityksesi tarpeisiin.';
  };

  // Helper to trigger fetching recommendations - used in polling/timeout
  const triggerRecommendationsFetch = () => {
    if (typeof window !== 'undefined' && companyId) {
      try {
        console.log('📣 [Step5] Dispatching recommendations-ready event (trigger fetch)');
        const event = new CustomEvent('recommendations-ready', { detail: { companyId } });
        window.dispatchEvent(event);
      } catch (err) {
        console.error('❌ [Step5] Error dispatching event:', err);
      }
    }
  };

  // Function to manually show all recommendations if needed
  const handleShowAllRecommendations = () => {
    console.log('🔍 [Step5] Manually showing all available recommendations');
    setShouldShowFreshRecommendationsOnly(false);
    setIsWaitingForAnalysis(false);
    setIsPollingRecommendations(false); // Stop polling as well
    // Trigger a fetch to ensure we have the latest non-fresh data if needed
    triggerRecommendationsFetch();
  };

  // Filter recommendations based on timestamp and analysis state
  useEffect(() => {
    // If no recommendations or if we're still fetching, nothing to do
    if (!fundingRecommendations || fundingRecommendations.length === 0 ) {
      setFilteredRecommendations([]);
      return;
    }

    // If we are not coming from analysis OR if we explicitly chose to show all, display all recommendations
    if (!isFromAnalysis || !shouldShowFreshRecommendationsOnly) {
      console.log(`📊 [Step5] Showing all ${fundingRecommendations.length} available recommendations without freshness filter`);
      setFilteredRecommendations(fundingRecommendations);
      return;
    }

    // If we ARE coming from analysis (isFromAnalysis is true) and should only show fresh ones:
    console.log(`🔍 [Step5] Filtering for fresh recommendations newer than ${new Date(freshnessThresholdRef.current).toISOString()}`);

    if (fundingRecommendations.length > 0) {
      // Find recommendations newer than our analysis start time
      const freshFromAnalysis = fundingRecommendations.filter((rec) => {
        const recCreatedAt = new Date(rec.created_at).getTime();
        return recCreatedAt >= freshnessThresholdRef.current;
      });
      
      if (freshFromAnalysis.length > 0) {
        console.log(`✅ [Step5] Found ${freshFromAnalysis.length} fresh recommendations created after analysis started!`);
        setFilteredRecommendations(freshFromAnalysis);
        setIsWaitingForAnalysis(false); // Stop the initial wait period if we found fresh ones
        setIsPollingRecommendations(false); // Stop polling if we found fresh ones
      } else {
        // No fresh ones found yet.
        // If we are still in the initial waiting period or polling, show nothing yet.
        // Otherwise (polling timed out), this block won't be reached because shouldShowFreshRecommendationsOnly would be false.
        console.log(`⏳ [Step5] No fresh recommendations found yet. Waiting/Polling continues...`);
        setFilteredRecommendations([]);
      }
    }
  }, [fundingRecommendations, shouldShowFreshRecommendationsOnly, pollingAttempts, isPollingRecommendations, hasPollingTimedOut, isWaitingForAnalysis, isFromAnalysis]);

  // Add an immediate check function that runs on component mount
  useEffect(() => {
    const checkImmediately = async () => {
      // Only check if we have a companyId, no recommendations yet, and we're not already fetching
      if (companyId && !primaryRecommendation && !isFetchingRecommendations && !isPollingRecommendations && supabase) {
        console.log(`🔍 [Step5] Performing immediate recommendations check for company ${companyId}`);
        
        try {
          const { data: recommendations, error } = await supabase
            .from('funding_recommendations')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('❌ [Step5] Error in immediate recommendations check:', error);
            return;
          }
          
          if (recommendations && recommendations.length > 0) {
            // Trigger update using the fetched recommendations
             // Dispatch the event to notify parent component - this assumes the parent listens
             if (typeof window !== 'undefined') {
               try {
                 console.log('📣 [Step5] Dispatching recommendations-ready event (immediate check success)');
                 const event = new CustomEvent('recommendations-ready', { detail: { companyId } });
                 window.dispatchEvent(event);
                 // Optionally set recommendations here if parent doesn't refetch on event
                 // setFilteredRecommendations(recommendations); // Consider if needed based on parent logic
               } catch (err) {
                 console.error('❌ [Step5] Error dispatching event:', err);
               }
             }
            // Start polling only if no fresh recommendations were found immediately
            // This part might be redundant if the parent handles the 'recommendations-ready' event
            // by updating the fundingRecommendations prop
            const freshRecommendations = recommendations.filter((rec: Recommendation) => {
               const recCreatedAt = new Date(rec.created_at).getTime();
               return recCreatedAt >= freshnessThresholdRef.current; // Use the correct freshness threshold
             });

             if (freshRecommendations.length === 0) {
               console.log(`⏳ [Step5] Found ${recommendations.length} recommendations but none are fresh, starting polling`);
               setIsPollingRecommendations(true);
             } else {
                console.log(`✅ [Step5] Found ${freshRecommendations.length} fresh recommendations immediately, no polling needed initially.`);
                // Recommendations will be filtered by the main useEffect
             }

          } else {
            console.log('⏳ [Step5] No recommendations found in immediate check, starting polling');
            setIsPollingRecommendations(true);
          }
        } catch (err) {
          console.error('❌ [Step5] Unexpected error in immediate check:', err);
          // Start polling as a fallback if immediate check fails unexpectedly
          setIsPollingRecommendations(true);
        }
      }
    };
    
    checkImmediately();
  }, [companyId, primaryRecommendation, isFetchingRecommendations, isPollingRecommendations, supabase]);

  // Improve the polling mechanism
  useEffect(() => {
    // Only run the polling interval if polling is active
    if (isPollingRecommendations && companyId && !error && !isFetchingRecommendations) {
      console.log('🔄 [Step5] Starting recommendation polling interval');
      setPollingAttempts(0);
      setHasPollingTimedOut(false);
      
      let attemptCount = 0;
      
      // Single interval for both progress updates and polling checks
      const pollInterval = setInterval(async () => {
        attemptCount++;
        // Update progress state based on time elapsed
        setPollingAttempts(prev => {
           const newValue = Math.min(MAX_POLLING_ATTEMPTS, prev + 1); // Ensure we don't exceed max
           console.log(`🔄 [Step5] Polling attempt: ${newValue}/${MAX_POLLING_ATTEMPTS} (${Math.round((newValue / MAX_POLLING_ATTEMPTS) * 100)}%)`);
           return newValue;
         });

        // Stop condition 1: Max attempts reached (40 seconds elapsed)
        if (attemptCount >= MAX_POLLING_ATTEMPTS) {
          console.log('⏱️ [Step5] Polling duration complete (40 seconds). Stopping polling and showing available recommendations.');
          clearInterval(pollInterval);
          setIsPollingRecommendations(false);
          setHasPollingTimedOut(true);
          setShouldShowFreshRecommendationsOnly(false); // Show all recommendations after timeout
          
          // Trigger recommendations fetch one last time after timeout
          fetchFundingRecommendations(); 
          return; // Exit interval callback
        }

        // Stop condition 2: Primary recommendation found (handled by separate effect)
        // This interval doesn't need to check for primaryRecommendation directly,
        // as the effect below will stop polling when it appears.

        // Perform the actual recommendation check
        try {
          const foundFresh = await checkRecommendationsStatus(); // checkRecommendationsStatus looks for fresh recs
          if (foundFresh) {
            console.log('✅ [Step5] Fresh recommendations found during polling, stopping polling.');
            clearInterval(pollInterval);
            setIsPollingRecommendations(false);
            // The main filtering useEffect will handle displaying them.
          } else {
             console.log(`⏳ [Step5] Polling attempt ${attemptCount}: No fresh recommendations found yet.`);
          }
        } catch (err) {
          console.error('❌ [Step5] Error during polling checkRecommendationsStatus:', err);
          // Continue polling despite errors in this check
        }
      }, POLLING_INTERVAL_MS); // Check every 5 seconds
      
      // Clean up interval on unmount or when polling stops
      return () => {
        console.log('🧹 [Step5] Cleaning up recommendation polling interval');
        clearInterval(pollInterval);
      };
    }
  }, [isPollingRecommendations, companyId, isFetchingRecommendations, error, supabase]); // Depend on isPollingRecommendations

  // Effect to stop polling if primaryRecommendation appears (e.g., from parent update via event)
   useEffect(() => {
     if (primaryRecommendation && isPollingRecommendations) {
       console.log('✋ [Step5] Primary recommendation detected, stopping polling.');
       setIsPollingRecommendations(false);
       // Note: We don't clear intervals here as the main polling effect's cleanup handles it
       // when isPollingRecommendations becomes false.
     }
   }, [primaryRecommendation, isPollingRecommendations]);

  // Add a function to fetch recommendations directly (can be used by polling or timeout)
  const fetchFundingRecommendations = async () => {
    if (!companyId || !supabase) return;
    
    try {
      console.log(`🔍 [Step5] Fetching recommendations for company ${companyId} via Supabase`);
      
      const { data: recommendations, error } = await supabase
        .from('funding_recommendations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [Step5] Error fetching recommendations:', error);
        return;
      }
      
      if (recommendations && recommendations.length > 0) {
        console.log(`✅ [Step5] Found ${recommendations.length} recommendations via Supabase fetch`);
        // Update the state directly - this will trigger the filtering useEffect
        // Use a function here if you need to ensure atomicity or depend on previous state
        setFilteredRecommendations(recommendations);
      } else {
        console.log('ℹ️ [Step5] No recommendations found on direct fetch');
      }
    } catch (err) {
      console.error('❌ [Step5] Unexpected error in fetchFundingRecommendations:', err);
    }
  };

  // Function to fetch financial data from the API
  const fetchFinancialData = async () => {
    if (!companyId) return;
    
    setIsFetchingFinancials(true);
    setFinancialsError(null);
    
    try {
      // Refresh session to get a valid token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData?.session?.access_token) {
        console.error('❌ Failed to refresh session or session invalid:', refreshError);
        throw new Error('Authentication session is invalid. Please sign in again.');
      }
      const token = refreshData.session.access_token;
      
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
      
      if (!data || data.length === 0) {
        console.log('No financial data available for this company');
        setYearlyFinancialData([]);
        setLatestFinancialRatios({});
        setIsFetchingFinancials(false);
        return;
      }
      
      // Process the financial metrics into the format expected by FinancialChartsDisplay
      const yearlyDataMapped: YearlyFinancialData[] = data.map((item: any) => ({
        fiscal_year: item.fiscal_year,
        revenue: item.revenue,
        ebitda: item.ebitda,
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
      
      // Extract transparency data from latest metrics
      setFinancialTransparencyData({
        confidence: latest.data_confidence || null,
        sources: latest.data_sources || null,
        dataSource: latest.data_source || null,
        lastUpdated: latest.updated_at || null,
      });
      
      console.log('✅ Financial data loaded and reversed:', {
        yearsCount: yearlyDataMapped.length,
        years: yearlyDataMapped.map(d => d.fiscal_year),
        hasRevenue: yearlyDataMapped.some(d => d.revenue),
        hasEbitda: yearlyDataMapped.some(d => d.ebitda),
        transparency: {
          confidence: latest.data_confidence,
          sourcesCount: latest.data_sources?.length || 0
        }
      });
    } catch (error) {
      console.error('❌ Unexpected error fetching financial data:', error);
      setFinancialsError(error instanceof Error ? error.message : 'Failed to load financial data');
    } finally {
      setIsFetchingFinancials(false);
    }
  };

  // Fetch financial data when companyId changes
  useEffect(() => {
    if (companyId) {
      fetchFinancialData();
    }
  }, [companyId]);

  const handleStartPresentation = () => {
    viewerRef.current?.requestFullscreen().catch(err => {
      console.error("Error attempting to enable full-screen mode:", err);
      // Optionally show a user-friendly message here
    });
  };

  // Enhance the checkRecommendationsStatus function
  const checkRecommendationsStatus = async () => {
    if (!companyId || !supabase) return false;

    try {
      console.log(`🔍 [Step5] Checking recommendations for company ${companyId}...`);
      
      // Use a safer approach with timeout
      const timeoutPromise = new Promise<{ data: any, error: Error }>((_, reject) => 
        setTimeout(() => reject(new Error('Recommendations query timeout')),
        5000)
      );
      
      const queryPromise = supabase
        .from('funding_recommendations')
        .select('id, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Race the query against a timeout
      const { data: recommendations, error: recError } = await Promise.race<{ data: any, error: any }>([
        queryPromise,
        timeoutPromise.then(() => ({ data: null, error: new Error('Recommendations query timed out') }))
      ]);

      if (recError) {
        // Log detailed error information
        const errorMessage = typeof recError === 'object' ? 
          (recError.message || JSON.stringify(recError)) : 
          String(recError);
          
        console.error(`❌ [Step5] Error checking recommendations: ${errorMessage}`);
        return false;
      }

      if (recommendations && recommendations.length > 0) {
        // Check if any recommendations are fresh according to the threshold
        // (which is analysisStartTime if coming from analysis)
        const freshRecommendations = recommendations.filter((rec: { created_at: string }) => {
          const recCreatedAt = new Date(rec.created_at).getTime();
          return recCreatedAt >= freshnessThresholdRef.current; // Use the correct threshold
        });
        
        console.log(`[Step5 CheckStatus] Found ${recommendations.length} total, ${freshRecommendations.length} fresh (threshold: ${new Date(freshnessThresholdRef.current).toISOString()})`);
        
        if (freshRecommendations.length > 0) {
          console.log('✅ [Step5] Found fresh recommendations:', freshRecommendations.length);
          
          // Try to dispatch the event multiple ways to ensure it's received
          if (typeof window !== 'undefined') {
            try {
              console.log('📣 [Step5] Dispatching recommendations-ready event (found fresh)');
              // Method 1: Standard CustomEvent
              const event = new CustomEvent('recommendations-ready', { 
                detail: { companyId } 
              });
              window.dispatchEvent(event);
              
              // Method 2: Use localStorage as a backup communication channel
              localStorage.setItem('recommendations_ready_signal', JSON.stringify({
                companyId,
                timestamp: Date.now()
              }));
              
              return true;
            } catch (dispatchErr) {
              console.error('❌ [Step5] Error dispatching event:', dispatchErr);
              return true; // Still return true as we found recommendations
            }
          }
          return true;
        } else {
          console.log(`⏳ [Step5] Found ${recommendations.length} recommendations but none are fresh`);
          
          // If we've found some recommendations but none are fresh, check if they're at least recent (within last hour)
          const recentRecommendations = recommendations.filter((rec: { created_at: string }) => {
            const recCreatedAt = new Date(rec.created_at).getTime();
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            return recCreatedAt >= oneHourAgo;
          });
          
          if (recentRecommendations.length > 0) {
            console.log(`ℹ️ [Step5] Found ${recentRecommendations.length} recent recommendations (within last hour)`);
            // After halfway through polling attempts, consider recent recs good enough
            if (pollingAttempts > MAX_POLLING_ATTEMPTS / 2) {
              console.log('🕒 [Step5] Polling halfway done, considering recent recommendations acceptable. Stopping polling.');
              setShouldShowFreshRecommendationsOnly(false); // Trigger showing older recs
              return true;
            }
          }
          
          return false;
        }
      } else {
        console.log('⏳ [Step5] No recommendations found yet');
        return false;
      }
    } catch (err) {
      // Give more detailed error logging
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [Step5] Unexpected error checking recommendations: ${errMsg}`);
      
      // Log the state to help with debugging
      console.log(`ℹ️ [Step5] Debug state: companyId=${companyId}, pollingAttempts=${pollingAttempts}`);
      
      // Don't throw, just return false to continue polling
      return false;
    }
  };

  // Render the main content
  const renderMainContent = () => {
    return (
      <div className="space-y-8">
        {/* Company selector */}
        <CompanySelector
          companies={userCompanies}
          selectedCompanyId={companyId}
          onCompanyChange={handleCompanyChange}
          isLoading={isFetchingCompanies}
        />

        {/* Recommendations section */}
        <div className="bg-card rounded-lg p-6 border border-primary/20">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <PresentationChartBarIcon className="h-6 w-6 mr-2" />
            {t('step5.recommendationsTitle', { default: 'Rahoitusanalyysi' })}
          </h2>
          
          {renderRecommendationsContent()}
        </div>

        {/* Financial charts section */}
        {renderFinancialChartsSection()}

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-8 border-t border-gray-dark">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => goToStep(4)}
              className="border-gray-dark text-gray-dark hover:bg-gray-dark hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {t('prevButton', { default: 'Edellinen' })}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => goToStep(2)}
              className="border-primary text-white hover:bg-primary/10 hover:text-white transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {t('step5.newFundingAnalysis', { default: 'Tee uusi rahoitusanalyysi' })}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={goToDashboard}
              className="border-primary text-white hover:bg-primary hover:text-white-foreground transition-colors"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            {t('step5.goToDashboard', { default: 'Siirry hallintapaneeliin' })}
          </Button>
        </div>
      </div>
    );
  };

  // Render the recommendations content
  const renderRecommendationsContent = () => {
    return (
      <div className="bg-gray-very-dark border border-gray-dark p-6 sm:p-8 rounded-lg shadow-lg mb-10">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-foreground">{t('step5.recommendationsTitle', { default: 'Rahoitusanalyysi' })}</h3>
        </div>

        {/* Show loading/polling state ONLY if we are actively fetching OR if polling is active */}
        {isFetchingRecommendations || (isPollingRecommendations && !primaryRecommendation) ? (
          <div className="flex flex-col justify-center items-center py-8 px-4 space-y-4">
            <div className="relative">
                          <Spinner className="h-10 w-10 text-white" />
              <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">AI</span>
              </div>
            </div>
          <p className="text-lg font-medium text-foreground">
              {/* Simplified message - remove dependency on analysisStatus */}
              {isPollingRecommendations
                ? t('step5.generatingRecommendations', { default: 'Luodaan henkilökohtaisia rahoitussuosituksia...' })
                : t('step5.loadingRecommendations', { default: 'Ladataan suosituksiasi...' })
              }
            </p>
            <p className="text-sm text-gold-secondary/70 max-w-md text-center">
               {/* Simplified message - update time estimate */}
               {t('step5.recommendationsTimeEstimate', { default: 'Tämä voi kestää jopa 40 sekuntia. Voit tutkia taloustietojasi odottaessasi.' })} {isPollingRecommendations ? '' : '(Alkuperäinen lataus)'}
            </p>
            
            {/* Progress indicator - Updated to show progress over 40 seconds */}
            <div className="w-full max-w-md mt-2">
              <div className="bg-gray-dark h-1.5 rounded-full w-full">
                <div 
                  className="onboarding-progress-bar h-1.5 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ 
                    width: `${isPollingRecommendations ? Math.min(100, (pollingAttempts / MAX_POLLING_ATTEMPTS) * 100) : 100}%` // Show full if only fetching
                  }}
                />
              </div>
              <p className="text-xs text-gold-secondary/60 mt-1 text-right">
                {Math.round((pollingAttempts / MAX_POLLING_ATTEMPTS) * 100)}% {t('step5.complete', { default: 'valmis' })}
              </p>
            </div>
            
            {/* Manual override button - Updated to appear halfway through the 40-second window */}
            {isPollingRecommendations && pollingAttempts > MAX_POLLING_ATTEMPTS / 2 && !hasPollingTimedOut && fundingRecommendations.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={handleShowAllRecommendations}
                  className="text-sm flex items-center text-gold-secondary border-gray-dark hover:bg-gray-dark"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                  {t('step5.showAvailableRecommendations', { default: 'Näytä saatavilla olevat suositukset' })}
                </Button>
              </div>
            )}
          </div>
        ) : error ? (
          <div className="text-red-400 text-center p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
            {t('step5.errorLoading', { default: 'Suositusten lataaminen epäonnistui:' })} {error}
          </div>
        ) : primaryRecommendation ? (
          <>
            {/* Summary and funding section at the top */}
            {primaryRecommendation.summary && (
              <div className="mb-8 p-6 bg-black/30 rounded-lg border border-gray-dark">
                <h4 className="text-xl font-semibold mb-4 onboarding-text-white">{t('step5.summary', { default: 'Yhteenveto' })}</h4>
                <div className="onboarding-text-secondary prose prose-invert" dangerouslySetInnerHTML={{ __html: primaryRecommendation.summary }} />
              </div>
            )}

            {/* Apply for funding section */}
            <div className="mb-8 pt-6 border-t border-gray-dark">
              <h4 className="text-xl font-semibold mb-4 text-gold-secondary">{t('step5.applyForFundingTitle', { default: 'Hae rahoitusta' })}</h4>
              {primaryRecommendation.recommendation_details && primaryRecommendation.recommendation_details.length > 0 ? (
                <div className="space-y-4">
                   <p className="text-sm text-gold-secondary/80 mb-4">{t('step5.supportedFundingInfo', { default: 'TrustyFinance voi auttaa sinua saamaan yrityslainoja (vakuudellisia/vakuudettomia), luottorajoja ja factoring-palveluja. Valitse alla oleva vaihtoehto hakeaksesi rahoitusta.' })}</p>
                  {primaryRecommendation.recommendation_details
                    .filter(detail => !detail.type || allowedFundingTypes.includes(detail.type)) // Show only applicable funding types
                    .map((detail, index) => {
                    const typeKey = detail.type || 'unknown';
                    const isApplicable = allowedFundingTypes.includes(typeKey);
                    const tooltipContent = getRecommendationTooltip(typeKey, detail.details, detail.suitability_rationale);
                    
                    return (
                      <div 
                        key={index} 
                        className="relative flex items-center justify-between bg-black/40 p-4 rounded-md border border-gray-dark hover:border-gold-primary/50 transition-colors duration-200"
                        onMouseEnter={() => setHoveredRecommendationType(typeKey)}
                        onMouseLeave={() => setHoveredRecommendationType(null)}
                      >
                        <span className="font-medium text-gold-primary">
                          {t(`recommendationType.${typeKey}`, { default: detail.type || 'Suositus' })}
                        </span>
                        <div className="mt-6">
                        <Button
                            className="w-full mt-4"
                            onClick={() => {
                              // Extract the funding type and amount from recommendation
                              const fundingType = detail.type || 'business_loan_unsecured';
                              const amount = detail.amount_suggestion;
                              startApplication(primaryRecommendation.id, fundingType, amount);
                            }}
                        >
                            {t('step5.startApplication')}
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                        </div>
                        
                        {/* Tooltip */}
                        {hoveredRecommendationType === typeKey && (
                          <div className="absolute bottom-full left-0 mb-2 w-96 max-w-lg p-4 bg-gray-very-dark border border-gold-primary/30 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                            <p className="text-sm text-gold-secondary leading-relaxed whitespace-pre-wrap">
                              {tooltipContent}
                            </p>
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gold-primary/30"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                 <p className="text-gold-secondary/80 italic">{t('step5.noSpecificActions', { default: 'Suosituksessa ei ole listattuna tiettyjä rahoitustoimenpiteitä.' })}</p>
              )}
               {/* General Apply Button (always available if recommendations exist) */} 
               <div className="text-center mt-8">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => window.location.href = `/${locale}/finance-application?step=application`}
                   className="onboarding-btn-primary"
                 >
                   {t('step5.createGeneralApplication', { default: 'Hae rahoitusta' })}
                 </Button>
               </div>
            </div>
            
            {/* Full Analysis Button */}
            <div className="text-center mt-8 pt-6 border-t border-gray-dark">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecommendationViewer(true)}
                className="border-gold-primary text-gold-primary hover:bg-gold-primary/10 hover:text-gold-highlight transition-colors"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                {t('step5.viewFullAnalysis', { default: 'Näytä laaja rahoitusanalyysi' })}
              </Button>
            </div>
          </>
        ) : (
          <div>
             <p className="text-center text-gold-secondary py-4">{t('step5.noRecommendations', { default: 'Valitulle yritykselle ei ole saatavilla tiettyjä rahoitussuosituksia. Voit silti jatkaa yleisellä hakemuksella.' })}</p>
             <p className="text-gold-secondary/80 mb-3 text-center">
               {t('step5.supportedFundingInfo', { default: 'TrustyFinance voi auttaa sinua saamaan yrityslainoja (vakuudellisia/vakuudettomia), luottorajoja ja factoring-palveluja. Luo hakemus aloittaaksesi.' })}
             </p>
             <div className="flex justify-center">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => window.location.href = `/${locale}/finance-application?step=application`}
                 className="border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-black transition-colors"
               >
                 {t('step5.createGeneralApplication', { default: 'Hae rahoitusta' })}
               </Button>
             </div>
           </div>
        )}
      </div>
    );
  };

  // Render the financial charts section - show only non-empty values
  const renderFinancialChartsSection = () => {
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
      // Core financial metrics
      { key: 'revenue' as ChartKey, type: 'bar' as const, titleKey: 'revenueTitle' },
      { key: 'revenueGrowth' as ChartKey, type: 'line' as const, titleKey: 'revenueGrowthTitle' },
      
      // Profitability
      { key: 'operatingProfit' as ChartKey, type: 'bar' as const, titleKey: 'operatingProfitTitle' },
      { key: 'operatingProfitPct' as ChartKey, type: 'line' as const, titleKey: 'operatingProfitPctTitle' },
      { key: 'ebitda' as ChartKey, type: 'bar' as const, titleKey: 'ebitdaTitle' },
      { key: 'netResult' as ChartKey, type: 'bar' as const, titleKey: 'netResultTitle' },
      { key: 'grossMargin' as ChartKey, type: 'bar' as const, titleKey: 'grossMarginTitle' },
      { key: 'grossMarginPct' as ChartKey, type: 'line' as const, titleKey: 'grossMarginPctTitle' },
      
      // Profitability ratios
      { key: 'roe' as ChartKey, type: 'bar' as const, titleKey: 'roeTitle' },
      { key: 'roa' as ChartKey, type: 'bar' as const, titleKey: 'roaTitle' },
      
      // Solvency & Leverage
      { key: 'equityRatio' as ChartKey, type: 'line' as const, titleKey: 'equityRatioTitle' },
      { key: 'debtRatio' as ChartKey, type: 'line' as const, titleKey: 'debtRatioTitle' },
      { key: 'debtToEquity' as ChartKey, type: 'bar' as const, titleKey: 'debtToEquityTitle' },
      
      // Liquidity
      { key: 'currentRatio' as ChartKey, type: 'gauge' as const, titleKey: 'currentRatioTitle' },
      { key: 'quickRatio' as ChartKey, type: 'gauge' as const, titleKey: 'quickRatioTitle' },
      
      // Balance sheet
      { key: 'totalAssets' as ChartKey, type: 'bar' as const, titleKey: 'totalAssetsTitle' }, 
      { key: 'equityAndAssetsCombo' as ChartKey, type: 'combo' as const, titleKey: 'equityAndAssetsComboTitle' },
      { key: 'cashAndReceivables' as ChartKey, type: 'line' as const, titleKey: 'cashAndReceivablesTitle' },
      
      // Operational metrics
      { key: 'employees' as ChartKey, type: 'line' as const, titleKey: 'employeesTitle' },
      { key: 'dso' as ChartKey, type: 'line' as const, titleKey: 'dsoTitle' },
    ];

    const filteredCharts = allCharts.filter(chart => {
      // Show chart only if there's data for it
      if (chart.key === 'currentRatio' || chart.key === 'quickRatio') {
        return filteredRatios[chart.key as keyof CurrentFinancialRatios] !== undefined;
      }
      return filteredYearlyData.some(data => (data as any)[chart.key] !== null && (data as any)[chart.key] !== undefined);
    });

    return (
      <div className="mb-12">
        <FinancialChartsDisplay
          title={tFinancials('financialHighlightsTitle', { default: 'Taloudelliset tunnusluvut' })}
          yearlyData={filteredYearlyData}
          latestRatios={filteredRatios}
          isLoading={isFetchingFinancials}
          error={financialsError}
          locale={locale}
          defaultChartsToShow={3}
          chartHeight={250}
          chartKeysAndTypes={filteredCharts}
        />
        
        {/* Analysis section after financial charts */}
        {primaryRecommendation?.analysis && (
          <div className="mt-12 p-6 bg-black/30 rounded-lg border border-gray-dark">
            <h4 className="text-xl font-semibold mb-4 text-gold-primary">{t('step5.analysis', { default: 'Analyysi' })}</h4>
            <div className="text-gold-secondary prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: primaryRecommendation.analysis }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-gold-secondary">
      {renderMainContent()}
      
      {/* RecommendationViewer Modal */}
      {showRecommendationViewer && primaryRecommendation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-6xl mx-4 bg-gray-very-dark border border-gray-dark rounded-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-dark">
              <h2 className="text-xl font-semibold text-gold-primary">
                {t('step5.viewFullAnalysis', { default: 'Laaja rahoitusanalyysi' })}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecommendationViewer(false)}
                className="border-gray-dark text-gray-dark hover:bg-gray-dark hover:text-white"
              >
                ✕
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Financial Data Transparency */}
              {financialTransparencyData && (
                <div className="mb-6">
                  <FinancialDataTransparency
                    confidence={financialTransparencyData.confidence}
                    sources={financialTransparencyData.sources}
                    dataSource={financialTransparencyData.dataSource}
                    lastUpdated={financialTransparencyData.lastUpdated}
                    compact={false}
                  />
                </div>
              )}
              
              <FullAnalysisView 
                recommendation={primaryRecommendation} 
                companyName={companyName || 'Yritys'}
                yearlyFinancialData={yearlyFinancialData}
                latestFinancialRatios={latestFinancialRatios}
                locale={locale}
                currency={
                  countryCode === 'SE' ? 'SEK' : 
                  countryCode === 'NO' ? 'NOK' : 
                  countryCode === 'DK' ? 'DKK' : 
                  'EUR'
                }
                financialTransparency={financialTransparencyData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step5Summary;

