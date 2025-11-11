'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboard } from '../layout';
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
  Bookmark
} from 'lucide-react';

// Recommendation interface
interface Recommendation {
  id?: string;
  company_id?: string;
  title: string;
  description: string;
  category: 'finance' | 'operations' | 'strategy' | 'marketing' | 'other';
  impact_level: 'high' | 'medium' | 'low';
  implementation_difficulty: 'easy' | 'moderate' | 'difficult';
  implementation_timeline: 'short' | 'medium' | 'long';
  saved: boolean;
  created_at?: string;
}

export default function RecommendationsPage() {
  const t = useTranslations('Dashboard.Recommendations');
  const { session, loading: authLoading } = useAuth();
  const { completedSteps, setCompletedSteps } = useDashboard();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const supabase = createClientComponentClient();

  // Fetch recommendations when component loads
  useEffect(() => {
    if (!session?.access_token) return;

    async function fetchRecommendations() {
      setIsLoading(true);
      setError(null);

      try {
        // First get user's company_id from their profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', session?.user?.id)
          .single();

        if (profileError) {
          throw new Error(`Error fetching profile: ${profileError.message}`);
        }

        if (!profileData?.company_id) {
          // No company associated with this user yet
          setError('No company profile found. Please complete your company profile first.');
          setIsLoading(false);
          return;
        }

        setCompanyId(profileData.company_id);

        // Fetch recommendations for this company
        const { data: recommendationsData, error: recommendationsError } = await supabase
          .from('recommendations')
          .select('*')
          .eq('company_id', profileData.company_id)
          .order('impact_level', { ascending: false });

        if (recommendationsError) {
          throw new Error(`Error fetching recommendations: ${recommendationsError.message}`);
        }

        if (recommendationsData && recommendationsData.length > 0) {
          setRecommendations(recommendationsData as Recommendation[]);
          
          // Mark this step as completed
          if (!completedSteps.includes('recommendations')) {
            setCompletedSteps([...completedSteps, 'recommendations']);
          }
        } else {
          // No recommendations yet
          setRecommendations([]);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, [session?.access_token, session?.user?.id, supabase, completedSteps, setCompletedSteps]);

  // Generate AI recommendations
  const generateRecommendations = async () => {
    if (!companyId) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // First check if we have required data (financial metrics and growth goals)
      const { data: financialMetrics, error: financialError } = await supabase
        .from('financial_metrics')
        .select('*')
        .eq('company_id', companyId)
        .limit(1);
        
      if (financialError) throw new Error(`Error checking financial data: ${financialError.message}`);
      
      const { data: growthGoals, error: goalsError } = await supabase
        .from('growth_goals')
        .select('*')
        .eq('company_id', companyId)
        .limit(1);
        
      if (goalsError) throw new Error(`Error checking growth goals: ${goalsError.message}`);
      
      if (!financialMetrics?.length) {
        throw new Error('Missing financial data. Please complete the financial dashboard first.');
      }
      
      if (!growthGoals?.length) {
        throw new Error('Missing growth goals. Please add at least one growth goal first.');
      }
      
      // Call the API to generate recommendations
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recommendations');
      }
      
      const { recommendations: newRecommendations } = await response.json();
      
      // Update state
      setRecommendations(newRecommendations);
      
      // Mark step as completed
      if (!completedSteps.includes('recommendations')) {
        setCompletedSteps([...completedSteps, 'recommendations']);
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle saved status
  const toggleSaved = async (id: string, currentSaved: boolean) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('recommendations')
        .update({ saved: !currentSaved })
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setRecommendations(recommendations.map(rec => 
        rec.id === id ? { ...rec, saved: !currentSaved } : rec
      ));
    } catch (err) {
      console.error('Error updating saved status:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Generate PDF report of recommendations
  const generatePDF = async () => {
    try {
      if (!companyId || !recommendations?.length) return;
      
      const response = await fetch('/api/recommendations/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
      
      // Get blob
      const blob = await response.blob();
      
      // Create a link element and trigger download
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'business-recommendations.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Filter recommendations by category
  const getFilteredRecommendations = () => {
    if (activeFilter === 'all') return recommendations;
    if (activeFilter === 'saved') return recommendations.filter(rec => rec.saved);
    return recommendations.filter(rec => rec.category === activeFilter);
  };

  // Get color for impact level badge
  const getImpactLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Get color for difficulty badge
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'moderate':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'difficult':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Get color for timeline badge
  const getTimelineColor = (timeline: string) => {
    switch (timeline) {
      case 'short':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'long':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'finance':
        return <BarChart3 className="h-5 w-5" />;
      case 'strategy':
        return <Zap className="h-5 w-5" />;
      case 'operations':
        return <BadgeCheck className="h-5 w-5" />;
      case 'marketing':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <LightbulbIcon className="h-5 w-5" />;
    }
  };

  // Loading placeholder
  if (isLoading || authLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
          <h3 className="text-red-800 dark:text-red-300 font-medium">{t('errorLoadingRecommendations')}</h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mt-2 text-sm">{error}</p>
        {error.includes('company profile') && (
          <Link 
            href="../company-profile"
            className="mt-3 inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500"
          >
            {t('setupCompanyProfile')}
          </Link>
        )}
        {error.includes('financial data') && (
          <Link 
            href=".."
            className="mt-3 inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 block"
          >
            {t('setupFinancialDashboard')}
          </Link>
        )}
        {error.includes('growth goals') && (
          <Link 
            href="../growth-plan"
            className="mt-3 inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 block"
          >
            {t('setupGrowthGoals')}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('businessRecommendations')}
        </h1>
        
        <div className="flex gap-2">
          {recommendations?.length > 0 && (
            <button
              onClick={generatePDF}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-1" />
              {t('downloadPDF')}
            </button>
          )}
          
          <button
            onClick={generateRecommendations}
            disabled={isGenerating}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm flex items-center disabled:bg-indigo-400"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <LightbulbIcon className="h-4 w-4 mr-1" />
                {recommendations?.length > 0 ? t('regenerateRecommendations') : t('generateRecommendations')}
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Intro section */}
      {!recommendations?.length && !isGenerating && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <LightbulbIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('recommendationsIntroTitle')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('recommendationsIntroDescription')}
              </p>
              <button
                onClick={generateRecommendations}
                disabled={isGenerating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:bg-indigo-400 flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <LightbulbIcon className="h-4 w-4 mr-1" />
                    {t('generateRecommendations')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Category filter */}
      {recommendations?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {t('allRecommendations')}
          </button>
          
          <button
            onClick={() => setActiveFilter('saved')}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
              activeFilter === 'saved'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Bookmark className="h-3 w-3 mr-1" />
            {t('saved')}
          </button>
          
          <button
            onClick={() => setActiveFilter('finance')}
            className={`px-3 py-1.5 rounded-md text-sm ${
              activeFilter === 'finance'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {t('financeCategory')}
          </button>
          
          <button
            onClick={() => setActiveFilter('strategy')}
            className={`px-3 py-1.5 rounded-md text-sm ${
              activeFilter === 'strategy'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {t('strategyCategory')}
          </button>
          
          <button
            onClick={() => setActiveFilter('operations')}
            className={`px-3 py-1.5 rounded-md text-sm ${
              activeFilter === 'operations'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {t('operationsCategory')}
          </button>
          
          <button
            onClick={() => setActiveFilter('marketing')}
            className={`px-3 py-1.5 rounded-md text-sm ${
              activeFilter === 'marketing'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {t('marketingCategory')}
          </button>
        </div>
      )}
      
      {/* Loading state while generating */}
      {isGenerating && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('generatingRecommendations')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              {t('generatingRecommendationsDescription')}
            </p>
          </div>
        </div>
      )}
      
      {/* Recommendations list */}
      {recommendations?.length > 0 && !isGenerating && (
        <div className="space-y-4 mb-6">
          {getFilteredRecommendations().map((recommendation, index) => (
            <div 
              key={recommendation.id || index} 
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 ${
                  recommendation.category === 'finance' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' :
                  recommendation.category === 'operations' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' :
                  recommendation.category === 'strategy' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' :
                  recommendation.category === 'marketing' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {getCategoryIcon(recommendation.category)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {recommendation.title}
                    </h3>
                    
                    <button
                      onClick={() => toggleSaved(recommendation.id!, recommendation.saved)}
                      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ml-2 ${
                        recommendation.saved ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'
                      }`}
                      aria-label={recommendation.saved ? t('unsaveRecommendation') : t('saveRecommendation')}
                    >
                      <Bookmark className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {recommendation.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactLevelColor(recommendation.impact_level)}`}>
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      {t(`impact${recommendation.impact_level.charAt(0).toUpperCase() + recommendation.impact_level.slice(1)}`)}
                    </span>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.implementation_difficulty)}`}>
                      {t(`difficulty${recommendation.implementation_difficulty.charAt(0).toUpperCase() + recommendation.implementation_difficulty.slice(1)}`)}
                    </span>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTimelineColor(recommendation.implementation_timeline)}`}>
                      {t(`timeline${recommendation.implementation_timeline.charAt(0).toUpperCase() + recommendation.implementation_timeline.slice(1)}`)}
                    </span>
                    
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                      {t(`category${recommendation.category.charAt(0).toUpperCase() + recommendation.category.slice(1)}`)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Show message when filter returns no results */}
      {recommendations?.length > 0 && 
       getFilteredRecommendations().length === 0 && 
       !isGenerating && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {t('noRecommendationsMatchFilter')}
          </p>
        </div>
      )}
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Link
          href="../dashboard/growth-plan"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          ← {t('backToGrowthPlan')}
        </Link>
      </div>
    </div>
  );
}